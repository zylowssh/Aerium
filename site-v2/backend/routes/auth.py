from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from database import db, User
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName', data.get('full_name', ''))
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create new user
        new_user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role='user'
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT tokens"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Invalid login credentials'}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid login credentials'}), 401
        
        # Create tokens with explicit identity
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        print(f"Login successful for user {user.id}: {user.email}")
        print(f"Access token created: {access_token[:50]}...")
        print(f"Refresh token created: {refresh_token[:50]}...")
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        print(f"Refreshing token for user ID: {current_user_id}")
        
        # Convert to string for consistency
        access_token = create_access_token(identity=current_user_id)
        
        print(f"New access token created: {access_token[:50]}...")
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        print(f"Refresh error: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        print(f"Getting user for ID: {current_user_id} (type: {type(current_user_id)})")
        
        # Convert to int if it's a string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        
        if not user:
            print(f"User not found for ID: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"User found: {user.email}")
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({'message': 'Logged out successfully'}), 200
