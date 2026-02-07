from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS
from flask_socketio import SocketIO, join_room
from flask_jwt_extended import JWTManager, decode_token
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from datetime import timedelta
from dotenv import load_dotenv
import os
import logging
from logging.handlers import RotatingFileHandler
import urllib.request

from database import db, init_db, check_sensor_threshold_columns, User
from routes.auth import auth_bp
from routes.sensors import sensors_bp
from routes.readings import readings_bp
from routes.users import users_bp
from routes.alerts import alerts_bp
from routes.reports import reports_bp
from routes.maintenance import maintenance_bp
from scheduler import init_scheduler
from email_service import init_email
from config import Config

load_dotenv()

# Configure logging
def setup_logging(app):
    """Setup application logging with enhanced CLI output"""
    if not app.config.get('DEBUG'):
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler(
            'logs/aerium.log',
            maxBytes=10240000,
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('[INIT] Aerium Air Quality Dashboard startup')
    else:
        # Enhanced console output for debug mode
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter('[%(levelname)s] %(message)s'))
        app.logger.addHandler(console_handler)
        app.logger.setLevel(logging.INFO)


def rate_limit_key():
    """Key function for rate limiter that excludes OPTIONS requests"""
    # Don't rate limit CORS preflight requests
    if request.method == 'OPTIONS':
        return None
    return get_remote_address()


def create_app():
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'aerium-dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aerium.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # Email configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@airsense.app')
    
    # Feature flags
    app.config['ENABLE_EMAIL_NOTIFICATIONS'] = os.getenv('ENABLE_EMAIL_NOTIFICATIONS', 'True') == 'True'
    app.config['ENABLE_RATE_LIMITING'] = os.getenv('ENABLE_RATE_LIMITING', 'True') == 'True'
    app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Setup logging
    setup_logging(app)
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    init_email(app)

    
    # CORS Configuration - must be initialized early
    allowed_origins = list({
        app.config.get('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080'
    })

    CORS(
        app,
        origins=allowed_origins,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
        max_age=3600,
        send_wildcard=False,
        vary_header=True,
        resources={r"/api/*": {"origins": allowed_origins}}
    )
    
    # Initialize rate limiter only if enabled
    if app.config.get('ENABLE_RATE_LIMITING'):
        limiter = Limiter(
            app=app,
            key_func=rate_limit_key,
            default_limits=["10000 per day", "1000 per hour", "100 per minute"],
            storage_uri="memory://"
        )
        app.logger.info('[OK] Rate limiting enabled: 10000/day, 1000/hour, 100/minute')
    else:
        # Create a dummy limiter that doesn't limit anything
        limiter = Limiter(
            app=app,
            key_func=lambda: None,  # Return None to disable
            default_limits=[],
            enabled=False
        )
        app.logger.info('[WARN] Rate limiting disabled')
    
    
    # Initialize caching
    cache = Cache(app, config={
        'CACHE_TYPE': 'simple',
        'CACHE_DEFAULT_TIMEOUT': 300
    })
    app.logger.info('[OK] Caching initialized')
    
    socketio = SocketIO(app, cors_allowed_origins=allowed_origins, async_mode='threading', logger=False, engineio_logger=False)
    app.logger.info('[OK] WebSocket (Socket.IO) initialized')

    @jwt.user_identity_loader
    def user_identity_lookup(identity):
        return str(identity)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data.get('sub')
        if identity is None:
            return None
        try:
            identity = int(identity)
        except (TypeError, ValueError):
            return None
        return db.session.get(User, identity)

    # WebSocket event handlers
    @socketio.on('connect')
    def handle_connect(auth):
        """Handle client connection"""
        token = None
        if isinstance(auth, dict):
            token = auth.get('token')
        if not token:
            token = request.args.get('token')

        if not token:
            app.logger.warning('[WebSocket] Missing token for client %s', request.sid)
            return False

        try:
            decoded = decode_token(token)
            user_id = decoded.get('sub')
            user = db.session.get(User, user_id) if user_id is not None else None
            if not user:
                app.logger.warning('[WebSocket] Invalid user for client %s', request.sid)
                return False

            join_room(f'user_{user.id}')
            if user.role == 'admin':
                join_room('admin')
        except Exception as exc:
            app.logger.warning('[WebSocket] Token validation failed for client %s: %s', request.sid, exc)
            return False

        app.logger.info(f'[WebSocket] Client connected: {request.sid}')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        app.logger.info(f'[WebSocket] Client disconnected: {request.sid}')
    
    @socketio.on('subscribe_sensors')
    def handle_subscribe_sensors(data):
        """Handle sensor subscription from client"""
        app.logger.info(f'[WebSocket] Client {request.sid} subscribed to sensor updates')

    # Register blueprints
    app.logger.info('[INFO] Registering API blueprints...')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(sensors_bp, url_prefix='/api/sensors')
    app.register_blueprint(readings_bp, url_prefix='/api/readings')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    app.logger.info('[OK] All API blueprints registered')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Aerium API is running',
            'features': {
                'email_notifications': app.config.get('ENABLE_EMAIL_NOTIFICATIONS', False),
                'rate_limiting': app.config.get('ENABLE_RATE_LIMITING', False)
            }
        }), 200
    
    # API documentation endpoint
    @app.route('/api/docs')
    def api_docs():
        return jsonify({
            'api_version': '1.0.0',
            'title': 'Aerium Air Quality Dashboard API',
            'description': 'REST API for real-time air quality monitoring',
            'endpoints': {
                'auth': '/api/auth - Authentication endpoints',
                'sensors': '/api/sensors - Sensor management',
                'readings': '/api/readings - Sensor readings',
                'alerts': '/api/alerts - Alert management',
                'users': '/api/users - User management',
                'reports': '/api/reports - Reports generation'
            }
        }), 200

    # Audio proxy to avoid cross-origin issues when loading remote audio files
    @app.route('/api/proxy-audio')
    def proxy_audio():
        """Proxy a remote audio URL and stream it back to the frontend with proper CORS headers.

        Query params:
            url: full remote URL to fetch
        """
        url = request.args.get('url')
        if not url:
            return jsonify({'error': 'Missing url parameter'}), 400

        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Aerium-Audio-Proxy'})
            remote = urllib.request.urlopen(req, timeout=15)

            content_type = remote.headers.get_content_type() or 'audio/mpeg'

            def generate():
                try:
                    while True:
                        chunk = remote.read(8192)
                        if not chunk:
                            break
                        yield chunk
                finally:
                    try:
                        remote.close()
                    except Exception:
                        pass

            return Response(stream_with_context(generate()), content_type=content_type)
        except Exception as e:
            app.logger.error(f'Audio proxy error fetching {url}: {e}')
            return jsonify({'error': 'Failed to fetch remote audio'}), 502
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is missing'}), 401
    
    # Initialize database
    with app.app_context():
        init_db()
        check_sensor_threshold_columns(app)
    app.logger.info('[OK] Database initialized')
    
    # Initialize scheduler for sensor simulation
    init_scheduler(app, socketio)
    app.logger.info('[OK] Scheduler initialized for sensor simulation')
    
    app.logger.info('[SUCCESS] Aerium app initialized successfully')
    return app, socketio

app, socketio = create_app()

if __name__ == '__main__':
    print("\n" + "="*80)
    print("                   AERIUM - Air Quality Monitoring Platform")
    print("="*80)
    print("\n[START] Flask backend server starting...\n")
    print("[SERVICES]")
    print("  API:      http://0.0.0.0:5000")
    print("  WebSocket: ws://0.0.0.0:5000")
    print("\n[DEBUG] Debug mode: ON")
    print("[INFO] Press Ctrl+C to stop the server\n")
    print("="*80 + "\n")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
