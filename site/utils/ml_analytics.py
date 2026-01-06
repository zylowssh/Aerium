"""
Advanced Analytics Module with Machine Learning
Predictive analytics, anomaly detection, trend analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import json
from database import get_db

try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LinearRegression
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class MLAnalytics:
    """Machine learning based analytics"""
    
    def __init__(self):
        self.db = get_db()
        self.sklearn_available = SKLEARN_AVAILABLE
    
    def predict_co2_levels(self, sensor_id: int, hours: int = 24) -> Optional[List[float]]:
        """
        Predict CO₂ levels for next N hours using linear regression
        
        Args:
            sensor_id: Sensor ID
            hours: Number of hours to predict
        
        Returns:
            List of predicted CO₂ values or None
        """
        if not self.sklearn_available:
            return None
        
        try:
            # Get historical data (last 7 days)
            cursor = self.db.cursor()
            seven_days_ago = datetime.now() - timedelta(days=7)
            
            cursor.execute('''
                SELECT timestamp, ppm FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                ORDER BY timestamp
            ''', (sensor_id, seven_days_ago))
            
            readings = cursor.fetchall()
            
            if len(readings) < 10:
                return None  # Not enough data
            
            # Prepare data
            X = np.array([(datetime.fromisoformat(r[0]) - datetime.now().replace(hour=0, minute=0, second=0)).total_seconds() 
                         for r in readings]).reshape(-1, 1)
            y = np.array([r[1] for r in readings])
            
            # Train model
            model = LinearRegression()
            model.fit(X, y)
            
            # Make predictions
            future_times = np.array([i * 3600 for i in range(1, hours + 1)]).reshape(-1, 1)
            current_time = (datetime.now() - datetime.now().replace(hour=0, minute=0, second=0)).total_seconds()
            future_times = future_times + current_time
            
            predictions = model.predict(future_times)
            
            # Ensure realistic values (between 300-2000 ppm)
            predictions = np.clip(predictions, 300, 2000)
            
            return predictions.tolist()
        
        except Exception as e:
            print(f"Error predicting CO₂ levels: {e}")
            return None
    
    def detect_anomalies(self, sensor_id: int, threshold: float = 0.95) -> Optional[List[Dict]]:
        """
        Detect anomalies in CO₂ readings using Isolation Forest
        
        Args:
            sensor_id: Sensor ID
            threshold: Anomaly threshold (0-1)
        
        Returns:
            List of detected anomalies or None
        """
        if not self.sklearn_available:
            return None
        
        try:
            # Get last 30 days of data
            cursor = self.db.cursor()
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            cursor.execute('''
                SELECT id, timestamp, ppm FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                ORDER BY timestamp
            ''', (sensor_id, thirty_days_ago))
            
            readings = cursor.fetchall()
            
            if len(readings) < 20:
                return None
            
            # Prepare features
            data = []
            for r in readings:
                hour = datetime.fromisoformat(r[1]).hour
                data.append([r[2], hour])  # PPM and hour of day
            
            X = np.array(data)
            
            # Detect anomalies
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            predictions = iso_forest.fit_predict(X_scaled)
            
            # Extract anomalies
            anomalies = []
            for i, (reading, pred) in enumerate(zip(readings, predictions)):
                if pred == -1:  # Anomaly detected
                    anomalies.append({
                        'id': reading[0],
                        'timestamp': reading[1],
                        'ppm': reading[2],
                        'severity': self._calculate_anomaly_severity(reading[2])
                    })
            
            return anomalies
        
        except Exception as e:
            print(f"Error detecting anomalies: {e}")
            return None
    
    def _calculate_anomaly_severity(self, ppm: float) -> str:
        """Calculate severity of anomaly based on PPM value"""
        if ppm < 400 or ppm > 1800:
            return 'high'
        elif ppm < 500 or ppm > 1500:
            return 'medium'
        return 'low'
    
    def analyze_trends(self, sensor_id: int, days: int = 30) -> Dict:
        """
        Analyze trends in CO₂ levels
        
        Args:
            sensor_id: Sensor ID
            days: Number of days to analyze
        
        Returns:
            Dictionary with trend analysis
        """
        try:
            cursor = self.db.cursor()
            start_date = datetime.now() - timedelta(days=days)
            
            cursor.execute('''
                SELECT DATE(timestamp) as date, AVG(ppm) as avg_ppm, 
                       MIN(ppm) as min_ppm, MAX(ppm) as max_ppm, COUNT(*) as readings
                FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                GROUP BY DATE(timestamp)
                ORDER BY date
            ''', (sensor_id, start_date))
            
            daily_data = cursor.fetchall()
            
            if len(daily_data) < 2:
                return {}
            
            # Calculate trend
            values = [row[1] for row in daily_data]  # avg_ppm
            trend = 'stable'
            
            if len(values) >= 2:
                change = values[-1] - values[0]
                if change > values[0] * 0.1:
                    trend = 'increasing'
                elif change < -values[0] * 0.1:
                    trend = 'decreasing'
            
            return {
                'trend': trend,
                'average': np.mean(values),
                'min': min(values),
                'max': max(values),
                'std_dev': np.std(values),
                'days_analyzed': len(daily_data),
                'daily_data': [
                    {
                        'date': row[0],
                        'avg': row[1],
                        'min': row[2],
                        'max': row[3]
                    }
                    for row in daily_data
                ]
            }
        except Exception as e:
            print(f"Error analyzing trends: {e}")
            return {}
    
    def get_insights(self, sensor_id: int) -> List[str]:
        """
        Generate AI-powered insights from data
        
        Returns:
            List of insight strings
        """
        insights = []
        
        try:
            cursor = self.db.cursor()
            today = datetime.now().replace(hour=0, minute=0, second=0)
            
            # Get today's average
            cursor.execute('''
                SELECT AVG(ppm) FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
            ''', (sensor_id, today))
            
            today_avg = cursor.fetchone()[0]
            
            # Get yesterday's average
            yesterday = today - timedelta(days=1)
            cursor.execute('''
                SELECT AVG(ppm) FROM sensor_readings
                WHERE sensor_id = ? AND timestamp BETWEEN ? AND ?
            ''', (sensor_id, yesterday, today))
            
            yesterday_avg = cursor.fetchone()[0]
            
            if today_avg and yesterday_avg:
                if today_avg > yesterday_avg * 1.15:
                    insights.append(f"CO₂ levels increased by {((today_avg - yesterday_avg) / yesterday_avg * 100):.1f}% today. Consider improving ventilation.")
                elif today_avg < yesterday_avg * 0.85:
                    insights.append("CO₂ levels decreased significantly. Good ventilation detected.")
                else:
                    insights.append("CO₂ levels are stable compared to yesterday.")
            
            # Check peak hours
            cursor.execute('''
                SELECT strftime('%H', timestamp) as hour, AVG(ppm) as avg_ppm
                FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                GROUP BY hour
                ORDER BY avg_ppm DESC
                LIMIT 1
            ''', (sensor_id, today))
            
            peak = cursor.fetchone()
            if peak:
                insights.append(f"Peak CO₂ levels occur around {peak[0]}:00 ({peak[1]:.0f} ppm).")
            
        except Exception as e:
            print(f"Error generating insights: {e}")
        
        return insights
    
    def get_correlation_analysis(self, sensor_id: int, days: int = 30) -> Dict:
        """
        Analyze correlations between CO₂ and time of day
        
        Returns:
            Correlation data
        """
        try:
            cursor = self.db.cursor()
            start_date = datetime.now() - timedelta(days=days)
            
            cursor.execute('''
                SELECT strftime('%H', timestamp) as hour, AVG(ppm) as avg_ppm, COUNT(*) as count
                FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                GROUP BY hour
                ORDER BY hour
            ''', (sensor_id, start_date))
            
            hourly_data = cursor.fetchall()
            
            return {
                'hours': [int(row[0]) for row in hourly_data],
                'averages': [row[1] for row in hourly_data],
                'counts': [row[2] for row in hourly_data]
            }
        except Exception as e:
            print(f"Error getting correlation: {e}")
            return {}
