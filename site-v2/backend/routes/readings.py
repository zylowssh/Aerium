from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, SensorReading, Sensor, User, Alert, AlertHistory
from datetime import datetime, timedelta
from email_service import send_alert_email
from audit_logger import log_action
from sensor_simulator import generate_historical_simulated_readings, generate_current_simulated_reading
import logging

readings_bp = Blueprint('readings', __name__)
logger = logging.getLogger(__name__)

@readings_bp.route('/sensor/<int:sensor_id>', methods=['GET'])
@jwt_required()
def get_sensor_readings(sensor_id):
    """Get readings for a specific sensor (generates on-demand for simulated sensors)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        user = User.query.get(current_user_id)
        
        sensor = Sensor.query.get(sensor_id)
        
        if not sensor:
            return jsonify({'error': 'Sensor not found'}), 404
        
        # Check ownership unless admin
        if user.role != 'admin' and sensor.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access to this sensor'}), 403
        
        # Get query parameters
        limit = request.args.get('limit', 100, type=int)
        hours = request.args.get('hours', 24, type=int)
        
        # For simulated sensors, generate historical data on-demand
        if sensor.sensor_type == 'simulation':
            simulated_readings = generate_historical_simulated_readings(sensor.name, hours)
            
            # Return limited number of readings
            readings_data = [
                {
                    'id': idx,
                    'sensor_id': sensor_id,
                    'co2': r['co2'],
                    'temperature': r['temperature'],
                    'humidity': r['humidity'],
                    'recorded_at': r['recorded_at']
                }
                for idx, r in enumerate(simulated_readings[-limit:])
            ]
            
            return jsonify({
                'readings': readings_data
            }), 200
        
        # For real sensors, get actual readings from database
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        readings = SensorReading.query.filter(
            SensorReading.sensor_id == sensor_id,
            SensorReading.recorded_at >= start_time
        ).order_by(SensorReading.recorded_at.desc()).limit(limit).all()
        
        return jsonify({
            'readings': [reading.to_dict() for reading in readings]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@readings_bp.route('', methods=['POST'])
@jwt_required()
def add_reading():
    """Add a new sensor reading"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        user = User.query.get(current_user_id)
        
        data = request.get_json()
        
        sensor_id = data.get('sensor_id')
        co2 = data.get('co2')
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        
        if not sensor_id or co2 is None or temperature is None or humidity is None:
            return jsonify({'error': 'sensor_id, co2, temperature, and humidity are required'}), 400
        
        sensor = Sensor.query.get(sensor_id)
        
        if not sensor:
            return jsonify({'error': 'Sensor not found'}), 404
        
        # Check ownership unless admin
        if user.role != 'admin' and sensor.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access to this sensor'}), 403
        
        new_reading = SensorReading(
            sensor_id=sensor_id,
            co2=float(co2),
            temperature=float(temperature),
            humidity=float(humidity)
        )
        
        db.session.add(new_reading)
        
        # Check thresholds and trigger alerts
        check_thresholds(sensor, current_user_id, co2, temperature, humidity)
        
        # Update sensor status based on CO2 levels
        if co2 > 1200:
            sensor.status = 'avertissement'
        elif co2 < 1000:
            sensor.status = 'en ligne'
        
        sensor.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log the action
        log_action(current_user_id, 'CREATE', 'READING', resource_id=new_reading.id)
        
        return jsonify({
            'message': 'Reading added successfully',
            'reading': new_reading.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding reading: {str(e)}")
        return jsonify({'error': str(e)}), 500


def check_thresholds(sensor, user_id, co2, temperature, humidity):
    """Check if readings exceed configured thresholds and trigger alerts"""
    try:
        # Get thresholds - use sensor-specific if set, otherwise use global defaults
        co2_threshold = sensor.threshold_co2 if sensor.threshold_co2 is not None else current_app.config.get('ALERT_CO2_THRESHOLD', 1200)
        temp_min = sensor.threshold_temp_min if sensor.threshold_temp_min is not None else current_app.config.get('ALERT_TEMP_MIN', 15)
        temp_max = sensor.threshold_temp_max if sensor.threshold_temp_max is not None else current_app.config.get('ALERT_TEMP_MAX', 28)
        humidity_threshold = sensor.threshold_humidity if sensor.threshold_humidity is not None else current_app.config.get('ALERT_HUMIDITY_THRESHOLD', 80)
        
        user = User.query.get(user_id)
        
        # Check CO2 levels
        if co2 > co2_threshold:
            send_threshold_alert(
                sensor,
                user,
                'avertissement',
                'co2',
                f'CO2 level {co2} ppm exceeds threshold {co2_threshold} ppm',
                co2,
                co2_threshold
            )
        
        # Check temperature
        if temperature < temp_min or temperature > temp_max:
            threshold = temp_min if temperature < temp_min else temp_max
            send_threshold_alert(
                sensor,
                user,
                'avertissement',
                'temperature',
                f'Temperature {temperature}°C outside range',
                temperature,
                threshold
            )
        
        # Check humidity
        if humidity > humidity_threshold:
            send_threshold_alert(
                sensor,
                user,
                'avertissement',
                'humidity',
                f'Humidity level {humidity}% exceeds threshold {humidity_threshold}%',
                humidity,
                humidity_threshold
            )
    
    except Exception as e:
        logger.error(f"Error checking thresholds: {str(e)}")


def send_threshold_alert(sensor, user, alert_type, metric, message, value, threshold):
    """Send alert when threshold is exceeded"""
    try:
        normalized_type = alert_type if alert_type in ['info', 'avertissement', 'critique'] else 'avertissement'

        # Create alert history record
        alert_history = AlertHistory(
            user_id=user.id,
            sensor_id=sensor.id,
            alert_type=normalized_type,
            metric=metric,
            metric_value=float(value),
            threshold_value=float(threshold) if threshold is not None else None,
            message=message,
            status='triggered'
        )
        db.session.add(alert_history)

        # Create alert for dashboard
        alert = Alert(
            user_id=user.id,
            sensor_id=sensor.id,
            alert_type=normalized_type,
            message=message,
            value=float(value)
        )
        db.session.add(alert)
        db.session.commit()
        
        # Send email notification if enabled
        if current_app.config.get('ENABLE_EMAIL_NOTIFICATIONS') and user.email:
            send_alert_email(
                to_email=user.email,
                sensor_name=sensor.name,
                alert_type=alert_type,
                alert_value=value,
                threshold=threshold
            )
        
        logger.info(f"Alert triggered for sensor {sensor.id}: {alert_type}")
    
    except Exception as e:
        logger.error(f"Error sending threshold alert: {str(e)}")


@readings_bp.route('/aggregate', methods=['GET'])
@jwt_required()
def get_aggregate_data():
    """Get aggregate sensor data for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        user = User.query.get(current_user_id)
        
        # Get all user's sensors
        if user.role == 'admin':
            sensors = Sensor.query.all()
        else:
            sensors = Sensor.query.filter_by(user_id=current_user_id).all()
        
        sensor_ids = [s.id for s in sensors]
        
        if not sensor_ids:
            return jsonify({
                'avgCo2': 0,
                'avgTemperature': 0,
                'avgHumidity': 0,
                'totalReadings': 0
            }), 200
        
        # Get recent readings (last 24 hours)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)
        
        readings = SensorReading.query.filter(
            SensorReading.sensor_id.in_(sensor_ids),
            SensorReading.recorded_at >= start_time
        ).all()
        
        if not readings:
            return jsonify({
                'avgCo2': 0,
                'avgTemperature': 0,
                'avgHumidity': 0,
                'totalReadings': 0
            }), 200
        
        # Calculate averages
        avg_co2 = sum(r.co2 for r in readings) / len(readings)
        avg_temp = sum(r.temperature for r in readings) / len(readings)
        avg_humidity = sum(r.humidity for r in readings) / len(readings)
        
        return jsonify({
            'avgCo2': round(avg_co2, 2),
            'avgTemperature': round(avg_temp, 2),
            'avgHumidity': round(avg_humidity, 2),
            'totalReadings': len(readings)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@readings_bp.route('/external/<sensor_api_key>', methods=['POST'])
def add_external_reading(sensor_api_key):
    """
    External endpoint for real sensors (SDC30, etc.) to push data.
    This endpoint uses API key auth instead of JWT for IoT devices.
    The sensor_api_key is the sensor ID for now (can be enhanced with API keys later)
    """
    try:
        data = request.get_json()
        
        co2 = data.get('co2')
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        
        if co2 is None or temperature is None or humidity is None:
            return jsonify({'error': 'co2, temperature, and humidity are required'}), 400
        
        # Find sensor by ID (treating api_key as sensor_id for simplicity)
        try:
            sensor_id = int(sensor_api_key)
        except ValueError:
            return jsonify({'error': 'Invalid sensor identifier'}), 400
            
        sensor = Sensor.query.get(sensor_id)
        
        if not sensor:
            return jsonify({'error': 'Sensor not found'}), 404
        
        # Only allow real sensors to use this endpoint
        if sensor.sensor_type != 'real':
            return jsonify({'error': 'This endpoint is only for real sensors'}), 403
        
        new_reading = SensorReading(
            sensor_id=sensor_id,
            co2=float(co2),
            temperature=float(temperature),
            humidity=float(humidity)
        )
        
        db.session.add(new_reading)

        # Check thresholds and trigger alerts
        check_thresholds(sensor, sensor.user_id, co2, temperature, humidity)
        
        # Update sensor status based on CO2 levels
        if co2 > 1200:
            sensor.status = 'avertissement'
        elif co2 > 1000:
            sensor.status = 'avertissement'
        else:
            sensor.status = 'en ligne'
        
        sensor.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reading recorded successfully',
            'reading': new_reading.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@readings_bp.route('/latest/<int:sensor_id>', methods=['GET'])
@jwt_required()
def get_latest_reading(sensor_id):
    """Get the latest reading for a specific sensor. For simulated sensors, generate and store if stale."""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        user = User.query.get(current_user_id)
        
        sensor = Sensor.query.get(sensor_id)
        
        if not sensor:
            return jsonify({'error': 'Sensor not found'}), 404
        
        # Check ownership unless admin
        if user.role != 'admin' and sensor.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access to this sensor'}), 403
        
        # Get latest reading
        latest_reading = SensorReading.query.filter_by(
            sensor_id=sensor_id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        # For simulated sensors, generate fresh reading on-demand without persisting
        if sensor.sensor_type == 'simulation':
            if latest_reading and (datetime.utcnow() - latest_reading.recorded_at).total_seconds() <= 60:
                return jsonify({
                    'reading': latest_reading.to_dict(),
                    'sensor': sensor.to_dict()
                }), 200

            simulated_data = generate_current_simulated_reading(sensor.name)
            simulated_reading = {
                'id': 0,
                'sensor_id': sensor_id,
                'co2': simulated_data['co2'],
                'temperature': simulated_data['temperature'],
                'humidity': simulated_data['humidity'],
                'recorded_at': datetime.utcnow().isoformat()
            }
            return jsonify({
                'reading': simulated_reading,
                'sensor': sensor.to_dict()
            }), 200
        
        if not latest_reading:
            return jsonify({'error': 'No readings found for this sensor'}), 404
        
        return jsonify({
            'reading': latest_reading.to_dict(),
            'sensor': sensor.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
