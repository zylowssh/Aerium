#!/usr/bin/env python3
"""
Quick test of correlation calculation
"""
import sqlite3
import numpy as np
from pathlib import Path

DB_PATH = Path("data/aerium.sqlite")

def test_correlation_direct():
    print("Testing correlation calculation with real data...")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT timestamp, ppm, temperature, humidity
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        AND temperature IS NOT NULL
        ORDER BY timestamp
    """)
    
    readings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    print(f"Found {len(readings)} readings with temperature data")
    
    if len(readings) > 2:
        ppm_data = np.array([r.get('ppm', 0) for r in readings])
        temp_data = np.array([r.get('temperature', 0) for r in readings])
        
        print(f"PPM data: {len(ppm_data)} values, std: {np.std(ppm_data):.2f}")
        print(f"Temp data: {len(temp_data)} values, std: {np.std(temp_data):.2f}")
        
        if np.std(ppm_data) > 0 and np.std(temp_data) > 0:
            corr = np.corrcoef(ppm_data, temp_data)[0, 1]
            print(f"Correlation (PPM vs Temp): {corr:.3f}")
            print(f"Is NaN: {np.isnan(corr)}")
        else:
            print("No variation in data")

if __name__ == '__main__':
    test_correlation_direct()
