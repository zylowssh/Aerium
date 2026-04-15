from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from database import db, User, Sensor
import bcrypt
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


def _provision_starter_sensor_if_missing(user: User) -> None:
    """Ensure non-admin users always have at least one simulation sensor."""
    if not user or user.role == 'admin':
        return

    try:
        existing_count = Sensor.query.filter_by(user_id=user.id).count()
        if existing_count > 0:
            return

        starter_sensor = Sensor(
            user_id=user.id,
            name='Capteur Initial',
            location='Zone Principale',
            status='en ligne',
            sensor_type='simulation',
            battery=None,
            is_live=True,
        )
        db.session.add(starter_sensor)
        db.session.commit()
        logger.info('Starter sensor provisioned for user_id=%s', user.id)
    except Exception as exc:
        db.session.rollback()
        logger.warning('Failed to provision starter sensor for user_id=%s: %s', getattr(user, 'id', None), exc)

@auth_bp.route('/register', methods=['POST'])
def inscrire():
    """Inscrire un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName', data.get('full_name', ''))
        
        if not email or not password:
            return jsonify({'error': 'L\'email et le mot de passe sont requis'}), 400
        
        # Vérifier si l'utilisateur existe déjà
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email déjà enregistré'}), 400
        
        # Hacher le mot de passe
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Créer un nouvel utilisateur
        new_user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role='user'
        )
        
        db.session.add(new_user)
        db.session.commit()

        # Provision a starter simulation sensor so first dashboard load is never empty.
        _provision_starter_sensor_if_missing(new_user)
        
        return jsonify({
            'message': 'Utilisateur enregistré avec succès',
            'user': new_user.vers_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def connexion():
    """Authentifier l'utilisateur et retourner les jetons JWT"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email et mot de passe requis'}), 400
        
        # Trouver l'utilisateur
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Identifiants de connexion invalides'}), 401
        
        # Vérifier le mot de passe
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Identifiants de connexion invalides'}), 401

        # Backfill starter sensor for legacy accounts created before provisioning existed.
        _provision_starter_sensor_if_missing(user)
        
        # Créer les jetons avec une identité explicite
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.vers_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur du serveur: {str(e)}'}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def rafraîchir():
    """Rafraîchir le jeton d'accès"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en chaîne pour la cohérence
        access_token = create_access_token(identity=str(id_utilisateur_courant))
        
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def obtenir_utilisateur_courant():
    """Obtenir les informations de l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si c'est une chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Ensure legacy accounts also receive starter data on active sessions.
        _provision_starter_sensor_if_missing(user)

        return jsonify({'user': user.vers_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def déconnexion():
    """Déconnecter l'utilisateur (suppression du jeton côté client)"""
    return jsonify({'message': 'Déconnexion réussie'}), 200
