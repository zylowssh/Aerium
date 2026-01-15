#!/usr/bin/env python3
"""
Integration test for visualization endpoints
"""
import sqlite3
import requests
import json
from pathlib import Path
import sys
import io

# Set output encoding to UTF-8
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_PATH = Path("data/aerium.sqlite")

def setup_test_user():
    """Create a test user for API testing"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Check if test user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", ("testuser",))
    user = cursor.fetchone()
    
    if not user:
        from werkzeug.security import generate_password_hash
        hashed_pass = generate_password_hash("testpass123")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            ("testuser", "test@example.com", hashed_pass)
        )
        conn.commit()
        print("Created test user: testuser / testpass123")
    else:
        print("Test user already exists")
    
    conn.close()

def test_endpoints():
    """Test the visualization endpoints"""
    
    # Create a session with the server
    session = requests.Session()
    
    # Login
    print("\nLogging in...")
    login_response = session.post(
        "http://127.0.0.1:5000/api/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return False
    
    print("Login successful")
    
    # Test heatmap endpoint
    print("\nTesting /api/visualization/heatmap...")
    heatmap_response = session.get("http://127.0.0.1:5000/api/visualization/heatmap")
    
    if heatmap_response.status_code == 200:
        data = heatmap_response.json()
        if data.get('success') and data.get('heatmap'):
            heatmap = data['heatmap']
            print(f"✓ Heatmap retrieved: {len(heatmap)} hours x {len(heatmap[0]) if heatmap else 0} days")
            
            # Check if it has real data (not all 500s)
            flat = [v for row in heatmap for v in row]
            unique_values = set(flat)
            if len(unique_values) > 10:
                print(f"✓ Heatmap contains varied real data (unique values: {len(unique_values)})")
            else:
                print(f"✗ Heatmap data seems limited (unique values: {len(unique_values)})")
        else:
            print(f"✗ Unexpected response format: {data}")
    else:
        print(f"✗ Heatmap request failed: {heatmap_response.status_code} - {heatmap_response.text}")
    
    # Test correlation endpoint
    print("\nTesting /api/visualization/correlation...")
    correlation_response = session.get("http://127.0.0.1:5000/api/visualization/correlation")
    
    if correlation_response.status_code == 200:
        data = correlation_response.json()
        if data.get('success') and data.get('correlations'):
            correlations = data['correlations']
            print(f"✓ Correlations retrieved: {len(correlations)} correlations")
            
            for corr in correlations:
                print(f"  - {corr.get('name', '?')}: {corr.get('value', 0):.3f}")
        else:
            print(f"✗ Unexpected response format: {data}")
    else:
        print(f"✗ Correlation request failed: {correlation_response.status_code} - {correlation_response.text}")

if __name__ == '__main__':
    print("Integration Test for Visualization Endpoints")
    print("=" * 50)
    
    setup_test_user()
    test_endpoints()
    
    print("\n" + "=" * 50)
    print("Integration test complete!")
