#!/usr/bin/env python
"""Test all the pages that were fixed"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"
SESSION = requests.Session()

# First, login to get a session
login_url = f"{BASE_URL}/login"
login_data = {
    "username": "admin",
    "password": "admin"
}

print("=" * 60)
print("Testing Login...")
print("=" * 60)
try:
    response = SESSION.post(login_url, data=login_data)
    print(f"Login response: {response.status_code}")
    if response.status_code == 302:
        print("✓ Login successful (redirect)")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Login error: {e}")

# Test all the API endpoints
endpoints = [
    ("GET", "/api/analytics/predict/2", None),
    ("GET", "/api/analytics/anomalies", None),
    ("GET", "/api/analytics/insights", None),
    ("GET", "/api/health/recommendations", None),
    ("GET", "/api/system/performance", None),
    ("GET", "/api/system/cache/clear", None),  # Should be POST
    ("GET", "/api/visualization/heatmap", None),
    ("GET", "/api/visualization/correlation", None),
    ("POST", "/api/export/simulate", {"format": "csv", "period_days": 7}),
]

print("\n" + "=" * 60)
print("Testing API Endpoints...")
print("=" * 60)

for method, endpoint, data in endpoints:
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = SESSION.get(url)
        else:
            response = SESSION.post(url, json=data)
        
        print(f"\n{method} {endpoint}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"✓ Success - Keys: {list(result.keys())}")
            except:
                print(f"✓ Success - Response type: {response.headers.get('Content-Type', 'unknown')}")
        elif response.status_code == 401:
            print("⚠ Unauthorized (session needed)")
        else:
            print(f"✗ Error: {response.status_code}")
            print(f"  Response: {response.text[:100]}")
    except Exception as e:
        print(f"✗ Exception: {e}")

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)
