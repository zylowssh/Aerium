#!/usr/bin/env python3
"""
Test analytics endpoints with authentication via session
"""
import requests
import json
import time
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:5000"

def login_and_test():
    """Create session, login, then test endpoints"""
    
    session = requests.Session()
    
    print("\n" + "*" * 60)
    print("*  ANALYTICS API ENDPOINT TESTS (WITH AUTH)")
    print("*" * 60 + "\n")
    
    # Step 1: Get login page (to get CSRF token if needed)
    print("Step 1: Accessing login page...")
    try:
        response = session.get(f"{BASE_URL}/login")
        if response.status_code != 200:
            print(f"  ✗ Failed to load login page: {response.status_code}")
            return
        print("  ✓ Login page loaded")
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return
    
    # Step 2: Attempt login with default credentials
    print("\nStep 2: Attempting login...")
    try:
        # Try common default credentials
        credentials = [
            {'email': 'admin@example.com', 'password': 'admin'},
            {'email': 'test@example.com', 'password': 'test'},
            {'email': 'admin@aerium.com', 'password': 'admin123'},
        ]
        
        logged_in = False
        for cred in credentials:
            response = session.post(f"{BASE_URL}/login", data=cred, allow_redirects=True)
            if 'dashboard' in response.url.lower() or response.status_code == 200:
                print(f"  ✓ Logged in with {cred['email']}")
                logged_in = True
                break
        
        if not logged_in:
            print(f"  ✗ Could not log in with default credentials")
            print(f"  ! Trying to access endpoints anyway...")
            
    except Exception as e:
        print(f"  ✗ Login error: {e}")
    
    # Step 3: Test endpoints
    endpoints = [
        ("Predictions (6 hours)", "/api/analytics/predict/6", "predictions"),
        ("Anomalies", "/api/analytics/anomalies", "data"),
        ("Insights", "/api/analytics/insights", "data"),
        ("Health Recommendations", "/api/health/recommendations", "data"),
    ]
    
    print("\n" + "=" * 60)
    print("TESTING ENDPOINTS")
    print("=" * 60)
    
    for name, endpoint, expected_key in endpoints:
        print(f"\n{name}")
        print(f"  Endpoint: {endpoint}")
        
        try:
            response = session.get(f"{BASE_URL}{endpoint}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    print(f"  ✓ Success")
                    
                    if expected_key in data:
                        result = data[expected_key]
                        if isinstance(result, list):
                            print(f"    Items: {len(result)}")
                            if result:
                                print(f"    Sample: {json.dumps(result[0], indent=6)[:200]}...")
                        elif isinstance(result, dict):
                            print(f"    Keys: {', '.join(result.keys())}")
                else:
                    print(f"  ✗ Not successful: {data.get('error', 'Unknown error')}")
                    
            elif response.status_code == 401:
                print(f"  ✗ Unauthorized (401) - User not logged in")
            else:
                print(f"  ✗ HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
    
    print("\n" + "*" * 60)
    print("*  TESTS COMPLETE")
    print("*" * 60 + "\n")

if __name__ == '__main__':
    time.sleep(2)  # Wait for server
    login_and_test()
