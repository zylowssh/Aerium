"""
AI Recommendations Engine
Generate context-aware recommendations based on CO₂ patterns and building characteristics
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from database import get_db


class AIRecommender:
    """Generate smart recommendations for CO₂ optimization"""
    
    # Optimal CO₂ levels by building type (in ppm)
    OPTIMAL_LEVELS = {
        'office': {'min': 400, 'max': 600, 'ideal': 500},
        'school': {'min': 400, 'max': 700, 'ideal': 550},
        'hospital': {'min': 400, 'max': 500, 'ideal': 450},
        'warehouse': {'min': 500, 'max': 1000, 'ideal': 700},
        'retail': {'min': 400, 'max': 800, 'ideal': 600},
        'residential': {'min': 400, 'max': 900, 'ideal': 650},
        'gym': {'min': 400, 'max': 800, 'ideal': 600},
        'restaurant': {'min': 400, 'max': 700, 'ideal': 550},
        'default': {'min': 400, 'max': 800, 'ideal': 600}
    }
    
    def __init__(self):
        self.db = get_db()
    
    def get_recommendations(self, sensor_id: int, building_type: str = 'office', 
                           occupancy_count: int = 10) -> List[Dict]:
        """
        Generate AI recommendations for CO₂ management
        
        Args:
            sensor_id: Sensor ID
            building_type: Type of building (office, school, hospital, etc)
            occupancy_count: Number of people in space
        
        Returns:
            List of recommendations with priority levels
        """
        recommendations = []
        
        try:
            # Get current data
            cursor = self.db.cursor()
            current_avg = self._get_current_average(sensor_id)
            peak_hours = self._get_peak_hours(sensor_id)
            trend = self._analyze_trend(sensor_id)
            
            optimal = self.OPTIMAL_LEVELS.get(building_type.lower(), self.OPTIMAL_LEVELS['default'])
            
            # Recommendation 1: Current level management
            if current_avg and current_avg > optimal['max']:
                severity = self._calculate_recommendation_severity(
                    current_avg, optimal['max'], occupancy_count
                )
                recommendations.append({
                    'id': 'co2_exceeds_optimal',
                    'title': 'Improve Ventilation',
                    'description': f"Current CO₂ is {current_avg:.0f} ppm, exceeding optimal {optimal['ideal']} ppm.",
                    'action': 'Increase ventilation rate by 20-30%',
                    'priority': severity,
                    'impact': 'High',
                    'estimated_time': '5-15 minutes',
                    'confidence': 0.95,
                    'tags': ['ventilation', 'air-quality']
                })
            
            # Recommendation 2: Peak hours management
            if peak_hours:
                peak_hour = peak_hours[0]['hour']
                peak_ppm = peak_hours[0]['ppm']
                
                if peak_ppm > optimal['max']:
                    recommendations.append({
                        'id': 'peak_hour_high',
                        'title': 'Schedule Pre-Ventilation',
                        'description': f"CO₂ peaks at {peak_hour}:00 ({peak_ppm:.0f} ppm). Pre-ventilate 30 minutes before.",
                        'action': f'Run ventilation system 30 min before {peak_hour}:00',
                        'priority': 'high' if peak_ppm > optimal['max'] * 1.2 else 'medium',
                        'impact': 'Medium',
                        'estimated_time': 'Ongoing',
                        'confidence': 0.87,
                        'tags': ['scheduling', 'automation']
                    })
            
            # Recommendation 3: Occupancy-based adjustment
            if current_avg and occupancy_count:
                co2_per_person = current_avg / max(occupancy_count, 1)
                
                if co2_per_person > 50:  # More than 50 ppm per person
                    recommendations.append({
                        'id': 'low_air_per_person',
                        'title': 'Increase Fresh Air Supply',
                        'description': f"At {occupancy_count} people, fresh air is {co2_per_person:.1f} ppm/person. Target: <40 ppm/person.",
                        'action': 'Increase HVAC fresh air intake (CFM)',
                        'priority': 'high' if co2_per_person > 70 else 'medium',
                        'impact': 'High',
                        'estimated_time': '10-20 minutes',
                        'confidence': 0.90,
                        'tags': ['occupancy', 'air-flow']
                    })
            
            # Recommendation 4: Trend-based prediction
            if trend and trend['trend'] == 'increasing':
                recommendations.append({
                    'id': 'rising_trend',
                    'title': 'Address Rising CO₂ Trend',
                    'description': f"CO₂ trending upward ({trend['rate']:.1f} ppm/day). Proactive action needed.",
                    'action': 'Increase ventilation or reduce occupancy',
                    'priority': 'medium',
                    'impact': 'Medium',
                    'estimated_time': 'Varies',
                    'confidence': 0.82,
                    'tags': ['trend', 'preventive']
                })
            
            # Recommendation 5: Building-type specific
            if building_type.lower() == 'school':
                recommendations.append({
                    'id': 'school_air_breaks',
                    'title': 'Implement Air Breaks',
                    'description': 'Open windows for 3-5 minutes between classes.',
                    'action': 'Schedule 5-min windows opening between classes',
                    'priority': 'high',
                    'impact': 'Medium',
                    'estimated_time': 'One-time setup',
                    'confidence': 0.93,
                    'tags': ['school', 'schedule']
                })
            
            elif building_type.lower() == 'office':
                recommendations.append({
                    'id': 'office_break_ventilation',
                    'title': 'Ventilate During Breaks',
                    'description': 'Open windows or increase ventilation during lunch breaks.',
                    'action': 'Boost ventilation 11:30-13:30 and 15:00-15:30',
                    'priority': 'medium',
                    'impact': 'Medium',
                    'estimated_time': 'Ongoing',
                    'confidence': 0.88,
                    'tags': ['office', 'break-time']
                })
            
            # Recommendation 6: Smart automation
            if current_avg and current_avg > optimal['max']:
                recommendations.append({
                    'id': 'smart_automation',
                    'title': 'Enable Demand-Controlled Ventilation',
                    'description': 'Automatically adjust ventilation based on CO₂ levels.',
                    'action': 'Install CO₂-controlled thermostat or HVAC controller',
                    'priority': 'low',
                    'impact': 'Very High',
                    'estimated_time': 'Setup time varies',
                    'confidence': 0.89,
                    'tags': ['automation', 'hvac', 'long-term']
                })
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
        
        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 99))
        
        return recommendations
    
    def _get_current_average(self, sensor_id: int) -> Optional[float]:
        """Get current 1-hour average"""
        try:
            cursor = self.db.cursor()
            one_hour_ago = datetime.now() - timedelta(hours=1)
            
            cursor.execute('''
                SELECT AVG(ppm) FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
            ''', (sensor_id, one_hour_ago))
            
            result = cursor.fetchone()
            return result[0] if result[0] else None
        except:
            return None
    
    def _get_peak_hours(self, sensor_id: int, days: int = 7) -> List[Dict]:
        """Get peak CO₂ hours"""
        try:
            cursor = self.db.cursor()
            start_date = datetime.now() - timedelta(days=days)
            
            cursor.execute('''
                SELECT strftime('%H', timestamp) as hour, AVG(ppm) as ppm
                FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                GROUP BY hour
                ORDER BY ppm DESC
                LIMIT 3
            ''', (sensor_id, start_date))
            
            peaks = []
            for row in cursor.fetchall():
                peaks.append({
                    'hour': int(row[0]),
                    'ppm': row[1]
                })
            return peaks
        except:
            return []
    
    def _analyze_trend(self, sensor_id: int, days: int = 7) -> Optional[Dict]:
        """Analyze CO₂ trend"""
        try:
            cursor = self.db.cursor()
            start_date = datetime.now() - timedelta(days=days)
            
            cursor.execute('''
                SELECT DATE(timestamp) as date, AVG(ppm) as avg_ppm
                FROM sensor_readings
                WHERE sensor_id = ? AND timestamp > ?
                GROUP BY DATE(timestamp)
                ORDER BY date
            ''', (sensor_id, start_date))
            
            data = cursor.fetchall()
            
            if len(data) < 2:
                return None
            
            values = [row[1] for row in data]
            rate = (values[-1] - values[0]) / len(values)
            
            trend = 'stable'
            if rate > 5:
                trend = 'increasing'
            elif rate < -5:
                trend = 'decreasing'
            
            return {
                'trend': trend,
                'rate': rate,
                'current': values[-1],
                'baseline': values[0]
            }
        except:
            return None
    
    def _calculate_recommendation_severity(self, current: float, optimal_max: float, 
                                         occupancy: int) -> str:
        """Calculate recommendation severity"""
        excess = current - optimal_max
        excess_pct = excess / optimal_max * 100
        
        # Factor in occupancy
        severity_score = excess_pct + (occupancy / 20)
        
        if severity_score > 40:
            return 'critical'
        elif severity_score > 20:
            return 'high'
        elif severity_score > 10:
            return 'medium'
        return 'low'
    
    def track_recommendation_effectiveness(self, sensor_id: int, recommendation_id: str,
                                          action_taken: str, 
                                          co2_before: float, co2_after: float) -> Dict:
        """
        Track if a recommendation worked
        
        Args:
            sensor_id: Sensor ID
            recommendation_id: ID of recommendation
            action_taken: Description of action taken
            co2_before: CO₂ level before action
            co2_after: CO₂ level after action
        
        Returns:
            Effectiveness analysis
        """
        improvement = co2_before - co2_after
        improvement_pct = (improvement / co2_before) * 100 if co2_before > 0 else 0
        
        return {
            'recommendation_id': recommendation_id,
            'action': action_taken,
            'improvement_ppm': improvement,
            'improvement_percent': improvement_pct,
            'effectiveness': 'excellent' if improvement_pct > 30 else 'good' if improvement_pct > 15 else 'fair',
            'timestamp': datetime.now().isoformat()
        }
    
    def get_recommendation_history(self, sensor_id: int, days: int = 30) -> List[Dict]:
        """Get history of recommendations and their outcomes"""
        # This would typically query a stored recommendations table
        # For now, returning structure for future implementation
        return [
            {
                'date': (datetime.now() - timedelta(days=i)).isoformat(),
                'recommendation': 'Improve Ventilation',
                'status': 'applied',
                'effectiveness': 'good'
            }
            for i in range(min(days, 10))
        ]
