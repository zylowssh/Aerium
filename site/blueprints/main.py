from flask import Blueprint, render_template, redirect, url_for, session
from utils.auth_decorators import login_required
from database import (
    get_db, get_user_by_id, get_user_settings, get_login_history,
    get_admin_stats, get_all_users, is_admin
)

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def index():
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    user_id = session.get('user_id')
    if is_admin(user_id):
        admin_stats = get_admin_stats()
        admin_users = get_all_users()
        return render_template('dashboard.html', is_admin=True, admin_stats=admin_stats, admin_users=admin_users)
    else:
        user = get_user_by_id(user_id)
        user_settings = get_user_settings(user_id)
        login_history = get_login_history(user_id, limit=10)
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            SELECT COUNT(*) as total_readings, AVG(ppm) as avg_ppm, MAX(ppm) as max_ppm, MIN(ppm) as min_ppm
            FROM readings
            WHERE DATE(timestamp) = CURRENT_DATE
        """)
        today_stats = cursor.fetchone()
        cursor.execute("""
            SELECT COUNT(*) as total_readings, AVG(ppm) as avg_ppm
            FROM readings
            WHERE DATE(timestamp) >= DATE('now', '-7 days')
        """)
        week_stats = cursor.fetchone()
        user_threshold = user_settings.get('co2_threshold', 800) if user_settings else 800
        cursor.execute("""
            SELECT COUNT(*) as bad_events
            FROM readings
            WHERE DATE(timestamp) = CURRENT_DATE AND ppm > ?
        """, (user_threshold,))
        bad_events = cursor.fetchone()
        db.close()
        return render_template('dashboard.html', is_admin=False, user=user, user_settings=user_settings,
                               login_history=login_history, today_stats=today_stats,
                               week_stats=week_stats, bad_events=bad_events)

@main_bp.route('/live')
@login_required
def live_page():
    return render_template('monitoring/live.html')

@main_bp.route('/settings')
@login_required
def settings_page():
    return render_template('user-management/settings.html')

@main_bp.route('/sensors')
@login_required
def sensors_page():
    return render_template('system/sensors.html')

@main_bp.route('/simulator')
@login_required
def simulator_page():
    return render_template('system/simulator.html')

@main_bp.route('/visualization')
@login_required
def visualization():
    return render_template('visualization/visualization.html')

@main_bp.route('/advanced-features')
@login_required
def advanced_features_page():
    return render_template('features/advanced-features.html')

@main_bp.route('/analytics')
@login_required
def analytics_feature():
    return render_template('analytics/analytics-enhanced.html')

@main_bp.route('/visualizations')
@login_required
def visualizations_feature():
    return render_template('visualization/visualizations-feature.html')

@main_bp.route('/collaboration')
@login_required
def collaboration_feature():
    return render_template('collaboration/collaboration-enhanced.html')

@main_bp.route('/export')
@login_required
def export_manager():
    return render_template('data-export/export-enhanced.html')

@main_bp.route('/organizations')
@login_required
def organizations():
    return redirect(url_for('main.collaboration_feature'))

@main_bp.route('/team-collaboration')
@login_required
def team_collaboration():
    return redirect(url_for('main.collaboration_feature'))

@main_bp.route('/admin/performance')
@login_required
def performance_monitoring():
    return redirect(url_for('main.analytics_feature'))

@main_bp.route('/onboarding')
@login_required
def onboarding_page():
    """Onboarding/tutorial page"""
    from database import get_onboarding_status, init_onboarding
    from flask import session
    user_id = session.get('user_id')
    onboarding = get_onboarding_status(user_id)
    
    # Initialize if doesn't exist
    if not onboarding:
        init_onboarding(user_id)
        onboarding = get_onboarding_status(user_id)
    
    return render_template('user-management/onboarding.html', onboarding=onboarding)
