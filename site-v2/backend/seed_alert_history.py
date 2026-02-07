"""
Seed alert history with test data
"""
from app import app
from database import db, User, Sensor, AlertHistory
from datetime import datetime, timedelta
import random

def seed_alert_history():
    """Create test alert history data"""
    with app.app_context():
        # Get demo user
        demo_user = User.query.filter_by(email='demo@aerium.app').first()
        if not demo_user:
            print("❌ Demo user not found. Please run seed_database.py first.")
            return
        
        # Get demo user's sensors
        sensors = Sensor.query.filter_by(user_id=demo_user.id).all()
        if not sensors:
            print("❌ No sensors found for demo user. Please run seed_database.py first.")
            return
        
        print(f"🌱 Creating alert history for {len(sensors)} sensors...")
        
        alert_types = ['info', 'avertissement', 'critique']
        metrics = ['co2', 'temperature', 'humidity']
        statuses = ['triggered', 'acknowledged', 'resolved']
        
        now = datetime.utcnow()
        alert_count = 0
        
        # Create 5-10 alerts per sensor over the last 30 days
        for sensor in sensors:
            num_alerts = random.randint(5, 10)
            
            for _ in range(num_alerts):
                # Random time within last 30 days
                days_ago = random.randint(0, 29)
                hours_ago = random.randint(0, 23)
                created_at = now - timedelta(days=days_ago, hours=hours_ago)
                
                alert_type = random.choice(alert_types)
                metric = random.choice(metrics)
                status = random.choice(statuses)
                
                # Set thresholds and values based on metric
                if metric == 'co2':
                    threshold = random.choice([800, 1000, 1200])
                    value = threshold + random.randint(50, 300)
                elif metric == 'temperature':
                    threshold = 25
                    value = threshold + random.uniform(0.5, 5.0)
                else:  # humidity
                    threshold = 70
                    value = threshold + random.uniform(5, 15)
                
                alert = AlertHistory(
                    sensor_id=sensor.id,
                    user_id=demo_user.id,
                    alert_type=alert_type,
                    metric=metric,
                    metric_value=round(value, 2),
                    threshold_value=threshold,
                    message=f"{metric.capitalize()} a dépassé le seuil de {threshold}",
                    status=status,
                    created_at=created_at,
                    acknowledged_at=created_at + timedelta(minutes=random.randint(5, 60)) if status in ['acknowledged', 'resolved'] else None,
                    resolved_at=created_at + timedelta(minutes=random.randint(60, 240)) if status == 'resolved' else None
                )
                
                db.session.add(alert)
                alert_count += 1
        
        db.session.commit()
        print(f"✅ Created {alert_count} alert history records")
        print(f"\n📊 Alert History Stats:")
        print(f"   Total alerts: {AlertHistory.query.count()}")
        print(f"   Triggered: {AlertHistory.query.filter_by(status='triggered').count()}")
        print(f"   Acknowledged: {AlertHistory.query.filter_by(status='acknowledged').count()}")
        print(f"   Resolved: {AlertHistory.query.filter_by(status='resolved').count()}")


if __name__ == '__main__':
    seed_alert_history()
