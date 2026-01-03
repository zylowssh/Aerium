#!/usr/bin/env python3
"""
Database update and initialization script
Ensures all tables, indexes, and data are properly set up
"""

import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

from database import (
    init_db, get_db, get_all_users, 
    get_user_settings
)

print("=" * 70)
print("DATABASE UPDATE & INITIALIZATION")
print("=" * 70)

# Step 1: Initialize database (create all tables and indexes)
print("\n[1] Initializing database schema...")
try:
    init_db()
    print("    ✓ Database schema created/verified")
except Exception as e:
    print(f"    ✗ Error: {e}")
    sys.exit(1)

# Step 2: Verify tables exist
print("\n[2] Verifying database tables...")
db = get_db()
cursor = db.cursor()

required_tables = [
    'co2_readings',
    'settings',
    'users',
    'user_settings',
    'verification_tokens',
    'password_reset_tokens',
    'user_thresholds',
    'user_permissions',
    'audit_logs'
]

existing_tables = set()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
for row in cursor.fetchall():
    existing_tables.add(row[0])

print(f"    Found {len(existing_tables)} tables:")
for table in sorted(existing_tables):
    status = "✓" if table in required_tables else "✓"
    print(f"      {status} {table}")

missing = set(required_tables) - existing_tables
if missing:
    print(f"\n    ✗ Missing tables: {', '.join(missing)}")
else:
    print(f"    ✓ All required tables present")

# Step 3: Initialize user settings for all users
print("\n[3] Checking user settings...")
users = get_all_users()
settings_count = 0

for user in users:
    try:
        settings = get_user_settings(user['id'])
        if settings:
            settings_count += 1
    except Exception as e:
        print(f"    ⚠ {user['username']}: {e}")

print(f"    ✓ {settings_count}/{len(users)} users have settings")

# Step 4: Database statistics
print("\n[4] Database statistics:")
try:
    # CO₂ readings
    cursor.execute("SELECT COUNT(*) as count FROM co2_readings")
    readings_count = cursor.fetchone()['count']
    print(f"    - CO₂ readings: {readings_count}")
    
    # Users
    cursor.execute("SELECT COUNT(*) as count FROM users")
    users_count = cursor.fetchone()['count']
    print(f"    - Users: {users_count}")
    
    # Admin users
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
    admins_count = cursor.fetchone()['count']
    print(f"    - Admin users: {admins_count}")
    
    # User permissions
    cursor.execute("SELECT COUNT(*) as count FROM user_permissions")
    perms_count = cursor.fetchone()['count']
    print(f"    - Permission assignments: {perms_count}")
    
    # Audit logs
    cursor.execute("SELECT COUNT(*) as count FROM audit_logs")
    audit_count = cursor.fetchone()['count']
    print(f"    - Audit log entries: {audit_count}")
    
except Exception as e:
    print(f"    ⚠ Could not retrieve statistics: {e}")

# Step 5: Database file size
print("\n[5] Database file size:")
try:
    db_file = 'data/aerium.sqlite'
    if os.path.exists(db_file):
        size_bytes = os.path.getsize(db_file)
        size_mb = size_bytes / (1024 * 1024)
        print(f"    - {db_file}: {size_mb:.2f} MB ({size_bytes:,} bytes)")
    else:
        print(f"    ✗ Database file not found: {db_file}")
except Exception as e:
    print(f"    ⚠ Error getting file size: {e}")

db.close()

# Final summary
print("\n" + "=" * 70)
print("DATABASE UPDATE COMPLETE")
print("=" * 70)
print("\n✅ Database is ready for use!")
print("\nNext steps:")
print("  1. Start the Flask app: python app.py")
print("  2. Access at: http://localhost:5000")
print("  3. Log in with admin account")
print("\n")
