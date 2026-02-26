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

from database import db, init_db, vérifier_colonnes_seuil_capteur, User
from routes.auth import auth_bp
from routes.sensors import capteurs_bp
from routes.readings import lectures_bp
from routes.users import utilisateurs_bp
from routes.alerts import alertes_bp
from routes.reports import rapports_bp
from routes.maintenance import maintenance_bp
from routes.admin import admin_bp
from scheduler import initialiser_planificateur
from config import Config

load_dotenv()

# Configurer la journalisation
def configurer_journalisation(app):
    """Configuration de la journalisation de l'application avec sortie CLI améliorée"""
    if not app.config.get('DEBUG'):
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        gestionnaire_fichier = RotatingFileHandler(
            'logs/aerium.log',
            maxBytes=10240000,
            backupCount=10
        )
        gestionnaire_fichier.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        gestionnaire_fichier.setLevel(logging.INFO)
        app.logger.addHandler(gestionnaire_fichier)
        app.logger.setLevel(logging.INFO)
        app.logger.info('[INIT] Démarrage du tableau de bord Aerium de qualité de l\'air')
    else:
        # Sortie de console améliorée pour le mode débogage
        gestionnaire_console = logging.StreamHandler()
        gestionnaire_console.setFormatter(logging.Formatter('[%(levelname)s] %(message)s'))
        app.logger.addHandler(gestionnaire_console)
        app.logger.setLevel(logging.INFO)


def clé_limite_débit():
    """Fonction clé pour le limiteur de débit qui exclut les requêtes OPTIONS"""
    # Ne pas limiter les requêtes de pré-vol CORS
    if request.method == 'OPTIONS':
        return 'cors-preflight'
    return get_remote_address() or 'unknown'


def créer_app():
    app = Flask(__name__)
    
    # Charger la configuration
    app.config.from_object(Config)
    app.config['SECRET_KEY'] = 'aerium-school-project-secret'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aerium.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'aerium-jwt-secret'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # Drapeaux de fonctionnalité
    app.config['ENABLE_RATE_LIMITING'] = os.getenv('ENABLE_RATE_LIMITING', 'True') == 'True'
    app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Configurer la journalisation
    configurer_journalisation(app)
    
    # Initialiser les extensions
    db.init_app(app)
    jwt = JWTManager(app)

    
    # Configuration CORS - doit être initialisée tôt
    # Obtenir l'adresse IP locale pour l'accès mobile
    import socket
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = '192.168.1.1'  # fallback
    
    allowed_origins = list({
        app.config.get('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
        # Mobile access - add your local network IPs
        f'http://{local_ip}:5173',
        f'http://{local_ip}:3000',
        'http://172.20.10.4:5173',  # Your main IP
        'http://192.168.127.1:5173',
        'http://192.168.42.1:5173',
        # Allow common private network ranges for mobile testing
        'http://192.168.1.1:5173',
        'http://10.0.0.1:5173'
    })
    
    app.logger.info(f'[CORS] Local IP detected: {local_ip}')
    app.logger.info(f'[CORS] Mobile access enabled on: http://{local_ip}:5173')

    CORS(
        app,
        origins=['*'],  # Allow all origins for development/mobile testing
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["Content-Type", "Authorization"],
        supports_credentials=False,  # Changed to False - using localStorage, not cookies
        max_age=3600,
        resources={r"/api/*": {"origins": "*"}}
    )
    
    # Initialize rate limiter only if enabled
    if app.config.get('ENABLE_RATE_LIMITING'):
        limiter = Limiter(
            app=app,
            key_func=clé_limite_débit,
            default_limits=["10000 per day", "1000 per hour", "100 per minute"],
            storage_uri="memory://"
        )
        app.logger.info('[OK] Rate limiting enabled: 10000/day, 1000/hour, 100/minute')
    else:
        # Create a dummy limiter that doesn't limit anything
        limiter = Limiter(
            app=app,
            key_func=lambda: "disabled",  # Return a string key but no actual limits
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
    def recherche_identité_utilisateur(identity):
        return str(identity)

    @jwt.user_lookup_loader
    def rappel_recherche_utilisateur(_jwt_header, jwt_data):
        identity = jwt_data.get('sub')
        if identity is None:
            return None
        try:
            identity = int(identity)
        except (TypeError, ValueError):
            return None
        return db.session.get(User, identity)

    # Gestionnaires d'événements WebSocket
    @socketio.on('connect')
    def gérer_connexion(auth):
        """Gérer la connexion du client"""
        token = None
        if isinstance(auth, dict):
            token = auth.get('token')
        if not token:
            token = request.args.get('token')

        if not token:
            sid = getattr(request, 'sid', 'unknown')
            app.logger.warning('[WebSocket] Jeton manquant pour le client %s', sid)
            return False

        try:
            décodé = decode_token(token)
            id_utilisateur = décodé.get('sub')
            utilisateur = db.session.get(User, id_utilisateur) if id_utilisateur is not None else None
            if not utilisateur:
                sid = getattr(request, 'sid', 'unknown')
                app.logger.warning('[WebSocket] Utilisateur invalide pour le client %s', sid)
                return False

            # Rejoindre la salle spécifique à l'utilisateur
            join_room(f'user_{utilisateur.id}')
            salons_rejoints = [f'user_{utilisateur.id}']
            
            # Rejoindre la salle admin si admin
            if utilisateur.role == 'admin':
                join_room('admin')
                salons_rejoints.append('admin')
            
            sid = getattr(request, 'sid', 'unknown')
            app.logger.info(f'[WebSocket] Client {sid} connecté - Utilisateur: {utilisateur.email} (ID: {utilisateur.id}) - Salons: {salons_rejoints}')
        except Exception as exc:
            sid = getattr(request, 'sid', 'unknown')
            app.logger.warning('[WebSocket] Validation du jeton échouée pour le client %s: %s', sid, exc)
            return False
    
    @socketio.on('disconnect')
    def gérer_déconnexion():
        """Gérer la déconnexion du client"""
        sid = getattr(request, 'sid', 'unknown')
        app.logger.info(f'[WebSocket] Client déconnecté: {sid}')
    
    @socketio.on('subscribe_sensors')
    def gérer_abonnement_capteurs(data):
        """Gérer l'abonnement aux capteurs depuis le client"""
        sid = getattr(request, 'sid', 'unknown')
        app.logger.info(f'[WebSocket] Client {sid} abonné aux mises à jour des capteurs')

    # Enregistrer les blueprints
    app.logger.info('[INFO] Enregistrement des blueprints API...')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(capteurs_bp, url_prefix='/api/sensors')
    app.register_blueprint(lectures_bp, url_prefix='/api/readings')
    app.register_blueprint(utilisateurs_bp, url_prefix='/api/users')
    app.register_blueprint(alertes_bp, url_prefix='/api/alerts')
    app.register_blueprint(rapports_bp, url_prefix='/api/reports')
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.logger.info('[OK] Tous les blueprints API enregistrés')
    
    # Point de terminaison de vérification de santé
    @app.route('/api/health')
    def vérification_santé():
        return jsonify({
            'status': 'healthy',
            'message': 'L\'API Aerium fonctionne',
            'features': {
                'rate_limiting': app.config.get('ENABLE_RATE_LIMITING', False)
            }
        }), 200
    
    # Point de terminaison de documentation API
    @app.route('/api/docs')
    def docs_api():
        return jsonify({
            'api_version': '1.0.0',
            'title': 'API du tableau de bord de qualité de l\'air Aerium',
            'description': 'API REST pour la surveillance de la qualité de l\'air en temps réel',
            'endpoints': {
                'auth': '/api/auth - Points de terminaison d\'authentification',
                'sensors': '/api/sensors - Gestion des capteurs',
                'readings': '/api/readings - Lectures des capteurs',
                'alerts': '/api/alerts - Gestion des alertes',
                'users': '/api/users - Gestion des utilisateurs',
                'reports': '/api/reports - Génération de rapports'
            }
        }), 200

    # Proxy audio pour éviter les problèmes d'origine croisée pour le chargement de fichiers audio distants
    @app.route('/api/proxy-audio')
    def proxy_audio():
        """Proxy une URL audio distante et la renvoyer au frontend avec les en-têtes CORS appropriés.

        Paramètres de requête:
            url: URL distant complet à récupérer
        """
        url = request.args.get('url')
        if not url:
            return jsonify({'error': 'Paramètre url manquant'}), 400

        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Aerium-Audio-Proxy'})
            distant = urllib.request.urlopen(req, timeout=15)

            type_contenu = distant.headers.get_content_type() or 'audio/mpeg'

            def générer():
                try:
                    while True:
                        chunk = distant.read(8192)
                        if not chunk:
                            break
                        yield chunk
                finally:
                    try:
                        distant.close()
                    except Exception:
                        pass

            return Response(stream_with_context(générer()), content_type=type_contenu)
        except Exception as e:
            app.logger.error(f'Erreur de proxy audio lors de la récupération {url}: {e}')
            return jsonify({'error': 'Échec de la récupération de l\'audio distant'}), 502
    
    # Gestionnaires d'erreur
    @app.errorhandler(404)
    def non_trouvé(error):
        return jsonify({'error': 'Ressource non trouvée'}), 404
    
    @app.errorhandler(500)
    def erreur_interne(error):
        app.logger.error(f'Erreur du serveur: {error}')
        return jsonify({'error': 'Erreur interne du serveur'}), 500
    
    @app.errorhandler(429)
    def gestionnaire_limite_débit(e):
        return jsonify({'error': 'Limite de débit dépassée. Réessayez plus tard.'}), 429
    
    # Gestionnaires d'erreur JWT
    @jwt.expired_token_loader
    def rappel_jeton_expiré(jwt_header, jwt_payload):
        return jsonify({'error': 'Le jeton a expiré'}), 401
    
    @jwt.invalid_token_loader
    def rappel_jeton_invalide(error):
        return jsonify({'error': 'Jeton invalide'}), 401
    
    @jwt.unauthorized_loader
    def rappel_jeton_manquant(error):
        return jsonify({'error': 'Le jeton d\'autorisation est manquant'}), 401
    
    # Initialiser la base de données
    with app.app_context():
        init_db()
        vérifier_colonnes_seuil_capteur(app)
    app.logger.info('[OK] Base de données initialisée')
    
    # Initialiser le planificateur pour la simulation des capteurs
    initialiser_planificateur(app, socketio)
    app.logger.info('[OK] Planificateur initialisé pour la simulation des capteurs')
    
    app.logger.info('[SUCCÈS] Application Aerium initialisée avec succès')
    return app, socketio

app, socketio = créer_app()

if __name__ == '__main__':
    print("\n" + "="*80)
    print("                   AERIUM - Plateforme de surveillance de la qualité de l'air")
    print("="*80)
    print("\n[DÉMARRRE] Le serveur backend Flask démarre...\n")
    print("[SERVICES]")
    print("  API:      http://0.0.0.0:5000")
    print("  WebSocket: ws://0.0.0.0:5000")
    print("\n[DÉBOGAGE] Mode débogage: ON")
    print("[INFO] Appuyez sur Ctrl+C pour arrêter le serveur\n")
    print("="*80 + "\n")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
