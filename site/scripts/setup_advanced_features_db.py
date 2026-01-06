#!/usr/bin/env python3
"""
Setup database tables for advanced features
Runs the SQL schema to create tables for:
- Shared dashboards
- Teams and team members
- Cached analytics data
"""

import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "aerium.db"

SQL_SCHEMA = """
-- Shared Dashboards Table
CREATE TABLE IF NOT EXISTS shared_dashboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dashboard_name TEXT NOT NULL,
    configuration TEXT,
    share_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT NOT NULL UNIQUE,
    owner_id INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cached Analytics Table
CREATE TABLE IF NOT EXISTS cached_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_type TEXT NOT NULL,
    cache_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_user_id ON shared_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_share_token ON shared_dashboards(share_token);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cached_analytics_user_id ON cached_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_cached_analytics_data_type ON cached_analytics(data_type);
"""

def setup_database():
    """Create database tables"""
    try:
        # Ensure data directory exists
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Execute schema
        cursor.executescript(SQL_SCHEMA)
        conn.commit()
        
        print("✅ Database schema setup successful!")
        print(f"   Database: {DB_PATH}")
        print("   Tables created:")
        print("   - shared_dashboards")
        print("   - teams")
        print("   - team_members")
        print("   - cached_analytics")
        print("   Indexes created for optimal performance")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = setup_database()
    sys.exit(0 if success else 1)
