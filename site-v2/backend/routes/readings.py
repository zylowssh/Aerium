from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, SensorReading, Sensor, User, Alert, AlertHistory
from datetime import datetime, timedelta
from audit_logger import enregistrer_action
from sensor_simulator import generate_historical_simulated_readings, generate_current_simulated_reading
import logging

lectures_bp = Blueprint('readings', __name__)
logger = logging.getLogger(__name__)

@lectures_bp.route('/sensor/<int:sensor_id>', methods=['GET'])
@jwt_required()
def obtenir_lectures_capteur(sensor_id):
    """Obtenir les lectures pour un capteur spécifique (générer à la demande pour les capteurs simulés)"""
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
        
        # Obtenir les paramètres de requête
        limit = request.args.get('limit', 100, type=int)
        heures = request.args.get('hours', 24, type=int)
        
        # Pour les capteurs simulés, générer des données historiques à la demande
        if capteur.sensor_type == 'simulation':
            lectures_simulees = generate_historical_simulated_readings(capteur.name, heures)
            
            # Retourner un nombre limité de lectures
            donnees_lectures = [
                {
                    'id': idx,
                    'sensor_id': sensor_id,
                    'co2': r['co2'],
                    'temperature': r['temperature'],
                    'humidity': r['humidity'],
                    'recorded_at': r['recorded_at']
                }
                for idx, r in enumerate(lectures_simulees[-limit:])
            ]
            
            return jsonify({
                'readings': donnees_lectures
            }), 200
        
        # Pour les capteurs réels, obtenir les lectures réelles de la base de données
        # Calculer l'intervalle de temps
        temps_fin = datetime.utcnow()
        temps_debut = temps_fin - timedelta(hours=heures)
        
        lectures = SensorReading.query.filter(
            SensorReading.sensor_id == sensor_id,
            SensorReading.recorded_at >= temps_debut
        ).order_by(SensorReading.recorded_at.desc()).limit(limit).all()
        
        return jsonify({
            'readings': [lecture.vers_dict() for lecture in lectures]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lectures_bp.route('', methods=['POST'])
@jwt_required()
def ajouter_lecture():
    """Ajouter une nouvelle lecture de capteur"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        data = request.get_json()
        
        sensor_id = data.get('sensor_id')
        co2 = data.get('co2')
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        
        if not sensor_id or co2 is None or temperature is None or humidity is None:
            return jsonify({'error': 'sensor_id, co2, temperature, et humidity sont requis'}), 400
        
        capteur = Sensor.query.get(sensor_id)
        
        if not capteur:
            return jsonify({'error': 'Capteur non trouvé'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and capteur.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à ce capteur'}), 403
        
        nouvelle_lecture = SensorReading(
            sensor_id=sensor_id,
            co2=float(co2),
            temperature=float(temperature),
            humidity=float(humidity)
        )
        
        db.session.add(nouvelle_lecture)
        
        # Vérifier les seuils et déclencher des aler
        verifier_seuils(capteur, id_utilisateur_courant, co2, temperature, humidity)
        
        # Mettre à jour l'état du capteur en fonction des niveaux de CO2
        if co2 > 1200:
            capteur.status = 'avertissement'
        elif co2 >= 1000:
            capteur.status = 'avertissement'
        else:
            capteur.status = 'en ligne'
        
        capteur.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Enregistrer l'action
        enregistrer_action(id_utilisateur_courant, 'CREER', 'LECTURE', resource_id=nouvelle_lecture.id)
        
        return jsonify({
            'message': 'Lecture ajoutée avec succès',
            'reading': nouvelle_lecture.vers_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors de l'ajout de la lecture: {str(e)}")
        return jsonify({'error': str(e)}), 500


def verifier_seuils(capteur, id_utilisateur_courant, co2, temperature, humidity):
    """Vérifier si les lectures dépassent les seuils configurés et déclencher des alertes"""
    try:
        # Obtenir les seuils - utiliser ceux spécifiques au capteur s'ils sont définis, sinon les défauts globaux
        seuil_co2 = capteur.threshold_co2 if capteur.threshold_co2 is not None else current_app.config.get('ALERT_CO2_THRESHOLD', 1200)
        temp_min = capteur.threshold_temp_min if capteur.threshold_temp_min is not None else current_app.config.get('ALERT_TEMP_MIN', 15)
        temp_max = capteur.threshold_temp_max if capteur.threshold_temp_max is not None else current_app.config.get('ALERT_TEMP_MAX', 28)
        seuil_humidite = capteur.threshold_humidity if capteur.threshold_humidity is not None else current_app.config.get('ALERT_HUMIDITY_THRESHOLD', 80)
        
        user = User.query.get(id_utilisateur_courant)
        
        # Vérifier les niveaux de CO2
        if co2 > seuil_co2:
            envoyer_alerte_seuil(
                capteur,
                user,
                'avertissement',
                'co2',
                f'Le niveau de CO2 {co2} ppm dépasse le seuil {seuil_co2} ppm',
                co2,
                seuil_co2
            )
        
        # Vérifier la température
        if temperature < temp_min or temperature > temp_max:
            seuil = temp_min if temperature < temp_min else temp_max
            envoyer_alerte_seuil(
                capteur,
                user,
                'avertissement',
                'temperature',
                f'La température {temperature}°C est en dehors de la plage',
                temperature,
                seuil
            )
        
        # Vérifier l'humidité
        if humidity > seuil_humidite:
            envoyer_alerte_seuil(
                capteur,
                user,
                'avertissement',
                'humidity',
                f'Le niveau d\'humidité {humidity}% dépasse le seuil {seuil_humidite}%',
                humidity,
                seuil_humidite
            )
    
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des seuils: {str(e)}")


def envoyer_alerte_seuil(capteur, user, type_alerte, metrique, message, valeur, seuil):
    """Envoyer une alerte quand un seuil est dépassé"""
    try:
        type_normalise = type_alerte if type_alerte in ['info', 'avertissement', 'critique'] else 'avertissement'

        # Vérifier les alertes existantes non résolues pour éviter les doublons
        alerte_existante = Alert.query.filter_by(
            sensor_id=capteur.id,
            alert_type=type_normalise,
            status='nouvelle'
        ).filter(
            Alert.message.like(f'%{metrique}%')
        ).first()
        
        if alerte_existante:
            logger.info(f"Alerte duplicée ignorée pour le capteur {capteur.id}, métrique {metrique} - ID d'alerte existante: {alerte_existante.id}")
            return  # Ne pas créer d'alerte duplicée

        # Créer un enregistrement d'historique d'alerte
        historique_alerte = AlertHistory(
            user_id=user.id,
            sensor_id=capteur.id,
            alert_type=type_normalise,
            metric=metrique,
            metric_value=float(valeur),
            threshold_value=float(seuil) if seuil is not None else None,
            message=message,
            status='triggered'
        )
        db.session.add(historique_alerte)

        # Créer une alerte pour le tableau de bord
        alerte = Alert(
            user_id=user.id,
            sensor_id=capteur.id,
            alert_type=type_normalise,
            message=message,
            value=float(valeur)
        )
        db.session.add(alerte)
        db.session.commit()
        
        logger.info(f"Alerte déclenchée pour le capteur {capteur.id}: {type_alerte}")
    
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'alerte de seuil: {str(e)}")


@lectures_bp.route('/aggregate', methods=['GET'])
@jwt_required()
def obtenir_donnees_agregees():
    """Obtenir les données agrégées des capteurs pour l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        # Obtenir tous les capteurs de l'utilisateur
        if user.role == 'admin':
            capteurs = Sensor.query.all()
        else:
            capteurs = Sensor.query.filter_by(user_id=id_utilisateur_courant).all()
        
        ids_capteurs = [s.id for s in capteurs]
        
        if not ids_capteurs:
            return jsonify({
                'avgCo2': 0,
                'avgTemperature': 0,
                'avgHumidity': 0,
                'totalReadings': 0
            }), 200
        
        # Obtenir les lectures récentes (dernières 24 heures)
        temps_fin = datetime.utcnow()
        temps_debut = temps_fin - timedelta(hours=24)
        
        lectures = SensorReading.query.filter(
            SensorReading.sensor_id.in_(ids_capteurs),
            SensorReading.recorded_at >= temps_debut
        ).all()
        
        if not lectures:
            # Fallback: utiliser un échantillon en temps réel pour les capteurs simulés
            # afin que les widgets affichent des valeurs utiles même sans historique persisté.
            fallback = []
            for capteur in capteurs:
                if capteur.sensor_type == 'simulation':
                    sim = generate_current_simulated_reading(capteur.name)
                    fallback.append({
                        'co2': float(sim['co2']),
                        'temperature': float(sim['temperature']),
                        'humidity': float(sim['humidity'])
                    })
                    continue

                derniere_lecture = SensorReading.query.filter_by(sensor_id=capteur.id).order_by(
                    SensorReading.recorded_at.desc()
                ).first()
                if derniere_lecture:
                    fallback.append({
                        'co2': float(derniere_lecture.co2),
                        'temperature': float(derniere_lecture.temperature),
                        'humidity': float(derniere_lecture.humidity)
                    })

            if not fallback:
                return jsonify({
                    'avgCo2': 0,
                    'avgTemperature': 0,
                    'avgHumidity': 0,
                    'totalReadings': 0
                }), 200

            moy_co2 = sum(r['co2'] for r in fallback) / len(fallback)
            moy_temp = sum(r['temperature'] for r in fallback) / len(fallback)
            moy_humidite = sum(r['humidity'] for r in fallback) / len(fallback)

            return jsonify({
                'avgCo2': round(moy_co2, 2),
                'avgTemperature': round(moy_temp, 2),
                'avgHumidity': round(moy_humidite, 2),
                'totalReadings': len(fallback)
            }), 200
        
        # Calculer les moyennes
        moy_co2 = sum(r.co2 for r in lectures) / len(lectures)
        moy_temp = sum(r.temperature for r in lectures) / len(lectures)
        moy_humidite = sum(r.humidity for r in lectures) / len(lectures)
        
        return jsonify({
            'avgCo2': round(moy_co2, 2),
            'avgTemperature': round(moy_temp, 2),
            'avgHumidity': round(moy_humidite, 2),
            'totalReadings': len(lectures)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lectures_bp.route('/external/<sensor_api_key>', methods=['POST'])
def ajouter_lecture_externe(sensor_api_key):
    """
    Point de terminaison externe pour les capteurs réels (SDC30, etc.) pour pousser les données.
    Ce point de terminaison utilise l'authentification par clé API au lieu de JWT pour les appareils IoT.
    La sensor_api_key est l'ID du capteur pour l'instant (peut être améliorée avec des clés API plus tard)
    """
    try:
        configured_iot_key = current_app.config.get('IOT_INGEST_API_KEY')
        if not configured_iot_key:
            return jsonify({'error': 'Ingestion IoT non configurée côté serveur'}), 503

        provided_key = request.headers.get('X-API-Key')
        auth_header = request.headers.get('Authorization', '')
        if not provided_key and auth_header.lower().startswith('bearer '):
            provided_key = auth_header.split(' ', 1)[1].strip()

        if not provided_key or provided_key != configured_iot_key:
            return jsonify({'error': 'Authentification IoT invalide'}), 401

        data = request.get_json()
        
        co2 = data.get('co2')
        temperature = data.get('temperature')
        humidity = data.get('humidity')
        
        if co2 is None or temperature is None or humidity is None:
            return jsonify({'error': 'co2, temperature, et humidity sont requis'}), 400
        
        # Trouver le capteur par ID (traiter api_key comme sensor_id pour simplicité)
        try:
            sensor_id = int(sensor_api_key)
        except ValueError:
            return jsonify({'error': 'Identifiant de capteur invalide'}), 400
            
        capteur = Sensor.query.get(sensor_id)
        
        if not capteur:
            return jsonify({'error': 'Capteur non trouvé'}), 404
        
        # Permettre uniquement aux capteurs réels d'utiliser ce point de terminaison
        if capteur.sensor_type != 'real':
            return jsonify({'error': 'Ce point de terminaison est réservé aux capteurs réels'}), 403
        
        nouvelle_lecture = SensorReading(
            sensor_id=sensor_id,
            co2=float(co2),
            temperature=float(temperature),
            humidity=float(humidity)
        )
        
        db.session.add(nouvelle_lecture)

        # Vérifier les seuils et déclencher des alertes
        verifier_seuils(capteur, capteur.user_id, co2, temperature, humidity)
        
        # Mettre à jour l'état du capteur en fonction des niveaux de CO2
        if co2 > 1200:
            capteur.status = 'avertissement'
        elif co2 >= 1000:
            capteur.status = 'avertissement'
        else:
            capteur.status = 'en ligne'
        
        capteur.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Lecture enregistrée avec succès',
            'reading': nouvelle_lecture.vers_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lectures_bp.route('/latest/<int:sensor_id>', methods=['GET'])
@jwt_required()
def obtenir_derniere_lecture(sensor_id):
    """Obtenir la dernière lecture pour un capteur spécifique. Pour les capteurs simulés, générer et enregistrer si obsolète."""
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
        
        # Obtenir la dernière lecture
        derniere_lecture = SensorReading.query.filter_by(
            sensor_id=sensor_id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        # Pour les capteurs simulés, générer une lecture fraêche à la demande sans persister
        if capteur.sensor_type == 'simulation':
            if derniere_lecture and (datetime.utcnow() - derniere_lecture.recorded_at).total_seconds() <= 60:
                return jsonify({
                    'reading': derniere_lecture.vers_dict(),
                    'sensor': capteur.vers_dict()
                }), 200

            donnees_simulees = generate_current_simulated_reading(capteur.name)
            lecture_simulee = {
                'id': 0,
                'sensor_id': sensor_id,
                'co2': donnees_simulees['co2'],
                'temperature': donnees_simulees['temperature'],
                'humidity': donnees_simulees['humidity'],
                'recorded_at': datetime.utcnow().isoformat()
            }
            return jsonify({
                'reading': lecture_simulee,
                'sensor': capteur.vers_dict()
            }), 200
        
        if not derniere_lecture:
            return jsonify({'error': 'Aucune lecture trouvée pour ce capteur'}), 404
        
        return jsonify({
            'reading': derniere_lecture.vers_dict(),
            'sensor': capteur.vers_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
