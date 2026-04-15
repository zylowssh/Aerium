"""
Journalisation d'audit pour suivre les actions de l'utilisateur
"""
from database import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class JournalAudit(db.Model):
    """Modèle pour suivi des actions utilisateur"""
    __tablename__ = 'audit_log'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # ex: 'CREER_CAPTEUR', 'SUPPRIMER_ALERTE'
    resource_type = db.Column(db.String(50), nullable=False)  # ex: 'CAPTEUR', 'ALERTE'
    resource_id = db.Column(db.Integer)
    details = db.Column(db.JSON)  # Contexte supplémentaire comme les valeurs ancien/nouveau
    ip_address = db.Column(db.String(45))  # IPv4 ou IPv6
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<JournalAudit {self.action} par l\'utilisateur {self.user_id}>'
    
    def vers_dict(self):
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


def enregistrer_action(
    id_utilisateur,
    action,
    type_ressource,
    id_ressource=None,
    details=None,
    ip_address=None,
    resource_id=None,
):
    """
    Enregistrer une action utilisateur dans la piste d'audit
    
    Args:
        id_utilisateur: ID de l'utilisateur effectuant l'action
        action: Action effectuée (ex: 'CREER', 'MODIFIER', 'SUPPRIMER')
        type_ressource: Type de ressource (ex: 'CAPTEUR', 'ALERTE')
        id_ressource: ID de la ressource affectée
        details: Dictionnaire de détails supplémentaires
        ip_address: Adresse IP de la requête
    """
    # Backward-compatible alias used by some routes.
    if resource_id is not None:
        id_ressource = resource_id

    try:
        audit = JournalAudit(
            user_id=id_utilisateur,
            action=f"{action}_{type_ressource}",
            resource_type=type_ressource,
            resource_id=id_ressource,
            details=details or {},
            ip_address=ip_address
        )
        db.session.add(audit)
        db.session.commit()
        logger.debug(f"Journal d'audit créé: {action} sur {type_ressource} par l'utilisateur {id_utilisateur}")
    except Exception as e:
        logger.error(f"Erreur lors de la création du journal d'audit: {str(e)}")
        db.session.rollback()


def obtenir_historique_audit_utilisateur(id_utilisateur, limit=100):
    """Obtenir l'historique d'audit pour un utilisateur spécifique"""
    try:
        logs = JournalAudit.query.filter_by(user_id=id_utilisateur).order_by(
            JournalAudit.timestamp.desc()
        ).limit(limit).all()
        return [log.vers_dict() for log in logs]
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'historique d'audit: {str(e)}")
        return []


def obtenir_historique_audit_ressource(type_ressource, id_ressource, limit=50):
    """Obtenir l'historique d'audit pour une ressource spécifique"""
    try:
        logs = JournalAudit.query.filter_by(
            resource_type=type_ressource,
            resource_id=id_ressource
        ).order_by(JournalAudit.timestamp.desc()).limit(limit).all()
        return [log.vers_dict() for log in logs]
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'historique d'audit de la ressource: {str(e)}")
        return []
