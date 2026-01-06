#!/usr/bin/env python3
"""
Debug admin access issues
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import get_db, get_user_by_id, get_user_by_username, is_admin

print("=" * 70)
print("ADMIN ACCESS DEBUG")
print("=" * 70)

# Test 1: Check admin user by ID
print("\n[1] Admin user by ID (1):")
admin = get_user_by_id(1)
if admin:
    print(f"    ✓ Found")
    print(f"      ID: {admin['id']}")
    print(f"      Username: {admin['username']}")
    print(f"      Role: {admin['role']}")
    print(f"      is_admin(1): {is_admin(1)}")
else:
    print(f"    ✗ Not found")

# Test 2: Check admin user by username
print("\n[2] Admin user by username ('admin'):")
admin2 = get_user_by_username('admin')
if admin2:
    print(f"    ✓ Found")
    print(f"      ID: {admin2['id']}")
    print(f"      Username: {admin2['username']}")
    print(f"      Role: {admin2['role']}")
    print(f"      is_admin({admin2['id']}): {is_admin(admin2['id'])}")
else:
    print(f"    ✗ Not found")

# Test 3: Check database directly
print("\n[3] Direct database query:")
db = get_db()
cursor = db.cursor()

cursor.execute("SELECT id, username, email, role FROM users WHERE username = 'admin'")
row = cursor.fetchone()
if row:
    user_id, username, email, role = row
    print(f"    ✓ Found in database")
    print(f"      ID: {user_id}")
    print(f"      Username: {username}")
    print(f"      Email: {email}")
    print(f"      Role: {role}")
    print(f"      Role == 'admin': {role == 'admin'}")
else:
    print(f"    ✗ Not found in database")

# Test 4: Check is_admin function
print("\n[4] Testing is_admin() function:")
for user_id in [1, 2, 3]:
    admin_check = is_admin(user_id)
    user = get_user_by_id(user_id)
    if user:
        print(f"    User {user_id} ({user['username']}): is_admin={admin_check}, role={user['role']}")
    else:
        print(f"    User {user_id}: not found")

db.close()

print("\n" + "=" * 70)
print("DEBUG COMPLETE")
print("=" * 70)
print("\nIf admin shows role='admin' and is_admin()=True above,")
print("then the database is correct and the issue is with the session.")
print("\nTry:")
print("  1. Restart the Flask app")
print("  2. Clear browser cookies completely")
print("  3. Log out if you're still logged in")
print("  4. Close all browser tabs/windows")
print("  5. Open a fresh browser window and log in again")
print("\n")
