#!/usr/bin/env python3
"""
Quick test script - Run this after starting the Flask server
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_endpoint(name, method, endpoint):
    """Test a single endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json={}, timeout=5)
        
        status = "✅" if response.status_code in [200, 201] else "⚠️"
        print(f"{status} {name}")
        print(f"   └─ {response.status_code} {url}")
        
        try:
            data = response.json()
            if isinstance(data, dict) and 'status' in data:
                print(f"   └─ Status: {data.get('status')}")
            elif isinstance(data, list):
                print(f"   └─ Data: {len(data)} items")
            else:
                keys = list(data.keys())[:2] if isinstance(data, dict) else []
                if keys:
                    print(f"   └─ Response keys: {', '.join(keys)}")
        except:
            pass
        
        return response.status_code in [200, 201]
        
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}")
        print(f"   └─ Connection refused (server not running on {BASE_URL})")
        return False
    except Exception as e:
        print(f"❌ {name}")
        print(f"   └─ Error: {str(e)[:50]}")
        return False

print("=" * 70)
print(f"🧪 ADVANCED FEATURES TEST - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

print("\n📊 ANALYTICS ENDPOINTS:")
print("-" * 70)
test_endpoint("Insights", "GET", "/api/analytics/insights")
test_endpoint("CO2 Prediction (2h)", "GET", "/api/analytics/predict/2")
test_endpoint("Anomaly Detection", "GET", "/api/analytics/anomalies")
test_endpoint("Trend Analysis", "GET", "/api/analytics/trend")

print("\n📈 VISUALIZATION ENDPOINTS:")
print("-" * 70)
test_endpoint("Heatmap Data", "GET", "/api/visualization/heatmap")
test_endpoint("Correlation Analysis", "GET", "/api/visualization/correlation")
test_endpoint("Dashboard Config", "GET", "/api/dashboard/config")
test_endpoint("Export Visualization", "POST", "/api/visualization/export")

print("\n❤️  HEALTH ENDPOINTS:")
print("-" * 70)
test_endpoint("Health Recommendations", "GET", "/api/health/recommendations")

print("\n🔗 SHARING ENDPOINTS:")
print("-" * 70)
test_endpoint("Create Shared Dashboard", "POST", "/api/share/dashboard")
test_endpoint("Generate Share Link", "POST", "/api/share/link")

print("\n👥 TEAM ENDPOINTS:")
print("-" * 70)
test_endpoint("Create Team", "POST", "/api/teams")

print("\n⚙️  OPTIMIZATION ENDPOINTS:")
print("-" * 70)
test_endpoint("System Performance", "GET", "/api/system/performance")
test_endpoint("Clear Cache", "POST", "/api/system/cache/clear")
test_endpoint("Archive Data", "POST", "/api/system/archive")

print("\n" + "=" * 70)
print("✅ Test complete! All endpoints checked.")
print("=" * 70)
print("\n💡 Next steps:")
print("   1. Check which endpoints return 200 (working)")
print("   2. Build frontend components for those endpoints")
print("   3. Test with real data from your database")
print("=" * 70)
