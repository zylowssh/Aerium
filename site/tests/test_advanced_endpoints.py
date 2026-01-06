#!/usr/bin/env python3
"""
Test script for advanced features endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_endpoint(method, endpoint, name):
    """Test an endpoint and report status"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json={}, timeout=5)
        
        status = "✅" if response.status_code in [200, 201, 400] else "❌"
        print(f"{status} {name}: {response.status_code}")
        
        # Try to show response data
        try:
            data = response.json()
            if isinstance(data, dict):
                keys = list(data.keys())[:3]
                print(f"   Response keys: {', '.join(keys)}")
        except:
            pass
            
        return response.status_code in [200, 201, 400]
        
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection refused (server not running?)")
        return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Advanced Features Endpoints")
    print("=" * 60)
    
    # Wait for server
    time.sleep(2)
    
    # Test Analytics endpoints
    print("\n📊 Analytics Endpoints:")
    test_endpoint("GET", "/api/analytics/insights", "Analytics Insights")
    test_endpoint("GET", "/api/analytics/predict/2", "CO2 Prediction (2 hours)")
    test_endpoint("GET", "/api/analytics/anomalies", "Anomaly Detection")
    test_endpoint("GET", "/api/health/recommendations", "Health Recommendations")
    
    # Test Visualization endpoints
    print("\n📈 Visualization Endpoints:")
    test_endpoint("GET", "/api/visualization/heatmap", "Heatmap Data")
    test_endpoint("GET", "/api/visualization/correlation", "Correlation Analysis")
    test_endpoint("GET", "/api/dashboard/config", "Dashboard Config")
    test_endpoint("POST", "/api/visualization/export", "Export Visualization")
    
    # Test Sharing endpoints
    print("\n🔗 Sharing Endpoints:")
    test_endpoint("POST", "/api/share/dashboard", "Create Shared Dashboard")
    test_endpoint("POST", "/api/share/link", "Generate Share Link")
    test_endpoint("POST", "/api/teams", "Create Team")
    
    # Test Optimization endpoints
    print("\n⚙️ Optimization Endpoints:")
    test_endpoint("GET", "/api/system/performance", "System Performance")
    test_endpoint("POST", "/api/system/cache/clear", "Clear Cache")
    test_endpoint("POST", "/api/system/archive", "Archive Data")
    
    print("\n" + "=" * 60)
    print("✅ Endpoint testing complete!")
    print("=" * 60)
