#!/usr/bin/env python3
"""
Check admin password and test authentication
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import get_user_by_username, is_admin
from werkzeug.security import check_password_hash, generate_password_hash

print("=" * 70)
print("ADMIN PASSWORD & AUTH TEST")
print("=" * 70)

# Get admin user
admin = get_user_by_username('admin')
print(f"\n[1] Admin Account:")
print(f"    Username: {admin['username']}")
print(f"    ID: {admin['id']}")
print(f"    Role: {admin['role']}")
print(f"    Email: {admin['email']}")
print(f"    Password hash exists: {bool(admin['password_hash'])}")

# Test common passwords
print(f"\n[2] Testing common passwords:")
test_passwords = [
    'admin',
    'admin123',
    'password',
    '123456',
    'admin@admin.com'
]

for pwd in test_passwords:
    result = check_password_hash(admin['password_hash'], pwd)
    status = "✓" if result else "✗"
    print(f"    {status} '{pwd}': {result}")

# Check is_admin
print(f"\n[3] Admin Role Check:")
print(f"    is_admin({admin['id']}): {is_admin(admin['id'])}")

print("\n" + "=" * 70)
print("INFO: The correct password should show ✓ above.")
print("=" * 70)
print("\nIf you know the admin password, you can:")
print("  1. Log in with that password")
print("  2. Visit http://localhost:5000/debug-session after login")
print("  3. Check the JSON output to verify session is set")
print("  4. Try to access /admin")
print("\n")
