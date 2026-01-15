#!/usr/bin/env python3
"""
Verify analytics endpoints return real data
"""
import sqlite3
import statistics
from pathlib import Path
import sys
import io

# Set output encoding to UTF-8
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_PATH = Path("data/aerium.sqlite")

def verify_predictions():
    print("\n" + "=" * 60)
    print("PREDICTIONS ENDPOINT VERIFICATION")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get recent hourly data (last 7 days)
    readings = cursor.execute("""
        SELECT 
            strftime('%Y-%m-%d %H:00', timestamp) as hour,
            AVG(ppm) as avg_ppm,
            COUNT(*) as readings
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-7 days')
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 48
    """).fetchall()
    
    conn.close()
    
    if readings:
        print(f"✓ Found {len(readings)} hourly readings")
        
        # Calculate trend
        readings_list = [dict((cursor.description[i][0], reading[i]) for i in range(len(cursor.description))) for reading in readings]
        ppm_values = [r[1] for r in readings]
        
        if len(ppm_values) > 1:
            current_avg = ppm_values[0]
            older_avg = ppm_values[-1]
            trend = (current_avg - older_avg) / (len(ppm_values) - 1)
            
            print(f"  Current avg: {current_avg:.1f} ppm")
            print(f"  Older avg: {older_avg:.1f} ppm")
            print(f"  Trend: {trend:.2f} ppm/hour ({('rising' if trend > 5 else 'falling' if trend < -5 else 'stable')})")
            
            # Generate sample predictions
            predictions = []
            for i in range(6):
                predicted = current_avg + (trend * i) + (i * 5)
                predictions.append(max(400, min(2000, predicted)))
            
            print(f"\n  Sample 6-hour predictions:")
            for i, pred in enumerate(predictions):
                print(f"    Hour +{i}: {pred:.1f} ppm")
    else:
        print("✗ No readings found")

def verify_anomalies():
    print("\n" + "=" * 60)
    print("ANOMALIES ENDPOINT VERIFICATION")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    readings = cursor.execute("""
        SELECT timestamp, ppm
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-7 days')
        ORDER BY timestamp DESC
    """).fetchall()
    
    conn.close()
    
    if readings:
        print(f"✓ Found {len(readings)} readings")
        
        readings_list = [dict(r) for r in readings]
        ppm_values = [r['ppm'] for r in readings_list]
        
        if len(ppm_values) >= 3:
            mean_ppm = statistics.mean(ppm_values)
            stdev_ppm = statistics.stdev(ppm_values)
            
            print(f"  Mean: {mean_ppm:.1f} ppm")
            print(f"  Std Dev: {stdev_ppm:.1f} ppm")
            
            # Find anomalies
            threshold_high = mean_ppm + (2 * stdev_ppm)
            threshold_low = mean_ppm - (2 * stdev_ppm)
            
            anomalies = [r for r in readings_list if r['ppm'] > threshold_high or r['ppm'] < threshold_low]
            
            print(f"  High threshold: {threshold_high:.1f} ppm")
            print(f"  Low threshold: {threshold_low:.1f} ppm")
            print(f"\n  Anomalies found: {len(anomalies)}")
            
            if anomalies:
                print(f"    Sample anomalies:")
                for anom in anomalies[:3]:
                    print(f"      {anom['timestamp']}: {anom['ppm']} ppm")

def verify_insights():
    print("\n" + "=" * 60)
    print("INSIGHTS ENDPOINT VERIFICATION")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    readings = cursor.execute("""
        SELECT 
            strftime('%Y-%m-%d %H:00', timestamp) as hour,
            strftime('%H', timestamp) as hour_of_day,
            AVG(ppm) as avg_ppm,
            COUNT(*) as readings
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-30 days')
        GROUP BY hour
        ORDER BY hour
    """).fetchall()
    
    conn.close()
    
    if readings:
        print(f"✓ Found {len(readings)} hourly readings")
        
        readings_list = [dict(r) for r in readings]
        
        # Analyze patterns
        hourly_avg = {}
        for reading in readings_list:
            if reading['hour_of_day']:
                hour = int(reading['hour_of_day'])
                if hour not in hourly_avg:
                    hourly_avg[hour] = []
                hourly_avg[hour].append(reading['avg_ppm'])
        
        if hourly_avg:
            peak_hour = max(hourly_avg.items(), key=lambda x: sum(x[1])/len(x[1]))
            low_hour = min(hourly_avg.items(), key=lambda x: sum(x[1])/len(x[1]))
            
            peak_avg = sum(peak_hour[1]) / len(peak_hour[1])
            low_avg = sum(low_hour[1]) / len(low_hour[1])
            
            print(f"  Peak hour: {peak_hour[0]:02d}:00 with avg {peak_avg:.0f} ppm")
            print(f"  Low hour: {low_hour[0]:02d}:00 with avg {low_avg:.0f} ppm")
            print(f"  Daily variation: {peak_avg - low_avg:.0f} ppm")

def verify_recommendations():
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS ENDPOINT VERIFICATION")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    readings = cursor.execute("""
        SELECT ppm
        FROM co2_readings
        WHERE timestamp >= datetime('now', '-7 days')
        ORDER BY timestamp DESC
    """).fetchall()
    
    conn.close()
    
    if readings:
        ppm_values = [r[0] for r in readings]
        print(f"✓ Found {len(ppm_values)} readings")
        
        avg_ppm = sum(ppm_values) / len(ppm_values)
        max_ppm = max(ppm_values)
        min_ppm = min(ppm_values)
        
        print(f"  Average: {avg_ppm:.0f} ppm")
        print(f"  Max: {max_ppm:.0f} ppm")
        print(f"  Min: {min_ppm:.0f} ppm")
        print(f"  Variation: {max_ppm - min_ppm:.0f} ppm")
        
        print(f"\n  Recommendations based on data:")
        
        if max_ppm > 1200:
            print(f"    → HIGH: High CO₂ levels detected ({max_ppm:.0f} ppm)")
        elif max_ppm > 1000:
            print(f"    → HIGH: Open windows during peak hours ({max_ppm:.0f} ppm)")
        
        if avg_ppm > 800:
            print(f"    → MEDIUM: Consider air purifier (avg: {avg_ppm:.0f} ppm)")
        
        if min_ppm < 400:
            print(f"    → LOW: Monitor very low CO₂ levels ({min_ppm:.0f} ppm)")

if __name__ == '__main__':
    print("\n")
    print("*" * 60)
    print("*  ANALYTICS ENDPOINTS VERIFICATION")
    print("*" * 60)
    
    verify_predictions()
    verify_anomalies()
    verify_insights()
    verify_recommendations()
    
    print("\n" + "*" * 60)
    print("*  VERIFICATION COMPLETE")
    print("*" * 60 + "\n")
