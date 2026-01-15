#!/usr/bin/env python3
"""
Test analytics endpoints with proper authentication
"""
import requests
import json
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:5000"

def test_with_session():
    """Test endpoints using authenticated session"""
    
    session = requests.Session()
    
    print("\n" + "*" * 60)
    print("*  ANALYTICS ENDPOINTS TEST")
    print("*" * 60 + "\n")
    
    # Step 1: Login with admin user
    print("Step 1: Logging in as admin...")
    try:
        login_data = {
            'username': 'admin',
            'password': 'admin',
            'remember_me': 'off'
        }
        
        response = session.post(f"{BASE_URL}/login", data=login_data, allow_redirects=False)
        
        # Check if we got a redirect (302) which would indicate successful login
        if response.status_code in [200, 302]:
            # Verify session has user_id by checking a protected route
            dashboard_response = session.get(f"{BASE_URL}/dashboard")
            if dashboard_response.status_code == 200:
                print(f"  ✓ Successfully logged in")
            else:
                print(f"  ! Got status {dashboard_response.status_code} - trying endpoints anyway")
        else:
            print(f"  ! Got status {response.status_code} - trying endpoints anyway")
            
    except Exception as e:
        print(f"  ✗ Login error: {e}")
        return
    
    # Step 2: Test analytics endpoints
    print("\nStep 2: Testing analytics endpoints...\n")
    
    endpoints = [
        ("Predictions (6 hours)", "/api/analytics/predict/6"),
        ("Anomalies", "/api/analytics/anomalies"),
        ("Insights", "/api/analytics/insights"),
        ("Health Recommendations", "/api/health/recommendations"),
    ]
    
    print("=" * 60)
    
    for name, endpoint in endpoints:
        print(f"\n{name}")
        print(f"  URL: {endpoint}")
        
        try:
            response = session.get(f"{BASE_URL}{endpoint}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    print(f"  ✓ SUCCESS")
                    
                    # Show response structure
                    keys = list(data.keys())
                    print(f"    Response keys: {', '.join(keys)}")
                    
                    # Show data sample
                    for key in ['predictions', 'data', 'recommendations']:
                        if key in data:
                            value = data[key]
                            if isinstance(value, list):
                                print(f"    {key}: {len(value)} items")
                                if value and isinstance(value[0], dict):
                                    print(f"      Sample: {json.dumps(value[0], indent=8)[:150]}...")
                                elif value:
                                    print(f"      Sample: {value[0]}")
                            elif isinstance(value, dict):
                                print(f"    {key}: {len(value)} keys - {', '.join(list(value.keys())[:3])}...")
                            break
                else:
                    error = data.get('error', 'Unknown error')
                    print(f"  ✗ FAILED: {error}")
                    
            elif response.status_code == 401:
                print(f"  ✗ UNAUTHORIZED (401)")
            else:
                print(f"  ✗ HTTP {response.status_code}")
                if response.text:
                    print(f"    Response: {response.text[:100]}")
                    
        except Exception as e:
            print(f"  ✗ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("\nStep 3: Verify data quality...\n")
    
    # Get predictions for detailed analysis
    try:
        response = session.get(f"{BASE_URL}/api/analytics/predict/6", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'predictions' in data:
                preds = data['predictions']
                print(f"Predictions Analysis:")
                print(f"  Count: {len(preds)}")
                if preds:
                    print(f"  Range: {min(preds):.0f} - {max(preds):.0f} ppm")
                    print(f"  Average: {sum(preds)/len(preds):.0f} ppm")
                    print(f"  First 3: {[f'{p:.0f}' for p in preds[:3]]}")
    except:
        pass
    
    print("\n" + "=" * 60)
    print("\nStep 3: Verify data quality...\n")

    print("\n" + "*" * 60)
    print("*  TEST COMPLETE")
    print("*" * 60 + "\n")

if __name__ == '__main__':
    test_with_session()
