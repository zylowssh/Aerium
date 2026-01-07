"""
Real-time Collaboration Routes
Flask blueprint for shared dashboards and collaboration features
"""

from flask import Blueprint, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from database import get_db, is_admin
from utils.auth_decorators import login_required
from utils.collaboration import CollaborationManager
from datetime import datetime

collab_bp = Blueprint('collaboration', __name__, url_prefix='/api/collaboration')

# Active connections per dashboard
active_users = {}  # {dashboard_id: set(user_ids)}
dashboard_sockets = {}  # {dashboard_id: set(socket_ids)}

@collab_bp.route('/dashboards', methods=['GET'])
@login_required
def get_dashboards():
    """Get all shared dashboards for current user"""
    user_id = session.get('user_id')
    dashboards = CollaborationManager.get_user_dashboards(user_id)
    return jsonify(dashboards)

@collab_bp.route('/dashboard', methods=['POST'])
@login_required
def create_dashboard():
    """Create a new shared dashboard"""
    user_id = session.get('user_id')
    data = request.get_json()
    
    name = data.get('name', '').strip()
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': 'Dashboard name required'}), 400
    
    dashboard_id, share_token = CollaborationManager.create_shared_dashboard(
        user_id, name, description
    )
    
    return jsonify({
        'success': True,
        'dashboard_id': dashboard_id,
        'share_token': share_token,
        'name': name
    }), 201

@collab_bp.route('/dashboard/<int:dashboard_id>', methods=['GET'])
@login_required
def get_dashboard(dashboard_id):
    """Get dashboard details and collaborators"""
    user_id = session.get('user_id')
    
    # Check access
    db = get_db()
    dashboard = db.execute(
        "SELECT * FROM shared_dashboards WHERE id = ?",
        (dashboard_id,)
    ).fetchone()
    db.close()
    
    if not dashboard:
        return jsonify({'error': 'Dashboard not found'}), 404
    
    # Check permission
    is_owner = dashboard['owner_id'] == user_id
    is_collaborator = user_id != dashboard['owner_id']  # Simplified
    
    if not is_owner and not is_collaborator:
        return jsonify({'error': 'Access denied'}), 403
    
    collaborators = CollaborationManager.get_dashboard_collaborators(dashboard_id, dashboard['owner_id'])
    state = CollaborationManager.get_dashboard_state(dashboard_id, user_id)
    comments = CollaborationManager.get_dashboard_comments(dashboard_id)
    activity = CollaborationManager.get_collaboration_activity(dashboard_id, limit=20)
    
    return jsonify({
        'dashboard': dict(dashboard),
        'collaborators': collaborators,
        'state': state,
        'comments': comments,
        'activity': activity,
        'is_owner': is_owner,
        'active_users': list(active_users.get(dashboard_id, set()))
    })

@collab_bp.route('/dashboard/<int:dashboard_id>/share', methods=['POST'])
@login_required
def share_dashboard(dashboard_id):
    """Share dashboard with another user"""
    user_id = session.get('user_id')
    data = request.get_json()
    
    target_user_id = data.get('user_id')
    permission = data.get('permission', 'viewer')
    
    if not target_user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    success = CollaborationManager.share_dashboard(
        dashboard_id, user_id, target_user_id, permission
    )
    
    if not success:
        return jsonify({'error': 'Failed to share dashboard'}), 400
    
    CollaborationManager.log_collaboration_activity(
        dashboard_id, user_id, 'shared_with_user',
        f'Shared with user {target_user_id} as {permission}'
    )
    
    return jsonify({'success': True})

@collab_bp.route('/dashboard/<int:dashboard_id>/collaborators/<int:collab_user_id>', methods=['PUT'])
@login_required
def update_collaborator(dashboard_id, collab_user_id):
    """Update collaborator permissions"""
    user_id = session.get('user_id')
    data = request.get_json()
    
    new_permission = data.get('permission')
    if new_permission not in ['viewer', 'editor', 'admin']:
        return jsonify({'error': 'Invalid permission level'}), 400
    
    success = CollaborationManager.update_collaborator_permission(
        dashboard_id, user_id, collab_user_id, new_permission
    )
    
    if not success:
        return jsonify({'error': 'Failed to update permissions'}), 400
    
    return jsonify({'success': True})

@collab_bp.route('/dashboard/<int:dashboard_id>/collaborators/<int:collab_user_id>', methods=['DELETE'])
@login_required
def remove_collaborator(dashboard_id, collab_user_id):
    """Remove collaborator from dashboard"""
    user_id = session.get('user_id')
    
    success = CollaborationManager.remove_collaborator(
        dashboard_id, user_id, collab_user_id
    )
    
    if not success:
        return jsonify({'error': 'Failed to remove collaborator'}), 400
    
    CollaborationManager.log_collaboration_activity(
        dashboard_id, user_id, 'removed_collaborator',
        f'Removed user {collab_user_id}'
    )
    
    return jsonify({'success': True})

@collab_bp.route('/dashboard/<int:dashboard_id>/state', methods=['POST'])
@login_required
def save_state(dashboard_id):
    """Save dashboard state (layout, widgets, filters)"""
    user_id = session.get('user_id')
    data = request.get_json()
    
    state = data.get('state', {})
    
    CollaborationManager.save_dashboard_state(dashboard_id, user_id, state)
    
    return jsonify({'success': True})

@collab_bp.route('/dashboard/<int:dashboard_id>/comment', methods=['POST'])
@login_required
def add_comment(dashboard_id):
    """Add a comment to dashboard"""
    user_id = session.get('user_id')
    data = request.get_json()
    
    comment = data.get('comment', '').strip()
    data_point = data.get('data_point')
    
    if not comment:
        return jsonify({'error': 'Comment text required'}), 400
    
    comment_id = CollaborationManager.add_collaboration_comment(
        dashboard_id, user_id, comment, data_point
    )
    
    CollaborationManager.log_collaboration_activity(
        dashboard_id, user_id, 'added_comment', comment[:50]
    )
    
    return jsonify({'success': True, 'comment_id': comment_id}), 201

@collab_bp.route('/dashboard/<int:dashboard_id>/activity', methods=['GET'])
@login_required
def get_activity(dashboard_id):
    """Get collaboration activity feed"""
    limit = request.args.get('limit', 50, type=int)
    activity = CollaborationManager.get_collaboration_activity(dashboard_id, limit)
    return jsonify({'activity': activity})

# WebSocket handlers for real-time collaboration
def register_collab_sockets(socketio):
    """Register WebSocket event handlers for collaboration"""
    
    @socketio.on('join_dashboard')
    def handle_join_dashboard(data):
        """User joins a shared dashboard room"""
        user_id = session.get('user_id')
        dashboard_id = data.get('dashboard_id')
        
        if not user_id or not dashboard_id:
            return False
        
        room = f'dashboard_{dashboard_id}'
        join_room(room)
        
        # Track active users
        if dashboard_id not in active_users:
            active_users[dashboard_id] = set()
        active_users[dashboard_id].add(user_id)
        
        if dashboard_id not in dashboard_sockets:
            dashboard_sockets[dashboard_id] = set()
        dashboard_sockets[dashboard_id].add(request.sid)
        
        # Notify others
        emit('user_joined', {
            'user_id': user_id,
            'active_users': list(active_users[dashboard_id]),
            'timestamp': datetime.now(UTC).isoformat()
        }, room=room)
        
        CollaborationManager.log_collaboration_activity(
            dashboard_id, user_id, 'joined_dashboard'
        )
    
    @socketio.on('leave_dashboard')
    def handle_leave_dashboard(data):
        """User leaves a shared dashboard room"""
        user_id = session.get('user_id')
        dashboard_id = data.get('dashboard_id')
        
        room = f'dashboard_{dashboard_id}'
        leave_room(room)
        
        if dashboard_id in active_users:
            active_users[dashboard_id].discard(user_id)
            if not active_users[dashboard_id]:
                del active_users[dashboard_id]
        
        if dashboard_id in dashboard_sockets:
            dashboard_sockets[dashboard_id].discard(request.sid)
            if not dashboard_sockets[dashboard_id]:
                del dashboard_sockets[dashboard_id]
        
        # Notify others
        emit('user_left', {
            'user_id': user_id,
            'active_users': list(active_users.get(dashboard_id, set())),
            'timestamp': datetime.now(UTC).isoformat()
        }, room=room)
        
        CollaborationManager.log_collaboration_activity(
            dashboard_id, user_id, 'left_dashboard'
        )
    
    @socketio.on('dashboard_update')
    def handle_dashboard_update(data):
        """Broadcast dashboard state update to collaborators"""
        user_id = session.get('user_id')
        dashboard_id = data.get('dashboard_id')
        update = data.get('update', {})
        
        room = f'dashboard_{dashboard_id}'
        
        emit('dashboard_updated', {
            'user_id': user_id,
            'update': update,
            'timestamp': datetime.now(UTC).isoformat()
        }, room=room, skip_sid=request.sid)
        
        CollaborationManager.log_collaboration_activity(
            dashboard_id, user_id, 'updated_dashboard', str(update)[:100]
        )
    
    @socketio.on('send_comment')
    def handle_send_comment(data):
        """Send real-time comment to collaborators"""
        user_id = session.get('user_id')
        dashboard_id = data.get('dashboard_id')
        comment = data.get('comment', '')
        
        room = f'dashboard_{dashboard_id}'
        
        emit('new_comment', {
            'user_id': user_id,
            'comment': comment,
            'timestamp': datetime.now(UTC).isoformat()
        }, room=room)
        
        # Also save to database
        CollaborationManager.add_collaboration_comment(
            dashboard_id, user_id, comment
        )
    
    @socketio.on('request_sync')
    def handle_sync_request(data):
        """Request full sync from server"""
        dashboard_id = data.get('dashboard_id')
        
        # Return full dashboard state
        user_id = session.get('user_id')
        state = CollaborationManager.get_dashboard_state(dashboard_id, user_id)
        
        emit('sync_data', {
            'state': state['state'] if state else {},
            'timestamp': datetime.now(UTC).isoformat()
        })
