# fake_co2.py
"""
Enhanced CO2 sensor simulator with realistic environmental scenarios
Supports multiple simulation modes: normal, occupancy, ventilation, anomaly
"""
import random
from datetime import datetime, timedelta
from typing import Optional
from database import get_db

# ==================== GLOBAL STATE ====================
_current_co2 = 600
_current_temp = 22.0
_current_humidity = 45.0
_trend = 0
_trend_counter = 0
_scenario = "normal"  # normal, office_hours, sleep, ventilation_active, anomaly
_scenario_timer = 0
_scenario_duration = 0
_paused = False

# ==================== SIMULATION SCENARIOS ====================

class SimulationScenario:
    """Base scenario class"""
    def __init__(self):
        self.co2 = 600
        self.temp = 22.0
        self.humidity = 45.0
    
    def step(self):
        """Advance simulation by one step"""
        raise NotImplementedError


class NormalScenario(SimulationScenario):
    """Normal office operation - steady state with slight variations"""
    def __init__(self):
        super().__init__()
        self.co2_trend = random.choice([-1, 0, 1])
        self.trend_counter = 0
    
    def step(self):
        # Change trend every 5-15 readings
        self.trend_counter += 1
        if self.trend_counter > random.randint(5, 15):
            self.co2_trend = random.choice([-1, 0, 1])
            self.trend_counter = 0
        
        # Apply CO2 drift
        if self.co2_trend == 1:
            drift = random.uniform(3, 8)
        elif self.co2_trend == -1:
            drift = random.uniform(-8, -3)
        else:
            drift = random.uniform(-2, 2)
        
        self.co2 += drift
        self.co2 = max(400, min(1200, self.co2))
        
        # Temperature stable around 21-23°C
        self.temp += random.uniform(-0.5, 0.5)
        self.temp = max(19, min(25, self.temp))
        
        # Humidity stable around 40-50%
        self.humidity += random.uniform(-1, 1)
        self.humidity = max(30, min(60, self.humidity))


class OfficeHoursScenario(SimulationScenario):
    """Office hours - people present, CO2 rises throughout day"""
    def __init__(self):
        super().__init__()
        self.co2 = 500  # Morning start low
    
    def step(self):
        # Gradual CO2 increase as people work
        self.co2 += random.uniform(5, 15)
        self.co2 = max(400, min(1600, self.co2))
        
        # Temperature rises slightly with more occupants
        self.temp += random.uniform(0.1, 0.3)
        self.temp = max(19, min(26, self.temp))
        
        # Humidity increases with more people
        self.humidity += random.uniform(0.5, 1.5)
        self.humidity = max(30, min(70, self.humidity))


class SleepScenario(SimulationScenario):
    """Night time - very few people, low CO2"""
    def __init__(self):
        super().__init__()
        self.co2 = 400
    
    def step(self):
        # Very stable, slight variation
        self.co2 += random.uniform(-1, 1)
        self.co2 = max(400, min(500, self.co2))
        
        # Temperature slightly lower
        self.temp += random.uniform(-0.2, 0.1)
        self.temp = max(18, min(23, self.temp))
        
        # Humidity stable
        self.humidity += random.uniform(-0.5, 0.5)
        self.humidity = max(35, min(55, self.humidity))


class VentilationActiveScenario(SimulationScenario):
    """Ventilation running - rapid CO2 decrease"""
    def __init__(self):
        super().__init__()
        self.co2 = 1400  # Start high
    
    def step(self):
        # Rapid CO2 decrease due to ventilation
        self.co2 -= random.uniform(20, 40)
        self.co2 = max(400, self.co2)
        
        # Temperature drops slightly with air exchange
        self.temp -= random.uniform(0.1, 0.3)
        self.temp = max(18, min(25, self.temp))
        
        # Humidity decreases with ventilation
        self.humidity -= random.uniform(1, 2)
        self.humidity = max(30, min(70, self.humidity))


class AnomalyScenario(SimulationScenario):
    """Sensor anomaly - spikes, drift, or intermittent issues"""
    def __init__(self):
        super().__init__()
        self.anomaly_type = random.choice(['spike', 'drift', 'intermittent'])
        self.anomaly_counter = 0
    
    def step(self):
        if self.anomaly_type == 'spike':
            # Random spikes in CO2
            if random.random() < 0.3:
                self.co2 += random.uniform(200, 400)
            else:
                self.co2 -= random.uniform(50, 100)
        
        elif self.anomaly_type == 'drift':
            # Sensor drifting upward
            self.co2 += random.uniform(10, 30)
        
        elif self.anomaly_type == 'intermittent':
            # Sensor dropping out randomly
            if random.random() < 0.1:
                self.co2 = random.choice([400, 800, 1200])
            else:
                self.co2 += random.uniform(-5, 5)
        
        self.co2 = max(300, min(2500, self.co2))
        
        # Temperature anomalies
        self.temp += random.uniform(-1, 1)
        self.temp = max(15, min(40, self.temp))
        
        # Humidity anomalies
        self.humidity += random.uniform(-3, 3)
        self.humidity = max(10, min(95, self.humidity))


# ==================== SCENARIO MANAGER ====================

_scenarios = {
    'normal': NormalScenario(),
    'office_hours': OfficeHoursScenario(),
    'sleep': SleepScenario(),
    'ventilation': VentilationActiveScenario(),
    'anomaly': AnomalyScenario()
}

_active_scenario = _scenarios['normal']


def set_scenario(scenario_name: str, duration_minutes: int = 0):
    """
    Set active simulation scenario
    
    Args:
        scenario_name: 'normal', 'office_hours', 'sleep', 'ventilation', 'anomaly'
        duration_minutes: How long to run this scenario (0 = indefinite)
    """
    global _active_scenario, _scenario, _scenario_timer, _scenario_duration
    
    if scenario_name in _scenarios:
        _active_scenario = _scenarios[scenario_name]
        _scenario = scenario_name
        _scenario_timer = 0
        _scenario_duration = duration_minutes * 60  # Convert to steps (assuming 1 step = 1 second)
        return True
    return False


def generate_co2_data(realistic=True):
    """
    Generate realistic CO2, temperature, humidity data
    
    Returns:
        dict: {'co2': int, 'temp': float, 'humidity': float}
    """
    global _active_scenario, _scenario_timer, _scenario_duration, _paused

    # If paused, return the current values without advancing the simulation
    if _paused:
        return {
            'co2': int(_active_scenario.co2),
            'temp': round(_active_scenario.temp, 1),
            'humidity': round(_active_scenario.humidity, 1)
        }
    
    if not realistic:
        # Random mode for testing
        return {
            'co2': random.randint(400, 2000),
            'temp': round(random.uniform(18, 28), 1),
            'humidity': round(random.uniform(30, 70), 1)
        }
    
    # Check if scenario duration expired
    if _scenario_duration > 0:
        _scenario_timer += 1
        if _scenario_timer >= _scenario_duration:
            set_scenario('normal')
    
    # Generate new values
    _active_scenario.step()
    
    return {
        'co2': int(_active_scenario.co2),
        'temp': round(_active_scenario.temp, 1),
        'humidity': round(_active_scenario.humidity, 1)
    }


def generate_co2(realistic=True):
    """Legacy function - returns only CO2 value for backward compatibility"""
    data = generate_co2_data(realistic)
    return data['co2']


def save_reading(ppm: int, temp: Optional[float] = None, humidity: Optional[float] = None, *, source: str = "live", persist: bool = True):
    """Save CO₂ reading to the database with optional source tagging.

    Args:
        ppm: CO₂ level in ppm
        temp: Optional temperature in Celsius
        humidity: Optional humidity as percentage
        source: Origin of the reading (e.g., 'live', 'sim')
        persist: If False, skip writing (useful for pure-simulation flows)
    """
    if not persist:
        return

    db = get_db()

    try:
        if temp is not None and humidity is not None:
            db.execute(
                "INSERT INTO co2_readings (ppm, temperature, humidity, source) VALUES (?, ?, ?, ?)",
                (ppm, temp, humidity, source)
            )
        else:
            db.execute(
                "INSERT INTO co2_readings (ppm, source) VALUES (?, ?)",
                (ppm, source)
            )
    except Exception:
        # Fallback if newer columns are missing on an older schema
        db.execute(
            "INSERT INTO co2_readings (ppm) VALUES (?)",
            (ppm,)
        )
    db.commit()
    db.close()


def get_scenario_info() -> dict:
    """Get current scenario information"""
    return {
        'scenario': _scenario,
        'co2': int(_active_scenario.co2),
        'temp': round(_active_scenario.temp, 1),
        'humidity': round(_active_scenario.humidity, 1),
        'timer': _scenario_timer,
        'duration': _scenario_duration,
        'paused': _paused
    }


def reset_state(base_value: int = 600, scenario: str = 'normal'):
    """
    Reset the simulator to initial state
    
    Args:
        base_value: Starting CO2 value
        scenario: Initial scenario name
    """
    global _active_scenario, _scenario, _scenario_timer, _scenario_duration, _paused
    
    if scenario in _scenarios:
        _active_scenario = _scenarios[scenario]
        _active_scenario.co2 = base_value
        _active_scenario.temp = 22.0
        _active_scenario.humidity = 45.0
        _scenario = scenario
        _scenario_timer = 0
        _scenario_duration = 0
        _paused = False


def set_paused(paused: bool):
    """Pause or resume the simulator progression."""
    global _paused
    _paused = bool(paused)


# ==================== UTILITY FUNCTIONS ====================

def get_air_quality_level(ppm: int) -> str:
    """Classify air quality based on CO2 level"""
    if ppm < 800:
        return "Excellent"
    elif ppm < 1000:
        return "Good"
    elif ppm < 1200:
        return "Fair"
    elif ppm < 1500:
        return "Poor"
    else:
        return "Very Poor"


def get_occupancy_estimate(ppm: int, baseline: int = 400) -> int:
    """
    Estimate number of people in room based on CO2 level
    Assumes ~4 ppm per person
    """
    people = (ppm - baseline) / 4
    return max(0, int(people))


if __name__ == "__main__":
    import time
    
    print("🔬 Enhanced CO2 Simulator - Demo\n")
    
    # Test different scenarios
    scenarios_to_test = [
        ('normal', 10),
        ('office_hours', 15),
        ('ventilation', 15),
        ('sleep', 10),
        ('anomaly', 10)
    ]
    
    for scenario_name, duration in scenarios_to_test:
        print(f"\n{'='*60}")
        print(f"📊 Scenario: {scenario_name.upper()} ({duration}s)")
        print(f"{'='*60}")
        
        set_scenario(scenario_name, duration_minutes=0)
        
        for i in range(duration):
            data = generate_co2_data(realistic=True)
            info = get_scenario_info()
            quality = get_air_quality_level(data['co2'])
            occupancy = get_occupancy_estimate(data['co2'])
            
            print(f"{i+1:2d}s | CO2: {data['co2']:4d}ppm | "
                  f"Temp: {data['temp']:5.1f}°C | Humidity: {data['humidity']:5.1f}% | "
                  f"Quality: {quality:12s} | People: ~{occupancy}")
            
            time.sleep(0.1)  # Faster for demo
    
    print("\n✅ Simulator test complete!")
