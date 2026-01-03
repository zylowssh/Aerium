#!/usr/bin/env python3
"""
Test login and session flow
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database import get_user_by_username, check_password_hash, is_admin, get_user_by_id
from werkzeug.security import generate_password_hash

print("=" * 70)
print("LOGIN FLOW TEST")
print("=" * 70)

# Test with Flask test client
with app.test_client() as client:
    print("\n[1] Testing login with admin@admin.com:")
    
    # First, get the admin account and verify password works
    admin = get_user_by_username('admin')
    print(f"    Admin user found: {admin['username']}")
    print(f"    Admin role: {admin['role']}")
    print(f"    is_admin({admin['id']}): {is_admin(admin['id'])}")
    
    print("\n[2] Simulating login POST request:")
    response = client.post('/login', data={
        'username': 'admin',
        'password': 'admin',  # Try default password
        'remember_me': 'off'
    }, follow_redirects=False)
    
    print(f"    Response status: {response.status_code}")
    print(f"    Response location: {response.location if response.status_code in [302, 303] else 'N/A'}")
    
    # Check if session was set
    with client.session_transaction() as sess:
        print(f"    Session user_id: {sess.get('user_id')}")
        print(f"    Session username: {sess.get('username')}")
    
    print("\n[3] If logged in, test /admin access:")
    response = client.get('/admin')
    print(f"    Response status: {response.status_code}")
    if response.status_code == 200:
        print(f"    ✓ Admin dashboard accessible!")
    else:
        print(f"    ✗ Access denied (status {response.status_code})")
    
    print("\n[4] Check /debug-session:")
    response = client.get('/debug-session')
    print(f"    Response status: {response.status_code}")
    if response.status_code == 200:
        import json
        data = json.loads(response.get_data(as_text=True))
        print(f"    Session data: {json.dumps(data, indent=6)}")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
print("\nNote: For this test to work, you need the admin password.")
print("If login fails, the password in the test may be wrong.")
print("\n")
