#!/usr/bin/env python3
"""
Grant all admin permissions to the admin account
"""

import sys
import os

# Add site directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, grant_permission, get_user_permissions, get_user_by_id

# Initialize database (create tables if they don't exist)
init_db()

# All available permissions
ALL_PERMISSIONS = [
    'view_reports',
    'manage_exports',
    'manage_sensors',
    'manage_alerts',
    'manage_users'
]

print("=" * 60)
print("ADMIN PERMISSIONS SETUP")
print("=" * 60)

# Get admin user
admin = get_user_by_id(1)
if not admin:
    print("\n✗ Admin user not found!")
    sys.exit(1)

print(f"\nAdmin User: {admin['username']} (ID: {admin['id']})")
print(f"Role: {admin['role']}")

# Grant all permissions
print(f"\nGranting {len(ALL_PERMISSIONS)} permissions to admin...\n")

for perm in ALL_PERMISSIONS:
    grant_permission(admin['id'], perm)
    print(f"  ✓ {perm}")

# Verify
print("\nVerifying permissions...")
current_perms = get_user_permissions(admin['id'])
print(f"\nAdmin now has {len(current_perms)} permissions:")
for perm in current_perms:
    print(f"  ✓ {perm}")

if len(current_perms) == len(ALL_PERMISSIONS):
    print("\n✅ SUCCESS: Admin has all permissions!")
else:
    print(f"\n⚠️ Warning: Expected {len(ALL_PERMISSIONS)} permissions, got {len(current_perms)}")

print("\n" + "=" * 60)
