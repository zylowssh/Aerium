import sqlite3
from pathlib import Path

DB_PATH = Path("data/aerium.sqlite")

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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create index on username for faster lookups
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_username 
        ON users(username)
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