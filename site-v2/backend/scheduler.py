from apscheduler.schedulers.background import BackgroundScheduler
from database import db, Sensor, SensorReading, Alert
from datetime import datetime
import random

scheduler = BackgroundScheduler()

# Sensor profiles with realistic base values
SENSOR_PROFILES = {
    'Bureau Principal': {'base_co2': 650, 'base_temp': 22.5, 'base_humidity': 45, 'occupancy_factor': 0.8},
    'Salle de Réunion Alpha': {'base_co2': 800, 'base_temp': 23.2, 'base_humidity': 48, 'occupancy_factor': 1.5},
    'Open Space Dev': {'base_co2': 750, 'base_temp': 21.8, 'base_humidity': 52, 'occupancy_factor': 1.2},
    'Cafétéria': {'base_co2': 600, 'base_temp': 23.5, 'base_humidity': 42, 'occupancy_factor': 1.0},
    'Salle Serveur': {'base_co2': 450, 'base_temp': 19.0, 'base_humidity': 35, 'occupancy_factor': 0.1},
}

def get_sensor_profile(sensor_name):
    """Get sensor profile or return default"""
    return SENSOR_PROFILES.get(sensor_name, {
        'base_co2': 700, 
        'base_temp': 22.0, 
        'base_humidity': 50, 
        'occupancy_factor': 1.0
    })

def generate_co2_pattern(hour, base_value, occupancy_factor=1.0, sensor_name=''):
    """Generate realistic CO2 patterns based on time of day and space type"""
    # Office hours pattern (more occupancy during work hours)
    if 'Salle de Réunion' in sensor_name:
        # Meeting rooms: spikes during meeting times
        meeting_times = {
            9: 300, 10: 400, 11: 350, 14: 400, 15: 350, 16: 300
        }
        pattern_offset = meeting_times.get(hour, 0)
    elif 'Cafétéria' in sensor_name:
        # Cafeteria: peaks during lunch and break times
        meal_times = {
            8: 150, 9: 100, 12: 350, 13: 300, 17: 200, 18: 150
        }
        pattern_offset = meal_times.get(hour, -100)
    elif 'Serveur' in sensor_name:
        # Server room: consistently low with minimal variation
        pattern_offset = random.randint(-20, 20)
    else:
        # Office/default: gradual increase during work hours
        patterns = {
            0: -200, 1: -220, 2: -230, 3: -240, 4: -230, 5: -200,
            6: -150, 7: -50, 8: 100, 9: 200, 10: 250, 11: 280,
            12: 250, 13: 280, 14: 300, 15: 280, 16: 250, 17: 150,
            18: 50, 19: -50, 20: -100, 21: -150, 22: -180, 23: -190
        }
        pattern_offset = patterns.get(hour, 0)
    
    # Apply occupancy factor
    pattern_offset = int(pattern_offset * occupancy_factor)
    
    # Add random variation (±50 ppm)
    variation = random.randint(-50, 50)
    
    # Calculate final value
    final_value = base_value + pattern_offset + variation
    
    # Clamp to realistic ranges
    return max(400, min(1500, final_value))


def generate_temperature(base_temp, hour, sensor_name=''):
    """Generate realistic temperature variations"""
    if 'Serveur' in sensor_name:
        # Server room: cooler and more stable
        variation = (random.random() - 0.5) * 0.3
    else:
        # Normal rooms: slight variation throughout day
        daily_pattern = {
            0: -0.5, 1: -0.6, 2: -0.7, 3: -0.7, 4: -0.6, 5: -0.5,
            6: -0.3, 7: 0.0, 8: 0.3, 9: 0.5, 10: 0.7, 11: 0.8,
            12: 0.8, 13: 0.9, 14: 1.0, 15: 0.9, 16: 0.7, 17: 0.5,
            18: 0.3, 19: 0.0, 20: -0.2, 21: -0.3, 22: -0.4, 23: -0.5
        }
        daily_offset = daily_pattern.get(hour, 0)
        variation = daily_offset + (random.random() - 0.5) * 0.4
    
    return round((base_temp + variation) * 10) / 10


def generate_humidity(base_humidity, hour, sensor_name=''):
    """Generate realistic humidity variations"""
    if 'Serveur' in sensor_name:
        # Server room: lower and more controlled humidity
        variation = (random.random() - 0.5) * 2
    else:
        # Normal variation (±5%)
        variation = (random.random() - 0.5) * 10
    
    return max(30, min(70, round(base_humidity + variation)))


def simulate_sensor_readings(app, socketio):
    """
    Generate and emit sensor readings to connected WebSocket clients.
    Runs periodically to provide real-time updates for simulated sensors.
    """
    with app.app_context():
        # Get all simulated sensors (sensor_type='simulation')
        sensors = Sensor.query.filter_by(sensor_type='simulation').all()
        
        if not sensors:
            return
        
        # Import here to avoid circular imports
        from sensor_simulator import generate_current_simulated_reading
        
        for sensor in sensors:
            try:
                # Generate fresh simulated data
                simulated_data = generate_current_simulated_reading(sensor.name)
                
                # Prepare WebSocket payload - match frontend's expected format
                reading_data = {
                    'sensor_id': sensor.id,
                    'sensor_name': sensor.name,
                    'reading': {
                        'co2': simulated_data['co2'],
                        'temperature': simulated_data['temperature'],
                        'humidity': simulated_data['humidity'],
                        'recorded_at': datetime.utcnow().isoformat()
                    }
                }
                
                # Emit to all connected clients (broadcast is default behavior)
                socketio.emit('sensor_update', reading_data)
                
            except Exception as e:
                print(f"Error generating reading for sensor {sensor.name}: {e}")


def init_scheduler(app, socketio):
    """Initialize the scheduler for periodic tasks"""
    # Schedule real-time sensor data emission every 5 seconds
    scheduler.add_job(
        func=simulate_sensor_readings,
        trigger='interval',
        seconds=5,
        args=[app, socketio],
        id='sensor_simulation',
        name='Real-time sensor simulation',
        replace_existing=True
    )
    
    scheduler.start()
    print("✓ Scheduler initialized - Real-time sensor updates active (every 5 seconds)")
    print("✓ WebSocket emissions enabled for simulated sensors")

