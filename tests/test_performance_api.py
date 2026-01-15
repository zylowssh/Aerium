#!/usr/bin/env python3
"""
Test performance API endpoints with authentication
"""
import requests
import json
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:5000"

def test_performance_endpoints():
    """Test all performance endpoints"""
    
    session = requests.Session()
    
    print("\n" + "*" * 60)
    print("*  PERFORMANCE API ENDPOINTS TEST")
    print("*" * 60 + "\n")
    
    # Step 1: Login
    print("Step 1: Logging in...")
    try:
        login_data = {
            'username': 'admin',
            'password': 'admin'
        }
        response = session.post(f"{BASE_URL}/login", data=login_data, allow_redirects=False)
        print(f"  ✓ Login attempt (Status: {response.status_code})")
    except Exception as e:
        print(f"  ✗ Login error: {e}")
        return
    
    # Step 2: Test endpoints
    print("\nStep 2: Testing performance endpoints...\n")
    
    endpoints = [
        ("System Performance", "/api/system/performance"),
        ("Cache Status", "/api/system/cache/status"),
        ("Query Analysis", "/api/system/queries"),
        ("Storage Stats", "/api/system/storage"),
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
                    if 'performance' in data:
                        perf = data['performance']
                        print(f"    Response time: {perf.get('response_time_ms')}")
                        print(f"    Total records: {perf.get('total_records')}")
                        print(f"    Status: {perf.get('status')}")
                    
                    if 'cache_size' in data:
                        print(f"    Cache size: {data.get('cache_size')}")
                        print(f"    Items cached: {data.get('items_cached')}")
                        print(f"    Hit rate: {data.get('hit_rate')}")
                    
                    if 'data' in data and 'queries' in data['data']:
                        print(f"    Queries analyzed: {len(data['data']['queries'])}")
                        print(f"    Avg query time: {data['data'].get('avg_query_time_ms'):.1f}ms")
                    
                    if 'storage' in data:
                        storage = data['storage']
                        print(f"    Active records: {storage.get('records_current')}")
                        print(f"    Archived: {storage.get('records_archived')}")
                        print(f"    Total size: {storage.get('total_size_mb')}")
                else:
                    print(f"  ✗ FAILED: {data.get('error', 'Unknown error')}")
                    
            elif response.status_code == 401:
                print(f"  ✗ UNAUTHORIZED (401)")
            else:
                print(f"  ✗ HTTP {response.status_code}")
                    
        except Exception as e:
            print(f"  ✗ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("\n*  ALL TESTS COMPLETE\n" + "*" * 60 + "\n")

if __name__ == '__main__':
    test_performance_endpoints()
