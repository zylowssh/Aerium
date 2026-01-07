"""
API Blueprint
Provides REST API endpoints
"""
from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api')


@api_bp.route('/')
def index():
    """API root endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'API endpoints available',
        'version': '1.0'
    })


@api_bp.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})
