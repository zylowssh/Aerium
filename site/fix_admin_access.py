#!/usr/bin/env python3
"""
Diagnose and fix admin panel access issues
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import get_db, get_user_by_id, is_admin

print("=" * 70)
print("ADMIN ACCESS DIAGNOSTIC")
print("=" * 70)

db = get_db()
cursor = db.cursor()

# Check admin user account
print("\n[1] Admin Account Status:")
admin = get_user_by_id(1)
if admin:
    print(f"    ✓ Admin user found")
    print(f"      - ID: {admin['id']}")
    print(f"      - Username: {admin['username']}")
    print(f"      - Email: {admin['email']}")
    print(f"      - Role: {admin['role']}")
    print(f"      - is_admin() returns: {is_admin(1)}")
else:
    print(f"    ✗ No admin user found")
    db.close()
    sys.exit(1)

# Check user_permissions table
print("\n[2] User Permissions Table Check:")
try:
    cursor.execute("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = 1")
    perm_count = cursor.fetchone()[0]
    print(f"    ✓ Admin has {perm_count} permissions assigned")
    
    if perm_count > 0:
        cursor.execute("SELECT permission FROM user_permissions WHERE user_id = 1 ORDER BY permission")
        for row in cursor.fetchall():
            print(f"      - {row[0]}")
    else:
        print(f"    ⚠ No permissions found - will add them now...")
except Exception as e:
    print(f"    ✗ Error checking permissions: {e}")

# Verify user_permissions table exists
print("\n[3] Database Table Verification:")
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_permissions'")
    if cursor.fetchone():
        print(f"    ✓ user_permissions table exists")
    else:
        print(f"    ✗ user_permissions table does NOT exist")
except Exception as e:
    print(f"    ✗ Error: {e}")

# Show all available permissions
print("\n[4] Available Permissions:")
all_perms = ['view_reports', 'manage_exports', 'manage_sensors', 'manage_alerts', 'manage_users']
for perm in all_perms:
    print(f"    - {perm}")

# Add missing permissions
print("\n[5] Adding/Ensuring Admin Permissions:")
for perm in all_perms:
    try:
        # Check if permission already exists
        cursor.execute(
            "SELECT id FROM user_permissions WHERE user_id = 1 AND permission = ?",
            (perm,)
        )
        if cursor.fetchone():
            print(f"    ✓ {perm} (already exists)")
        else:
            # Add the permission
            cursor.execute(
                "INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)",
                (1, perm)
            )
            db.commit()
            print(f"    ✓ {perm} (added)")
    except Exception as e:
        print(f"    ✗ {perm}: {e}")

# Final verification
print("\n[6] Final Verification:")
cursor.execute("SELECT COUNT(*) as count FROM user_permissions WHERE user_id = 1")
final_count = cursor.fetchone()[0]
print(f"    Admin now has {final_count} permissions")

if final_count == len(all_perms):
    print(f"    ✅ All {len(all_perms)} permissions assigned!")
else:
    print(f"    ⚠ Only {final_count}/{len(all_perms)} permissions assigned")

# Summary
print("\n" + "=" * 70)
print("DIAGNOSTIC COMPLETE")
print("=" * 70)
print("\n✅ Admin permissions verified/updated!")
print("\nTo fix admin panel access:")
print("  1. Clear browser cache (Ctrl+Shift+Delete)")
print("  2. Log out from the application")
print("  3. Log back in as admin")
print("  4. Visit http://localhost:5000/admin")
print("\n")

db.close()
