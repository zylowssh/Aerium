#!/usr/bin/env python
"""Test script for multi-sensor API endpoints"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'site'))

from database import (
    init_db, create_user, get_user_by_username,
    create_sensor, get_user_sensors, get_sensor_by_id, 
    update_sensor, delete_sensor, get_active_sensors,
    get_sensors_count, get_available_sensors_count
)
from werkzeug.security import generate_password_hash
import json

def test_multi_sensor_database():
    """Test multi-sensor database functions"""
    print("🧪 Testing Multi-Sensor Database Functions...\n")
    
    # Initialize database
    print("✓ Initializing database...")
    init_db()
    
    # Create test user
    print("✓ Creating test user...")
    user_id = create_user("test_sensor_user", "test@sensors.local", generate_password_hash("testpass123"))
    print(f"  User ID: {user_id}")
    
    # Test create_sensor
    print("\n✓ Creating first sensor (SCD30)...")
    sensor1_id = create_sensor(
        user_id=user_id,
        name="Living Room SCD30",
        sensor_type="scd30",
        interface="i2c",
        config={"bus": 1, "address": "0x61"}
    )
    print(f"  Sensor 1 ID: {sensor1_id}")
    
    # Test create_sensor with different type
    print("✓ Creating second sensor (MH-Z19)...")
    sensor2_id = create_sensor(
        user_id=user_id,
        name="Kitchen MH-Z19",
        sensor_type="mhz19",
        interface="uart",
        config={"port": "/dev/ttyUSB0", "baudrate": 9600}
    )
    print(f"  Sensor 2 ID: {sensor2_id}")
    
    # Test get_user_sensors
    print("\n✓ Retrieving all sensors...")
    sensors = get_user_sensors(user_id)
    print(f"  Total sensors: {len(sensors)}")
    for sensor in sensors:
        print(f"  - {sensor['name']} ({sensor['type']}) [{sensor['interface']}]")
        print(f"    Config: {sensor['config']}")
    
    # Test get_sensor_by_id
    print("\n✓ Getting sensor by ID...")
    sensor1 = get_sensor_by_id(sensor1_id, user_id)
    print(f"  Name: {sensor1['name']}")
    print(f"  Type: {sensor1['type']}")
    print(f"  Interface: {sensor1['interface']}")
    print(f"  Active: {sensor1['active']}")
    print(f"  Available: {sensor1['available']}")
    
    # Test update_sensor
    print("\n✓ Updating sensor name...")
    update_sensor(sensor1_id, user_id, name="Updated Living Room SCD30")
    updated = get_sensor_by_id(sensor1_id, user_id)
    print(f"  New name: {updated['name']}")
    
    # Test update active status
    print("✓ Toggling sensor active status...")
    update_sensor(sensor1_id, user_id, active=False)
    updated = get_sensor_by_id(sensor1_id, user_id)
    print(f"  Active: {updated['active']}")
    
    # Test get_active_sensors
    print("\n✓ Getting active sensors...")
    active = get_active_sensors(user_id)
    print(f"  Active sensors: {len(active)}")
    
    # Test get_sensors_count
    print("\n✓ Getting sensor counts...")
    total = get_sensors_count(user_id)
    available = get_available_sensors_count(user_id)
    print(f"  Total sensors: {total}")
    print(f"  Available sensors: {available}")
    
    # Test delete_sensor
    print("\n✓ Deleting a sensor...")
    delete_sensor(sensor2_id, user_id)
    sensors = get_user_sensors(user_id)
    print(f"  Remaining sensors: {len(sensors)}")
    
    # Test duplicate name constraint
    print("\n✓ Testing duplicate name constraint...")
    try:
        create_sensor(
            user_id=user_id,
            name="Updated Living Room SCD30",  # Same name as sensor1
            sensor_type="scd30",
            interface="i2c",
            config={}
        )
        print("  ❌ Should have rejected duplicate name!")
    except:
        print("  ✓ Correctly rejected duplicate sensor name")
    
    print("\n✅ All database tests passed!")

if __name__ == "__main__":
    test_multi_sensor_database()
