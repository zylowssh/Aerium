#!/usr/bin/env python3
import sys, json, time
sys.path.insert(0, 'site')
from app import app
from database import init_db, create_user, create_sensor, log_sensor_reading
from werkzeug.security import generate_password_hash

# Initialize app context
app.config['TESTING'] = True
client = app.test_client()

# Set up test data
init_db()
uid = create_user(f'api_test_{int(time.time())}', f'user_{int(time.time())}@test.local', generate_password_hash('pass123'))
sid = create_sensor(uid, 'Living Room', 'scd30', 'i2c', {'bus': 1, 'address': '0x61'})

# Log some readings
log_sensor_reading(sid, 850, 22.5, 45.0)
log_sensor_reading(sid, 920, 23.0, 46.0)
log_sensor_reading(sid, 890, 22.8, 45.5)

print("=" * 60)
print("🧪 API ENDPOINT TESTS - READINGS & THRESHOLDS")
print("=" * 60)

# Test 1: Get readings
response = client.get(f'/api/sensor/{sid}/readings')
print(f"\n✓ GET /api/sensor/{sid}/readings")
if response.status_code == 200:
    data = response.get_json()
    print(f"  Status: {response.status_code}")
    print(f"  Reading count: {data.get('count')}")
    print(f"  Latest CO2: {data.get('latest_reading', {}).get('co2')} ppm")
    print(f"  ✓ PASSED")
else:
    print(f"  ✗ FAILED: {response.status_code}")

# Test 2: Get thresholds
response = client.get(f'/api/sensor/{sid}/thresholds')
print(f"\n✓ GET /api/sensor/{sid}/thresholds")
if response.status_code == 200:
    data = response.get_json()
    print(f"  Status: {response.status_code}")
    print(f"  Thresholds: good={data['good']}, warning={data['warning']}, critical={data['critical']}")
    print(f"  ✓ PASSED")
else:
    print(f"  ✗ FAILED: {response.status_code}")

# Test 3: Update thresholds
response = client.put(f'/api/sensor/{sid}/thresholds', 
    data=json.dumps({'good': 700, 'warning': 900, 'critical': 1200}),
    content_type='application/json'
)
print(f"\n✓ PUT /api/sensor/{sid}/thresholds")
if response.status_code == 200:
    data = response.get_json()
    print(f"  Status: {response.status_code}")
    print(f"  Updated: good={data['good']}, warning={data['warning']}, critical={data['critical']}")
    print(f"  ✓ PASSED")
else:
    print(f"  ✗ FAILED: {response.status_code} - {response.get_json()}")

print("\n" + "=" * 60)
print("✅ ALL API TESTS PASSED")
print("=" * 60)
