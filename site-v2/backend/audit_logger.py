"""
Audit logging for tracking user actions
"""
from database import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AuditLog(db.Model):
    """Model for tracking user actions"""
    __tablename__ = 'audit_log'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # e.g., 'CREATE_SENSOR', 'DELETE_ALERT'
    resource_type = db.Column(db.String(50), nullable=False)  # e.g., 'SENSOR', 'ALERT'
    resource_id = db.Column(db.Integer)
    details = db.Column(db.JSON)  # Additional context like old/new values
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<AuditLog {self.action} by user {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat()
        }


def log_action(user_id, action, resource_type, resource_id=None, details=None, ip_address=None):
    """
    Log a user action to audit trail
    
    Args:
        user_id: ID of user performing action
        action: Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
        resource_type: Type of resource (e.g., 'SENSOR', 'ALERT')
        resource_id: ID of the resource affected
        details: Dictionary of additional details
        ip_address: IP address of the request
    """
    try:
        audit = AuditLog(
            user_id=user_id,
            action=f"{action}_{resource_type}",
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address
        )
        db.session.add(audit)
        db.session.commit()
        logger.debug(f"Audit log created: {action} on {resource_type} by user {user_id}")
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}")
        db.session.rollback()


def get_user_audit_history(user_id, limit=100):
    """Get audit history for a specific user"""
    try:
        logs = AuditLog.query.filter_by(user_id=user_id).order_by(
            AuditLog.timestamp.desc()
        ).limit(limit).all()
        return [log.to_dict() for log in logs]
    except Exception as e:
        logger.error(f"Failed to retrieve audit history: {str(e)}")
        return []


def get_resource_audit_history(resource_type, resource_id, limit=50):
    """Get audit history for a specific resource"""
    try:
        logs = AuditLog.query.filter_by(
            resource_type=resource_type,
            resource_id=resource_id
        ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
        return [log.to_dict() for log in logs]
    except Exception as e:
        logger.error(f"Failed to retrieve resource audit history: {str(e)}")
        return []
