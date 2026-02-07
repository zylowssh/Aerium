"""
Database seeding script for demonstration accounts
Run this script to populate the database with demo users and sensors
"""
from app import app
from database import db, User, Sensor, SensorReading
import bcrypt
from datetime import datetime, timedelta
import random

def generate_co2_pattern(hour, base_value):
    """Generate realistic CO2 patterns based on time of day"""
    patterns = {
        0: -200, 1: -220, 2: -230, 3: -240, 4: -230, 5: -200,
        6: -150, 7: -50, 8: 50, 9: 150, 10: 200, 11: 250,
        12: 200, 13: 250, 14: 300, 15: 280, 16: 250, 17: 150,
        18: 50, 19: -50, 20: -100, 21: -150, 22: -180, 23: -190
    }
    
    variation = (random.random() - 0.5) * 100
    return max(350, base_value + patterns.get(hour, 0) + variation)


def seed_database():
    """Seed the database with demonstration data"""
    with app.app_context():
        print("🌱 Seeding database with demonstration data...")
        
        # Check if demo users already exist
        existing_demo = User.query.filter_by(email='demo@aerium.app').first()
        if existing_demo:
            print("⚠️  Demo accounts already exist. Skipping seed.")
            return
        
        # Create demo users
        demo_password = bcrypt.hashpw('demo123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        demo_user = User(
            email='demo@aerium.app',
            password_hash=demo_password,
            full_name='Demo User',
            role='user'
        )
        
        admin_user = User(
            email='admin@aerium.app',
            password_hash=admin_password,
            full_name='Admin User',
            role='admin'
        )
        
        db.session.add(demo_user)
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"✅ Created demo user: demo@aerium.app (password: demo123)")
        print(f"✅ Created admin user: admin@aerium.app (password: admin123)")
        
        # Create sensors for demo user
        sensors_data = [
            {
                'name': 'Bureau Principal',
                'location': 'Bâtiment A, 2ᵉ étage',
                'base_co2': 750,
                'base_temp': 22.5,
                'base_humidity': 45
            },
            {
                'name': 'Salle de Réunion Alpha',
                'location': 'Bâtiment A, 3ᵉ étage',
                'base_co2': 850,
                'base_temp': 23.2,
                'base_humidity': 48
            },
            {
                'name': 'Open Space Dev',
                'location': 'Bâtiment B, 1ᵉʳ étage',
                'base_co2': 920,
                'base_temp': 21.8,
                'base_humidity': 52
            },
            {
                'name': 'Cafétéria',
                'location': 'Bâtiment A, RDC',
                'base_co2': 680,
                'base_temp': 23.5,
                'base_humidity': 42
            }
        ]
        
        sensors = []
        for sensor_data in sensors_data:
            sensor = Sensor(
                user_id=demo_user.id,
                name=sensor_data['name'],
                location=sensor_data['location'],
                status='en ligne',
                sensor_type='simulation',
                battery=random.randint(75, 100),
                is_live=True
            )
            db.session.add(sensor)
            sensors.append((sensor, sensor_data))
        
        db.session.commit()
        print(f"✅ Created {len(sensors)} demo sensors")
        
        # Create historical readings (last 24 hours)
        now = datetime.utcnow()
        readings_count = 0
        
        for sensor, sensor_data in sensors:
            # Generate readings for the last 24 hours (every 30 minutes = 48 readings)
            for i in range(48):
                time_offset = timedelta(minutes=30 * i)
                reading_time = now - timedelta(hours=24) + time_offset
                hour = reading_time.hour
                
                # Generate realistic variations
                co2 = round(generate_co2_pattern(hour, sensor_data['base_co2']))
                temp = round((sensor_data['base_temp'] + (random.random() - 0.5) * 2) * 10) / 10
                humidity = round(sensor_data['base_humidity'] + (random.random() - 0.5) * 10)
                
                reading = SensorReading(
                    sensor_id=sensor.id,
                    co2=co2,
                    temperature=temp,
                    humidity=max(20, min(80, humidity)),
                    recorded_at=reading_time
                )
                db.session.add(reading)
                readings_count += 1
        
        # Update sensor statuses based on latest readings
        for sensor, _ in sensors:
            latest_reading = SensorReading.query.filter_by(
                sensor_id=sensor.id
            ).order_by(SensorReading.recorded_at.desc()).first()
            
            if latest_reading:
                if latest_reading.co2 > 1200:
                    sensor.status = 'avertissement'
                elif latest_reading.co2 > 1000:
                    sensor.status = 'avertissement'
                else:
                    sensor.status = 'en ligne'
        
        db.session.commit()
        print(f"✅ Created {readings_count} historical sensor readings")
        
        # Create admin sensors
        admin_sensor = Sensor(
            user_id=admin_user.id,
            name='Salle Serveur',
            location='Datacenter',
            status='en ligne',
            sensor_type='simulation',
            battery=95,
            is_live=True
        )
        db.session.add(admin_sensor)
        db.session.commit()
        print(f"✅ Created admin sensor")
        
        print("\n🎉 Database seeding completed!")
        print("\n📊 Demo Accounts:")
        print("   Regular User:")
        print("   - Email: demo@aerium.app")
        print("   - Password: demo123")
        print("\n   Admin User:")
        print("   - Email: admin@aerium.app")
        print("   - Password: admin123")
        print("\n🚀 You can now login with these accounts!")


if __name__ == '__main__':
    seed_database()
