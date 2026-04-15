from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Sensor, SensorReading, User
from datetime import datetime, timezone
from audit_logger import enregistrer_action
from sensor_simulator import generate_current_simulated_reading
import logging

capteurs_bp = Blueprint('sensors', __name__)
logger = logging.getLogger(__name__)

REAL_SENSOR_OFFLINE_TIMEOUT_SECONDS = 120
METHODES_CONNEXION_REELLES = {
    'http_push',
    'mqtt_bridge',
    'serial_gateway',
    'websocket_gateway',
}
MODELE_CAPTEUR_MAX_LEN = 120


def normaliser_type_capteur(type_capteur):
    valeur = str(type_capteur or 'simulation').strip().lower()
    return valeur if valeur in ('real', 'simulation') else None


def normaliser_modele_capteur(modele_capteur):
    if modele_capteur is None:
        return None

    valeur = str(modele_capteur).strip()
    if not valeur:
        return None

    return valeur[:MODELE_CAPTEUR_MAX_LEN]


def normaliser_methode_connexion(methode_connexion):
    if methode_connexion is None:
        return None

    valeur = str(methode_connexion).strip().lower()
    if not valeur:
        return None

    return valeur if valeur in METHODES_CONNEXION_REELLES else None


def analyser_horodatage_iso(valeur):
    if not valeur:
        return None

    brut = str(valeur).strip()
    if not brut:
        return None

    try:
        if brut.endswith('Z'):
            brut = brut[:-1] + '+00:00'
        parsed = datetime.fromisoformat(brut)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        return None


def capteur_reel_connecte(last_reading_iso):
    horodatage = analyser_horodatage_iso(last_reading_iso)
    if horodatage is None:
        return False

    age_secondes = (datetime.utcnow() - horodatage).total_seconds()
    return age_secondes <= REAL_SENSOR_OFFLINE_TIMEOUT_SECONDS


def synchroniser_connectivite_capteur_reel(sensor, sensor_dict):
    if sensor.sensor_type != 'real':
        return False

    connecte = capteur_reel_connecte(sensor_dict.get('lastReading'))
    nouveau_statut = sensor.status

    if connecte:
        if nouveau_statut == 'hors ligne':
            nouveau_statut = 'en ligne'
    else:
        nouveau_statut = 'hors ligne'

    modifie = False
    if sensor.is_live != connecte:
        sensor.is_live = connecte
        modifie = True
    if sensor.status != nouveau_statut:
        sensor.status = nouveau_statut
        modifie = True

    sensor_dict['is_live'] = connecte
    sensor_dict['status'] = nouveau_statut
    return modifie

@capteurs_bp.route('', methods=['GET'])
@jwt_required()
def obtenir_capteurs():
    """Obtenir tous les capteurs pour l'utilisateur courant avec filtrage et recherche optionnels"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Obtenir les paramètres de requête pour filtrage et recherche
        search = request.args.get('search', '').strip()
        status = request.args.get('status')  # 'en ligne', 'avertissement', 'hors ligne'
        sensor_type = request.args.get('type')
        is_active = request.args.get('active')
        sort_by = request.args.get('sort', 'name')  # 'name', 'updated_at', 'status'
        limit = request.args.get('limit', 100, type=int)
        
        # Admin peut voir tous les capteurs, les utilisateurs normaux seulement les leurs
        if user.role == 'admin':
            query = Sensor.query
        else:
            query = Sensor.query.filter_by(user_id=id_utilisateur_courant)
        
        # Appliquer le filtre de recherche
        if search:
            query = query.filter(
                db.or_(
                    Sensor.name.ilike(f'%{search}%'),
                    Sensor.location.ilike(f'%{search}%')
                )
            )
        
        # Appliquer le filtre d'état
        if status:
            query = query.filter_by(status=status)
        
        # Appliquer le filtre de type de capteur
        if sensor_type:
            query = query.filter_by(sensor_type=sensor_type)
        
        # Appliquer le filtre d'état actif
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter_by(is_live=is_active_bool)
        
        # Appliquer le tri
        if sort_by == 'updated_at':
            query = query.order_by(Sensor.updated_at.desc())
        elif sort_by == 'status':
            query = query.order_by(Sensor.status)
        else:  # défaut: nom
            query = query.order_by(Sensor.name)
        
        capteurs = query.limit(limit).all()
        
        # Inclure les dernières lectures pour chaque capteur (générer à la demande pour les capteurs simulés)
        donnees_capteurs = []
        doit_commiter = False
        for sensor in capteurs:
            sensor_dict = sensor.vers_dict(inclure_dernière_lecture=True)
            
            # Pour les capteurs simulés sans lectures récentes, générer une à la demande
            if sensor.sensor_type == 'simulation':
                derniere_lecture = SensorReading.query.filter_by(sensor_id=sensor.id).order_by(
                    SensorReading.recorded_at.desc()
                ).first()
                
                # Si aucune lecture existe ou la lecture est obsolète (>1 minute), générer de nouvelles données
                if not derniere_lecture or (datetime.utcnow() - derniere_lecture.recorded_at).total_seconds() > 60:
                    simulated_data = generate_current_simulated_reading(sensor.name)
                    sensor_dict['co2'] = simulated_data['co2']
                    sensor_dict['temperature'] = simulated_data['temperature']
                    sensor_dict['humidity'] = simulated_data['humidity']
                    sensor_dict['lastReading'] = datetime.utcnow().isoformat()

            if sensor.sensor_type == 'real':
                if synchroniser_connectivite_capteur_reel(sensor, sensor_dict):
                    doit_commiter = True
            
            donnees_capteurs.append(sensor_dict)

        if doit_commiter:
            db.session.commit()
        
        return jsonify({
            'sensors': donnees_capteurs,
            'count': len(donnees_capteurs),
            'filters': {
                'search': search,
                'status': status,
                'type': sensor_type,
                'active': is_active,
                'sort': sort_by
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des capteurs: {str(e)}")
        return jsonify({'error': str(e)}), 500


@capteurs_bp.route('/<int:sensor_id>', methods=['GET'])
@jwt_required()
def obtenir_capteur(sensor_id):
    """Obtenir un capteur spécifique par ID"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        capteur = Sensor.query.get(sensor_id)
        
        if not capteur:
            return jsonify({'error': 'Capteur non trouvé'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and capteur.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à ce capteur'}), 403
        
        sensor_dict = capteur.vers_dict(inclure_dernière_lecture=True)
        
        # Pour les capteurs simulés, générer des données fraêches à la demande
        if capteur.sensor_type == 'simulation':
            derniere_lecture = SensorReading.query.filter_by(sensor_id=capteur.id).order_by(
                SensorReading.recorded_at.desc()
            ).first()
            
            # Si aucune lecture existe ou la lecture est obsolète (>1 minute), générer de nouvelles données
            if not derniere_lecture or (datetime.utcnow() - derniere_lecture.recorded_at).total_seconds() > 60:
                simulated_data = generate_current_simulated_reading(capteur.name)
                sensor_dict['co2'] = simulated_data['co2']
                sensor_dict['temperature'] = simulated_data['temperature']
                sensor_dict['humidity'] = simulated_data['humidity']
                sensor_dict['lastReading'] = datetime.utcnow().isoformat()

        if capteur.sensor_type == 'real':
            if synchroniser_connectivite_capteur_reel(capteur, sensor_dict):
                db.session.commit()
        
        return jsonify({'sensor': sensor_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@capteurs_bp.route('', methods=['POST'])
@jwt_required()
def creer_capteur():
    """Créer un nouveau capteur"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        data = request.get_json() or {}
        
        nom = str(data.get('name') or '').strip()
        lieu = str(data.get('location') or '').strip()
        type_capteur = normaliser_type_capteur(data.get('sensor_type', 'simulation'))
        modele_capteur = normaliser_modele_capteur(data.get('sensor_model'))
        methode_connexion = normaliser_methode_connexion(data.get('connection_method'))
        
        if not nom or not lieu:
            return jsonify({'error': 'Le nom et le lieu sont requis'}), 400

        if type_capteur is None:
            return jsonify({'error': 'Le type de capteur doit être real ou simulation'}), 400

        if 'connection_method' in data and data.get('connection_method') is not None and methode_connexion is None:
            return jsonify({'error': 'Méthode de connexion invalide'}), 400

        capteur_reel = type_capteur == 'real'

        if capteur_reel:
            if methode_connexion is None:
                methode_connexion = 'http_push'
            if not modele_capteur:
                modele_capteur = 'generic'
        else:
            modele_capteur = None
            methode_connexion = None
        
        nouveau_capteur = Sensor(
            user_id=id_utilisateur_courant,
            name=nom,
            location=lieu,
            sensor_type=type_capteur,
            sensor_model=modele_capteur,
            connection_method=methode_connexion,
            status='hors ligne' if capteur_reel else 'en ligne',
            battery=None if type_capteur == 'simulation' else 100,
            is_live=not capteur_reel
        )
        
        db.session.add(nouveau_capteur)
        db.session.commit()
        
        # Enregistrer l'action
        enregistrer_action(id_utilisateur_courant, 'CREER', 'CAPTEUR', resource_id=nouveau_capteur.id, details={
            'name': nom,
            'location': lieu,
            'sensor_type': type_capteur,
            'sensor_model': modele_capteur,
            'connection_method': methode_connexion,
        })
        
        return jsonify({
            'message': 'Capteur créé avec succès',
            'sensor': nouveau_capteur.vers_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors de la création du capteur: {str(e)}")
        return jsonify({'error': str(e)}), 500


@capteurs_bp.route('/<int:sensor_id>', methods=['PUT'])
@jwt_required()
def mettre_a_jour_capteur(sensor_id):
    """Mettre à jour un capteur"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        capteur = Sensor.query.get(sensor_id)
        
        if not capteur:
            return jsonify({'error': 'Capteur non trouvé'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and capteur.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à ce capteur'}), 403
        
        data = request.get_json() or {}
        
        if 'name' in data:
            capteur.name = data['name']
        if 'location' in data:
            capteur.location = data['location']
        if 'sensor_type' in data:
            type_capteur = normaliser_type_capteur(data['sensor_type'])
            if type_capteur is None:
                return jsonify({'error': 'Le type de capteur doit être real ou simulation'}), 400

            capteur.sensor_type = type_capteur
            if capteur.sensor_type == 'simulation':
                capteur.sensor_model = None
                capteur.connection_method = None
                capteur.battery = None
                capteur.status = 'en ligne'
                capteur.is_live = True
            else:
                if not capteur.sensor_model:
                    capteur.sensor_model = 'generic'
                if not capteur.connection_method:
                    capteur.connection_method = 'http_push'
                capteur.status = 'hors ligne'
                capteur.is_live = False
                if capteur.battery is None:
                    capteur.battery = 100
        if 'sensor_model' in data:
            modele_capteur = normaliser_modele_capteur(data.get('sensor_model'))
            if capteur.sensor_type == 'real' and not modele_capteur:
                return jsonify({'error': 'Le modèle du capteur réel est requis'}), 400
            capteur.sensor_model = modele_capteur if capteur.sensor_type == 'real' else None
        if 'connection_method' in data:
            methode_connexion = normaliser_methode_connexion(data.get('connection_method'))
            if capteur.sensor_type == 'real' and methode_connexion is None:
                return jsonify({'error': 'Méthode de connexion invalide'}), 400
            capteur.connection_method = methode_connexion if capteur.sensor_type == 'real' else None
        if 'status' in data:
            capteur.status = data['status']
        if 'battery' in data and capteur.sensor_type != 'simulation':
            capteur.battery = data['battery']
        if 'is_live' in data:
            capteur.is_live = data['is_live']

        if capteur.sensor_type == 'real':
            if not capteur.sensor_model:
                capteur.sensor_model = 'generic'
            if not capteur.connection_method:
                capteur.connection_method = 'http_push'
        
        capteur.updated_at = datetime.utcnow()
        
        # Enregistrer l'action
        enregistrer_action(id_utilisateur_courant, 'METTRE_A_JOUR', 'CAPTEUR', resource_id=sensor_id, details=data)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Capteur mis à jour avec succès',
            'sensor': capteur.vers_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors de la mise à jour du capteur: {str(e)}")
        return jsonify({'error': str(e)}), 500


@capteurs_bp.route('/<int:sensor_id>/thresholds', methods=['PUT'])
@jwt_required()
def mettre_a_jour_seuils_capteur(sensor_id):
    """Mettre à jour les seuils d'alerte pour un capteur spécifique"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        capteur = Sensor.query.get(sensor_id)
        
        if not capteur:
            return jsonify({'error': 'Capteur non trouvé'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and capteur.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à ce capteur'}), 403
        
        data = request.get_json()
        
        # Mettre à jour les seuils (None signifie utiliser les defaults globaux)
        if 'co2' in data:
            capteur.threshold_co2 = float(data['co2']) if data['co2'] is not None else None
        if 'temp_min' in data:
            capteur.threshold_temp_min = float(data['temp_min']) if data['temp_min'] is not None else None
        if 'temp_max' in data:
            capteur.threshold_temp_max = float(data['temp_max']) if data['temp_max'] is not None else None
        if 'humidity' in data:
            capteur.threshold_humidity = float(data['humidity']) if data['humidity'] is not None else None
        
        capteur.updated_at = datetime.utcnow()
        
        # Enregistrer l'action
        enregistrer_action(id_utilisateur_courant, 'METTRE_A_JOUR', 'SEUILS_CAPTEUR', resource_id=sensor_id, details=data)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Seuils du capteur mis à jour avec succès',
            'thresholds': {
                'co2': capteur.threshold_co2,
                'temp_min': capteur.threshold_temp_min,
                'temp_max': capteur.threshold_temp_max,
                'humidity': capteur.threshold_humidity
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors de la mise à jour des seuils du capteur: {str(e)}")
        return jsonify({'error': str(e)}), 500


@capteurs_bp.route('/<int:sensor_id>', methods=['DELETE'])
@jwt_required()
def supprimer_capteur(sensor_id):
    """Supprimer un capteur"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        capteur = Sensor.query.get(sensor_id)
        
        if not capteur:
            return jsonify({'error': 'Capteur non trouvé'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and capteur.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à ce capteur'}), 403
        
        # Enregistrer l'action avant la suppression
        enregistrer_action(id_utilisateur_courant, 'SUPPRIMER', 'CAPTEUR', resource_id=sensor_id, details={
            'name': capteur.name,
            'location': capteur.location
        })
        
        db.session.delete(capteur)
        db.session.commit()
        
        return jsonify({'message': 'Capteur supprimé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
