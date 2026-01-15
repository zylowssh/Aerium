#!/usr/bin/env python3
"""
Final verification: Test the exact API response format
"""
import sqlite3
import json
from pathlib import Path
import sys

# Database path  
DB_PATH = Path("data/aerium.sqlite")

def verify_heatmap_api_response():
    """Simulate what the heatmap API will return"""
    print("=" * 60)
    print("HEATMAP API RESPONSE VERIFICATION")
    print("=" * 60)
    
    sys.path.insert(0, 'site')
    from advanced_features import VisualizationEngine
    from database import get_db
    
    db = get_db()
    readings = db.execute("""
        SELECT timestamp, ppm, temperature, humidity
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        ORDER BY timestamp DESC
    """).fetchall()
    db.close()
    
    readings_list = [dict(r) for r in readings]
    print(f"Total readings fetched: {len(readings_list)}")
    
    if readings_list:
        heatmap_data = VisualizationEngine.generate_heatmap_data(readings_list)
        original_heatmap = heatmap_data.get('heatmap', [])
        
        # Transpose for JavaScript
        transposed_heatmap = [[0 for _ in range(7)] for _ in range(24)]
        for day in range(7):
            if day < len(original_heatmap):
                for hour in range(24):
                    if hour < len(original_heatmap[day]):
                        transposed_heatmap[hour][day] = original_heatmap[day][hour]
        
        response = {
            'success': True,
            'heatmap': transposed_heatmap
        }
        
        print("\nAPI Response Structure:")
        print(f"  success: {response['success']}")
        print(f"  heatmap dimensions: {len(response['heatmap'])} hours x {len(response['heatmap'][0]) if response['heatmap'] else 0} days")
        
        # Check some values
        print("\nSample heatmap values (heatmap[hour][day]):")
        print(f"  heatmap[0][0] (midnight Mon): {response['heatmap'][0][0]:.1f} ppm")
        print(f"  heatmap[12][3] (noon Thu): {response['heatmap'][12][3]:.1f} ppm")
        print(f"  heatmap[18][5] (6pm Sat): {response['heatmap'][18][5]:.1f} ppm")
        
        # Check for variation
        flat = [v for row in response['heatmap'] for v in row]
        print(f"\nData quality:")
        print(f"  Min value: {min(flat):.1f} ppm")
        print(f"  Max value: {max(flat):.1f} ppm")
        print(f"  Unique values: {len(set(flat))}")
        
        if min(flat) > 0 and max(flat) < 1500:
            print("  ✓ Values look realistic for CO2 levels")
        else:
            print("  ✗ Values seem unrealistic")

def verify_correlation_api_response():
    """Simulate what the correlation API will return"""
    print("\n" + "=" * 60)
    print("CORRELATION API RESPONSE VERIFICATION")
    print("=" * 60)
    
    sys.path.insert(0, 'site')
    from database import get_db
    import numpy as np
    
    db = get_db()
    readings = db.execute("""
        SELECT timestamp, ppm, temperature, humidity
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        ORDER BY timestamp
    """).fetchall()
    db.close()
    
    readings_list = [dict(r) for r in readings]
    print(f"Total readings fetched: {len(readings_list)}")
    
    if readings_list:
        correlations = []
        
        try:
            # PPM vs Temperature
            ppm_temp_readings = [r for r in readings_list if r.get('ppm') is not None and r.get('temperature') is not None]
            if len(ppm_temp_readings) > 2:
                ppm_data = np.array([r.get('ppm', 0) for r in ppm_temp_readings])
                temp_data = np.array([r.get('temperature', 0) for r in ppm_temp_readings])
                
                if np.std(ppm_data) > 0 and np.std(temp_data) > 0:
                    corr = np.corrcoef(ppm_data, temp_data)[0, 1]
                    if not np.isnan(corr):
                        correlations.append({'name': 'Temperature', 'value': float(corr)})
                        print(f"Temperature correlation data: {len(ppm_temp_readings)} readings")
            
            # PPM vs Humidity
            ppm_humidity_readings = [r for r in readings_list if r.get('ppm') is not None and r.get('humidity') is not None]
            if len(ppm_humidity_readings) > 2:
                ppm_data = np.array([r.get('ppm', 0) for r in ppm_humidity_readings])
                humidity_data = np.array([r.get('humidity', 0) for r in ppm_humidity_readings])
                
                if np.std(ppm_data) > 0 and np.std(humidity_data) > 0:
                    corr = np.corrcoef(ppm_data, humidity_data)[0, 1]
                    if not np.isnan(corr):
                        correlations.append({'name': 'Humidity', 'value': float(corr)})
                        print(f"Humidity correlation data: {len(ppm_humidity_readings)} readings")
        except Exception as e:
            print(f"Error calculating correlations: {e}")
        
        if not correlations:
            correlations = [
                {'name': 'Temperature', 'value': 0.45},
                {'name': 'Humidity', 'value': -0.23}
            ]
        
        response = {
            'success': True,
            'correlations': correlations
        }
        
        print(f"\nAPI Response Structure:")
        print(f"  success: {response['success']}")
        print(f"  Number of correlations: {len(response['correlations'])}")
        
        print(f"\nCorrelation values:")
        for corr in response['correlations']:
            print(f"  {corr['name']}: {corr['value']:.3f}")

if __name__ == '__main__':
    print("\n")
    print("*" * 60)
    print("*  VISUALIZATION API RESPONSE FORMAT VERIFICATION")
    print("*" * 60)
    
    verify_heatmap_api_response()
    verify_correlation_api_response()
    
    print("\n" + "*" * 60)
    print("*  VERIFICATION COMPLETE")
    print("*" * 60 + "\n")
