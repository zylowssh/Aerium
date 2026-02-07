from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Sensor, SensorReading, User
from datetime import datetime
from audit_logger import log_action
from sensor_simulator import generate_current_simulated_reading
import logging

sensors_bp = Blueprint('sensors', __name__)
logger = logging.getLogger(__name__)

@sensors_bp.route('', methods=['GET'])
@jwt_required()
def get_sensors():
    """Get all sensors for the current user with optional filtering and search"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters for filtering and search
        search = request.args.get('search', '').strip()
        status = request.args.get('status')  # 'en ligne', 'avertissement', 'offline'
        sensor_type = request.args.get('type')
        is_active = request.args.get('active')
        sort_by = request.args.get('sort', 'name')  # 'name', 'updated_at', 'status'
        limit = request.args.get('limit', 100, type=int)
        
        # Admin can see all sensors, regular users only their own
        if user.role == 'admin':
            query = Sensor.query
        else:
            query = Sensor.query.filter_by(user_id=current_user_id)
        
        # Apply search filter
        if search:
            query = query.filter(
                db.or_(
                    Sensor.name.ilike(f'%{search}%'),
                    Sensor.location.ilike(f'%{search}%'),
                    Sensor.external_id.ilike(f'%{search}%')
                )
            )
        
        # Apply status filter
        if status:
            query = query.filter_by(status=status)
        
        # Apply sensor type filter
        if sensor_type:
            query = query.filter_by(sensor_type=sensor_type)
        
        # Apply active status filter
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter_by(is_active=is_active_bool)
        
        # Apply sorting
        if sort_by == 'updated_at':
            query = query.order_by(Sensor.updated_at.desc())
        elif sort_by == 'status':
            query = query.order_by(Sensor.status)
        else:  # default: name
            query = query.order_by(Sensor.name)
        
        sensors = query.limit(limit).all()
        
        # Include latest readings for each sensor (generate on-demand for simulated sensors)
        sensors_data = []
        for sensor in sensors:
            sensor_dict = sensor.to_dict(include_latest_reading=True)
            
            # For simulated sensors without recent readings, generate one on-demand
            if sensor.sensor_type == 'simulation':
                latest_reading = SensorReading.query.filter_by(sensor_id=sensor.id).order_by(
                    SensorReading.recorded_at.desc()
                ).first()
                
                # If no reading exists or reading is stale (>1 minute old), generate fresh data
                if not latest_reading or (datetime.utcnow() - latest_reading.recorded_at).total_seconds() > 60:
                    simulated_data = generate_current_simulated_reading(sensor.name)
                    sensor_dict['co2'] = simulated_data['co2']
                    sensor_dict['temperature'] = simulated_data['temperature']
                    sensor_dict['humidity'] = simulated_data['humidity']
                    sensor_dict['lastReading'] = datetime.utcnow().isoformat()
            
            sensors_data.append(sensor_dict)
        
        return jsonify({
            'sensors': sensors_data,
            'count': len(sensors_data),
            'filters': {
                'search': search,
                'status': status,
                'type': sensor_type,
                'active': is_active,
                'sort': sort_by
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching sensors: {str(e)}")
        return jsonify({'error': str(e)}), 500


@sensors_bp.route('/<int:sensor_id>', methods=['GET'])
@jwt_required()
def get_sensor(sensor_id):
    """Get a specific sensor by ID"""
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
        
        sensor_dict = sensor.to_dict(include_latest_reading=True)
        
        # For simulated sensors, generate fresh data on-demand
        if sensor.sensor_type == 'simulation':
            latest_reading = SensorReading.query.filter_by(sensor_id=sensor.id).order_by(
                SensorReading.recorded_at.desc()
            ).first()
            
            # If no reading exists or reading is stale (>1 minute old), generate fresh data
            if not latest_reading or (datetime.utcnow() - latest_reading.recorded_at).total_seconds() > 60:
                simulated_data = generate_current_simulated_reading(sensor.name)
                sensor_dict['co2'] = simulated_data['co2']
                sensor_dict['temperature'] = simulated_data['temperature']
                sensor_dict['humidity'] = simulated_data['humidity']
                sensor_dict['lastReading'] = datetime.utcnow().isoformat()
        
        return jsonify({'sensor': sensor_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sensors_bp.route('', methods=['POST'])
@jwt_required()
def create_sensor():
    """Create a new sensor"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        data = request.get_json()
        
        name = data.get('name')
        location = data.get('location')
        sensor_type = data.get('sensor_type', 'simulation')
        
        if not name or not location:
            return jsonify({'error': 'Name and location are required'}), 400
        
        new_sensor = Sensor(
            user_id=current_user_id,
            name=name,
            location=location,
            sensor_type=sensor_type,
            status='en ligne',
            battery=100,
            is_live=True
        )
        
        db.session.add(new_sensor)
        db.session.commit()
        
        # Log the action
        log_action(current_user_id, 'CREATE', 'SENSOR', resource_id=new_sensor.id, details={
            'name': name,
            'location': location,
            'sensor_type': sensor_type
        })
        
        return jsonify({
            'message': 'Sensor created successfully',
            'sensor': new_sensor.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating sensor: {str(e)}")
        return jsonify({'error': str(e)}), 500


@sensors_bp.route('/<int:sensor_id>', methods=['PUT'])
@jwt_required()
def update_sensor(sensor_id):
    """Update a sensor"""
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
        
        data = request.get_json()
        
        if 'name' in data:
            sensor.name = data['name']
        if 'location' in data:
            sensor.location = data['location']
        if 'sensor_type' in data:
            sensor.sensor_type = data['sensor_type']
        if 'status' in data:
            sensor.status = data['status']
        if 'battery' in data:
            sensor.battery = data['battery']
        if 'is_live' in data:
            sensor.is_live = data['is_live']
        
        sensor.updated_at = datetime.utcnow()
        
        # Log the action
        log_action(current_user_id, 'UPDATE', 'SENSOR', resource_id=sensor_id, details=data)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sensor updated successfully',
            'sensor': sensor.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating sensor: {str(e)}")
        return jsonify({'error': str(e)}), 500


@sensors_bp.route('/<int:sensor_id>/thresholds', methods=['PUT'])
@jwt_required()
def update_sensor_thresholds(sensor_id):
    """Update alert thresholds for a specific sensor"""
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
        
        data = request.get_json()
        
        # Update thresholds (None means use global defaults)
        if 'co2' in data:
            sensor.threshold_co2 = float(data['co2']) if data['co2'] is not None else None
        if 'temp_min' in data:
            sensor.threshold_temp_min = float(data['temp_min']) if data['temp_min'] is not None else None
        if 'temp_max' in data:
            sensor.threshold_temp_max = float(data['temp_max']) if data['temp_max'] is not None else None
        if 'humidity' in data:
            sensor.threshold_humidity = float(data['humidity']) if data['humidity'] is not None else None
        
        sensor.updated_at = datetime.utcnow()
        
        # Log the action
        log_action(current_user_id, 'UPDATE', 'SENSOR_THRESHOLDS', resource_id=sensor_id, details=data)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Sensor thresholds updated successfully',
            'thresholds': {
                'co2': sensor.threshold_co2,
                'temp_min': sensor.threshold_temp_min,
                'temp_max': sensor.threshold_temp_max,
                'humidity': sensor.threshold_humidity
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating sensor thresholds: {str(e)}")
        return jsonify({'error': str(e)}), 500


@sensors_bp.route('/<int:sensor_id>', methods=['DELETE'])
@jwt_required()
def delete_sensor(sensor_id):
    """Delete a sensor"""
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
        
        # Log the action before deletion
        log_action(current_user_id, 'DELETE', 'SENSOR', resource_id=sensor_id, details={
            'name': sensor.name,
            'location': sensor.location
        })
        
        db.session.delete(sensor)
        db.session.commit()
        
        return jsonify({'message': 'Sensor deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
