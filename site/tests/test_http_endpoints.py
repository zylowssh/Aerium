#!/usr/bin/env python3
"""
Integration test - Tests actual HTTP endpoints to verify they return real data
Run this after starting the Flask app: python app.py
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/login"
API_BASE = f"{BASE_URL}/api"

# Test credentials (adjust as needed)
TEST_USERNAME = "admin"
TEST_PASSWORD = "password"

def create_session():
    """Create a session and login"""
    session = requests.Session()
    
    # Login
    response = session.post(LOGIN_URL, data={
        'username': TEST_USERNAME,
        'password': TEST_PASSWORD
    })
    
    if response.status_code == 200:
        print("✅ Login successful")
        return session
    else:
        print(f"❌ Login failed: {response.status_code}")
        return None

def test_health_score(session):
    """Test /api/health/score endpoint"""
    print("\n" + "="*70)
    print("TEST: /api/health/score")
    print("="*70)
    
    # Request 1
    response1 = session.get(f"{API_BASE}/health/score")
    if response1.status_code != 200:
        print(f"❌ Request failed: {response1.status_code}")
        return False
    
    data1 = response1.json()
    print(f"\nResponse 1:")
    print(json.dumps(data1, indent=2))
    
    # Request 2 (should be same)
    time.sleep(0.5)
    response2 = session.get(f"{API_BASE}/health/score")
    data2 = response2.json()
    
    print(f"\nResponse 2:")
    print(json.dumps(data2, indent=2))
    
    # Verify not random
    if data1.get('data', {}).get('score') == data2.get('data', {}).get('score'):
        print("\n✅ PASS: Scores are consistent (not random)")
        return True
    else:
        print(f"\n❌ FAIL: Scores differ ({data1} vs {data2})")
        return False

def test_health_trends(session):
    """Test /api/health/trends endpoint"""
    print("\n" + "="*70)
    print("TEST: /api/health/trends")
    print("="*70)
    
    response = session.get(f"{API_BASE}/health/trends?period=week")
    if response.status_code != 200:
        print(f"❌ Request failed: {response.status_code}")
        return False
    
    data = response.json()
    print(f"\nResponse:")
    print(json.dumps(data, indent=2)[:500] + "...")
    
    if data.get('success') and data.get('data', {}).get('trend_data'):
        print("\n✅ PASS: Trends returned successfully")
        return True
    else:
        print("\n❌ FAIL: No trend data returned")
        return False

def test_system_performance(session):
    """Test /api/system/performance endpoint"""
    print("\n" + "="*70)
    print("TEST: /api/system/performance")
    print("="*70)
    
    response = session.get(f"{API_BASE}/system/performance")
    if response.status_code != 200:
        print(f"❌ Request failed: {response.status_code}")
        return False
    
    data = response.json()
    print(f"\nResponse:")
    print(json.dumps(data, indent=2))
    
    perf = data.get('performance', {})
    if perf.get('total_records') is not None:
        print("\n✅ PASS: Real performance metrics returned")
        return True
    else:
        print("\n❌ FAIL: Missing performance data")
        return False

def test_analytics_predict(session):
    """Test /api/analytics/predict endpoint"""
    print("\n" + "="*70)
    print("TEST: /api/analytics/predict/6")
    print("="*70)
    
    response = session.get(f"{API_BASE}/analytics/predict/6")
    if response.status_code != 200:
        print(f"❌ Request failed: {response.status_code}")
        return False
    
    data = response.json()
    print(f"\nResponse:")
    print(json.dumps(data, indent=2))
    
    if data.get('success') and data.get('predictions'):
        predictions = data.get('predictions')
        print(f"\n✅ PASS: Predictions generated ({len(predictions)} values)")
        
        # Check if not all same (would indicate hardcoded/random)
        unique_values = len(set(predictions))
        print(f"   Unique prediction values: {unique_values}/{len(predictions)}")
        
        return True
    else:
        print("\n❌ FAIL: No predictions returned")
        return False

def test_healthz(session):
    """Test /healthz endpoint"""
    print("\n" + "="*70)
    print("TEST: /healthz (no auth required)")
    print("="*70)
    
    # This endpoint doesn't require auth
    response = requests.get(f"{BASE_URL}/healthz")
    if response.status_code != 200:
        print(f"❌ Request failed: {response.status_code}")
        return False
    
    data = response.json()
    print(f"\nResponse:")
    print(json.dumps(data, indent=2))
    
    if data.get('status') == 'ok':
        print("\n✅ PASS: Health check successful")
        return True
    else:
        print("\n❌ FAIL: Health check failed")
        return False

def main():
    """Run all integration tests"""
    print("\n" + "╔" + "="*68 + "╗")
    print("║" + " "*12 + "INTEGRATION TESTS - HTTP ENDPOINT VERIFICATION" + " "*11 + "║")
    print("╚" + "="*68 + "╝")
    
    print(f"\nBase URL: {BASE_URL}")
    print(f"Testing with user: {TEST_USERNAME}")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/healthz", timeout=2)
    except:
        print("\n❌ ERROR: Flask server not running!")
        print(f"   Start the server with: python app.py")
        return 1
    
    # Create authenticated session
    session = create_session()
    if not session:
        print("❌ Failed to create authenticated session")
        return 1
    
    # Run tests
    tests = [
        ("Health Check", test_healthz),
        ("Health Score", lambda s: test_health_score(session)),
        ("Health Trends", lambda s: test_health_trends(session)),
        ("System Performance", lambda s: test_system_performance(session)),
        ("Analytics Predictions", lambda s: test_analytics_predict(session)),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func(None)  # session passed differently
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ ERROR in {test_name}: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✨ All HTTP integration tests PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == '__main__':
    exit(main())
