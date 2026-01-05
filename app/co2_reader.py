'''
Fichier pour lire et enregistrer les données CO₂ par capteur
'''
import random
import time
import os
import sys
from pathlib import Path

# Add site directory to path for database imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'site'))

def fake_read_co2():
    """
    Simule une valeur de CO₂ entre 400 et 2000 ppm.
    """
    return random.randint(400, 2000)


def get_air_quality(ppm):
    """
    Retourne une classification de la qualité de l'air en fonction du ppm.
    """
    if ppm < 800:
        return "Bon"
    elif ppm < 1200:
        return "Moyen"
    else:
        return "Mauvais"


def alert_needed(ppm, threshold=1200):
    """
    Retourne True si le ppm dépasse le seuil d'alerte défini.
    Par défaut : 1200 ppm.
    """
    return ppm > threshold


def read_all_sensors_and_log():
    """
    Read all active sensors and log their data to database
    """
    try:
        from database import (get_db, get_active_sensors, 
                             log_sensor_reading, update_sensor_availability)
        from app.sensors.scd30 import SCD30
        
        # Get all active sensors for all users
        db = get_db()
        sensors = db.execute("""
            SELECT id, user_id, name, type, interface, config, active
            FROM user_sensors 
            WHERE active = 1
        """).fetchall()
        db.close()
        
        for sensor_row in sensors:
            try:
                sensor_id = sensor_row['id']
                sensor_type = sensor_row['type']
                config_str = sensor_row['config']
                
                # Parse config
                import json
                config = json.loads(config_str) if isinstance(config_str, str) else config_str
                
                ppm = None
                temperature = None
                humidity = None
                available = False
                
                # Read based on sensor type
                if sensor_type == 'scd30':
                    try:
                        bus = config.get('bus', 1)
                        address = config.get('address', '0x61')
                        if isinstance(address, str):
                            address = int(address, 16)
                        
                        scd30 = SCD30(bus=int(bus), address=address)
                        reading = scd30.read()
                        
                        if reading and 'co2' in reading:
                            ppm = int(reading['co2'])
                            temperature = reading.get('temperature')
                            humidity = reading.get('humidity')
                            available = True
                    except Exception as e:
                        print(f"  ✗ SCD30 read error: {e}")
                        available = False
                
                elif sensor_type == 'mhz19':
                    # MH-Z19 reading would go here
                    ppm = fake_read_co2()
                    available = True
                
                elif sensor_type == 'senseair':
                    # Senseair reading would go here
                    ppm = fake_read_co2()
                    available = True
                
                else:
                    # Unknown type - use fake
                    ppm = fake_read_co2()
                    available = True
                
                # Use fake if no real reading
                if ppm is None:
                    ppm = fake_read_co2()
                    available = False
                
                # Log the reading
                log_sensor_reading(sensor_id, ppm, temperature, humidity)
                update_sensor_availability(sensor_id, available)
                
                quality = get_air_quality(ppm)
                status = "✓" if available else "~"
                extra = f"| T:{temperature:.1f}°C | RH:{humidity:.0f}%" if temperature else ""
                print(f"  {status} [{sensor_row['name']}] {ppm}ppm ({quality}) {extra}")
                
            except Exception as e:
                print(f"  ✗ Error processing sensor {sensor_row['id']}: {e}")
                try:
                    update_sensor_availability(sensor_row['id'], False)
                except:
                    pass
        
    except ImportError:
        print("  ! Database module not available - skipping sensor logging")
    except Exception as e:
        print(f"  ! Error in sensor reading loop: {e}")


if __name__ == "__main__":
    import time
    # Try to use an attached SCD30 sensor when available. Set environment
    # variable USE_SCD30=0 to force the fake reader.
    try:
        from app.sensors.scd30 import SCD30
        _scd30 = SCD30()
    except Exception:
        _scd30 = None

    use_scd = os.environ.get("USE_SCD30", "1")
    
    print("CO₂ Sensor Reader - Per-Sensor Logging Mode")
    print("=" * 50)
    
    while True:
        try:
            print(f"[{time.strftime('%H:%M:%S')}] Reading sensors...")
            read_all_sensors_and_log()
        except KeyboardInterrupt:
            print("\nShutdown requested")
            break
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(10)  # Read every 10 seconds
