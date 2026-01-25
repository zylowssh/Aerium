from flask import Flask, jsonify, render_template, request, make_response, session, redirect, url_for, flash
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import random
import time
from datetime import datetime, date, UTC, timedelta
import os
from database import (get_db, init_db, get_user_by_username, create_user, get_user_by_id,
                      get_user_settings, update_user_settings, reset_user_settings,
                      create_verification_token, verify_email_token, cleanup_expired_tokens,
                      get_user_by_email, create_password_reset_token, verify_reset_token,
                      reset_password, cleanup_expired_reset_tokens, log_login, get_login_history,
                      is_admin, set_user_role, get_all_users, get_admin_stats,
                      log_audit, get_audit_logs, cleanup_old_audit_logs, cleanup_old_data,
                      cleanup_old_login_history, delete_user_with_audit, get_database_info,
                      init_onboarding, get_onboarding_status, update_onboarding_step, 
                      mark_feature_as_seen, complete_onboarding, start_tour, complete_tour,
                      create_scheduled_export, get_user_scheduled_exports, get_due_exports,
                      update_export_timestamp, delete_scheduled_export,
                      get_user_thresholds, update_user_thresholds, check_threshold_status,
                      grant_permission, revoke_permission, has_permission, get_user_permissions, get_users_with_permission,
                      import_csv_readings, get_csv_import_stats,
                      create_sensor, get_user_sensors, get_sensor_by_id, update_sensor, delete_sensor,
                      get_active_sensors, update_sensor_availability, update_sensor_last_read,
                      log_sensor_reading, get_sensor_readings, get_sensor_latest_reading,
                      update_sensor_thresholds, get_sensor_thresholds, check_sensor_threshold_status)

# Try to import APScheduler for automated cleanup tasks
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False
import json
from flask import send_file
try:
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    HTML = None
    WEASYPRINT_AVAILABLE = False
    # WeasyPrint requires system libraries (GTK) - PDF export will be unavailable
    # This is normal on Windows and can be safely ignored
import io
import threading
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import csv
import secrets

from utils.fake_co2 import generate_co2, generate_co2_data, save_reading, reset_state, set_scenario, get_scenario_info, set_paused
from utils.email_templates import send_verification_email, send_password_reset_email
from database import cleanup_old_data
from advanced_features import (AdvancedAnalytics, CollaborationManager, 
                               PerformanceOptimizer, VisualizationEngine)
from advanced_features_routes import register_advanced_features
from utils.source_helpers import resolve_source_param, build_source_filter



app = Flask(__name__)
from config import get_config
app.config.from_object(get_config())
from utils.logger import configure_logging
logger = configure_logging()
from error_handlers import register_error_handlers
register_error_handlers(app, logger)

# Initialize rate limiter - disabled for live data polling
# Uncomment and configure if you need rate limiting in production
# limiter = Limiter(
#     app=app,
#     key_func=get_remote_address,
#     default_limits=["500 per day", "150 per hour"],
#     storage_uri="memory://"
# )

# Create a dummy limiter for compatibility with existing routes
class DummyLimiter:
    def limit(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator
    
    def exempt(self, f):
        return f

limiter = DummyLimiter()

# Configure CORS for WebSocket (allow specific origins instead of *)
# For local development, allows localhost; in production, use environment variables
allowed_origins = os.getenv('WEBSOCKET_ALLOWED_ORIGINS', 'localhost,127.0.0.1').split(',')
allowed_origins = [origin.strip() for origin in allowed_origins]

socketio = SocketIO(
    app,
    cors_allowed_origins=allowed_origins,
    async_mode='threading',
    logger=False,
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25
)

init_db()

# ================================================================================
#                    BACKGROUND SCHEDULER SETUP
# ================================================================================

if SCHEDULER_AVAILABLE:
    scheduler = BackgroundScheduler()
    
    def scheduled_cleanup():
        """Run cleanup tasks on a schedule"""
        try:
            retention_days = int(os.getenv('DATA_RETENTION_DAYS', '90'))
            logger.info(f"Running scheduled cleanup: removing data older than {retention_days} days")
            cleanup_old_data(retention_days)
            cleanup_old_audit_logs(days_to_keep=365)  # Keep audit logs longer
            cleanup_old_login_history(days_to_keep=30)
            cleanup_expired_tokens()
            cleanup_expired_reset_tokens()
        except Exception as e:
            logger.error(f"Cleanup task failed: {e}")
    
    # Schedule cleanup to run daily at 2 AM
    scheduler.add_job(scheduled_cleanup, 'cron', hour=2, minute=0, id='cleanup_task')
    scheduler.start()
    logger.info("✓ Background scheduler started - daily cleanup at 2:00 AM")
else:
    logger.warning("APScheduler not installed - automatic cleanup disabled. Install with: pip install apscheduler")
    scheduler = None

# Register advanced features routes
register_advanced_features(app, limiter)

# Register Jinja2 globals for templates
app.jinja_env.globals['is_admin'] = is_admin

# ================================================================================
#                    CONTEXT PROCESSOR
# ================================================================================

@app.context_processor
def inject_user_context():
    """Inject user context variables into all templates"""
    user_is_admin = False
    if 'user_id' in session:
        user_is_admin = is_admin(session['user_id'])
    
    return {
        'current_user_is_admin': user_is_admin,
        'is_logged_in': 'user_id' in session
    }

# ================================================================================
#                    SECURITY HEADERS & MIDDLEWARE
# ================================================================================

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdn.socket.io unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' cdn.jsdelivr.net cdn.socket.io unpkg.com ws: wss:; font-src 'self' data:;"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    try:
        user_id = session.get('user_id')
        logger.info(f"{request.method} {request.path} -> {response.status_code} user={user_id}")
    except Exception:
        pass
    return response

@app.before_request
def log_request():
    try:
        user_id = session.get('user_id')
        logger.info(f"REQ {request.method} {request.path} user={user_id}")
    except Exception:
        pass

def load_settings():
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    db.close()

    settings = DEFAULT_SETTINGS.copy()
    for r in rows:
        settings[r["key"]] = json.loads(r["value"])

    return settings

# Template folder verified during development - remove debug output for cleaner logs
logger.debug(f"Current directory: {os.getcwd()}")
logger.debug(f"Template folder exists: {os.path.exists('templates')}")

DEFAULT_SETTINGS = {
    "analysis_running": True,
    "good_threshold": 800,
    "warning_threshold": 1000,
    "bad_threshold": 1200,
    "critical_threshold": 1200,
    "alert_threshold": 1400,
    "realistic_mode": True,
    "update_speed": 1,
    "overview_update_speed": 5,
    "simulate_live": False,
}

def save_settings(data):
    db = get_db()
    for k, v in data.items():
        db.execute(
            "REPLACE INTO settings (key, value) VALUES (?, ?)",
            (k, json.dumps(v))
        )
    db.commit()
    db.close()

from utils.auth_decorators import login_required, admin_required, permission_required

from blueprints.auth import auth_bp
from blueprints.main import main_bp
from blueprints.data_export import export_bp, initialize_export_tables
from blueprints.gdpr import gdpr_bp, initialize_gdpr_tables
from blueprints.api import api_bp
from blueprints.analytics import analytics_bp
from blueprints.admin_routes import admin_bp
from blueprints.sensors import sensors_bp
from blueprints.data_io import create_data_io_blueprint
from blueprints.collaboration import collab_bp, register_collab_sockets

app.register_blueprint(auth_bp)
app.register_blueprint(main_bp)
app.register_blueprint(export_bp)
app.register_blueprint(gdpr_bp)
app.register_blueprint(api_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(sensors_bp)
app.register_blueprint(create_data_io_blueprint(limiter))
app.register_blueprint(collab_bp)

# Initialize database tables for new features
try:
    initialize_export_tables()
    initialize_gdpr_tables()
except Exception as e:
    logger.warning(f"Could not initialize new feature tables: {e}")

# Register real-time collaboration WebSocket handlers
register_collab_sockets(socketio)

# Main routes moved to main blueprint

@app.route("/performance")
@login_required
def performance_feature():
    """Performance & Optimization feature page (User + Admin Tabs)"""
    return render_template("features/performance.html")

@app.route("/health")
@login_required
def health_feature():
    """Health Recommendations feature page"""
    return render_template("features/health-feature.html")

# ================================================================================
#                    MOBILE PWA ROUTES
# ================================================================================

@app.route('/manifest.json')
def manifest():
    """PWA Manifest for installable app - Enhanced Version"""
    try:
        with open(os.path.join(app.root_path, 'manifest.json'), 'r') as f:
            manifest_data = json.load(f)
        return jsonify(manifest_data)
    except FileNotFoundError:
        # Fallback to basic manifest if file not found
        return jsonify({
            'name': 'Aerium - Air Quality Monitor',
            'short_name': 'Aerium',
            'description': 'Real-time CO₂ air quality monitoring system with advanced analytics',
            'start_url': '/',
            'scope': '/',
            'display': 'standalone',
            'orientation': 'any',
            'theme_color': '#0f0f23',
            'background_color': '#0f0f23',
            'icons': [
                {
                    'src': '/static/images/icon-192.png',
                    'sizes': '192x192',
                    'type': 'image/png',
                    'purpose': 'any maskable'
                },
                {
                    'src': '/static/images/icon-512.png',
                    'sizes': '512x512',
                    'type': 'image/png',
                    'purpose': 'any maskable'
                }
            ]
        })

@app.route('/sw.js')
def service_worker():
    """Service Worker for offline support and caching - Enhanced Version"""
    try:
        # Try to serve the enhanced service worker file
        with open(os.path.join(app.root_path, 'sw.js'), 'r') as f:
            sw_content = f.read()
        response = make_response(sw_content)
    except FileNotFoundError:
        # Fallback to inline service worker if file not found
        response = make_response("""
// Fallback Service Worker for Aerium
const CACHE_NAME = 'aerium-v1.0.0-fallback';
const STATIC_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/js/enhanced-ui.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => console.log('Some assets failed to cache')))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Skip external CDN resources
  if (url.hostname.includes('cdn.jsdelivr.net') || 
      url.hostname.includes('cdn.socket.io') ||
      url.hostname.includes('unpkg.com')) {
    return;
  }

  // Network first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
      .catch(() => new Response('Offline', { status: 503 }))
  );
});
""")
    
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

# Admin routes moved to blueprints/admin_routes.py

# ================================================================================
#                        ONBOARDING ROUTES
# ================================================================================
# Main onboarding page moved to main blueprint
# Keeping API routes here for centralized management

@app.route("/api/onboarding/step/<int:step>", methods=["POST"])
@login_required
def update_onboarding_progress(step):
    """Update onboarding step"""
    user_id = session.get('user_id')
    success, normalized_step = update_onboarding_step(user_id, step)
    if not success:
        return jsonify({'success': False, 'step': normalized_step, 'error': 'Step regression not allowed'}), 400
    return jsonify({'success': True, 'step': normalized_step})

@app.route("/api/onboarding/feature/<feature>", methods=["POST"])
@login_required
def mark_feature_seen(feature):
    """Mark a feature as seen"""
    user_id = session.get('user_id')
    mark_feature_as_seen(user_id, feature)
    return jsonify({'success': True})

@app.route("/api/onboarding/complete", methods=["POST"])
@login_required
def finish_onboarding():
    """Complete onboarding"""
    user_id = session.get('user_id')
    complete_onboarding(user_id)
    return jsonify({'success': True})

@app.route("/api/onboarding/tour", methods=["POST"])
@login_required
def handle_tour():
    """Handle tour start/complete"""
    user_id = session.get('user_id')
    action = request.json.get('action')
    
    if action == 'start':
        start_tour(user_id)
    elif action == 'complete':
        complete_tour(user_id)
    
    return jsonify({'success': True})

# Data export/import routes moved to blueprints/data_io.py

# ================================================================================
#                        GLOBAL SEARCH
# ================================================================================

@app.route("/api/search")
@login_required
def global_search():
    """Global search across pages, sensors, users, and content"""
    query = request.args.get('q', '').strip().lower()
    if not query or len(query) < 2:
        return jsonify({'results': []})
    
    results = []
    user_id = session.get('user_id')
    user_is_admin = is_admin(user_id)
    
    # Search pages/features
    pages = [
        {'name': 'Tableau de bord', 'url': url_for('main.dashboard'), 'category': 'page', 'icon': '📊'},
        {'name': 'Surveillance en direct', 'url': url_for('main.live_page'), 'category': 'page', 'icon': '📡'},
        {'name': 'Paramètres', 'url': url_for('main.settings_page'), 'category': 'page', 'icon': '⚙️'},
        {'name': 'Capteurs', 'url': url_for('main.sensors_page'), 'category': 'page', 'icon': '🎛️'},
        {'name': 'Visualisation', 'url': url_for('main.visualization_page'), 'category': 'page', 'icon': '📈'},
        {'name': 'Export de données', 'url': url_for('main.data_export_page'), 'category': 'page', 'icon': '💾'},
        {'name': 'Import de données', 'url': url_for('main.data_import_page'), 'category': 'page', 'icon': '📥'},
        {'name': 'Profil utilisateur', 'url': url_for('auth.profile'), 'category': 'page', 'icon': '👤'},
        {'name': 'Historique de connexion', 'url': url_for('auth.login_history'), 'category': 'page', 'icon': '📋'},
    ]
    
    if user_is_admin:
        pages.extend([
            {'name': 'Administration', 'url': url_for('main.admin'), 'category': 'page', 'icon': '👨‍💼'},
            {'name': 'Gestion des utilisateurs', 'url': url_for('main.user_management'), 'category': 'page', 'icon': '👥'},
            {'name': 'Journal d\'audit', 'url': url_for('main.audit_log'), 'category': 'page', 'icon': '📜'},
            {'name': 'Informations système', 'url': url_for('main.system_info'), 'category': 'page', 'icon': 'ℹ️'},
            {'name': 'Simulateur', 'url': url_for('main.simulator'), 'category': 'page', 'icon': '🎮'},
        ])
    
    for page in pages:
        if query in page['name'].lower():
            results.append({
                'title': page['name'],
                'url': page['url'],
                'category': page['category'],
                'icon': page['icon'],
                'match': 'name'
            })
    
    # Search user sensors
    try:
        sensors = get_user_sensors(user_id)
        for sensor in sensors:
            if query in sensor['name'].lower() or query in sensor.get('location', '').lower():
                results.append({
                    'title': sensor['name'],
                    'url': url_for('main.sensors_page'),
                    'category': 'sensor',
                    'icon': '🎛️',
                    'description': f"Capteur: {sensor.get('location', 'Sans emplacement')}",
                    'match': 'sensor'
                })
    except Exception:
        pass
    
    # Search keywords/terms for quick help
    keywords = {
        'co2': {'title': 'Niveau de CO₂', 'url': url_for('main.live_page'), 'desc': 'Voir les mesures en temps réel'},
        'ppm': {'title': 'Parties par million', 'url': url_for('main.live_page'), 'desc': 'Unité de mesure CO₂'},
        'export': {'title': 'Exporter les données', 'url': url_for('main.data_export_page'), 'desc': 'CSV, JSON, Excel, PDF'},
        'import': {'title': 'Importer les données', 'url': url_for('main.data_import_page'), 'desc': 'Charger des données CSV'},
        'seuil': {'title': 'Seuils d\'alerte', 'url': url_for('main.settings_page'), 'desc': 'Configurer les alertes'},
        'historique': {'title': 'Historique des données', 'url': url_for('main.visualization_page'), 'desc': 'Visualiser l\'historique'},
        'connexion': {'title': 'Historique de connexion', 'url': url_for('auth.login_history'), 'desc': 'Voir vos connexions'},
        'mot de passe': {'title': 'Changer le mot de passe', 'url': url_for('auth.change_password'), 'desc': 'Mettre à jour votre mot de passe'},
        'theme': {'title': 'Thème sombre/clair', 'url': url_for('main.settings_page'), 'desc': 'Changer l\'apparence'},
    }
    
    for keyword, data in keywords.items():
        if query in keyword:
            results.append({
                'title': data['title'],
                'url': data['url'],
                'category': 'help',
                'icon': '❓',
                'description': data['desc'],
                'match': 'keyword'
            })
    
    # Limit to top 10 results
    return jsonify({'results': results[:10]})

# Sensor and threshold routes moved to blueprints/sensors.py

# Analytics routes moved to blueprints/analytics.py

@app.route("/api/history/<range>")
@login_required
def history_range(range):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()

    if range == "today":
        rows = db.execute("""
            SELECT ppm, timestamp
            FROM co2_readings
            WHERE date(timestamp) = date('now') AND user_id = ?
            ORDER BY timestamp
        """, (user_id,)).fetchall()

    elif range == "7d":
        rows = db.execute("""
            SELECT ppm, timestamp
            FROM co2_readings   
            WHERE timestamp >= datetime('now', '-7 days') AND user_id = ?
            ORDER BY timestamp
        """, (user_id,)).fetchall()

    elif range == "30d":
        rows = db.execute("""
            SELECT ppm, timestamp
            FROM co2_readings
            WHERE timestamp >= datetime('now', '-30 days') AND user_id = ?
            ORDER BY timestamp
        """, (user_id,)).fetchall()

    else:
        db.close()
        return jsonify({"error": "Invalid range"}), 400

    db.close()
    return jsonify([dict(r) for r in rows])

# 3. API ROUTES
def get_latest_real_reading(max_age_minutes: int = 1):
    """Return the most recent hardware reading for the current user if fresh enough."""
    user_id = session.get("user_id")
    if not user_id:
        return None

    db = get_db()
    row = db.execute(
        """
        SELECT ppm, temperature, humidity, timestamp, source
        FROM co2_readings
        WHERE source IN ('sensor','live_real') AND user_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()
    db.close()

    if not row:
        return None

    ts_raw = row["timestamp"]
    if ts_raw:
        try:
            ts_dt = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
            if ts_dt < datetime.now(UTC) - timedelta(minutes=max_age_minutes):
                return None
        except Exception:
            # If parsing fails, treat as stale to avoid surfacing ghost values
            return None

    return dict(row)


def build_live_payload(settings=None):
    """Centralized live-reading builder (used by HTTP and WebSocket)."""
    settings = settings or load_settings()

    user_id = session.get("user_id")
    if not user_id:
        return settings, {
            "analysis_running": False,
            "ppm": None,
            "reason": "unauthenticated",
            "timestamp": datetime.now(UTC).isoformat()
        }

    # Respect paused state first
    if not settings.get("analysis_running", True):
        return settings, {
            "analysis_running": False,
            "ppm": None,
            "reason": "paused",
            "timestamp": datetime.now(UTC).isoformat()
        }

    # Simulator data must NOT feed the live UI; only the simulator page uses /api/simulator/latest
    # If simulate_live is flagged true, treat it as no_sensor for the live endpoint/UI.
    if settings.get("simulate_live", False):
        return settings, {
            "analysis_running": False,
            "ppm": None,
            "reason": "no_sensor",
            "timestamp": datetime.now(UTC).isoformat()
        }

    # Real sensor path: use freshest non-simulated reading
    latest = get_latest_real_reading()
    if not latest:
        return settings, {
            "analysis_running": False,
            "ppm": None,
            "reason": "no_sensor",
            "timestamp": datetime.now(UTC).isoformat()
        }

    return settings, {
        "analysis_running": True,
        "ppm": latest.get("ppm"),
        "temp": latest.get("temperature"),
        "humidity": latest.get("humidity"),
        "timestamp": latest.get("timestamp", datetime.now(UTC).isoformat())
    }


@app.route("/api/live/latest")
@limiter.exempt
@login_required
def api_live_latest():
    _, payload = build_live_payload()
    resp = make_response(jsonify(payload))
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.route("/api/readings", methods=["POST", "GET"])
@limiter.exempt
@login_required
def api_readings_ingest():
    """Ingest real sensor readings (POST) or fetch recent readings (GET)."""
    if request.method == "GET":
        days = request.args.get("days", default=1, type=int)
        db_source = resolve_source_param(allow_sim=True, allow_import=True)
        source_clause, source_params = build_source_filter(db_source)
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        db = get_db()
        rows = db.execute(
            f"""
            SELECT ppm, temperature, humidity, timestamp, source
            FROM co2_readings
            WHERE timestamp >= datetime('now', ?)
            AND {source_clause}
            AND user_id = ?
            ORDER BY timestamp DESC
            """,
            (f"-{days} days", *source_params, user_id)
        ).fetchall()
        db.close()
        return jsonify([dict(r) for r in rows])

    data = request.get_json(silent=True) or {}
    ppm = data.get("ppm")
    if ppm is None:
        return jsonify({"error": "ppm is required"}), 400

    temp = data.get("temp", data.get("temperature"))
    humidity = data.get("humidity")

    try:
        ppm_int = int(ppm)
    except Exception:
        return jsonify({"error": "ppm must be numeric"}), 400

    user_id = session.get("user_id")
    save_reading(ppm_int, temp, humidity, source="sensor", persist=True, user_id=user_id)
    return jsonify({"success": True})


@app.route("/api/latest")
@login_required
def api_latest():
    # Backward-compatible alias
    return api_live_latest()


@app.route("/api/simulator/latest")
@limiter.exempt
@login_required
def api_simulator_latest():
    """Simulator-only feed that stays independent from the live pipeline."""
    settings = load_settings()

    data = generate_co2_data(settings.get("realistic_mode", True))
    ppm = data["co2"]
    temp = data.get("temp")
    humidity = data.get("humidity")

    # Persist simulator traffic as source="sim" so analytics can display it
    user_id = session.get("user_id")
    save_reading(ppm, temp, humidity, source="sim", persist=True, user_id=user_id)

    resp = make_response(jsonify({
        "analysis_running": True,
        "ppm": ppm,
        "temp": temp,
        "humidity": humidity,
        "timestamp": datetime.now(UTC).isoformat()
    }))
    resp.headers["Cache-Control"] = "no-store"
    return resp

@app.route("/api/history/today")
@login_required
def api_history_today():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    source_raw = request.args.get("source", "real")

    db = get_db()
    if source_raw == "all":
        rows = db.execute(
            """
            SELECT ppm, temperature, humidity, timestamp, source
            FROM co2_readings
            WHERE date(timestamp) = date('now') AND user_id = ?
            ORDER BY timestamp
            """,
            (user_id,)
        ).fetchall()
    else:
        db_source = resolve_source_param(default="live", allow_sim=True, allow_import=True)
        source_clause, source_params = build_source_filter(db_source)
        rows = db.execute(
            f"""
            SELECT ppm, temperature, humidity, timestamp, source
            FROM co2_readings
            WHERE date(timestamp) = date('now') AND {source_clause} AND user_id = ?
            ORDER BY timestamp
            """,
            (*source_params, user_id)
        ).fetchall()

    db.close()

    return jsonify([dict(r) for r in rows])

def get_today_history(db_source="live", user_id=None):
    if not user_id:
        return []

    source_clause, source_params = build_source_filter(db_source)

    db = get_db()
    rows = db.execute(f"""
        SELECT ppm, timestamp
        FROM co2_readings
        WHERE date(timestamp) = date('now') AND {source_clause} AND user_id = ?
        ORDER BY timestamp
    """, (*source_params, user_id)).fetchall()
    db.close()

    return [dict(r) for r in rows]


@limiter.exempt
@app.route("/api/settings", methods=["GET", "POST", "DELETE"])
@login_required
def api_settings():
    if request.method == "POST":
        if not is_admin(session.get("user_id")):
            return jsonify({"error": "Admin required"}), 403
        data = request.json
        
        # Map warning_threshold to bad_threshold for backend compatibility
        if 'warning_threshold' in data and 'bad_threshold' not in data:
            data['bad_threshold'] = data['warning_threshold']
        if 'critical_threshold' in data and 'alert_threshold' not in data:
            data['alert_threshold'] = data['critical_threshold']
        
        save_settings(data)
        
        # Broadcast updated settings to all WebSocket clients
        saved_settings = load_settings()
        socketio.emit('settings_update', saved_settings)
        
        return jsonify({"status": "ok", "settings": saved_settings})

    if request.method == "DELETE":
        if not is_admin(session.get("user_id")):
            return jsonify({"error": "Admin required"}), 403
        db = get_db()
        db.execute("DELETE FROM settings")
        db.commit()
        db.close()
        
        # Broadcast reset to all WebSocket clients
        socketio.emit('settings_update', DEFAULT_SETTINGS)
        
        return jsonify(DEFAULT_SETTINGS)

    # GET: Return settings with frontend-compatible field names
    settings = load_settings()
    
    # Map backend fields to frontend expected names
    if 'bad_threshold' in settings and 'warning_threshold' not in settings:
        settings['warning_threshold'] = settings['bad_threshold']
    if 'alert_threshold' in settings and 'critical_threshold' not in settings:
        settings['critical_threshold'] = settings['alert_threshold']
    
    return jsonify(settings)

@app.route("/api/user/profile")
@login_required
def api_user_profile():
    """Get current user's profile information"""
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user['id'],
        "username": user['username'],
        "email": user['email'],
        "role": "Admin" if is_admin(user_id) else "Utilisateur",
        "created_at": user.get('created_at'),
    })

@app.route("/api/user/change-password", methods=["POST"])
@login_required
def api_change_password():
    """Change user password"""
    user_id = session['user_id']
    data = request.json
    
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        return jsonify({"error": "Missing required fields"}), 400
    
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    user = get_user_by_id(user_id)
    if not user or not check_password_hash(user['password_hash'], current_password):
        return jsonify({"error": "Current password is incorrect"}), 401
    
    # Update password
    db = get_db()
    hashed = generate_password_hash(new_password)
    db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, user_id))
    db.commit()
    db.close()
    
    log_audit(user_id, "UPDATE", "Password changed")
    
    return jsonify({"status": "ok", "message": "Password changed successfully"})

# Admin data endpoints moved to blueprints/admin_routes.py

@app.route("/api/history/latest/<int:limit>")
@login_required
def api_history_latest(limit):
    db_source = resolve_source_param(allow_sim=True, allow_import=True)
    source_clause, source_params = build_source_filter(db_source)
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    rows = db.execute(f"""
        SELECT id, ppm, timestamp
        FROM co2_readings
        WHERE {source_clause} AND user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (*source_params, user_id, limit)).fetchall()
    db.close()

    # reverse so oldest → newest
    return jsonify([dict(r) for r in reversed(rows)])

@app.route("/api/cleanup", methods=["POST"])
@login_required
@admin_required
def api_cleanup():
    """Clean up old CO₂ readings (default: 90 days)"""
    days = request.json.get("days", 90) if request.json else 90
    deleted = cleanup_old_data(days)
    return jsonify({"status": "ok", "deleted": deleted, "days": days})

@app.route("/api/reset-state", methods=["POST"])
@login_required
@admin_required
def api_reset_state():
    """Reset CO₂ generator state"""
    base = request.json.get("base", 600) if request.json else 600
    reset_state(base)
    return jsonify({"status": "ok", "base": base})

@app.route("/api/thresholds", methods=["GET", "POST"])
@login_required
def api_thresholds():
    """Get or update user's CO₂ thresholds"""
    user_id = session['user_id']
    
    if request.method == "GET":
        thresholds = get_user_thresholds(user_id)
        return jsonify({
            "good_level": thresholds['good_level'],
            "warning_level": thresholds['warning_level'],
            "critical_level": thresholds['critical_level']
        }), 200
    
    elif request.method == "POST":
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        good = int(data.get('good_level', 800))
        warning = int(data.get('warning_level', 1000))
        critical = int(data.get('critical_level', 1200))
        
        # Validate: good < warning < critical
        if not (good < warning < critical):
            return jsonify({"error": "Invalid threshold order"}), 400
        
        update_user_thresholds(user_id, good, warning, critical)
        log_audit(user_id, "UPDATE", "Thresholds updated")
        
        return jsonify({
            "status": "ok",
            "good_level": good,
            "warning_level": warning,
            "critical_level": critical
        }), 200
    
    return jsonify({"error": "Method not allowed"}), 405

def generate_pdf(html):
    pdf_io = io.BytesIO()

    HTML(
        string=html,
        base_url=os.path.abspath(".")
    ).write_pdf(
        target=pdf_io,
        presentational_hints=True
    )

    pdf_io.seek(0)

    return send_file(
        pdf_io,
        mimetype="application/pdf",
        as_attachment=False,
        download_name="daily_report.pdf"
    )


@app.route("/api/report/daily/pdf")
@login_required
def export_daily_pdf():
    db_source = resolve_source_param(allow_sim=True, allow_import=True)
    user_id = session.get("user_id")
    data = get_today_history(db_source, user_id)
    settings = load_settings()

    if not data:
        return "No data", 400

    values = [d["ppm"] for d in data]

    avg = round(sum(values) / len(values))
    max_ppm = max(values)
    min_ppm = min(values)

    # ⏱ minutes above bad threshold
    bad_minutes = sum(1 for v in values if v >= settings["bad_threshold"])

    # ✅ EXPOSURE BREAKDOWN (THIS IS YOUR QUESTION)
    good = sum(1 for v in values if v < settings["good_threshold"])
    medium = sum(
        1 for v in values
        if settings["good_threshold"] <= v < settings["bad_threshold"]
    )
    bad = sum(1 for v in values if v >= settings["bad_threshold"])
    total = len(values)

    good_pct = round(good / total * 100)
    medium_pct = round(medium / total * 100)
    bad_pct = round(bad / total * 100)

    with open("static/css/report.css", "r", encoding="utf-8") as f:
        report_css = f.read()

    html = render_template(
        "system/report_daily.html",
        date=date.today().strftime("%d %B %Y"),
        avg=avg,
        max=max_ppm,
        min=min_ppm,
        bad_minutes=bad_minutes,
        good_pct=good_pct,
        medium_pct=medium_pct,
        bad_pct=bad_pct,
        good_threshold=settings["good_threshold"],
        bad_threshold=settings["bad_threshold"],
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        report_css=report_css
    )

    return generate_pdf(html)


@app.route("/healthz")
def healthz():
    db = get_db()
    latest = db.execute("SELECT ppm, timestamp FROM co2_readings ORDER BY id DESC LIMIT 1").fetchone()
    count = db.execute("SELECT COUNT(*) AS c FROM co2_readings").fetchone()["c"]
    settings = load_settings()
    db.close()

    return jsonify({
        "status": "ok",
        "analysis_running": settings.get("analysis_running", True),
        "rows": count,
        "latest_ppm": latest["ppm"] if latest else None,
        "latest_timestamp": latest["timestamp"] if latest else None,
    })


@app.route("/metrics")
def metrics():
    db = get_db()
    latest = db.execute("SELECT ppm, timestamp FROM co2_readings ORDER BY id DESC LIMIT 1").fetchone()
    count = db.execute("SELECT COUNT(*) AS c FROM co2_readings").fetchone()["c"]
    settings = load_settings()
    db.close()

    payload = {
        "rows": count,
        "analysis_running": settings.get("analysis_running", True),
        "good_threshold": settings.get("good_threshold"),
        "bad_threshold": settings.get("bad_threshold"),
        "update_speed": settings.get("update_speed"),
        "overview_update_speed": settings.get("overview_update_speed"),
        "latest_ppm": latest["ppm"] if latest else None,
        "latest_timestamp": latest["timestamp"] if latest else None,
    }

    return jsonify(payload)


# ================================================================================
#                    HARDWARE SIMULATION CONTROL (TESTING)
# ================================================================================

@app.route("/api/simulator/scenario/<scenario_name>", methods=['POST'])
@login_required
def set_simulation_scenario(scenario_name):
    """Set simulation scenario for testing"""
    # Allow scenario changes without admin gate for local simulator control
    # (previously blocked with a 403 when not authenticated as admin).
    # If you need to re-enable the check, restore the guard below:
    # if not is_admin(session.get('user_id')):
    #     return jsonify({'success': False, 'error': 'Admin only'}), 403
    
    duration = request.json.get('duration', 0) if request.json else 0
    valid_scenarios = ['normal', 'office_hours', 'sleep', 'ventilation', 'anomaly']
    
    if scenario_name not in valid_scenarios:
        return jsonify({'success': False, 'error': f'Invalid scenario. Must be one of: {valid_scenarios}'}), 400
    
    result = set_scenario(scenario_name, duration)
    
    if result:
        return jsonify({
            'success': True,
            'message': f'Scenario set to {scenario_name}',
            'duration': duration,
            'info': get_scenario_info()
        })
    return jsonify({'success': False, 'error': 'Failed to set scenario'}), 400


@app.route("/api/simulator/status", methods=['GET'])
@limiter.exempt
@login_required
def get_simulator_status():
    """Get current simulator status"""
    info = get_scenario_info()
    return jsonify({
        'success': True,
        'simulator': {
            'scenario': info['scenario'],
            'co2': info['co2'],
            'temperature': info['temp'],
            'humidity': info['humidity'],
            'timer': info['timer'],
            'duration': info['duration'],
            'paused': info.get('paused', False)
        }
    })


@app.route("/api/simulator/pause", methods=['POST'])
@login_required
def pause_simulator():
    """Pause or resume the simulator progression."""
    desired = False
    if request.json is not None:
        desired = bool(request.json.get('paused', False))

    set_paused(desired)
    info = get_scenario_info()
    return jsonify({
        'success': True,
        'paused': desired,
        'simulator': {
            'scenario': info['scenario'],
            'co2': info['co2'],
            'temperature': info['temp'],
            'humidity': info['humidity'],
            'timer': info['timer'],
            'duration': info['duration'],
            'paused': info.get('paused', desired)
        }
    })


@app.route("/api/simulator/reset", methods=['POST'])
@login_required
def reset_simulator():
    """Reset simulator to initial state"""
    if not is_admin(session.get('user_id')):
        return jsonify({'success': False, 'error': 'Admin only'}), 403
    
    base_co2 = request.json.get('base_co2', 600) if request.json else 600
    scenario = request.json.get('scenario', 'normal') if request.json else 'normal'
    
    reset_state(base_co2, scenario)
    
    return jsonify({
        'success': True,
        'message': 'Simulator reset',
        'info': get_scenario_info()
    })


# ================================================================================
#                          WEBSOCKET HANDLERS
# ================================================================================

# Global state for WebSocket broadcasting
broadcast_thread = None
broadcast_running = False

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket"""
    logger.info(f"Client connected: {request.sid}")
    emit('status', {'data': 'Connected to Aerium CO₂ Monitor'})
    
    # Send current settings to client
    settings = load_settings()
    emit('settings_update', settings)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('request_data')
def handle_request_data():
    """Handle request for latest CO₂ data"""
    _, payload = build_live_payload()
    emit('co2_update', payload)

@socketio.on('settings_change')
def handle_settings_change(data):
    """Handle settings update and broadcast to all clients"""
    save_settings(data)
    # Broadcast to all clients
    socketio.emit('settings_update', data)

def broadcast_co2_loop():
    """Background thread that broadcasts CO₂ readings to all connected clients"""
    global broadcast_running
    broadcast_running = True
    last_ppm = None
    last_state = None  # 'running', 'paused', 'no_sensor'
    
    while broadcast_running:
        settings = load_settings()
        update_delay = settings.get("update_speed", 0.5)

        settings, payload = build_live_payload(settings)
        current_state = "running" if payload.get("analysis_running") else payload.get("reason", "paused")

        if not payload.get("analysis_running"):
            if last_state != current_state:
                socketio.emit('co2_update', {
                    'analysis_running': False,
                    'reason': payload.get('reason'),
                    'ppm': None,
                    'timestamp': datetime.now(UTC).isoformat()
                }, to=None)
                last_state = current_state
            time.sleep(update_delay)
            continue

        socketio.emit('co2_update', payload, to=None)
        last_ppm = payload.get('ppm')
        last_state = current_state

        time.sleep(update_delay)

def start_broadcast_thread():
    """Start the background broadcast thread"""
    global broadcast_thread, broadcast_running
    if broadcast_thread is None or not broadcast_thread.is_alive():
        broadcast_running = True
        broadcast_thread = threading.Thread(target=broadcast_co2_loop, daemon=True)
        broadcast_thread.start()
        logger.info("[OK] WebSocket broadcast thread started")

def stop_broadcast_thread():
    """Stop the background broadcast thread"""
    global broadcast_running
    broadcast_running = False
    logger.info("[OK] WebSocket broadcast thread stopped")




if __name__ == "__main__":
    # Database migrations
    try:
        db = get_db()
        
        # Add temperature and humidity columns to co2_readings if missing
        try:
            db.execute("ALTER TABLE co2_readings ADD COLUMN temperature REAL")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE co2_readings ADD COLUMN humidity REAL")
        except Exception:
            pass
        
        # Migrate audit_logs table to add missing columns
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN user_id INTEGER")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN username TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN entity_type TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN entity_id TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN details TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN status TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN severity TEXT")
        except Exception:
            pass
        
        db.commit()
        db.close()
    except Exception as e:
        print(f"Migration error: {e}")

# Export simulation now served via data_io blueprint

if __name__ == "__main__":
    # Database migrations
    try:
        db = get_db()
        
        # Add temperature and humidity columns to co2_readings if missing
        try:
            db.execute("ALTER TABLE co2_readings ADD COLUMN temperature REAL")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE co2_readings ADD COLUMN humidity REAL")
        except Exception:
            pass
        
        # Migrate audit_logs table to add missing columns
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN user_id INTEGER")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN username TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN entity_type TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN entity_id TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN details TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN status TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE audit_logs ADD COLUMN severity TEXT")
        except Exception:
            pass
        
        db.commit()
        db.close()
    except Exception as e:
        print(f"Migration error: {e}")

    start_broadcast_thread()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)