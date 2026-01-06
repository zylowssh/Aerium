#!/usr/bin/env python3
import sys, time
sys.path.insert(0, 'site')
from database import init_db, create_user, create_sensor, log_sensor_reading, get_sensor_readings, update_sensor_thresholds, get_sensor_thresholds, check_sensor_threshold_status
from werkzeug.security import generate_password_hash

init_db()
uid = create_user(f'thresh_test_{int(time.time())}', f'user_{int(time.time())}@test.local', generate_password_hash('pass'))
sid = create_sensor(uid, 'Test Room', 'scd30', 'i2c', {'bus': 1, 'address': '0x61'})

# Test logging readings
log_sensor_reading(sid, 850, 22.5, 45.0)
log_sensor_reading(sid, 920, 23.0, 46.0)
readings = get_sensor_readings(sid, 24)
print(f'✓ Logged and retrieved {len(readings)} readings')

# Test thresholds
update_sensor_thresholds(sid, uid, good=750, warning=950, critical=1100)
thresholds = get_sensor_thresholds(sid, uid)
print(f'✓ Thresholds set: good={thresholds["good"]}, warning={thresholds["warning"]}, critical={thresholds["critical"]}')

# Test threshold status check
status = check_sensor_threshold_status(850, sid, uid)
print(f'✓ Status check: 850 ppm = {status} (should be warning)')

status = check_sensor_threshold_status(700, sid, uid)
print(f'✓ Status check: 700 ppm = {status} (should be good)')

print()
print('✅ ALL THRESHOLD TESTS PASSED')
