#!/usr/bin/env python3
"""
Test analytics API endpoints via HTTP requests
"""
import requests
import json
import time
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:5000"

def test_endpoint(name, endpoint, timeout=5):
    """Test a single endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Endpoint: {endpoint}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=timeout)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for success field
            if isinstance(data, dict):
                if 'success' in data:
                    print(f"✓ Success: {data.get('success', 'N/A')}")
                
                if 'data' in data:
                    print(f"✓ Data received: {len(json.dumps(data['data']))} bytes")
                    
                    # Show sample data
                    if isinstance(data['data'], list):
                        print(f"  Items: {len(data['data'])}")
                        if data['data']:
                            print(f"  Sample item: {json.dumps(data['data'][0], indent=2)}")
                    elif isinstance(data['data'], dict):
                        print(f"  Keys: {', '.join(data['data'].keys())}")
                        for key, value in list(data['data'].items())[:3]:
                            if isinstance(value, (int, float, str)):
                                print(f"    {key}: {value}")
                else:
                    print(f"✓ Response: {json.dumps(data, indent=2)}")
            else:
                print(f"✓ Response: {response.text[:200]}")
        else:
            print(f"✗ Status {response.status_code}: {response.text[:500]}")
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Connection failed - server may not be running on {BASE_URL}")
    except requests.exceptions.Timeout:
        print(f"✗ Request timeout after {timeout}s")
    except json.JSONDecodeError:
        print(f"✗ Invalid JSON response")
    except Exception as e:
        print(f"✗ Error: {str(e)}")

def main():
    print("\n")
    print("*" * 60)
    print("*  ANALYTICS API ENDPOINT TESTS")
    print("*" * 60)
    
    time.sleep(2)  # Wait for server to start
    
    # Test all endpoints
    test_endpoint("Predictions (6 hours)", "/api/analytics/predict/6")
    test_endpoint("Anomalies", "/api/analytics/anomalies")
    test_endpoint("Insights", "/api/analytics/insights")
    test_endpoint("Health Recommendations", "/api/health/recommendations")
    
    # Also test visualization endpoints
    test_endpoint("Heatmap", "/api/visualization/heatmap")
    test_endpoint("Correlation", "/api/visualization/correlation")
    
    print("\n" + "*" * 60)
    print("*  ENDPOINT TESTS COMPLETE")
    print("*" * 60 + "\n")

if __name__ == '__main__':
    main()
