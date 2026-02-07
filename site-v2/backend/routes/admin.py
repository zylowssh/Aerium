"""
Admin-only endpoints for system configuration
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import User
from scheduler import update_simulation_speed, SIMULATION_SPEED

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """Decorator to require admin role"""
    from functools import wraps
    
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated


@admin_bp.route('/simulation/speed', methods=['GET'])
@admin_required
def get_simulation_speed():
    """Get current simulation speed"""
    return jsonify({
        'speed': SIMULATION_SPEED,
        'message': f'Current simulation speed: {SIMULATION_SPEED} seconds'
    }), 200


@admin_bp.route('/simulation/speed', methods=['POST'])
@admin_required
def set_simulation_speed():
    """Update simulation speed (admin only)"""
    try:
        data = request.get_json()
        new_speed = data.get('speed')
        
        if not new_speed or new_speed <= 0:
            return jsonify({'error': 'Speed must be a positive number'}), 400
        
        success = update_simulation_speed(float(new_speed))
        
        if success:
            return jsonify({
                'message': f'Simulation speed updated to {new_speed} seconds',
                'speed': new_speed
            }), 200
        else:
            return jsonify({'error': 'Failed to update simulation speed'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
