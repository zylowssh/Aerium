import os
import sqlite3
import threading
from queue import Queue, Empty, Full
from pathlib import Path

# Database path - try main folder first, fallback to site folder
MAIN_DB_PATH = Path("../data/aerium.sqlite")
SITE_DB_PATH = Path("data/aerium.sqlite")

# Use main folder if it exists, otherwise use site folder
if MAIN_DB_PATH.exists():
    DB_PATH = MAIN_DB_PATH
else:
    DB_PATH = SITE_DB_PATH

DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
_db_pool: Queue = Queue(maxsize=DB_POOL_SIZE)
_pool_lock = threading.Lock()


class PooledConnection:
    """SQLite connection wrapper that returns connections to the pool on close."""

    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def __getattr__(self, item):
        return getattr(self._conn, item)

    def close(self):
        if self._conn is None:
            return

        try:
            self._conn.rollback()
        except Exception:
            pass

        try:
            _db_pool.put_nowait(self._conn)
        except Full:
            self._conn.close()
        finally:
            self._conn = None


def _create_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    return conn


def get_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    with _pool_lock:
        try:
            conn = _db_pool.get_nowait()
        except Empty:
            conn = _create_connection()
    return PooledConnection(conn)

def init_db():
    db = get_db()
    cur = db.cursor()

    # CO₂ history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS co2_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ppm INTEGER NOT NULL,
            temperature REAL,
            humidity REAL,
            source TEXT DEFAULT 'live',
            user_id INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Ensure newer columns exist when migrating older databases
    for column_def in [
        ("temperature", "REAL"),
        ("humidity", "REAL"),
        ("source", "TEXT DEFAULT 'live'"),
        ("user_id", "INTEGER")
    ]:
        try:
            cur.execute(f"ALTER TABLE co2_readings ADD COLUMN {column_def[0]} {column_def[1]}")
        except Exception:
            # Column already exists
            pass
    
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

    # Index on user_id for multi-tenant isolation
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_co2_user_id 
        ON co2_readings(user_id)
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
            admin_id INTEGER,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            target_type TEXT,
            target_id INTEGER,
            details TEXT,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            status TEXT,
            severity TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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

    # User sensors - multi-sensor management
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_sensors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            interface TEXT NOT NULL,
            config TEXT NOT NULL,
            active BOOLEAN DEFAULT 1,
            available BOOLEAN DEFAULT 0,
            good_threshold INTEGER DEFAULT 800,
            warning_threshold INTEGER DEFAULT 1000,
            critical_threshold INTEGER DEFAULT 1200,
            last_read DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, name)
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_sensors_user_id 
        ON user_sensors(user_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_sensors_active 
        ON user_sensors(user_id, active)
    """)

    # Add threshold columns if they don't exist (for existing databases)
    try:
        cur.execute("ALTER TABLE user_sensors ADD COLUMN good_threshold INTEGER DEFAULT 800")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    try:
        cur.execute("ALTER TABLE user_sensors ADD COLUMN warning_threshold INTEGER DEFAULT 1000")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    try:
        cur.execute("ALTER TABLE user_sensors ADD COLUMN critical_threshold INTEGER DEFAULT 1200")
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Sensor readings - per-sensor CO2 history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER NOT NULL,
            co2 INTEGER NOT NULL,
            temperature REAL,
            humidity REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sensor_id) REFERENCES user_sensors(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id 
        ON sensor_readings(sensor_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
        ON sensor_readings(sensor_id, timestamp DESC)
    """)

    # Teams and collaboration tables
    cur.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL UNIQUE,
            owner_id INTEGER NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_teams_owner_id 
        ON teams(owner_id)
    """)

    # Team members table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(team_id, user_id),
            FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_team_members_team_id 
        ON team_members(team_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_team_members_user_id 
        ON team_members(user_id)
    """)

    # Team shares table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS team_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            shared_with_user_id INTEGER NOT NULL,
            share_type TEXT DEFAULT 'view',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(team_id, shared_with_user_id),
            FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY(shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_team_shares_team_id 
        ON team_shares(team_id)
    """)

    # Team activity table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS team_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_team_activity_team_id 
        ON team_activity(team_id)
    """)

    # Team comments table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS team_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_team_comments_team_id 
        ON team_comments(team_id)
    """)

    # Shared Dashboards for real-time collaboration
    cur.execute("""
        CREATE TABLE IF NOT EXISTS shared_dashboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            dashboard_name TEXT NOT NULL,
            description TEXT,
            share_token TEXT UNIQUE,
            is_public BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_shared_dashboards_owner_id 
        ON shared_dashboards(owner_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_shared_dashboards_share_token 
        ON shared_dashboards(share_token)
    """)

    # Dashboard Collaborators with permission levels
    cur.execute("""
        CREATE TABLE IF NOT EXISTS shared_dashboard_collaborators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dashboard_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            permission_level TEXT DEFAULT 'viewer',
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(dashboard_id, user_id),
            FOREIGN KEY(dashboard_id) REFERENCES shared_dashboards(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dashboard_collab_dashboard_id 
        ON shared_dashboard_collaborators(dashboard_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dashboard_collab_user_id 
        ON shared_dashboard_collaborators(user_id)
    """)

    # Dashboard State (layout, widgets, filters, etc.)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dashboard_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            state_data TEXT,
            saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(dashboard_id, user_id),
            FOREIGN KEY(dashboard_id) REFERENCES shared_dashboards(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dashboard_states_dashboard_id 
        ON dashboard_states(dashboard_id)
    """)

    # Dashboard Comments and Annotations
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dashboard_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            data_point TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(dashboard_id) REFERENCES shared_dashboards(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dashboard_comments_dashboard_id 
        ON dashboard_comments(dashboard_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_dashboard_comments_user_id 
        ON dashboard_comments(user_id)
    """)

    # Collaboration Activity Log
    cur.execute("""
        CREATE TABLE IF NOT EXISTS collaboration_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dashboard_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL,
            activity_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(dashboard_id) REFERENCES shared_dashboards(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_collab_activity_dashboard_id 
        ON collaboration_activity(dashboard_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_collab_activity_user_id 
        ON collaboration_activity(user_id)
    """)

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_collab_activity_timestamp 
        ON collaboration_activity(created_at DESC)
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
    db.row_factory = sqlite3.Row
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.close()
    return dict(user) if user else None

def get_user_by_id(user_id):
    """Get user by ID"""
    db = get_db()
    db.row_factory = sqlite3.Row
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()
    return dict(user) if user else None
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
    db.row_factory = sqlite3.Row
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
    return dict(settings) if settings else None

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
    db.row_factory = sqlite3.Row
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    db.close()
    return dict(user) if user else None

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
MAX_ONBOARDING_STEP = int(os.getenv("MAX_ONBOARDING_STEP", "10"))
ONBOARDING_DEFAULT_STEP = 0

def init_onboarding(user_id):
    """Initialize onboarding for a new user"""
    db = get_db()
    db.execute(
        """INSERT OR IGNORE INTO onboarding (user_id, step, tour_started)
           VALUES (?, ?, 0)""",
        (user_id, ONBOARDING_DEFAULT_STEP),
    )
    db.commit()
    db.close()

def get_onboarding_status(user_id):
    """Get user's onboarding status"""
    db = get_db()
    db.row_factory = sqlite3.Row
    
    onboarding = db.execute(
        "SELECT * FROM onboarding WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    
    db.close()
    
    # Convert Row to dict if exists
    if onboarding:
        return dict(onboarding)
    return None

def update_onboarding_step(user_id, step):
    """Update onboarding progress"""
    db = get_db()

    current = db.execute(
        "SELECT step FROM onboarding WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    if not current:
        init_onboarding(user_id)
        current_step = ONBOARDING_DEFAULT_STEP
    else:
        current_step = current["step"]

    if step < current_step:
        db.close()
        return False, current_step

    normalized_step = min(current_step + 1, MAX_ONBOARDING_STEP, step)

    db.execute(
        "UPDATE onboarding SET step = ? WHERE user_id = ?",
        (normalized_step, user_id),
    )
    db.commit()
    db.close()
    return True, normalized_step

def mark_feature_as_seen(user_id, feature):
    """Record that user has seen a feature"""
    db = get_db()

    onboarding = db.execute(
        "SELECT features_seen FROM onboarding WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    if onboarding is None:
        init_onboarding(user_id)
        features = []
    else:
        features = onboarding["features_seen"].split(",") if onboarding["features_seen"] else []

    if feature not in features:
        features.append(feature)
        feature_value = ",".join([f for f in features if f])
        db.execute(
            "UPDATE onboarding SET features_seen = ? WHERE user_id = ?",
            (feature_value, user_id),
        )
        db.commit()

    db.close()

def complete_onboarding(user_id):
    """Mark onboarding as complete"""
    db = get_db()
    status = db.execute("SELECT step FROM onboarding WHERE user_id = ?", (user_id,)).fetchone()
    if not status:
        init_onboarding(user_id)
        current_step = ONBOARDING_DEFAULT_STEP
    else:
        current_step = status["step"]

    new_step = max(current_step, MAX_ONBOARDING_STEP)
    db.execute(
        """UPDATE onboarding SET completed = 1, completed_at = CURRENT_TIMESTAMP, step = ?
           WHERE user_id = ?""",
        (new_step, user_id),
    )
    db.commit()
    db.close()

def start_tour(user_id):
    """Mark tour as started"""
    db = get_db()
    existing = db.execute("SELECT 1 FROM onboarding WHERE user_id = ?", (user_id,)).fetchone()
    if not existing:
        init_onboarding(user_id)
    
    db.execute(
        "UPDATE onboarding SET tour_started = 1 WHERE user_id = ?",
        (user_id,)
    )
    
    db.commit()
    db.close()

def complete_tour(user_id):
    """Mark tour as complete"""
    db = get_db()
    existing = db.execute("SELECT 1 FROM onboarding WHERE user_id = ?", (user_id,)).fetchone()
    if not existing:
        init_onboarding(user_id)
    
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

def import_csv_readings(readings_list, user_id=None):
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
                "INSERT INTO co2_readings (timestamp, ppm, source, user_id) VALUES (?, ?, ?, ?)",
                (timestamp, ppm, 'import', user_id)
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

# ================================================================================
#                      MULTI-SENSOR MANAGEMENT
# ================================================================================

def create_sensor(user_id, name, sensor_type, interface, config):
    """Create a new sensor for user"""
    import json
    db = get_db()
    
    try:
        config_json = json.dumps(config) if isinstance(config, dict) else config
        cur = db.execute(
            """INSERT INTO user_sensors 
               (user_id, name, type, interface, config, active, available)
               VALUES (?, ?, ?, ?, ?, 1, 0)""",
            (user_id, name, sensor_type, interface, config_json)
        )
        db.commit()
        sensor_id = cur.lastrowid
        db.close()
        return sensor_id
    except sqlite3.IntegrityError as e:
        db.close()
        return None
    except Exception as e:
        db.close()
        return None

def get_user_sensors(user_id):
    """Get all sensors for a user"""
    import json
    db = get_db()
    db.row_factory = sqlite3.Row
    
    sensors = db.execute(
        """SELECT * FROM user_sensors WHERE user_id = ? ORDER BY created_at DESC""",
        (user_id,)
    ).fetchall()
    
    db.close()
    
    result = []
    for sensor in sensors:
        sensor_dict = dict(sensor)
        try:
            sensor_dict['config'] = json.loads(sensor_dict['config']) if isinstance(sensor_dict['config'], str) else sensor_dict['config']
        except:
            sensor_dict['config'] = {}
        result.append(sensor_dict)
    
    return result

def get_sensor_by_id(sensor_id, user_id=None):
    """Get a specific sensor"""
    import json
    db = get_db()
    db.row_factory = sqlite3.Row
    
    if user_id:
        sensor = db.execute(
            """SELECT * FROM user_sensors WHERE id = ? AND user_id = ?""",
            (sensor_id, user_id)
        ).fetchone()
    else:
        sensor = db.execute(
            """SELECT * FROM user_sensors WHERE id = ?""",
            (sensor_id,)
        ).fetchone()
    
    db.close()
    
    if sensor:
        sensor_dict = dict(sensor)
        try:
            sensor_dict['config'] = json.loads(sensor_dict['config']) if isinstance(sensor_dict['config'], str) else sensor_dict['config']
        except:
            sensor_dict['config'] = {}
        return sensor_dict
    
    return None

def update_sensor(sensor_id, user_id, name=None, sensor_type=None, interface=None, config=None, active=None, available=None):
    """Update sensor settings"""
    import json
    db = get_db()
    
    updates = []
    values = []
    
    if name is not None:
        updates.append("name = ?")
        values.append(name)
    if sensor_type is not None:
        updates.append("type = ?")
        values.append(sensor_type)
    if interface is not None:
        updates.append("interface = ?")
        values.append(interface)
    if config is not None:
        updates.append("config = ?")
        config_json = json.dumps(config) if isinstance(config, dict) else config
        values.append(config_json)
    if active is not None:
        updates.append("active = ?")
        values.append(active)
    if available is not None:
        updates.append("available = ?")
        values.append(available)
    
    if not updates:
        db.close()
        return False
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    values.append(sensor_id)
    values.append(user_id)
    
    try:
        db.execute(
            f"""UPDATE user_sensors 
               SET {', '.join(updates)} 
               WHERE id = ? AND user_id = ?""",
            values
        )
        db.commit()
        db.close()
        return True
    except Exception as e:
        print(f"Error updating sensor: {e}")
        db.close()
        return False

def delete_sensor(sensor_id, user_id):
    """Delete a sensor"""
    db = get_db()
    
    db.execute(
        """DELETE FROM user_sensors WHERE id = ? AND user_id = ?""",
        (sensor_id, user_id)
    )
    
    db.commit()
    db.close()
    return True

def get_active_sensors(user_id):
    """Get all active sensors for a user"""
    import json
    db = get_db()
    db.row_factory = sqlite3.Row
    
    sensors = db.execute(
        """SELECT * FROM user_sensors WHERE user_id = ? AND active = 1 ORDER BY created_at DESC""",
        (user_id,)
    ).fetchall()
    
    db.close()
    
    result = []
    for sensor in sensors:
        sensor_dict = dict(sensor)
        try:
            sensor_dict['config'] = json.loads(sensor_dict['config']) if isinstance(sensor_dict['config'], str) else sensor_dict['config']
        except:
            sensor_dict['config'] = {}
        result.append(sensor_dict)
    
    return result

def update_sensor_availability(sensor_id, available):
    """Update sensor availability status"""
    db = get_db()
    
    db.execute(
        """UPDATE user_sensors SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?""",
        (available, sensor_id)
    )
    
    db.commit()
    db.close()

def update_sensor_last_read(sensor_id):
    """Update sensor last read timestamp"""
    db = get_db()
    
    db.execute(
        """UPDATE user_sensors SET last_read = CURRENT_TIMESTAMP WHERE id = ?""",
        (sensor_id,)
    )
    
    db.commit()
    db.close()

def get_sensors_count(user_id):
    """Get count of sensors for a user"""
    db = get_db()
    
    count = db.execute(
        """SELECT COUNT(*) as count FROM user_sensors WHERE user_id = ?""",
        (user_id,)
    ).fetchone()['count']
    
    db.close()
    return count

def get_available_sensors_count(user_id):
    """Get count of available/connected sensors for a user"""
    db = get_db()
    
    count = db.execute(
        """SELECT COUNT(*) as count FROM user_sensors WHERE user_id = ? AND available = 1""",
        (user_id,)
    ).fetchone()['count']
    
    db.close()
    return count

# ================================================================================
#                      SENSOR READINGS (PER-SENSOR DATA)
# ================================================================================

def log_sensor_reading(sensor_id, co2, temperature=None, humidity=None):
    """Log a CO2 reading for a specific sensor"""
    db = get_db()
    
    db.execute(
        """INSERT INTO sensor_readings (sensor_id, co2, temperature, humidity)
           VALUES (?, ?, ?, ?)""",
        (sensor_id, co2, temperature, humidity)
    )
    
    db.commit()
    db.close()

def get_sensor_readings(sensor_id, hours=24):
    """Get sensor readings from last N hours"""
    db = get_db()
    
    readings = db.execute(
        """SELECT * FROM sensor_readings 
           WHERE sensor_id = ? AND timestamp > datetime('now', '-' || ? || ' hours')
           ORDER BY timestamp DESC""",
        (sensor_id, hours)
    ).fetchall()
    
    db.close()
    return [dict(r) for r in readings]

def get_sensor_latest_reading(sensor_id):
    """Get the most recent reading for a sensor"""
    db = get_db()
    
    reading = db.execute(
        """SELECT * FROM sensor_readings 
           WHERE sensor_id = ? 
           ORDER BY timestamp DESC 
           LIMIT 1""",
        (sensor_id,)
    ).fetchone()
    
    db.close()
    return dict(reading) if reading else None

def cleanup_old_sensor_readings(days_to_keep=90):
    """Remove sensor readings older than N days"""
    db = get_db()
    
    deleted = db.execute(
        """DELETE FROM sensor_readings 
           WHERE timestamp < datetime('now', '-' || ? || ' days')""",
        (days_to_keep,)
    ).rowcount
    
    db.commit()
    db.close()
    return deleted

# ================================================================================
#                      SENSOR THRESHOLD MANAGEMENT
# ================================================================================

def update_sensor_thresholds(sensor_id, user_id, good=None, warning=None, critical=None):
    """Update CO2 thresholds for a specific sensor"""
    db = get_db()
    
    updates = []
    values = []
    
    if good is not None:
        updates.append("good_threshold = ?")
        values.append(good)
    if warning is not None:
        updates.append("warning_threshold = ?")
        values.append(warning)
    if critical is not None:
        updates.append("critical_threshold = ?")
        values.append(critical)
    
    if not updates:
        db.close()
        return False
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    values.append(sensor_id)
    values.append(user_id)
    
    try:
        db.execute(
            f"""UPDATE user_sensors 
               SET {', '.join(updates)} 
               WHERE id = ? AND user_id = ?""",
            values
        )
        db.commit()
        db.close()
        return True
    except Exception as e:
        print(f"Error updating thresholds: {e}")
        db.close()
        return False

def get_sensor_thresholds(sensor_id, user_id):
    """Get thresholds for a specific sensor"""
    db = get_db()
    
    sensor = db.execute(
        """SELECT good_threshold, warning_threshold, critical_threshold 
           FROM user_sensors WHERE id = ? AND user_id = ?""",
        (sensor_id, user_id)
    ).fetchone()
    
    db.close()
    
    if sensor:
        return {
            'good': sensor['good_threshold'],
            'warning': sensor['warning_threshold'],
            'critical': sensor['critical_threshold']
        }
    return None

def check_sensor_threshold_status(ppm_value, sensor_id, user_id):
    """Check if reading exceeds sensor thresholds, return status"""
    thresholds = get_sensor_thresholds(sensor_id, user_id)
    
    if not thresholds:
        return 'unknown'
    
    if ppm_value <= thresholds['good']:
        return 'good'
    elif ppm_value <= thresholds['warning']:
        return 'warning'
    elif ppm_value <= thresholds['critical']:
        return 'warning_high'
    else:
        return 'critical'
