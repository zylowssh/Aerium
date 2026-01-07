from functools import wraps
from flask import session, redirect, url_for, render_template, request
from database import is_admin, has_permission


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login_page', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login_page', next=request.url))
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
                return redirect(url_for('auth.login_page', next=request.url))
            if not has_permission(session['user_id'], permission):
                return render_template("error.html",
                                       error="Access Denied",
                                       message=f"You do not have the '{permission}' permission."), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
