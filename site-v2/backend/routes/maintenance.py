from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Maintenance, Sensor, User
from datetime import datetime, timedelta

maintenance_bp = Blueprint('maintenance', __name__)


def analyser_datetime_iso(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (TypeError, ValueError):
        return None

@maintenance_bp.route('', methods=['GET'])
@jwt_required()
def obtenir_maintenance():
    """Obtenir les t\u00e2ches de maintenance pour l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Obtenir les paramètres de requête
        status = request.args.get('status')  # 'scheduled', 'in_progress', 'completed', 'overdue'
        sensor_id = request.args.get('sensor_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        # Construire la requête
        if user.role == 'admin':
            query = Maintenance.query
        else:
            query = Maintenance.query.filter_by(user_id=id_utilisateur_courant)
        
        # Filtrer par état si fourni
        if status:
            query = query.filter_by(status=status)
        
        # Filtrer par capteur si fourni
        if sensor_id:
            query = query.filter_by(sensor_id=sensor_id)
        
        # Obtenir les t\u00e2ches ordonnées par date planifiée
        tasks = query.order_by(Maintenance.scheduled_date).limit(limit).all()
        
        return jsonify({'maintenance': [task.vers_dict() for task in tasks]}), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération de la maintenance: {e}")
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('', methods=['POST'])
@jwt_required()
def creer_maintenance():
    """Créer une nouvelle t\u00e2che de maintenance"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        
        # Valider les champs requis
        if not data.get('sensorId') or not data.get('type') or not data.get('scheduledDate'):
            return jsonify({'error': 'Champs requis manquants'}), 400

        scheduled_date = analyser_datetime_iso(data.get('scheduledDate'))
        if not scheduled_date:
            return jsonify({'error': 'Format de date invalide'}), 400
        
        capteur = Sensor.query.get(data['sensorId'])
        if not capteur or (user.role != 'admin' and capteur.user_id != id_utilisateur_courant):
            return jsonify({'error': 'Capteur non trouvé ou non autorisé'}), 404
        
        # Créer la t\u00e2che de maintenance
        maintenance = Maintenance(
            sensor_id=data['sensorId'],
            user_id=id_utilisateur_courant,
            type=data['type'],
            status=data.get('status', 'scheduled'),
            scheduled_date=scheduled_date,
            description=data.get('description'),
            notes=data.get('notes'),
            priority=data.get('priority', 'normal')
        )
        
        db.session.add(maintenance)
        db.session.commit()
        
        return jsonify({'maintenance': maintenance.vers_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la création de la maintenance: {e}")
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('/<int:maintenance_id>', methods=['GET'])
@jwt_required()
def obtenir_tache_maintenance(maintenance_id):
    """Obtenir une t\u00e2che de maintenance spécifique"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        maintenance = Maintenance.query.get(maintenance_id)
        
        if not maintenance:
            return jsonify({'error': 'T\u00e2che de maintenance non trouvée'}), 404
        
        if user.role != 'admin' and maintenance.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Non autorisé'}), 403
        
        return jsonify({'maintenance': maintenance.vers_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('/<int:maintenance_id>', methods=['PUT'])
@jwt_required()
def mettre_a_jour_maintenance(maintenance_id):
    """Mettre \u00e0 jour une t\u00e2che de maintenance"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        maintenance = Maintenance.query.get(maintenance_id)
        
        if not maintenance:
            return jsonify({'error': 'T\u00e2che de maintenance non trouvée'}), 404
        
        if user.role != 'admin' and maintenance.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Non autorisé'}), 403
        
        data = request.get_json()
        
        # Mettre \u00e0 jour les champs
        if 'type' in data:
            maintenance.type = data['type']
        if 'status' in data:
            maintenance.status = data['status']
            if data['status'] == 'completed':
                maintenance.completed_date = datetime.utcnow()
        if 'scheduledDate' in data:
            scheduled_date = analyser_datetime_iso(data.get('scheduledDate'))
            if not scheduled_date:
                return jsonify({'error': 'Format de date invalide'}), 400
            maintenance.scheduled_date = scheduled_date
        if 'description' in data:
            maintenance.description = data['description']
        if 'notes' in data:
            maintenance.notes = data['notes']
        if 'priority' in data:
            maintenance.priority = data['priority']
        
        maintenance.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'maintenance': maintenance.vers_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la mise \u00e0 jour de la maintenance: {e}")
        return jsonify({'error': str(e)}), 500


@maintenance_bp.route('/<int:maintenance_id>', methods=['DELETE'])
@jwt_required()
def supprimer_maintenance(maintenance_id):
    """Supprimer une t\u00e2che de maintenance"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        maintenance = Maintenance.query.get(maintenance_id)
        
        if not maintenance:
            return jsonify({'error': 'T\u00e2che de maintenance non trouvée'}), 404
        
        if user.role != 'admin' and maintenance.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Non autorisé'}), 403
        
        db.session.delete(maintenance)
        db.session.commit()
        
        return jsonify({'message': 'T\u00e2che de maintenance supprimée'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
