import sqlite3
from pathlib import Path

# Database path - try main folder first, fallback to site folder
MAIN_DB_PATH = Path("../data/aerium.sqlite")
SITE_DB_PATH = Path("data/aerium.sqlite")

# Use main folder if it exists, otherwise use site folder
if MAIN_DB_PATH.exists():
    DB_PATH = MAIN_DB_PATH
else:
    DB_PATH = SITE_DB_PATH

def get_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    cur = db.cursor()

    # CO₂ history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS co2_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ppm INTEGER NOT NULL
        )
    """)
    
    # Create index on timestamp for faster queries
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_co2_timestamp 
        ON co2_readings(timestamp DESC)
    """)
    
    # Create index on date for daily queries
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_co2_date 
        ON co2_readings(date(timestamp))
    """)

    # Settings persistence
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    # Users table for authentication
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email_verified BOOLEAN DEFAULT 0,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create index on username for faster lookups
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_username 
        ON users(username)
    """)

    # User settings (per-user thresholds and preferences)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            good_threshold INTEGER DEFAULT 800,
            bad_threshold INTEGER DEFAULT 1200,
            alert_threshold INTEGER DEFAULT 1400,
            realistic_mode BOOLEAN DEFAULT 1,
            update_speed INTEGER DEFAULT 1,
            audio_alerts BOOLEAN DEFAULT 1,
            email_alerts BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create index on user_id for fast lookups
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
        ON user_settings(user_id)
    """)

    # Email verification tokens (for unverified accounts)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS verification_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create index for token lookups and cleanup
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_token 
        ON verification_tokens(token)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id 
        ON verification_tokens(user_id)
    """)

    # Password reset tokens (for forgot password feature)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create index for reset token lookups and cleanup
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
        ON password_reset_tokens(token)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id 
        ON password_reset_tokens(user_id)
    """)

    # Login history tracking
    cur.execute("""
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            success BOOLEAN DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create indexes for login history
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_login_history_user_id 
        ON login_history(user_id)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_login_history_time 
        ON login_history(login_time DESC)
    """)

    # Activity audit logs (for admin operations)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT,
            target_id INTEGER,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create indexes for audit logs
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id 
        ON audit_logs(admin_id)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
        ON audit_logs(timestamp DESC)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
        ON audit_logs(action)
    """)

    # System notifications for users
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT DEFAULT 'info',
            title TEXT NOT NULL,
            message TEXT,
            icon TEXT,
            read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create indexes for notifications
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
        ON notifications(user_id)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_read 
        ON notifications(user_id, read)
    """)

    # Mobile device preferences (for responsive design)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            device_id TEXT UNIQUE,
            device_type TEXT,
            is_mobile BOOLEAN DEFAULT 0,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create indexes for devices
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_devices_user_id 
        ON user_devices(user_id)
    """)

    # Onboarding state tracking
    cur.execute("""
        CREATE TABLE IF NOT EXISTS onboarding (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            completed BOOLEAN DEFAULT 0,
            step INTEGER DEFAULT 0,
            features_seen TEXT DEFAULT '',
            tour_started BOOLEAN DEFAULT 0,
            tour_completed BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_onboarding_user_id 
        ON onboarding(user_id)
    """)

    # Scheduled exports
    cur.execute("""
        CREATE TABLE IF NOT EXISTS scheduled_exports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            format TEXT DEFAULT 'csv',
            frequency TEXT DEFAULT 'weekly',
            enabled BOOLEAN DEFAULT 1,
            last_export DATETIME,
            next_export DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user_id 
        ON scheduled_exports(user_id)
    """)
    
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next 
        ON scheduled_exports(next_export)
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_thresholds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            good_level INTEGER DEFAULT 800,
            warning_level INTEGER DEFAULT 1000,
            critical_level INTEGER DEFAULT 1200,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_thresholds_user_id 
        ON user_thresholds(user_id)
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            permission TEXT NOT NULL,
            granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, permission)
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
        ON user_permissions(user_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_permissions_perm 
        ON user_permissions(permission)
    """)

    db.commit()
    db.close()

def cleanup_old_data(days_to_keep=90):
    """Remove CO₂ readings older than specified days (default 90 days)"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute("""
        DELETE FROM co2_readings 
        WHERE timestamp < datetime('now', '-' || ? || ' days')
    """, (days_to_keep,))
    
    deleted_count = cur.rowcount
    db.commit()
    db.close()
    
    return deleted_count
# ================================================================================
#                        USER AUTHENTICATION
# ================================================================================

def get_user_by_username(username):
    """Get user by username"""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.close()
    return user

def get_user_by_id(user_id):
    """Get user by ID"""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()
    return user
# ================================================================================
#                        PASSWORD RESET
# ================================================================================

def create_password_reset_token(user_id, token, expires_at):
    """Store password reset token for user"""
    db = get_db()
    try:
        # Delete any existing reset tokens for this user
        db.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", (user_id,))
        
        db.execute(
            """INSERT INTO password_reset_tokens (user_id, token, expires_at) 
               VALUES (?, ?, ?)""",
            (user_id, token, expires_at)
        )
        db.commit()
        db.close()
        return True
    except sqlite3.IntegrityError:
        db.close()
        return False

def verify_reset_token(token):
    """Verify reset token and return user_id if valid"""
    db = get_db()
    
    # Check if token exists and hasn't expired
    reset_token = db.execute(
        """SELECT user_id FROM password_reset_tokens 
           WHERE token = ? AND expires_at > datetime('now')""",
        (token,)
    ).fetchone()
    
    db.close()
    
    if not reset_token:
        return None
    
    return reset_token['user_id']

def reset_password(user_id, new_password_hash, token):
    """Reset password and delete the used token"""
    db = get_db()
    
    # Update password
    db.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_password_hash, user_id)
    )
    
    # Delete the reset token
    db.execute("DELETE FROM password_reset_tokens WHERE token = ?", (token,))
    
    db.commit()
    db.close()
    return True

def cleanup_expired_reset_tokens():
    """Remove expired password reset tokens"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute(
        "DELETE FROM password_reset_tokens WHERE expires_at < datetime('now')"
    )
    
    deleted_count = cur.rowcount
    db.commit()
    db.close()
    
    return deleted_count

# ================================================================================
#                        LOGIN HISTORY
# ================================================================================

def log_login(user_id, ip_address, user_agent, success=True):
    """Log a login attempt"""
    db = get_db()
    
    db.execute(
        """INSERT INTO login_history (user_id, ip_address, user_agent, success)
           VALUES (?, ?, ?, ?)""",
        (user_id, ip_address, user_agent, success)
    )
    
    db.commit()
    db.close()

def get_login_history(user_id, limit=10):
    """Get login history for a user"""
    db = get_db()
    
    logins = db.execute(
        """SELECT * FROM login_history 
           WHERE user_id = ? 
           ORDER BY login_time DESC 
           LIMIT ?""",
        (user_id, limit)
    ).fetchall()
    
    db.close()
    return logins

def cleanup_old_login_history(days_to_keep=90):
    """Remove login history older than specified days"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute(
        """DELETE FROM login_history 
           WHERE login_time < datetime('now', '-' || ? || ' days')""",
        (days_to_keep,)
    )
    
    deleted_count = cur.rowcount
    db.commit()
    db.close()
    
    return deleted_count

# ================================================================================
#                        ADMIN MANAGEMENT
# ================================================================================

def set_user_role(user_id, role):
    """Set user role (admin or user)"""
    db = get_db()
    
    if role not in ['user', 'admin']:
        db.close()
        return False
    
    db.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    db.commit()
    db.close()
    return True

def is_admin(user_id):
    """Check if user is admin"""
    user = get_user_by_id(user_id)
    return user and user['role'] == 'admin'

def get_all_users():
    """Get all users with their roles and creation dates"""
    db = get_db()
    
    users = db.execute(
        """SELECT id, username, email, role, created_at, email_verified FROM users ORDER BY created_at DESC"""
    ).fetchall()
    
    db.close()
    return users

def get_admin_stats():
    """Get admin dashboard statistics"""
    db = get_db()
    
    # Total users
    total_users = db.execute("SELECT COUNT(*) as count FROM users").fetchone()['count']
    
    # Verified users
    verified_users = db.execute("SELECT COUNT(*) as count FROM users WHERE email_verified = 1").fetchone()['count']
    
    # Total CO2 readings
    total_readings = db.execute("SELECT COUNT(*) as count FROM co2_readings").fetchone()['count']
    
    # Average PPM
    avg_ppm = db.execute("SELECT AVG(ppm) as avg FROM co2_readings").fetchone()['avg']
    
    # Recent logins (last 24 hours)
    recent_logins = db.execute(
        "SELECT COUNT(*) as count FROM login_history WHERE login_time > datetime('now', '-1 day')"
    ).fetchone()['count']
    
    # Admins count
    admin_count = db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").fetchone()['count']
    
    db.close()
    
    return {
        'total_users': total_users,
        'verified_users': verified_users,
        'total_readings': total_readings,
        'avg_ppm': round(avg_ppm, 1) if avg_ppm else 0,
        'recent_logins': recent_logins,
        'admin_count': admin_count
    }
def create_user(username, email, password_hash):
    """Create a new user"""
    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        db.commit()
        user_id = cur.lastrowid
        db.close()
        return user_id
    except sqlite3.IntegrityError:
        db.close()
        return None

# ================================================================================
#                        USER SETTINGS MANAGEMENT
# ================================================================================

def get_user_settings(user_id):
    """Get user settings, create if doesn't exist"""
    db = get_db()
    settings = db.execute(
        "SELECT * FROM user_settings WHERE user_id = ?", 
        (user_id,)
    ).fetchone()
    
    if not settings:
        # Create default settings for new user
        db.execute(
            """INSERT INTO user_settings (user_id, good_threshold, bad_threshold, 
               alert_threshold, realistic_mode, update_speed, audio_alerts, email_alerts)
               VALUES (?, 800, 1200, 1400, 1, 1, 1, 1)""",
            (user_id,)
        )
        db.commit()
        settings = db.execute(
            "SELECT * FROM user_settings WHERE user_id = ?", 
            (user_id,)
        ).fetchone()
    
    db.close()
    return settings

def update_user_settings(user_id, **kwargs):
    """Update user settings"""
    db = get_db()
    allowed_fields = {
        'good_threshold', 'bad_threshold', 'alert_threshold', 
        'realistic_mode', 'update_speed', 'audio_alerts', 'email_alerts'
    }
    
    fields_to_update = {k: v for k, v in kwargs.items() if k in allowed_fields}
    
    if not fields_to_update:
        db.close()
        return False
    
    set_clause = ", ".join([f"{k} = ?" for k in fields_to_update.keys()])
    values = list(fields_to_update.values()) + [user_id]
    
    db.execute(
        f"UPDATE user_settings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        values
    )
    db.commit()
    db.close()
    return True

def reset_user_settings(user_id):
    """Reset user settings to defaults"""
    return update_user_settings(
        user_id,
        good_threshold=800,
        bad_threshold=1200,
        alert_threshold=1400,
        realistic_mode=1,
        update_speed=1,
        audio_alerts=1,
        email_alerts=1
    )
# ================================================================================
#                        EMAIL VERIFICATION
# ================================================================================

def create_verification_token(user_id, token, expires_at):
    """Store verification token for user"""
    db = get_db()
    try:
        db.execute(
            """INSERT INTO verification_tokens (user_id, token, expires_at) 
               VALUES (?, ?, ?)""",
            (user_id, token, expires_at)
        )
        db.commit()
        db.close()
        return True
    except sqlite3.IntegrityError:
        db.close()
        return False

def verify_email_token(token):
    """Verify token and mark email as verified, returns user_id on success"""
    db = get_db()
    
    # Check if token exists and hasn't expired
    verification = db.execute(
        """SELECT user_id, expires_at FROM verification_tokens 
           WHERE token = ? AND expires_at > datetime('now')""",
        (token,)
    ).fetchone()
    
    if not verification:
        db.close()
        return None
    
    user_id = verification['user_id']
    
    # Mark user email as verified
    db.execute("UPDATE users SET email_verified = 1 WHERE id = ?", (user_id,))
    
    # Delete the token (it's been used)
    db.execute("DELETE FROM verification_tokens WHERE token = ?", (token,))
    
    db.commit()
    db.close()
    return user_id

def cleanup_expired_tokens():
    """Remove expired verification tokens"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute(
        "DELETE FROM verification_tokens WHERE expires_at < datetime('now')"
    )
    
    deleted_count = cur.rowcount
    db.commit()
    db.close()
    
    return deleted_count

def get_user_by_email(email):
    """Get user by email"""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    db.close()
    return user

# ================================================================================
#                        AUDIT LOGGING
# ================================================================================

def log_audit(admin_id, action, target_type=None, target_id=None, old_value=None, new_value=None, ip_address=None):
    """Log an admin action for audit trail"""
    db = get_db()
    
    db.execute(
        """INSERT INTO audit_logs (admin_id, action, target_type, target_id, old_value, new_value, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (admin_id, action, target_type, target_id, old_value, new_value, ip_address)
    )
    
    db.commit()
    db.close()

def get_audit_logs(limit=50, action_filter=None):
    """Get audit logs, optionally filtered by action"""
    db = get_db()
    
    if action_filter:
        logs = db.execute(
            """SELECT al.*, u.username as admin_name FROM audit_logs al
               JOIN users u ON al.admin_id = u.id
               WHERE al.action = ?
               ORDER BY al.timestamp DESC
               LIMIT ?""",
            (action_filter, limit)
        ).fetchall()
    else:
        logs = db.execute(
            """SELECT al.*, u.username as admin_name FROM audit_logs al
               JOIN users u ON al.admin_id = u.id
               ORDER BY al.timestamp DESC
               LIMIT ?""",
            (limit,)
        ).fetchall()
    
    db.close()
    return logs

def cleanup_old_audit_logs(days_to_keep=180):
    """Remove audit logs older than specified days"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute(
        """DELETE FROM audit_logs 
           WHERE timestamp < datetime('now', '-' || ? || ' days')""",
        (days_to_keep,)
    )
    
    deleted_count = cur.rowcount
    db.commit()
    db.close()
    
    return deleted_count

# ================================================================================
#                        NOTIFICATIONS
# ================================================================================

def create_notification(user_id, title, message, notification_type='info', icon=None, expires_at=None):
    """Create a system notification for a user"""
    db = get_db()
    
    db.execute(
        """INSERT INTO notifications (user_id, type, title, message, icon, expires_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (user_id, notification_type, title, message, icon, expires_at)
    )
    
    db.commit()
    db.close()

def get_unread_notifications(user_id, limit=10):
    """Get unread notifications for a user"""
    db = get_db()
    
    notifications = db.execute(
        """SELECT * FROM notifications 
           WHERE user_id = ? AND read = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
           ORDER BY created_at DESC
           LIMIT ?""",
        (user_id, limit)
    ).fetchall()
    
    db.close()
    return notifications

def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    db = get_db()
    
    db.execute(
        "UPDATE notifications SET read = 1 WHERE id = ?",
        (notification_id,)
    )
    
    db.commit()
    db.close()

def cleanup_expired_notifications():
    """Remove expired notifications"""
    db = get_db()
    cur = db.cursor()
    
    cur.execute(
        "DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < datetime('now')"
    )
    
    deleted_count = cur.rowcount
    db.commit()
    db.close()
    
    return deleted_count

# ================================================================================
#                        USER DEVICES
# ================================================================================

def register_device(user_id, device_id, device_type, is_mobile=False):
    """Register or update a user device"""
    db = get_db()
    
    # Try to update if exists
    cur = db.execute(
        "SELECT id FROM user_devices WHERE device_id = ?",
        (device_id,)
    )
    
    if cur.fetchone():
        db.execute(
            "UPDATE user_devices SET device_type = ?, is_mobile = ?, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?",
            (device_type, is_mobile, device_id)
        )
    else:
        db.execute(
            """INSERT INTO user_devices (user_id, device_id, device_type, is_mobile)
               VALUES (?, ?, ?, ?)""",
            (user_id, device_id, device_type, is_mobile)
        )
    
    db.commit()
    db.close()

def get_database_info():
    """Get database statistics for admin dashboard"""
    db = get_db()
    
    # Get database file size
    db_path = Path("data/aerium.sqlite")
    db_size = db_path.stat().st_size if db_path.exists() else 0
    
    # Count records in each table
    tables_info = {}
    
    tables = ['co2_readings', 'users', 'user_settings', 'login_history', 'audit_logs', 'notifications']
    for table in tables:
        count = db.execute(f"SELECT COUNT(*) as count FROM {table}").fetchone()['count']
        tables_info[table] = count
    
    db.close()
    
    return {
        'db_size_mb': round(db_size / (1024 * 1024), 2),
        'tables': tables_info
    }

def delete_user_with_audit(user_id, admin_id, ip_address=None):
    """Delete a user and log the action"""
    db = get_db()
    
    # Get user info before deletion for audit
    user = db.execute("SELECT username, email FROM users WHERE id = ?", (user_id,)).fetchone()
    
    if not user:
        db.close()
        return False
    
    # Log the deletion
    db.execute(
        """INSERT INTO audit_logs (admin_id, action, target_type, target_id, old_value, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (admin_id, 'user_deleted', 'user', user_id, f"{user['username']} ({user['email']})", ip_address)
    )
    
    # Delete user (cascades to settings, tokens, etc.)
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    
    db.commit()
    db.close()
    
    return True

def ban_user(user_id, admin_id, ip_address=None):
    """Ban a user by deleting their account"""
    return delete_user_with_audit(user_id, admin_id, ip_address)

# ================================================================================
#                        ONBOARDING
# ================================================================================

def init_onboarding(user_id):
    """Initialize onboarding for a new user"""
    db = get_db()
    
    db.execute(
        """INSERT INTO onboarding (user_id, step, tour_started)
           VALUES (?, 0, 0)""",
        (user_id,)
    )
    
    db.commit()
    db.close()

def get_onboarding_status(user_id):
    """Get user's onboarding status"""
    db = get_db()
    
    onboarding = db.execute(
        "SELECT * FROM onboarding WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    
    db.close()
    return onboarding

def update_onboarding_step(user_id, step):
    """Update onboarding progress"""
    db = get_db()
    
    db.execute(
        "UPDATE onboarding SET step = ? WHERE user_id = ?",
        (step, user_id)
    )
    
    db.commit()
    db.close()

def mark_feature_as_seen(user_id, feature):
    """Record that user has seen a feature"""
    db = get_db()
    
    onboarding = db.execute(
        "SELECT features_seen FROM onboarding WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    
    if onboarding:
        features = onboarding['features_seen'].split(',') if onboarding['features_seen'] else []
        if feature not in features:
            features.append(feature)
            db.execute(
                "UPDATE onboarding SET features_seen = ? WHERE user_id = ?",
                (','.join(features), user_id)
            )
            db.commit()
    
    db.close()

def complete_onboarding(user_id):
    """Mark onboarding as complete"""
    db = get_db()
    
    db.execute(
        """UPDATE onboarding SET completed = 1, completed_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?""",
        (user_id,)
    )
    
    db.commit()
    db.close()

def start_tour(user_id):
    """Mark tour as started"""
    db = get_db()
    
    db.execute(
        "UPDATE onboarding SET tour_started = 1 WHERE user_id = ?",
        (user_id,)
    )
    
    db.commit()
    db.close()

def complete_tour(user_id):
    """Mark tour as complete"""
    db = get_db()
    
    db.execute(
        "UPDATE onboarding SET tour_completed = 1 WHERE user_id = ?",
        (user_id,)
    )
    
    db.commit()
    db.close()

# ================================================================================
#                        SCHEDULED EXPORTS
# ================================================================================

def create_scheduled_export(user_id, format='csv', frequency='weekly'):
    """Create a scheduled export"""
    db = get_db()
    
    # Calculate next export time
    from datetime import datetime, timedelta
    next_time = datetime.now()
    if frequency == 'daily':
        next_time += timedelta(days=1)
    elif frequency == 'weekly':
        next_time += timedelta(weeks=1)
    elif frequency == 'monthly':
        next_time += timedelta(days=30)
    
    db.execute(
        """INSERT INTO scheduled_exports (user_id, format, frequency, next_export)
           VALUES (?, ?, ?, ?)""",
        (user_id, format, frequency, next_time)
    )
    
    db.commit()
    db.close()

def get_user_scheduled_exports(user_id):
    """Get all scheduled exports for a user"""
    db = get_db()
    
    exports = db.execute(
        "SELECT * FROM scheduled_exports WHERE user_id = ? AND enabled = 1",
        (user_id,)
    ).fetchall()
    
    db.close()
    return exports

def get_due_exports():
    """Get all exports that are due to run"""
    db = get_db()
    
    exports = db.execute(
        """SELECT * FROM scheduled_exports 
           WHERE enabled = 1 AND next_export <= datetime('now')"""
    ).fetchall()
    
    db.close()
    return exports

def update_export_timestamp(export_id):
    """Update last export time and calculate next"""
    db = get_db()
    
    export = db.execute(
        "SELECT frequency FROM scheduled_exports WHERE id = ?",
        (export_id,)
    ).fetchone()
    
    if export:
        from datetime import datetime, timedelta
        next_time = datetime.now()
        if export['frequency'] == 'daily':
            next_time += timedelta(days=1)
        elif export['frequency'] == 'weekly':
            next_time += timedelta(weeks=1)
        elif export['frequency'] == 'monthly':
            next_time += timedelta(days=30)
        
        db.execute(
            """UPDATE scheduled_exports 
               SET last_export = CURRENT_TIMESTAMP, next_export = ?
               WHERE id = ?""",
            (next_time, export_id)
        )
        
        db.commit()
    
    db.close()

def delete_scheduled_export(export_id):
    """Delete a scheduled export"""
    db = get_db()
    
    db.execute("DELETE FROM scheduled_exports WHERE id = ?", (export_id,))
    
    db.commit()
    db.close()

# ================================================================================
#                      THRESHOLD MANAGEMENT
# ================================================================================

def get_user_thresholds(user_id):
    """Get CO₂ thresholds for a user, or create defaults if not exist"""
    db = get_db()
    
    thresholds = db.execute(
        "SELECT * FROM user_thresholds WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    
    if not thresholds:
        db.execute(
            """INSERT INTO user_thresholds 
               (user_id, good_level, warning_level, critical_level)
               VALUES (?, 800, 1000, 1200)""",
            (user_id,)
        )
        db.commit()
        thresholds = db.execute(
            "SELECT * FROM user_thresholds WHERE user_id = ?",
            (user_id,)
        ).fetchone()
    
    db.close()
    return thresholds

def update_user_thresholds(user_id, good_level, warning_level, critical_level):
    """Update CO₂ thresholds for a user"""
    db = get_db()
    
    db.execute(
        """UPDATE user_thresholds 
           SET good_level = ?, warning_level = ?, critical_level = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?""",
        (good_level, warning_level, critical_level, user_id)
    )
    
    db.commit()
    db.close()

def check_threshold_status(ppm_value, user_id):
    """Check if CO₂ reading exceeds any threshold, return status"""
    thresholds = get_user_thresholds(user_id)
    
    if ppm_value <= thresholds['good_level']:
        return 'good'
    elif ppm_value <= thresholds['warning_level']:
        return 'warning'
    elif ppm_value <= thresholds['critical_level']:
        return 'warning_high'
    else:
        return 'critical'

# ================================================================================
#                      PERMISSIONS MANAGEMENT (RBAC)
# ================================================================================

def grant_permission(user_id, permission):
    """Grant a permission to a user"""
    db = get_db()
    
    try:
        db.execute(
            "INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)",
            (user_id, permission)
        )
        db.commit()
    except:
        db.rollback()
    
    db.close()

def revoke_permission(user_id, permission):
    """Revoke a permission from a user"""
    db = get_db()
    
    db.execute(
        "DELETE FROM user_permissions WHERE user_id = ? AND permission = ?",
        (user_id, permission)
    )
    
    db.commit()
    db.close()

def has_permission(user_id, permission):
    """Check if user has a specific permission"""
    db = get_db()
    
    result = db.execute(
        "SELECT 1 FROM user_permissions WHERE user_id = ? AND permission = ?",
        (user_id, permission)
    ).fetchone()
    
    db.close()
    return result is not None

def get_user_permissions(user_id):
    """Get all permissions for a user"""
    db = get_db()
    
    permissions = db.execute(
        "SELECT permission FROM user_permissions WHERE user_id = ? ORDER BY permission",
        (user_id,)
    ).fetchall()
    
    db.close()
    return [p['permission'] for p in permissions]

def get_users_with_permission(permission):
    """Get all users with a specific permission"""
    db = get_db()
    
    users = db.execute(
        """SELECT DISTINCT u.id, u.username FROM users u
           JOIN user_permissions p ON u.id = p.user_id
           WHERE p.permission = ?""",
        (permission,)
    ).fetchall()
    
    db.close()
    return users

# ================================================================================
#                      CSV IMPORT FUNCTIONS
# ================================================================================

def import_csv_readings(readings_list):
    """Import list of CO₂ readings from CSV
    Expected format: [{'timestamp': '2024-01-01 12:00:00', 'ppm': 850}, ...]
    """
    db = get_db()
    imported_count = 0
    errors = []
    
    for i, reading in enumerate(readings_list):
        try:
            timestamp = reading.get('timestamp')
            ppm = float(reading.get('ppm', 0))
            
            # Validate
            if not timestamp:
                errors.append(f"Row {i+1}: Missing timestamp")
                continue
            
            if ppm < 0 or ppm > 5000:
                errors.append(f"Row {i+1}: Invalid PPM value {ppm} (must be 0-5000)")
                continue
            
            # Insert
            db.execute(
                "INSERT INTO co2_readings (timestamp, ppm) VALUES (?, ?)",
                (timestamp, ppm)
            )
            imported_count += 1
        except ValueError as e:
            errors.append(f"Row {i+1}: {str(e)}")
        except Exception as e:
            errors.append(f"Row {i+1}: Unexpected error - {str(e)}")
    
    db.commit()
    db.close()
    
    return {
        'imported': imported_count,
        'total': len(readings_list),
        'errors': errors,
        'success': len(errors) == 0
    }

def get_csv_import_stats():
    """Get statistics about imported data"""
    db = get_db()
    
    stats = db.execute("""
        SELECT 
            COUNT(*) as total_readings,
            MIN(timestamp) as oldest,
            MAX(timestamp) as newest,
            AVG(ppm) as avg_ppm
        FROM co2_readings
    """).fetchone()
    
    db.close()
    return dict(stats) if stats else {}