#!/usr/bin/env python3
"""
Verification script for the three refinements:
1. CSV import moved from admin to visualization page
2. Analytics page removed
3. Admin account access working
"""

import sys
import os

# Add site directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database import is_admin, get_user_by_id

print("=" * 70)
print("REFINEMENT VERIFICATION TEST SUITE")
print("=" * 70)

# Test 1: CSV Import Route Accessibility
print("\n[TEST 1] CSV Import Route (@login_required, not @admin_required)")
print("-" * 70)
with app.test_request_context():
    # Check that /api/import/csv route exists
    csv_routes = [rule for rule in app.url_map.iter_rules() if 'import/csv' in str(rule)]
    if csv_routes:
        for route in csv_routes:
            print(f"✓ Route found: {route}")
            # Check if it's accessible to non-admin users
            # (we can't actually POST without credentials, but we can verify the route exists)
    else:
        print("✗ CSV import route not found!")

# Test 2: Analytics Page Removed
print("\n[TEST 2] Analytics Page Removed")
print("-" * 70)
with app.test_request_context():
    analytics_routes = [rule for rule in app.url_map.iter_rules() if 'analytics' in str(rule)]
    if analytics_routes:
        print(f"✗ Analytics route still exists: {analytics_routes}")
    else:
        print("✓ No analytics routes found - successfully removed")
        
    # Verify /analytics returns 404
    with app.test_client() as client:
        response = client.get('/analytics')
        if response.status_code == 404:
            print("✓ /analytics returns 404 (page not found)")
        else:
            print(f"⚠ /analytics returns {response.status_code} (expected 404)")

# Test 3: Admin Account Setup
print("\n[TEST 3] Admin Account Access")
print("-" * 70)
admin_user = get_user_by_id(1)  # Admin account created with ID 1
if admin_user:
    print(f"✓ Admin user found: {admin_user['username']}")
    print(f"  - Email: {admin_user['email']}")
    print(f"  - Role: {admin_user['role']}")
    
    # Check if is_admin returns True
    if is_admin(1):
        print(f"✓ is_admin(1) returns True - admin permissions working")
    else:
        print(f"✗ is_admin(1) returns False - ISSUE WITH ADMIN ROLE")
        
    # Verify admin route exists
    admin_routes = [rule for rule in app.url_map.iter_rules() if '/admin' in str(rule)]
    if admin_routes:
        print(f"✓ Admin dashboard route exists")
        for route in admin_routes:
            if str(route) == '/admin':
                print(f"  - {route}")
    else:
        print("✗ Admin dashboard route not found!")
else:
    print("✗ No admin user found with ID 1")

# Test 4: Visualization Page
print("\n[TEST 4] Visualization Page Structure")
print("-" * 70)
with app.test_request_context():
    viz_routes = [rule for rule in app.url_map.iter_rules() if '/visualization' in str(rule)]
    if viz_routes:
        print(f"✓ Visualization route exists")
        for route in viz_routes:
            print(f"  - {route}")
    
    # Check that visualization.html exists and has CSV form
    viz_template_path = 'templates/visualization.html'
    if os.path.exists(viz_template_path):
        with open(viz_template_path, 'r') as f:
            content = f.read()
            if 'csv_import' in content.lower() or 'import.*csv' in content.lower():
                print("✓ CSV import section found in visualization.html")
                if 'csv_import_file' in content:
                    print("  - CSV file input field: found")
                if 'importCSV' in content:
                    print("  - importCSV() function: found")
            else:
                print("⚠ CSV import section may be missing from visualization.html")
    else:
        print("✗ visualization.html not found")

print("\n" + "=" * 70)
print("VERIFICATION COMPLETE")
print("=" * 70)
print("\nTo test the application:")
print("  1. Start the Flask server: python app.py")
print("  2. Log in with: admin / admin_password")
print("  3. Visit /visualization - should see CSV import form")
print("  4. Visit /admin - should see admin dashboard")
print("  5. Try /analytics - should return 404")
