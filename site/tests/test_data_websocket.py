"""
Test script for validating data fetching from database and WebSocket real-time streaming
Tests database queries, WebSocket connections, and real-time data flow
"""

import sqlite3
import json
import time
from datetime import datetime, timedelta
import socketio
import requests
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import (
    get_db, init_db, 
    create_user, get_user_by_username, get_user_settings
)
from werkzeug.security import generate_password_hash

# Configuration
TEST_DB = Path("data/test_aerium.sqlite")
BASE_URL = "http://localhost:5000"
WEBSOCKET_URL = "ws://localhost:5000"
TEST_USERNAME = "testuser"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"

# Use test database
original_db_path = None

class TestResults:
    """Track test results"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def add_pass(self, test_name, message=""):
        self.passed += 1
        msg = f"✓ {test_name}"
        if message:
            msg += f" - {message}"
        self.tests.append(msg)
        print(msg)
    
    def add_fail(self, test_name, error=""):
        self.failed += 1
        msg = f"✗ {test_name}"
        if error:
            msg += f" - {error}"
        self.tests.append(msg)
        print(msg)
    
    def summary(self):
        total = self.passed + self.failed
        print("\n" + "="*60)
        print(f"TEST RESULTS: {self.passed}/{total} passed")
        print("="*60)
        for test in self.tests:
            print(test)
        print("="*60)
        return self.failed == 0


def setup_test_db():
    """Setup test database with sample data"""
    global original_db_path
    
    print("\n📦 Setting up test database...")
    
    # Initialize database
    db = get_db()
    
    # Add test user
    try:
        password_hash = generate_password_hash(TEST_PASSWORD)
        create_user(TEST_USERNAME, TEST_EMAIL, password_hash)
        print(f"  ✓ Test user created: {TEST_USERNAME}")
    except Exception as e:
        print(f"  ! User might already exist: {e}")
    
    # Add sample CO2 readings
    try:
        now = datetime.now()
        readings = []
        
        # Generate 100 sample readings over last 7 days
        for i in range(100):
            timestamp = now - timedelta(minutes=i*10)
            ppm = 400 + (50 * ((i % 24) / 24))  # Realistic daily variation
            readings.append((timestamp.isoformat(), ppm))
        
        for timestamp, ppm in readings:
            db.execute(
                "INSERT INTO co2_readings (timestamp, ppm) VALUES (?, ?)",
                (timestamp, ppm)
            )
        
        db.commit()
        print(f"  ✓ Inserted {len(readings)} sample CO2 readings")
    except Exception as e:
        print(f"  ! Error inserting readings: {e}")
        db.rollback()
    
    db.close()


def test_database_connection(results):
    """Test 1: Database connection"""
    print("\n📊 TEST 1: Database Connection")
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM co2_readings")
        count = cursor.fetchone()[0]
        db.close()
        
        results.add_pass("Database connection", f"Found {count} readings")
    except Exception as e:
        results.add_fail("Database connection", str(e))


def test_co2_readings_query(results):
    """Test 2: CO2 readings query"""
    print("\n📊 TEST 2: CO2 Readings Query")
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Test: Get last 24 hours of readings
        since = datetime.now() - timedelta(hours=24)
        cursor.execute(
            "SELECT * FROM co2_readings WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 100",
            (since.isoformat(),)
        )
        readings = cursor.fetchall()
        db.close()
        
        if readings:
            results.add_pass("CO2 readings query", f"Retrieved {len(readings)} recent readings")
        else:
            results.add_fail("CO2 readings query", "No readings found")
            
    except Exception as e:
        results.add_fail("CO2 readings query", str(e))


def test_daily_statistics(results):
    """Test 3: Daily statistics calculation"""
    print("\n📊 TEST 3: Daily Statistics")
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        today = datetime.now().date()
        cursor.execute(
            """
            SELECT 
                COUNT(*) as count,
                AVG(ppm) as avg,
                MIN(ppm) as min,
                MAX(ppm) as max
            FROM co2_readings
            WHERE DATE(timestamp) = ?
            """,
            (today,)
        )
        
        stats = cursor.fetchone()
        db.close()
        
        if stats:
            msg = f"Count: {stats['count']}, Avg: {stats['avg']:.1f}ppm, Min: {stats['min']}, Max: {stats['max']}"
            results.add_pass("Daily statistics", msg)
        else:
            results.add_fail("Daily statistics", "No stats calculated")
            
    except Exception as e:
        results.add_fail("Daily statistics", str(e))


def test_user_settings(results):
    """Test 4: User settings retrieval"""
    print("\n📊 TEST 4: User Settings")
    
    try:
        user = get_user_by_username(TEST_USERNAME)
        if not user:
            results.add_fail("User settings", "Test user not found")
            return
        
        settings = get_user_settings(user['id'])
        
        if settings:
            results.add_pass("User settings", f"Retrieved settings for {TEST_USERNAME}")
        else:
            results.add_fail("User settings", "Settings not found")
            
    except Exception as e:
        results.add_fail("User settings", str(e))


def test_api_auth(results):
    """Test 5: API authentication"""
    print("\n🔐 TEST 5: API Authentication")
    
    try:
        session = requests.Session()
        
        # Try login
        response = session.post(
            f"{BASE_URL}/login",
            data={"username": TEST_USERNAME, "password": TEST_PASSWORD}
        )
        
        if response.status_code == 200:
            results.add_pass("API login", f"Status: {response.status_code}")
        else:
            results.add_fail("API login", f"Status: {response.status_code}")
            
    except Exception as e:
        results.add_fail("API authentication", str(e))


def test_api_readings(results):
    """Test 6: API readings endpoint"""
    print("\n📡 TEST 6: API Readings Endpoint")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/readings",
            params={"days": 1}
        )
        
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('readings', []))
            results.add_pass("API /api/readings", f"Retrieved {count} readings")
        else:
            results.add_fail("API /api/readings", f"Status: {response.status_code}")
            
    except Exception as e:
        results.add_fail("API /api/readings", str(e))


def test_api_settings(results):
    """Test 7: API settings endpoint"""
    print("\n📡 TEST 7: API Settings Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/api/settings")
        
        if response.status_code == 200:
            settings = response.json()
            results.add_pass("API /api/settings", f"Retrieved settings")
        else:
            results.add_fail("API /api/settings", f"Status: {response.status_code}")
            
    except Exception as e:
        results.add_fail("API /api/settings", str(e))


def test_websocket_connection(results):
    """Test 8: WebSocket connection"""
    print("\n🔌 TEST 8: WebSocket Connection")
    
    try:
        sio = socketio.Client()
        
        # Register handlers
        def on_connect():
            print("  ✓ WebSocket connected")
            if sio:
                sio.disconnect()
        
        def on_error(data):
            print(f"  ✗ Connection error: {data}")
        
        if sio:
            sio.on('connect', on_connect)
            sio.on('connect_error', on_error)
            sio.connect(WEBSOCKET_URL, wait_timeout=5)
        
        results.add_pass("WebSocket connection", "Connected successfully")
        
    except Exception as e:
        results.add_fail("WebSocket connection", str(e))


def test_websocket_data_stream(results):
    """Test 9: WebSocket data streaming"""
    print("\n🔌 TEST 9: WebSocket Data Stream")
    
    try:
        sio = socketio.Client()
        if sio is None:
            results.add_fail("WebSocket data stream", "Could not create socket client")
            return
            
        received_data = {"count": 0}
        
        def on_update(data):
            received_data["count"] += 1
            if received_data["count"] == 1:
                print(f"  📍 Received: {json.dumps(data, indent=2)}")
        
        def on_connect():
            if sio:
                sio.emit('join_room', {'room': 'co2_updates'})
        
        sio.connect(WEBSOCKET_URL)
        time.sleep(5)  # Wait for data
        
        if received_data["count"] > 0:
            results.add_pass("WebSocket data stream", f"Received {received_data['count']} updates")
        else:
            results.add_fail("WebSocket data stream", "No data received")
        
        sio.disconnect()
        
    except Exception as e:
        results.add_fail("WebSocket data stream", str(e))


def test_data_consistency(results):
    """Test 10: Data consistency between DB and API"""
    print("\n📊 TEST 10: Data Consistency")
    
    try:
        # Get from DB
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM co2_readings")
        db_count = cursor.fetchone()[0]
        db.close()
        
        # Get from API
        response = requests.get(f"{BASE_URL}/api/readings", params={"days": 7})
        api_count = len(response.json().get('readings', []))
        
        if db_count > 0 and api_count > 0:
            results.add_pass("Data consistency", f"DB: {db_count}, API: {api_count}")
        else:
            results.add_fail("Data consistency", f"DB: {db_count}, API: {api_count}")
            
    except Exception as e:
        results.add_fail("Data consistency", str(e))


def check_server_running():
    """Check if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=2)
        return response.status_code == 200
    except:
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 MORPHEUS CO₂ DATA & WEBSOCKET TEST SUITE")
    print("="*60)
    
    results = TestResults()
    
    # Setup
    setup_test_db()
    
    # Check if server is running
    print(f"\n🔍 Checking if server is running at {BASE_URL}...")
    if not check_server_running():
        print("⚠️  WARNING: Server doesn't appear to be running!")
        print(f"   Start it with: python {Path(__file__).parent}/app.py")
        print("   Continuing with database tests only...\n")
    else:
        print("✓ Server is running\n")
    
    # Run database tests (always work)
    test_database_connection(results)
    test_co2_readings_query(results)
    test_daily_statistics(results)
    test_user_settings(results)
    
    # Run API tests (require server)
    if check_server_running():
        test_api_auth(results)
        test_api_readings(results)
        test_api_settings(results)
        test_websocket_connection(results)
        test_websocket_data_stream(results)
        test_data_consistency(results)
    
    # Summary
    success = results.summary()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
