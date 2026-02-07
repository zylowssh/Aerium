from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Maintenance, Sensor, User
from datetime import datetime, timedelta

maintenance_bp = Blueprint('maintenance', __name__)


def parse_iso_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (TypeError, ValueError):
        return None

@maintenance_bp.route('', methods=['GET'])
@jwt_required()
def get_maintenance():
    """Get maintenance tasks for the current user"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        status = request.args.get('status')  # 'scheduled', 'in_progress', 'completed', 'overdue'
        sensor_id = request.args.get('sensor_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        # Build query
        if user.role == 'admin':
            query = Maintenance.query
        else:
            query = Maintenance.query.filter_by(user_id=current_user_id)
        
        # Filter by status if provided
        if status:
            query = query.filter_by(status=status)
        
        # Filter by sensor if provided
        if sensor_id:
            query = query.filter_by(sensor_id=sensor_id)
        
        # Get tasks ordered by scheduled date
        tasks = query.order_by(Maintenance.scheduled_date).limit(limit).all()
        
        return jsonify({'maintenance': [task.to_dict() for task in tasks]}), 200
        
    except Exception as e:
        print(f"Error fetching maintenance: {e}")
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('', methods=['POST'])
@jwt_required()
def create_maintenance():
    """Create a new maintenance task"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('sensorId') or not data.get('type') or not data.get('scheduledDate'):
            return jsonify({'error': 'Missing required fields'}), 400

        scheduled_date = parse_iso_datetime(data.get('scheduledDate'))
        if not scheduled_date:
            return jsonify({'error': 'Invalid scheduledDate format'}), 400
        
        sensor = Sensor.query.get(data['sensorId'])
        if not sensor or (user.role != 'admin' and sensor.user_id != current_user_id):
            return jsonify({'error': 'Sensor not found or unauthorized'}), 404
        
        # Create maintenance task
        maintenance = Maintenance(
            sensor_id=data['sensorId'],
            user_id=current_user_id,
            type=data['type'],
            status=data.get('status', 'scheduled'),
            scheduled_date=scheduled_date,
            description=data.get('description'),
            notes=data.get('notes'),
            priority=data.get('priority', 'normal')
        )
        
        db.session.add(maintenance)
        db.session.commit()
        
        return jsonify({'maintenance': maintenance.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating maintenance: {e}")
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('/<int:maintenance_id>', methods=['GET'])
@jwt_required()
def get_maintenance_task(maintenance_id):
    """Get a specific maintenance task"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        maintenance = Maintenance.query.get(maintenance_id)
        
        if not maintenance:
            return jsonify({'error': 'Maintenance task not found'}), 404
        
        if user.role != 'admin' and maintenance.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({'maintenance': maintenance.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('/<int:maintenance_id>', methods=['PUT'])
@jwt_required()
def update_maintenance(maintenance_id):
    """Update a maintenance task"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        maintenance = Maintenance.query.get(maintenance_id)
        
        if not maintenance:
            return jsonify({'error': 'Maintenance task not found'}), 404
        
        if user.role != 'admin' and maintenance.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'type' in data:
            maintenance.type = data['type']
        if 'status' in data:
            maintenance.status = data['status']
            if data['status'] == 'completed':
                maintenance.completed_date = datetime.utcnow()
        if 'scheduledDate' in data:
            scheduled_date = parse_iso_datetime(data.get('scheduledDate'))
            if not scheduled_date:
                return jsonify({'error': 'Invalid scheduledDate format'}), 400
            maintenance.scheduled_date = scheduled_date
        if 'description' in data:
            maintenance.description = data['description']
        if 'notes' in data:
            maintenance.notes = data['notes']
        if 'priority' in data:
            maintenance.priority = data['priority']
        
        maintenance.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'maintenance': maintenance.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating maintenance: {e}")
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('/<int:maintenance_id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance(maintenance_id):
    """Delete a maintenance task"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        maintenance = Maintenance.query.get(maintenance_id)
        
        if not maintenance:
            return jsonify({'error': 'Maintenance task not found'}), 404
        
        if user.role != 'admin' and maintenance.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(maintenance)
        db.session.commit()
        
        return jsonify({'message': 'Maintenance task deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
