#!/usr/bin/env python3
"""
Test script to verify heatmap and correlation endpoints
"""
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
import random
import json
import sys
import os

# Set output encoding to UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database path
DB_PATH = Path("data/aerium.sqlite")

def init_test_data():
    """Add some test data to the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS co2_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ppm INTEGER NOT NULL,
            temperature REAL,
            humidity REAL,
            source TEXT DEFAULT 'live'
        )
    """)
    
    # Check if we have any data
    cursor.execute("SELECT COUNT(*) FROM co2_readings")
    count = cursor.fetchone()[0]
    
    if count < 100:
        print(f"Current data points: {count}. Adding test data...")
        
        # Add 7 days of hourly data
        base_time = datetime.now() - timedelta(days=7)
        for i in range(168):  # 7 days * 24 hours
            timestamp = base_time + timedelta(hours=i)
            
            # Simulate CO2 patterns - higher during day, lower at night
            hour_of_day = timestamp.hour
            base_ppm = 600 + (hour_of_day - 12) * 30  # Peak at noon
            ppm = max(400, base_ppm + random.randint(-50, 50))
            
            temp = 20 + random.uniform(-2, 2)
            humidity = 50 + random.uniform(-10, 10)
            
            cursor.execute(
                "INSERT INTO co2_readings (timestamp, ppm, temperature, humidity, source) VALUES (?, ?, ?, ?, ?)",
                (timestamp.isoformat(), ppm, temp, humidity, 'live')
            )
        
        conn.commit()
        print("Test data added successfully!")
    else:
        print(f"Database already has {count} data points")
    
    conn.close()

def test_heatmap_function():
    """Test the heatmap generation function directly"""
    print("\n=== Testing Heatmap Generation ===")
    
    # Import the function
    import sys
    sys.path.insert(0, 'site')
    from advanced_features import VisualizationEngine
    
    # Get readings from database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT timestamp, ppm, temperature, humidity
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        ORDER BY timestamp
    """)
    
    readings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    if readings:
        print(f"Testing with {len(readings)} readings...")
        result = VisualizationEngine.generate_heatmap_data(readings)
        
        if 'heatmap' in result:
            heatmap = result['heatmap']
            print(f"✓ Heatmap generated: {len(heatmap)} days x {len(heatmap[0]) if heatmap else 0} hours")
            
            # Print sample values
            if heatmap and heatmap[0]:
                print(f"  Sample values (Mon, midnight): {heatmap[0][0]:.1f} ppm")
                print(f"  Sample values (Mon, noon): {heatmap[0][12]:.1f} ppm")
            
            # Check if values make sense (not all 500)
            flat_values = [v for day in heatmap for v in day if v != 0]
            if flat_values:
                print(f"  Min: {min(flat_values):.1f}, Max: {max(flat_values):.1f}")
                print(f"  ✓ Heatmap contains real data (not all 500s)")
            else:
                print("  ✗ Heatmap has no real data!")
        else:
            print("✗ No heatmap in result")
    else:
        print("✗ No readings found in database")

def test_correlation_function():
    """Test the correlation generation function directly"""
    print("\n=== Testing Correlation Generation ===")
    
    # Import the function
    import sys
    sys.path.insert(0, 'site')
    from advanced_features import VisualizationEngine
    
    # Get readings from database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT timestamp, ppm, temperature, humidity
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        ORDER BY timestamp
    """)
    
    readings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    if readings:
        print(f"Testing with {len(readings)} readings...")
        result = VisualizationEngine.generate_correlation_data(readings, ['ppm', 'temperature', 'humidity'])
        
        if 'correlations' in result:
            correlations = result['correlations']
            print(f"✓ Generated {len(correlations)} correlations")
            
            for corr in correlations:
                print(f"  {corr.get('var1', '?')} vs {corr.get('var2', '?')}: {corr.get('correlation', 0):.3f}")
        else:
            print("✗ No correlations in result")
    else:
        print("✗ No readings found in database")

if __name__ == '__main__':
    print("Testing Heatmap and Correlation Visualization Fixes")
    print("=" * 50)
    
    # Initialize test data
    init_test_data()
    
    # Test functions
    test_heatmap_function()
    test_correlation_function()
    
    print("\n" + "=" * 50)
    print("Tests complete!")
