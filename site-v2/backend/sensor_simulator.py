"""
On-demand sensor simulation module
Generates realistic sensor data when requested, rather than continuously in background
"""

from datetime import datetime, timedelta
import random

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


def generate_current_simulated_reading(sensor_name):
    """Generate a single simulated reading for the current hour"""
    profile = get_sensor_profile(sensor_name)
    current_time = datetime.now()
    hour = current_time.hour
    
    co2 = generate_co2_pattern(
        hour, 
        profile['base_co2'], 
        profile['occupancy_factor'],
        sensor_name
    )
    temp = generate_temperature(profile['base_temp'], hour, sensor_name)
    humidity = generate_humidity(profile['base_humidity'], hour, sensor_name)
    
    return {
        'co2': co2,
        'temperature': temp,
        'humidity': humidity
    }


def generate_historical_simulated_readings(sensor_name, hours=24):
    """Generate historical simulated readings for the past N hours"""
    profile = get_sensor_profile(sensor_name)
    readings = []
    
    now = datetime.utcnow()
    
    # Generate readings for the last N hours (every 30 minutes = 2 readings per hour)
    num_readings = hours * 2
    
    for i in range(num_readings):
        time_offset = timedelta(minutes=30 * i)
        reading_time = now - timedelta(hours=hours) + time_offset
        hour = reading_time.hour
        
        co2 = generate_co2_pattern(
            hour,
            profile['base_co2'],
            profile['occupancy_factor'],
            sensor_name
        )
        temp = generate_temperature(profile['base_temp'], hour, sensor_name)
        humidity = generate_humidity(profile['base_humidity'], hour, sensor_name)
        
        readings.append({
            'co2': co2,
            'temperature': temp,
            'humidity': humidity,
            'recorded_at': reading_time.isoformat()
        })
    
    return readings
