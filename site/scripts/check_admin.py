#!/usr/bin/env python3
"""
Check and fix admin account permissions
Run this to diagnose admin account issues and promote a user to admin
"""

import sqlite3
import sys

DB_PATH = 'data/aerium.sqlite'

def check_database():
    """Check database structure and admin users"""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    
    print("=" * 60)
    print("ADMIN ACCOUNT DIAGNOSTIC")
    print("=" * 60)
    
    # Check users table structure
    print("\n[1] Users Table Structure:")
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
    
    # Check all users
    print("\n[2] All Users in Database:")
    cursor.execute("SELECT id, username, email, role, email_verified FROM users ORDER BY id")
    users = cursor.fetchall()
    if users:
        for user in users:
            print(f"  ID {user['id']}: {user['username']} ({user['email']})")
            print(f"    Role: {user['role']}, Email Verified: {user['email_verified']}")
    else:
        print("  (No users found)")
    
    # Check admin users
    print("\n[3] Admin Users:")
    cursor.execute("SELECT id, username, email FROM users WHERE role = 'admin'")
    admins = cursor.fetchall()
    if admins:
        for admin in admins:
            print(f"  ✓ {admin['username']} (ID: {admin['id']})")
    else:
        print("  (No admin users - need to promote one!)")
    
    db.close()
    return users

def promote_user_to_admin(username):
    """Promote a user to admin"""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    cursor = db.cursor()
    
    print(f"\n[4] Promoting '{username}' to Admin:")
    
    # Find user
    cursor.execute("SELECT id, username, role FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        print(f"  ✗ User '{username}' not found")
        db.close()
        return False
    
    print(f"  Found: {user['username']} (ID: {user['id']}, Current Role: {user['role']})")
    
    # Update role
    cursor.execute("UPDATE users SET role = ? WHERE id = ?", ('admin', user['id']))
    db.commit()
    
    # Verify
    cursor.execute("SELECT role FROM users WHERE id = ?", (user['id'],))
    updated = cursor.fetchone()
    print(f"  ✓ Updated to: {updated['role']}")
    
    db.close()
    return True

def main():
    users = check_database()
    
    print("\n" + "=" * 60)
    print("USAGE TO FIX ADMIN ACCESS:")
    print("=" * 60)
    print("""
From Python:
  python check_admin.py promote <username>
  
Example:
  python check_admin.py promote admin
  python check_admin.py promote john_doe

Or in Flask shell:
  from database import set_user_role, get_all_users
  set_user_role(USER_ID, 'admin')
""")
    
    if len(sys.argv) == 3 and sys.argv[1] == 'promote':
        username = sys.argv[2]
        if promote_user_to_admin(username):
            print(f"\n✓ SUCCESS: {username} is now an admin!")
            print("  You can now access /admin dashboard")
    elif len(sys.argv) > 1:
        print(f"\n✗ Invalid command: {' '.join(sys.argv[1:])}")
        print("  Use: python check_admin.py promote <username>")

if __name__ == '__main__':
    main()
