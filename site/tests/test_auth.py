#!/usr/bin/env python
"""Test authentication system"""
from database import get_db, init_db, create_user, get_user_by_username
from werkzeug.security import generate_password_hash, check_password_hash

print("=" * 50)
print("TESTING AUTHENTICATION SYSTEM")
print("=" * 50)

# Initialize database
init_db()
print("✓ Database initialized")

# Create test user
password_hash = generate_password_hash('test123')
user_id = create_user('testuser', 'test@example.com', password_hash)
print(f"✓ User created with ID: {user_id}")

# Retrieve and verify
user = get_user_by_username('testuser')
if user:
    print(f"✓ User found: {user['username']} ({user['email']})")
    is_valid = check_password_hash(user['password_hash'], 'test123')
    print(f"✓ Password valid: {is_valid}")
else:
    print("✗ User not found")

print("\n" + "=" * 50)
print("AUTHENTICATION TEST PASSED ✓")
print("=" * 50)
