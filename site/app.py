from flask import Flask, jsonify, render_template, request, make_response, session, redirect, url_for
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
                      import_csv_readings, get_csv_import_stats)
import json
from flask import send_file
import io
from weasyprint import HTML
import threading
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import csv
import secrets

from fake_co2 import generate_co2, save_reading, reset_state
from database import cleanup_old_data


app = Flask(__name__)
app.config['SECRET_KEY'] = 'morpheus-co2-secret-key'

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Email configuration (using development/testing settings)
# In production, use environment variables for credentials
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', True)
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@morpheus-co2.local')

socketio = SocketIO(app, cors_allowed_origins="*")

init_db()

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
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdn.socket.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

def send_verification_email(email, username, token):
    """Send email verification link"""
    try:
        from flask_mail import Mail, Message
        mail = Mail(app)
        
        verify_url = url_for('verify_email', token=token, _external=True)
        subject = "Verify your Morpheus CO₂ Account"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #3dd98f 0%, #4db8ff 100%); padding: 20px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
                        <h1 style="margin: 0;">🌍 Morpheus CO₂ Monitor</h1>
                    </div>
                    
                    <h2 style="color: #3dd98f;">Welcome, {username}!</h2>
                    <p>Thank you for registering with Morpheus. Please verify your email address to complete your account setup.</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="margin-bottom: 15px;">Click the button below to verify your email:</p>
                        <a href="{verify_url}" style="background: linear-gradient(135deg, #3dd98f 0%, #4db8ff 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #666;">Or copy and paste this link in your browser:</p>
                    <p style="font-size: 11px; color: #666; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">{verify_url}</p>
                    
                    <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
                        This link will expire in 24 hours. If you didn't create this account, please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(subject=subject, recipients=[email], html=html_body)
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_password_reset_email(email, username, token):
    """Send password reset email"""
    try:
        from flask_mail import Mail, Message
        mail = Mail(app)
        
        reset_url = url_for('reset_password_page', token=token, _external=True)
        subject = "Reset your Morpheus CO₂ Password"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #3dd98f 0%, #4db8ff 100%); padding: 20px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
                        <h1 style="margin: 0;">🌍 Morpheus CO₂ Monitor</h1>
                    </div>
                    
                    <h2 style="color: #3dd98f;">Password Reset Request</h2>
                    <p>Hi {username},</p>
                    <p>You requested to reset your password. Click the button below to proceed:</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="margin-bottom: 15px;">Click the button below to reset your password:</p>
                        <a href="{reset_url}" style="background: linear-gradient(135deg, #3dd98f 0%, #4db8ff 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #666;">Or copy and paste this link in your browser:</p>
                    <p style="font-size: 11px; color: #666; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">{reset_url}</p>
                    
                    <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
                        This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
                    </p>
                </div>
            </body>
        </html>
        """
        
        msg = Message(subject=subject, recipients=[email], html=html_body)
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Failed to send password reset email: {str(e)}")
        return False

def load_settings():
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    db.close()

    settings = DEFAULT_SETTINGS.copy()
    for r in rows:
        settings[r["key"]] = json.loads(r["value"])

    return settings

print("=" * 50)
print(f"Current directory: {os.getcwd()}")
print(f"Template folder exists: {os.path.exists('templates')}")
if os.path.exists('templates'):
    print(f"Files in templates/: {os.listdir('templates')}")
print("=" * 50)

DEFAULT_SETTINGS = {
    "analysis_running": True,
    "good_threshold": 800,
    "bad_threshold": 1200,
    "alert_threshold": 1400,
    "realistic_mode": True,
    "update_speed": 1,
    "overview_update_speed": 5,
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

# ================================================================================
#                        AUTHENTICATION DECORATOR
# ================================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page', next=request.url))
        if not is_admin(session['user_id']):
            return render_template("error.html", 
                error="Access Denied",
                message="You need administrator privileges to access this page."), 403
        return f(*args, **kwargs)
    return decorated_function

def permission_required(permission):
    """Decorator to check if user has a specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('login_page', next=request.url))
            if not has_permission(session['user_id'], permission):
                return render_template("error.html",
                    error="Access Denied",
                    message=f"You do not have the '{permission}' permission."), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ================================================================================
#                        AUTHENTICATION ROUTES
# ================================================================================

@app.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def login_page():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember_me = request.form.get("remember_me") == "on"
        
        if not username or not password:
            return render_template("login.html", error="Nom d'utilisateur et mot de passe requis")
        
        user = get_user_by_username(username)
        
        if user and check_password_hash(user['password_hash'], password):
            # Login successful
            session['user_id'] = user['id']
            session['username'] = user['username']
            
            # Log successful login
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', 'Unknown')
            log_login(user['id'], ip_address, user_agent, success=True)
            
            # Handle "Remember Me" - extend session duration
            if remember_me:
                session.permanent = True
                app.permanent_session_lifetime = timedelta(days=30)
            
            # Check if user has completed onboarding
            onboarding = get_onboarding_status(user['id'])
            if not onboarding or not onboarding.get('completed'):
                return redirect(url_for('onboarding_page'))
            
            next_page = request.args.get('next')
            if next_page and next_page.startswith('/'):
                return redirect(next_page)
            return redirect(url_for('index'))
        else:
            return render_template("login.html", error="Identifiants invalides")
    
    return render_template("login.html")

@app.route("/forgot-password", methods=["GET", "POST"])
@limiter.limit("3 per minute")
def forgot_password_page():
    """Request password reset"""
    if request.method == "POST":
        email = request.form.get("email")
        
        if not email:
            return render_template("forgot_password.html", error="Veuillez entrer votre email")
        
        user = get_user_by_email(email)
        
        if user:
            # Generate reset token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.now(UTC) + timedelta(hours=1)
            create_password_reset_token(user['id'], token, expires_at)
            
            # Send reset email
            email_sent = send_password_reset_email(email, user['username'], token)
            
            if email_sent:
                return render_template("forgot_password.html",
                    success=True,
                    message=f"Vérifiez votre email ({email}) pour obtenir le lien de réinitialisation du mot de passe.")
            else:
                # Email service not configured, still show success for security
                return render_template("forgot_password.html",
                    success=True,
                    message="Si ce compte existe, un email de réinitialisation a été envoyé.")
        else:
            # Don't reveal if email exists (security best practice)
            return render_template("forgot_password.html",
                success=True,
                message="Si ce compte existe, un email de réinitialisation a été envoyé.")
    
    return render_template("forgot_password.html")

@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password_page(token):
    """Reset password with token"""
    user_id = verify_reset_token(token)
    
    if not user_id:
        return render_template("reset_password.html", 
            error="Lien de réinitialisation invalide ou expiré.", 
            valid_token=False), 400
    
    if request.method == "POST":
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")
        
        # Validation
        if not new_password or not confirm_password:
            return render_template("reset_password.html", error="Tous les champs sont requis", valid_token=True)
        
        if len(new_password) < 6:
            return render_template("reset_password.html", 
                error="Le mot de passe doit contenir au moins 6 caractères", 
                valid_token=True)
        
        if new_password != confirm_password:
            return render_template("reset_password.html", 
                error="Les mots de passe ne correspondent pas", 
                valid_token=True)
        
        # Reset password
        new_password_hash = generate_password_hash(new_password)
        reset_password(user_id, new_password_hash, token)
        
        return render_template("reset_password.html", 
            success=True, 
            message="Votre mot de passe a été réinitialisé avec succès! Vous pouvez maintenant vous connecter.")
    
    return render_template("reset_password.html", valid_token=True)

@app.route("/register", methods=["GET", "POST"])
@limiter.limit("3 per minute")
def register_page():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        
        # Validation
        if not all([username, email, password, confirm_password]):
            return render_template("register.html", error="Tous les champs sont requis")
        
        if len(username) < 3:
            return render_template("register.html", error="Le nom d'utilisateur doit contenir au moins 3 caractères")
        
        if len(password) < 6:
            return render_template("register.html", error="Le mot de passe doit contenir au moins 6 caractères")
        
        if password != confirm_password:
            return render_template("register.html", error="Les mots de passe ne correspondent pas")
        
        # Check if username or email already exists
        if get_user_by_username(username):
            return render_template("register.html", error="Ce nom d'utilisateur existe déjà")
        
        # Create user
        password_hash = generate_password_hash(password)
        user_id = create_user(username, email, password_hash)
        
        if not user_id:
            return render_template("register.html", error="Cet email existe déjà")
        
        # Generate verification token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(UTC) + timedelta(hours=24)
        create_verification_token(user_id, token, expires_at)
        
        # Send verification email
        email_sent = send_verification_email(email, username, token)
        
        if email_sent:
            return render_template("register.html", 
                success=True,
                message=f"Inscription réussie! Vérifiez votre email ({email}) pour confirmer votre compte.")
        else:
            # Email service not configured, allow login without verification
            session['user_id'] = user_id
            session['username'] = username
            # Redirect to onboarding for new users
            return redirect(url_for('onboarding_page'))
    
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route("/verify/<token>")
def verify_email(token):
    """Verify user email with token"""
    user_id = verify_email_token(token)
    
    if user_id:
        user = get_user_by_id(user_id)
        if user:
            return render_template("email_verified.html", username=user['username'], success=True)
        else:
            return render_template("email_verified.html", 
                error="Lien de vérification invalide ou expiré. Veuillez vous réinscrire.",
                success=False), 400
    else:
        return render_template("email_verified.html", 
            error="Lien de vérification invalide ou expiré. Veuillez vous réinscrire.",
            success=False), 400

@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    user_id = session.get('user_id')
    user = get_user_by_id(user_id)
    user_settings = get_user_settings(user_id)
    login_history = get_login_history(user_id, limit=5)  # Get last 5 logins
    admin_stats = None
    admin_users = None
    
    # Check if user is admin to load admin dashboard data
    if is_admin(user_id):
        admin_stats = get_admin_stats()
        admin_users = get_all_users()
    
    # Note: CO₂ threshold settings are now handled in /settings page
    # Profile page is only for user info and admin dashboard
    if request.method == "POST":
        # This route no longer handles form submissions
        # CO₂ settings go to /api/settings
        pass
    
    return render_template("profile.html", 
                         user=user, 
                         settings=user_settings, 
                         login_history=login_history,
                         is_admin=is_admin(user_id),
                         admin_stats=admin_stats,
                         admin_users=admin_users)

@app.route("/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    user_id = session.get('user_id')
    user = get_user_by_id(user_id)
    
    if not user:
        session.clear()
        return redirect(url_for('login_page'))
    
    if request.method == "POST":
        current_password = request.form.get('current_password', "")
        new_password = request.form.get('new_password', "")
        confirm_password = request.form.get('confirm_password', "")
        
        error = None
        
        # Validation
        if not all([current_password, new_password, confirm_password]):
            error = "Tous les champs sont requis"
        elif not check_password_hash(user['password_hash'], current_password):
            error = "Mot de passe actuel incorrect"
        elif len(new_password) < 6:
            error = "Le nouveau mot de passe doit contenir au moins 6 caractères"
        elif new_password != confirm_password:
            error = "Les mots de passe ne correspondent pas"
        
        if error:
            return render_template("change_password.html", error=error)
        
        # Update password
        db = get_db()
        new_password_hash = generate_password_hash(new_password)
        db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (new_password_hash, user_id)
        )
        db.commit()
        db.close()
        
        return render_template("change_password.html", success=True)
    
    return render_template("change_password.html", user=user)
    return render_template("profile.html", user=user, settings=user_settings)

# 1. ROOT ROUTE - DASHBOARD (MUST BE FIRST!)
@app.route("/")
@login_required
def index():
    return render_template("index.html")  # Overview/vue d'ensemble page

@app.route("/dashboard")
@login_required
def dashboard():
    """Unified landing page - shows admin dashboard for admins, user info for others"""
    user_id = session.get('user_id')
    
    if is_admin(user_id):
        # Show admin dashboard with stats
        admin_stats = get_admin_stats()
        admin_users = get_all_users()
        return render_template("dashboard.html", 
                             is_admin=True,
                             admin_stats=admin_stats,
                             admin_users=admin_users)
    else:
        # Show regular user landing page
        return render_template("dashboard.html", is_admin=False)

@app.route("/live")
@login_required
def live_page():
    return render_template("live.html")  # Settings page

# 2. SETTINGS ROUTE
@app.route("/settings")
@login_required
def settings_page():
    return render_template("settings.html")  # Settings page

@app.route("/visualization")
@login_required
def visualization():
    """Advanced data visualization dashboard with CSV import"""
    return render_template("visualization.html")

@app.route("/debug-session")
def debug_session():
    """Debug session and auth info"""
    user_data = None
    if session.get('user_id'):
        user = get_user_by_id(session.get('user_id'))
        if user:
            user_data = {
                "id": user['id'],
                "username": user['username'],
                "role": user['role'],
            }
    
    return jsonify({
        "session_user_id": session.get('user_id'),
        "session_username": session.get('username'),
        "user_in_session": 'user_id' in session,
        "is_admin_result": is_admin(session.get('user_id')) if 'user_id' in session else None,
        "user_data": user_data
    })

@app.route("/admin")
@admin_required
def admin_dashboard():
    """Admin dashboard with statistics and user management"""
    stats = get_admin_stats()
    users = get_all_users()
    audit_logs = get_audit_logs(limit=20)
    db_info = get_database_info()
    
    return render_template("admin.html", 
                         stats=stats, 
                         users=users, 
                         audit_logs=audit_logs,
                         db_info=db_info)

@app.route("/admin/user/<int:user_id>/role/<role>", methods=["POST"])
@admin_required
def update_user_role(user_id, role):
    """Update user role (admin or user)"""
    if role not in ['user', 'admin']:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Prevent self-demotion
    if user_id == session.get('user_id') and role == 'user':
        return jsonify({'error': 'Cannot remove your own admin privileges'}), 400
    
    if set_user_role(user_id, role):
        # Log the action
        admin_id = session.get('user_id')
        ip_address = request.remote_addr
        log_audit(admin_id, 'user_role_updated', 'user', user_id, 
                 'role_changed', f"user → {role}", ip_address)
        
        return jsonify({'success': True, 'role': role})
    return jsonify({'error': 'Failed to update role'}), 500

@app.route("/api/permissions", methods=["GET"])
@login_required
def get_my_permissions():
    """Get current user's permissions"""
    user_id = session.get('user_id')
    permissions = get_user_permissions(user_id)
    return jsonify({"permissions": permissions})

@app.route("/api/permissions/<int:user_id>", methods=["GET"])
@admin_required
def get_user_perms(user_id):
    """Get a specific user's permissions (admin only)"""
    permissions = get_user_permissions(user_id)
    return jsonify({"user_id": user_id, "permissions": permissions})

@app.route("/api/permissions/<int:user_id>/<permission>", methods=["POST"])
@admin_required
def add_permission(user_id, permission):
    """Grant a permission to a user"""
    valid_perms = ['view_reports', 'manage_exports', 'manage_sensors', 'manage_alerts', 'manage_users']
    
    if permission not in valid_perms:
        return jsonify({"error": f"Invalid permission. Valid: {', '.join(valid_perms)}"}), 400
    
    grant_permission(user_id, permission)
    log_audit(session.get('user_id'), 'permission_granted', 'user', user_id, 
             'permission', permission, request.remote_addr)
    
    return jsonify({"status": "ok", "permission": permission})

@app.route("/api/permissions/<int:user_id>/<permission>", methods=["DELETE"])
@admin_required
def remove_permission(user_id, permission):
    """Revoke a permission from a user"""
    revoke_permission(user_id, permission)
    log_audit(session.get('user_id'), 'permission_revoked', 'user', user_id,
             'permission', permission, request.remote_addr)
    
    return jsonify({"status": "ok", "permission": permission})

@app.route("/admin/user/<int:user_id>/delete", methods=["POST"])
@admin_required
def delete_user_admin(user_id):
    """Delete a user account (admin only)"""
    # Prevent self-deletion
    if user_id == session.get('user_id'):
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    admin_id = session.get('user_id')
    ip_address = request.remote_addr
    
    if delete_user_with_audit(user_id, admin_id, ip_address):
        return jsonify({'success': True})
    
    return jsonify({'error': 'Failed to delete user'}), 500

@app.route("/admin/maintenance", methods=["POST"])
@admin_required
def admin_maintenance():
    """Execute maintenance tasks"""
    task = request.json.get('task')
    admin_id = session.get('user_id')
    ip_address = request.remote_addr
    
    results = {}
    
    if task == 'cleanup_old_data':
        days = request.json.get('days', 90)
        deleted = cleanup_old_data(days)
        results['deleted_readings'] = deleted
        log_audit(admin_id, 'maintenance_cleanup_data', None, None, 
                 f'days={days}', f'deleted={deleted}', ip_address)
    
    elif task == 'cleanup_old_logs':
        days = request.json.get('days', 180)
        deleted = cleanup_old_audit_logs(days)
        results['deleted_audit_logs'] = deleted
        log_audit(admin_id, 'maintenance_cleanup_logs', None, None, 
                 f'days={days}', f'deleted={deleted}', ip_address)
    
    elif task == 'cleanup_login_history':
        days = request.json.get('days', 90)
        deleted = cleanup_old_login_history(days)
        results['deleted_logins'] = deleted
        log_audit(admin_id, 'maintenance_cleanup_logins', None, None, 
                 f'days={days}', f'deleted={deleted}', ip_address)
    
    else:
        return jsonify({'error': 'Unknown maintenance task'}), 400
    
    return jsonify({'success': True, **results})

@app.route("/admin/audit-logs")
@admin_required
def view_audit_logs():
    """View audit logs"""
    action_filter = request.args.get('action')
    page = request.args.get('page', 1, type=int)
    limit = 50
    
    logs = get_audit_logs(limit=limit * page, action_filter=action_filter)
    
    return render_template("audit_logs.html", logs=logs, action_filter=action_filter)

# ================================================================================
#                        ONBOARDING ROUTES
# ================================================================================

@app.route("/onboarding")
@login_required
def onboarding_page():
    """Onboarding/tutorial page"""
    user_id = session.get('user_id')
    onboarding = get_onboarding_status(user_id)
    
    # Initialize if doesn't exist
    if not onboarding:
        init_onboarding(user_id)
        onboarding = get_onboarding_status(user_id)
    
    return render_template("onboarding.html", onboarding=onboarding)

@app.route("/api/onboarding/step/<int:step>", methods=["POST"])
@login_required
def update_onboarding_progress(step):
    """Update onboarding step"""
    user_id = session.get('user_id')
    update_onboarding_step(user_id, step)
    return jsonify({'success': True, 'step': step})

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

# ================================================================================
#                        DATA EXPORT ROUTES
# ================================================================================

@app.route("/api/export/json")
@login_required
@limiter.limit("10 per minute")
def export_json():
    """Export CO₂ data as JSON"""
    user_id = session.get('user_id')
    days = request.args.get('days', 30, type=int)
    
    db = get_db()
    readings = db.execute("""
        SELECT timestamp, ppm FROM co2_readings
        WHERE timestamp >= datetime('now', '-' || ? || ' days')
        ORDER BY timestamp DESC
    """, (days,)).fetchall()
    db.close()
    
    data = {
        'export_date': datetime.now(UTC).isoformat(),
        'days': days,
        'count': len(readings),
        'readings': [{'timestamp': r['timestamp'], 'ppm': r['ppm']} for r in readings]
    }
    
    return jsonify(data)

@app.route("/api/export/csv")
@login_required
@limiter.limit("10 per minute")
def export_csv():
    """Export CO₂ data as CSV"""
    user_id = session.get('user_id')
    days = request.args.get('days', 30, type=int)
    
    db = get_db()
    readings = db.execute("""
        SELECT timestamp, ppm FROM co2_readings
        WHERE timestamp >= datetime('now', '-' || ? || ' days')
        ORDER BY timestamp DESC
    """, (days,)).fetchall()
    db.close()
    
    # Generate CSV
    csv_content = "timestamp,ppm\n"
    for row in readings:
        csv_content += f"{row['timestamp']},{row['ppm']}\n"
    
    response = make_response(csv_content)
    response.headers['Content-Disposition'] = f'attachment; filename="co2_export_{days}d.csv"'
    response.headers['Content-Type'] = 'text/csv'
    
    return response

@app.route("/api/export/excel")
@login_required
@limiter.limit("10 per minute")
def export_excel():
    """Export CO₂ data as Excel"""
    user_id = session.get('user_id')
    days = request.args.get('days', 30, type=int)
    
    db = get_db()
    readings = db.execute("""
        SELECT timestamp, ppm FROM co2_readings
        WHERE timestamp >= datetime('now', '-' || ? || ' days')
        ORDER BY timestamp DESC
    """, (days,)).fetchall()
    db.close()
    
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
        
        wb = openpyxl.Workbook()
        ws = wb.active
        if ws is None:
            return jsonify({'error': 'Failed to create Excel workbook'}), 500
        
        ws.title = "CO₂ Data"
        
        # Headers
        ws['A1'] = "Timestamp"
        ws['B1'] = "PPM"
        for cell in ['A1', 'B1']:
            ws[cell].font = Font(bold=True, color="FFFFFF")
            ws[cell].fill = PatternFill(start_color="3DD98F", end_color="3DD98F", fill_type="solid")
        
        # Data
        for idx, row in enumerate(readings, start=2):
            ws[f'A{idx}'] = row['timestamp']
            ws[f'B{idx}'] = row['ppm']
        
        # Column widths
        ws.column_dimensions['A'].width = 25
        ws.column_dimensions['B'].width = 15
        
        # Save to bytes
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = f'attachment; filename="co2_export_{days}d.xlsx"'
        response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        
        return response
    except ImportError:
        return jsonify({'error': 'Excel support not installed. Install openpyxl: pip install openpyxl'}), 400

@app.route("/api/export/schedule", methods=["POST"])
@login_required
def schedule_export():
    """Setup scheduled exports"""
    user_id = session.get('user_id')
    format = request.json.get('format', 'csv')
    frequency = request.json.get('frequency', 'weekly')
    
    if format not in ['csv', 'json', 'excel']:
        return jsonify({'error': 'Invalid format'}), 400
    
    if frequency not in ['daily', 'weekly', 'monthly']:
        return jsonify({'error': 'Invalid frequency'}), 400
    
    create_scheduled_export(user_id, format, frequency)
    return jsonify({'success': True, 'format': format, 'frequency': frequency})

@app.route("/api/export/scheduled")
@login_required
def get_scheduled_exports():
    """Get user's scheduled exports"""
    user_id = session.get('user_id')
    exports = get_user_scheduled_exports(user_id)
    
    return jsonify({
        'exports': [dict(e) for e in exports]
    })

@app.route("/api/export/scheduled/<int:export_id>", methods=["DELETE"])
@login_required
def remove_scheduled_export(export_id):
    """Remove a scheduled export"""
    user_id = session.get('user_id')
    
    # Verify ownership
    db = get_db()
    export = db.execute(
        "SELECT user_id FROM scheduled_exports WHERE id = ?",
        (export_id,)
    ).fetchone()
    db.close()
    
    if not export or export['user_id'] != user_id:
        return jsonify({'error': 'Not found'}), 404
    
    delete_scheduled_export(export_id)
    return jsonify({'success': True})

@app.route("/api/import/csv", methods=["POST"])
@login_required
@limiter.limit("5 per minute")
def import_csv():
    """Import CO₂ readings from CSV file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if not file or not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    if not filename or not filename.lower().endswith('.csv'):
        return jsonify({'error': 'File must be CSV format'}), 400
    
    try:
        # Parse CSV
        stream = io.TextIOWrapper(file.stream, encoding='utf-8')
        reader = csv.DictReader(stream)
        readings = []
        
        for row in reader:
            if row.get('timestamp') and row.get('ppm'):
                readings.append({
                    'timestamp': row['timestamp'],
                    'ppm': row['ppm']
                })
        
        if not readings:
            return jsonify({'error': 'No valid readings found in CSV'}), 400
        
        # Import
        result = import_csv_readings(readings)
        
        # Log the import
        log_audit(session.get('user_id'), 'CSV_IMPORT', 'data', 0,
                 'imported_count', str(result['imported']), request.remote_addr)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'Failed to parse CSV: {str(e)}'}), 400

@app.route("/api/import/stats")
@admin_required
def import_stats():
    """Get data import statistics"""
    stats = get_csv_import_stats()
    return jsonify(stats)

# ================================================================================
#                        ANALYTICS ROUTES (ENHANCED)
# ================================================================================

@app.route("/api/analytics/weekcompare")
@login_required
def analytics_week_compare():
    """Get week-over-week comparison data"""
    db = get_db()
    
    # Current week
    current_week = db.execute("""
        SELECT DATE(timestamp) as date, AVG(ppm) as avg_ppm, MAX(ppm) as max_ppm, MIN(ppm) as min_ppm, COUNT(*) as count
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date
    """).fetchall()
    
    # Previous week
    prev_week = db.execute("""
        SELECT DATE(timestamp) as date, AVG(ppm) as avg_ppm, MAX(ppm) as max_ppm, MIN(ppm) as min_ppm, COUNT(*) as count
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-14 days') AND timestamp < datetime('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date
    """).fetchall()
    
    db.close()
    
    return jsonify({
        'current_week': [dict(row) for row in current_week],
        'previous_week': [dict(row) for row in prev_week]
    })

@app.route("/api/analytics/trend")
@login_required
def analytics_trend():
    """Get trend analysis (rising/stable/falling)"""
    db = get_db()
    
    # Get hourly averages for last 7 days
    data = db.execute("""
        SELECT 
            strftime('%Y-%m-%d %H:00', timestamp) as hour,
            AVG(ppm) as avg_ppm,
            COUNT(*) as readings
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-7 days')
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 168
    """).fetchall()
    
    db.close()
    
    if len(data) < 2:
        return jsonify({'trend': 'insufficient_data', 'data': []})
    
    # Calculate trend
    recent_avg = sum(d['avg_ppm'] for d in data[:24]) / min(24, len(data))
    older_avg = sum(d['avg_ppm'] for d in data[24:48]) / min(24, len(data[24:]))
    
    if older_avg == 0:
        trend = 'insufficient_data'
    else:
        percent_change = ((recent_avg - older_avg) / older_avg) * 100
        if percent_change > 5:
            trend = 'rising'
        elif percent_change < -5:
            trend = 'falling'
        else:
            trend = 'stable'
    
    return jsonify({
        'trend': trend,
        'recent_avg': round(recent_avg, 1),
        'older_avg': round(older_avg, 1),
        'percent_change': round(((recent_avg - older_avg) / older_avg) * 100, 1) if older_avg else 0,
        'data': [dict(d) for d in data]
    })

@app.route("/api/analytics/custom")
@login_required
def analytics_custom_range():
    """Get data for custom date range"""
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    if not start_date or not end_date:
        return jsonify({'error': 'start and end dates required'}), 400
    
    db = get_db()
    
    readings = db.execute("""
        SELECT timestamp, ppm FROM co2_readings
        WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
        ORDER BY timestamp
    """, (start_date, end_date)).fetchall()
    
    # Calculate stats
    stats = db.execute("""
        SELECT 
            COUNT(*) as count,
            AVG(ppm) as avg,
            MIN(ppm) as min,
            MAX(ppm) as max
        FROM co2_readings
        WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
    """, (start_date, end_date)).fetchone()
    
    db.close()
    
    return jsonify({
        'readings': [dict(r) for r in readings],
        'stats': dict(stats) if stats else {'count': 0, 'avg': 0, 'min': 0, 'max': 0}
    })

@app.route("/api/analytics/compare-periods")
@login_required
def compare_periods():
    """Compare CO₂ data between two time periods (e.g., this week vs last week)"""
    period_type = request.args.get('type', 'week')  # week, month, or custom
    
    db = get_db()
    
    if period_type == 'week':
        # Compare this week to last week
        current_data = db.execute("""
            SELECT AVG(ppm) as avg, MIN(ppm) as min, MAX(ppm) as max, COUNT(*) as count
            FROM co2_readings
            WHERE timestamp >= datetime('now', '-7 days')
        """).fetchone()
        
        previous_data = db.execute("""
            SELECT AVG(ppm) as avg, MIN(ppm) as min, MAX(ppm) as max, COUNT(*) as count
            FROM co2_readings
            WHERE timestamp >= datetime('now', '-14 days') AND timestamp < datetime('now', '-7 days')
        """).fetchone()
        
    elif period_type == 'month':
        # Compare this month to last month
        current_data = db.execute("""
            SELECT AVG(ppm) as avg, MIN(ppm) as min, MAX(ppm) as max, COUNT(*) as count
            FROM co2_readings
            WHERE timestamp >= datetime('now', 'start of month')
        """).fetchone()
        
        previous_data = db.execute("""
            SELECT AVG(ppm) as avg, MIN(ppm) as min, MAX(ppm) as max, COUNT(*) as count
            FROM co2_readings
            WHERE timestamp >= datetime('now', '-1 month', 'start of month')
            AND timestamp < datetime('now', 'start of month')
        """).fetchone()
    else:
        return jsonify({'error': 'Invalid period_type'}), 400
    
    db.close()
    
    # Calculate differences
    def calc_diff(current, previous, field):
        if previous[field] is None or previous[field] == 0:
            return 0
        return round(((current[field] - previous[field]) / previous[field]) * 100, 1)
    
    return jsonify({
        'period': period_type,
        'current': dict(current_data) if current_data else {},
        'previous': dict(previous_data) if previous_data else {},
        'differences': {
            'avg_percent': calc_diff(current_data, previous_data, 'avg'),
            'min_percent': calc_diff(current_data, previous_data, 'min'),
            'max_percent': calc_diff(current_data, previous_data, 'max'),
        }
    })

@app.route("/api/analytics/daily-comparison")
@login_required
def daily_comparison():
    """Get daily averages for the last 30 days for trend visualization"""
    db = get_db()
    
    days_data = db.execute("""
        SELECT 
            DATE(timestamp) as date,
            AVG(ppm) as avg_ppm,
            MIN(ppm) as min_ppm,
            MAX(ppm) as max_ppm,
            COUNT(*) as readings
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """).fetchall()
    
    db.close()
    
    return jsonify({
        'days': 30,
        'data': [dict(d) for d in days_data]
    })

@app.route("/api/analytics/report/pdf")
@login_required
def generate_pdf_report():
    """Generate PDF report with charts"""
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    if not start_date or not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    db = get_db()
    
    # Get data
    readings = db.execute("""
        SELECT DATE(timestamp) as date, AVG(ppm) as avg_ppm, MAX(ppm) as max_ppm, MIN(ppm) as min_ppm
        FROM co2_readings
        WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
        GROUP BY DATE(timestamp)
        ORDER BY date
    """, (start_date, end_date)).fetchall()
    
    stats = db.execute("""
        SELECT 
            COUNT(*) as count,
            AVG(ppm) as avg,
            MIN(ppm) as min,
            MAX(ppm) as max
        FROM co2_readings
        WHERE DATE(timestamp) >= ? AND DATE(timestamp) <= ?
    """, (start_date, end_date)).fetchone()
    
    db.close()
    
    # Build HTML for PDF
    html_content = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #3dd98f; }}
                .stats {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }}
                .stat {{ padding: 15px; background: #f0f0f0; border-radius: 8px; text-align: center; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #3dd98f; }}
                .stat-label {{ color: #666; margin-top: 5px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #3dd98f; color: white; }}
            </style>
        </head>
        <body>
            <h1>🌬️ CO₂ Monitoring Report</h1>
            <p>Period: {start_date} to {end_date}</p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">{stats['count']}</div>
                    <div class="stat-label">Readings</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{round(stats['avg'], 1)}</div>
                    <div class="stat-label">Avg PPM</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{round(stats['min'], 0)}</div>
                    <div class="stat-label">Min PPM</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{round(stats['max'], 0)}</div>
                    <div class="stat-label">Max PPM</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Average PPM</th>
                        <th>Min PPM</th>
                        <th>Max PPM</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    for row in readings:
        html_content += f"""
                    <tr>
                        <td>{row['date']}</td>
                        <td>{round(row['avg_ppm'], 1)}</td>
                        <td>{round(row['min_ppm'], 0)}</td>
                        <td>{round(row['max_ppm'], 0)}</td>
                    </tr>
        """
    
    html_content += """
                </tbody>
            </table>
        </body>
    </html>
    """
    
    # Generate PDF
    try:
        pdf = HTML(string=html_content).write_pdf()
        response = make_response(pdf)
        response.headers['Content-Disposition'] = f'attachment; filename="report_{start_date}_to_{end_date}.pdf"'
        response.headers['Content-Type'] = 'application/pdf'
        return response
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

@app.route("/api/history/<range>")
def history_range(range):
    db = get_db()

    if range == "today":
        rows = db.execute("""
            SELECT ppm, timestamp
            FROM co2_readings
            WHERE date(timestamp) = date('now')
            ORDER BY timestamp
        """).fetchall()

    elif range == "7d":
        rows = db.execute("""
            SELECT ppm, timestamp
            FROM co2_readings
            WHERE timestamp >= datetime('now', '-7 days')
            ORDER BY timestamp
        """).fetchall()

    elif range == "30d":
        rows = db.execute("""
            SELECT ppm, timestamp
            FROM co2_readings
            WHERE timestamp >= datetime('now', '-30 days')
            ORDER BY timestamp
        """).fetchall()

    else:
        db.close()
        return jsonify({"error": "Invalid range"}), 400

    db.close()
    return jsonify([dict(r) for r in rows])

# 3. API ROUTES
@app.route("/api/latest")
def api_latest():
    settings = load_settings()

    if not settings["analysis_running"]:
        resp = make_response(jsonify({
            "analysis_running": False,
            "ppm": None
        }))
        resp.headers["Cache-Control"] = "no-store"
        return resp

    ppm = generate_co2(settings["realistic_mode"])
    save_reading(ppm)

    resp = make_response(jsonify({
        "analysis_running": True,
        "ppm": ppm,
        "timestamp": datetime.utcnow().isoformat()
    }))
    resp.headers["Cache-Control"] = "no-store"
    return resp

@app.route("/api/history/today")
def api_history_today():
    db = get_db()
    rows = db.execute("""
        SELECT ppm, timestamp
        FROM co2_readings
        WHERE date(timestamp) = date('now')
        ORDER BY timestamp
    """).fetchall()
    db.close()

    return jsonify([dict(r) for r in rows])

def get_today_history():
    db = get_db()
    rows = db.execute("""
        SELECT ppm, timestamp
        FROM co2_readings
        WHERE date(timestamp) = date('now')
        ORDER BY timestamp
    """).fetchall()
    db.close()

    return [dict(r) for r in rows]


@app.route("/api/settings", methods=["GET", "POST", "DELETE"])
def api_settings():
    if request.method == "POST":
        save_settings(request.json)
        return jsonify({"status": "ok"})

    if request.method == "DELETE":
        db = get_db()
        db.execute("DELETE FROM settings")
        db.commit()
        db.close()
        
        # Broadcast reset to all WebSocket clients
        socketio.emit('settings_update', DEFAULT_SETTINGS)
        
        return jsonify(DEFAULT_SETTINGS)

    return jsonify(load_settings())

@app.route("/api/history/latest/<int:limit>")
def api_history_latest(limit):
    db = get_db()
    rows = db.execute("""
        SELECT id, ppm, timestamp
        FROM co2_readings
        ORDER BY id DESC
        LIMIT ?
    """, (limit,)).fetchall()
    db.close()

    # reverse so oldest → newest
    return jsonify([dict(r) for r in reversed(rows)])

@app.route("/api/cleanup", methods=["POST"])
def api_cleanup():
    """Clean up old CO₂ readings (default: 90 days)"""
    days = request.json.get("days", 90) if request.json else 90
    deleted = cleanup_old_data(days)
    return jsonify({"status": "ok", "deleted": deleted, "days": days})

@app.route("/api/reset-state", methods=["POST"])
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
        })
    
    if request.method == "POST":
        data = request.json
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
        })

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
def export_daily_pdf():
    data = get_today_history()
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
        "report_daily.html",
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
#                          WEBSOCKET HANDLERS
# ================================================================================

# Global state for WebSocket broadcasting
broadcast_thread = None
broadcast_running = False

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket"""
    print(f"Client connected")
    emit('status', {'data': 'Connected to Morpheus CO₂ Monitor'})
    
    # Send current settings to client
    settings = load_settings()
    emit('settings_update', settings)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected")

@socketio.on('request_data')
def handle_request_data():
    """Handle request for latest CO₂ data"""
    settings = load_settings()
    
    if not settings["analysis_running"]:
        emit('co2_update', {
            'analysis_running': False,
            'ppm': None,
            'timestamp': datetime.now(UTC).isoformat()
        })
        return
    
    ppm = generate_co2(settings["realistic_mode"])
    save_reading(ppm)
    
    emit('co2_update', {
        'analysis_running': True,
        'ppm': ppm,
            'timestamp': datetime.now(UTC).isoformat()
    })

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
    last_analysis_state = None
    
    while broadcast_running:
        settings = load_settings()
        
        if settings["analysis_running"]:
            ppm = generate_co2(settings["realistic_mode"])
            save_reading(ppm)
            
            # Only broadcast if value changed significantly (>= 5 ppm) or state changed
            if last_ppm is None or abs(ppm - last_ppm) >= 5 or last_analysis_state != True:
                socketio.emit('co2_update', {
                    'analysis_running': True,
                    'ppm': ppm,
                    'timestamp': datetime.now(UTC).isoformat()
                }, to=None)
                last_ppm = ppm
                last_analysis_state = True
        else:
            # Only broadcast state change once
            if last_analysis_state != False:
                socketio.emit('co2_update', {
                    'analysis_running': False,
                    'ppm': None,
                    'timestamp': datetime.now(UTC).isoformat()
                }, to=None)
                last_analysis_state = False
        
        # Respect update_speed setting (default 1 second)
        update_delay = settings.get("update_speed", 1)
        time.sleep(update_delay)

def start_broadcast_thread():
    """Start the background broadcast thread"""
    global broadcast_thread, broadcast_running
    if broadcast_thread is None or not broadcast_thread.is_alive():
        broadcast_running = True
        broadcast_thread = threading.Thread(target=broadcast_co2_loop, daemon=True)
        broadcast_thread.start()
        print("[OK] WebSocket broadcast thread started")

def stop_broadcast_thread():
    """Stop the background broadcast thread"""
    global broadcast_running
    broadcast_running = False
    print("[OK] WebSocket broadcast thread stopped")




if __name__ == "__main__":
    start_broadcast_thread()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)