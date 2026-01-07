from datetime import datetime, UTC, timedelta
import secrets
from flask import Blueprint, render_template, request, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

from database import (
    get_db, get_user_by_username, get_user_by_email, create_user,
    create_verification_token, verify_email_token, get_user_by_id,
    create_password_reset_token, verify_reset_token, reset_password,
    log_login, get_login_history, get_user_settings, get_admin_stats, get_all_users,
)
from utils.auth_decorators import login_required
from flask import current_app

def send_verification_email(email, username, token):
    """Send email verification link using Flask-Mail if configured"""
    try:
        from flask_mail import Mail, Message
        mail = Mail(current_app)
        verify_url = url_for('auth.verify_email', token=token, _external=True)
        subject = "Verify your Morpheus CO₂ Account"
        html_body = f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">
                <div style=\"background-color: #0b0d12; padding: 20px; color: white;\">
                    <h2 style=\"margin: 0;\">Aerium CO₂ Monitor</h2>
                </div>
                <div style=\"padding: 20px;\">
                    <p>Bonjour {username},</p>
                    <p>Merci de vous être inscrit à Morpheus CO₂ Monitor. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous:</p>
                    <p><a href=\"{verify_url}\" style=\"background-color: #3dd98f; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;\">Vérifier mon email</a></p>
                    <p>Ce lien expirera dans 24 heures.</p>
                </div>
                <div style=\"background-color: #f5f7fa; padding: 15px; font-size: 0.9em; color: #666;\">
                    <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
                </div>
            </body>
        </html>
        """
        msg = Message(subject=subject, recipients=[email], html=html_body)
        mail.send(msg)
        return True
    except Exception:
        return False

def send_password_reset_email(email, username, token):
    """Send password reset email using Flask-Mail if configured"""
    try:
        from flask_mail import Mail, Message
        mail = Mail(current_app)
        reset_url = url_for('auth.reset_password_page', token=token, _external=True)
        subject = "Reset your Morpheus CO₂ password"
        html_body = f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">
                <div style=\"background-color: #0b0d12; padding: 20px; color: white;\">
                    <h2 style=\"margin: 0;\">Aerium CO₂ Monitor</h2>
                </div>
                <div style=\"padding: 20px;\">
                    <p>Bonjour {username},</p>
                    <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour procéder:</p>
                    <p><a href=\"{reset_url}\" style=\"background-color: #4db8ff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;\">Réinitialiser mon mot de passe</a></p>
                    <p>Ce lien expirera dans 1 heure.</p>
                </div>
                <div style=\"background-color: #f5f7fa; padding: 15px; font-size: 0.9em; color: #666;\">
                    <p>Si vous n'avez pas demandé cette action, vous pouvez ignorer cet email.</p>
                </div>
            </body>
        </html>
        """
        msg = Message(subject=subject, recipients=[email], html=html_body)
        mail.send(msg)
        return True
    except Exception:
        return False

auth_bp = Blueprint('auth', __name__)


@auth_bp.route("/login", methods=["GET", "POST"]) 
def login_page():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        remember_me = request.form.get("remember_me") == "on"

        if not username or not password:
            return render_template("auth/login.html", error="Nom d'utilisateur et mot de passe requis")

        user = get_user_by_username(username)

        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']

            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', 'Unknown')
            log_login(user['id'], ip_address, user_agent, success=True)

            if remember_me:
                session.permanent = True
                from flask import current_app
                current_app.permanent_session_lifetime = timedelta(days=30)

            onboarding = get_login_history(user['id'])  # placeholder for onboarding status
            next_page = request.args.get('next')
            if next_page and next_page.startswith('/'):
                return redirect(next_page)
            return redirect(url_for('index'))
        else:
            return render_template("auth/login.html", error="Identifiants invalides")

    return render_template("auth/login.html")


@auth_bp.route("/forgot-password", methods=["GET", "POST"]) 
def forgot_password_page():
    if request.method == "POST":
        email = request.form.get("email")

        if not email:
            return render_template("auth/recovery.html", forgot_error="Veuillez entrer votre email")

        user = get_user_by_email(email)
        if user:
            token = secrets.token_urlsafe(32)
            expires_at = datetime.now(UTC) + timedelta(hours=1)
            create_password_reset_token(user['id'], token, expires_at)
            email_sent = send_password_reset_email(email, user['username'], token) if 'send_password_reset_email' in globals() else False
            return render_template("auth/recovery.html", forgot_success=True)
        else:
            return render_template("auth/recovery.html", forgot_success=True)

    return render_template("auth/recovery.html")


@auth_bp.route("/reset-password/<token>", methods=["GET", "POST"]) 
def reset_password_page(token):
    user_id = verify_reset_token(token)
    if not user_id:
        return render_template("auth/recovery.html", reset_error="Lien de réinitialisation invalide ou expiré.", token=token), 400

    if request.method == "POST":
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")

        if not new_password or not confirm_password:
            return render_template("auth/recovery.html", reset_error="Tous les champs sont requis", token=token)
        if len(new_password) < 6:
            return render_template("auth/recovery.html", reset_error="Le mot de passe doit contenir au moins 6 caractères", token=token)
        if new_password != confirm_password:
            return render_template("auth/recovery.html", reset_error="Les mots de passe ne correspondent pas", token=token)

        new_password_hash = generate_password_hash(new_password)
        reset_password(user_id, new_password_hash, token)
        return render_template("auth/recovery.html", reset_success=True)

    return render_template("auth/recovery.html", token=token)


@auth_bp.route("/register", methods=["GET", "POST"]) 
def register_page():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not all([username, email, password, confirm_password]):
            return render_template("auth/register.html", error="Tous les champs sont requis")
        if len(username) < 3:
            return render_template("auth/register.html", error="Le nom d'utilisateur doit contenir au moins 3 caractères")
        if len(password) < 6:
            return render_template("auth/register.html", error="Le mot de passe doit contenir au moins 6 caractères")
        if password != confirm_password:
            return render_template("auth/register.html", error="Les mots de passe ne correspondent pas")
        if get_user_by_username(username):
            return render_template("auth/register.html", error="Ce nom d'utilisateur existe déjà")

        password_hash = generate_password_hash(password)
        user_id = create_user(username, email, password_hash)
        if not user_id:
            return render_template("auth/register.html", error="Cet email existe déjà")

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(UTC) + timedelta(hours=24)
        create_verification_token(user_id, token, expires_at)
        email_sent = send_verification_email(email, username, token) if 'send_verification_email' in globals() else False

        if email_sent:
            return render_template("register.html", success=True, message=f"Inscription réussie! Vérifiez votre email ({email}) pour confirmer votre compte.")
        else:
            session['user_id'] = user_id
            session['username'] = username
            return redirect(url_for('onboarding_page')) if 'onboarding_page' in globals() else redirect(url_for('index'))

    return render_template("auth/register.html")


@auth_bp.route("/logout") 
def logout():
    session.clear()
    return redirect(url_for('auth.login_page'))


@auth_bp.route("/verify/<token>") 
def verify_email(token):
    user_id = verify_email_token(token)
    if user_id:
        user = get_user_by_id(user_id)
        if user:
            return render_template("auth/email_verified.html", username=user['username'], success=True)
        else:
            return render_template("email_verified.html", error="Lien de vérification invalide ou expiré. Veuillez vous réinscrire.", success=False), 400
    else:
        return render_template("email_verified.html", error="Lien de vérification invalide ou expiré. Veuillez vous réinscrire.", success=False), 400


@auth_bp.route("/profile", methods=["GET", "POST"]) 
@login_required
def profile():
    user_id = session.get('user_id')
    user = get_user_by_id(user_id)
    user_settings = get_user_settings(user_id)
    login_history = get_login_history(user_id, limit=5)
    admin_stats = None
    admin_users = None

    from database import is_admin
    if is_admin(user_id):
        admin_stats = get_admin_stats()
        admin_users = get_all_users()

    if request.method == "POST":
        pass

    return render_template("user-management/profile.html", user=user, settings=user_settings, login_history=login_history, is_admin=is_admin(user_id), admin_stats=admin_stats, admin_users=admin_users)


@auth_bp.route("/change-password", methods=["GET", "POST"]) 
@login_required
def change_password():
    user_id = session.get('user_id')
    user = get_user_by_id(user_id)
    if not user:
        session.clear()
        return redirect(url_for('auth.login_page'))

    if request.method == "POST":
        current_password = request.form.get('current_password', "")
        new_password = request.form.get('new_password', "")
        confirm_password = request.form.get('confirm_password', "")

        error = None
        if not all([current_password, new_password, confirm_password]):
            error = "Tous les champs sont requis"
        elif not check_password_hash(user['password_hash'], current_password):
            error = "Mot de passe actuel incorrect"
        elif len(new_password) < 6:
            error = "Le nouveau mot de passe doit contenir au moins 6 caractères"
        elif new_password != confirm_password:
            error = "Les mots de passe ne correspondent pas"

        if error:
            return render_template("auth/change_password.html", error=error)

        db = get_db()
        new_password_hash = generate_password_hash(new_password)
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, user_id))
        db.commit()
        db.close()
        return render_template("auth/change_password.html", success=True)

    return render_template("auth/change_password.html", user=user)
