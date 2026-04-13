from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Alert, AlertHistory, Sensor, User, SensorReading
from datetime import datetime, timedelta
import json
import os
import pandas as pd
import requests
from sensor_simulator import generate_historical_simulated_readings

try:
    from prophet import Prophet
except Exception:  # pragma: no cover - handled at runtime
    Prophet = None

PROPHET_RUNTIME_DISABLED = False
PROPHET_DISABLE_REASON = None

alertes_bp = Blueprint('alerts', __name__)
MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'


def _mistral_key():
    return os.getenv('MISTRAL_API_KEY', '').strip()


def _mistral_model():
    return os.getenv('MISTRAL_MODEL', 'mistral-small-latest')


def _call_mistral_json(messages, max_tokens=500):
    """Appel Mistral synchrone, retourne le texte brut ou None en cas d'erreur."""
    if not _mistral_key():
        return None

    try:
        response = requests.post(
            MISTRAL_URL,
            headers={
                'Authorization': f'Bearer {_mistral_key()}',
                'Content-Type': 'application/json',
            },
            json={
                'model': _mistral_model(),
                'messages': messages,
                'temperature': 0.2,
                'max_tokens': max_tokens,
            },
            timeout=12,
        )

        if response.status_code != 200:
            print(f"[ALERTS] Mistral HTTP {response.status_code}: {response.text[:180]}")
            return None

        payload = response.json()
        return payload.get('choices', [{}])[0].get('message', {}).get('content')
    except Exception as exc:
        print(f"[ALERTS] Erreur Mistral: {exc}")
        return None


def _parse_json_array(raw_text):
    """Extraire un tableau JSON d'une réponse LLM, même avec du markdown autour."""
    if not raw_text:
        return None

    candidate = str(raw_text).strip()
    if candidate.startswith('```'):
        candidate = candidate.replace('```json', '').replace('```', '').strip()

    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, list) else None
    except Exception:
        pass

    start = candidate.find('[')
    end = candidate.rfind(']')
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        parsed = json.loads(candidate[start:end + 1])
        return parsed if isinstance(parsed, list) else None
    except Exception:
        return None


def enrichir_predictions_avec_mistral(predictions):
    """Améliorer les titres/descriptions des prédictions via Mistral, sans changer le schéma de sortie."""
    if not predictions or not _mistral_key():
        return predictions

    a_enrichir = [dict(item) for item in predictions[:6]]
    donnees_llm = []
    for index, item in enumerate(a_enrichir):
        donnees_llm.append({
            'index': index,
            'sensorName': item.get('sensorName'),
            'metric': item.get('metric'),
            'currentValue': item.get('currentValue'),
            'trendPercentage': item.get('trendPercentage'),
            'likelihood': item.get('likelihood'),
            'impact': item.get('impact'),
            'title': item.get('title'),
            'description': item.get('description'),
            'timeframe': item.get('timeframe'),
        })

    prompt = (
        "Tu reçois des alertes prédictives de qualité de l'air. "
        "Réécris title et description en français clair et professionnel, "
        "en restant fidèle aux chiffres et sans inventer d'informations. "
        "Tu peux ajuster timeframe pour le rendre plus naturel. "
        "Retourne UNIQUEMENT un tableau JSON avec: index, title, description, timeframe.\n\n"
        f"Entrée:\n{json.dumps(donnees_llm, ensure_ascii=False)}"
    )

    brut = _call_mistral_json([{'role': 'user', 'content': prompt}], max_tokens=700)
    suggestions = _parse_json_array(brut)
    if not suggestions:
        return predictions

    for suggestion in suggestions:
        if not isinstance(suggestion, dict):
            continue

        try:
            index = int(str(suggestion.get('index', '')).strip())
        except Exception:
            continue

        if index < 0 or index >= len(a_enrichir):
            continue

        titre = suggestion.get('title')
        description = suggestion.get('description')
        timeframe = suggestion.get('timeframe')

        if isinstance(titre, str) and titre.strip():
            a_enrichir[index]['title'] = titre.strip()[:140]
        if isinstance(description, str) and description.strip():
            a_enrichir[index]['description'] = description.strip()[:260]
        if isinstance(timeframe, str) and timeframe.strip():
            a_enrichir[index]['timeframe'] = timeframe.strip()[:60]

    return a_enrichir + predictions[len(a_enrichir):]

@alertes_bp.route('', methods=['GET'])
@jwt_required()
def obtenir_alertes():
    """Obtenir les alertes pour l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        
        # Convertir en int si chaîne
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
            
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Obtenir les paramètres de requête
        status = request.args.get('status')  # 'nouvelle', 'reconnue', 'résolue'
        limit = request.args.get('limit', 50, type=int)
        
        # Vérifier si la table des alertes existe
        try:
            # Construire la requête
            if user.role == 'admin':
                query = Alert.query
            else:
                query = Alert.query.filter_by(user_id=id_utilisateur_courant)
            
            # Filtrer par statut si fourni
            if status:
                query = query.filter_by(status=status)
            
            # Obtenir les alertes triées par les plus récentes
            alertes = query.order_by(Alert.created_at.desc()).limit(limit).all()
            
            return jsonify({'alerts': [alerte.vers_dict() for alerte in alertes]}), 200
        except Exception as erreur_requete:
            # Si la table n'existe pas ou la requête échoue, retourner une liste vide
            print(f"Erreur de requête (retour vide): {erreur_requete}")
            return jsonify({'alerts': []}), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des alertes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'alerts': []}), 200


@alertes_bp.route('/<int:alert_id>', methods=['PUT'])
@jwt_required()
def mettre_a_jour_statut_alerte(alert_id):
    """Mettre à jour le statut de l'alerte"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        user = User.query.get(id_utilisateur_courant)
        
        alerte = Alert.query.get(alert_id)
        
        if not alerte:
            return jsonify({'error': 'Alerte non trouvée'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and alerte.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à cette alerte'}), 403
        
        data = request.get_json()
        nouveau_statut = data.get('status')
        
        if nouveau_statut not in ['nouvelle', 'reconnue', 'résolue']:
            return jsonify({'error': 'Statut invalide'}), 400
        
        alerte.status = nouveau_statut
        db.session.commit()
        
        return jsonify({
            'message': 'Statut de l\'alerte mis à jour avec succès',
            'alert': alerte.vers_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@alertes_bp.route('/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def supprimer_alerte(alert_id):
    """Supprimer une alerte"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        user = User.query.get(id_utilisateur_courant)
        
        alerte = Alert.query.get(alert_id)
        
        if not alerte:
            return jsonify({'error': 'Alerte non trouvée'}), 404
        
        # Vérifier la propriété sauf si admin
        if user.role != 'admin' and alerte.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Accès non autorisé à cette alerte'}), 403
        
        db.session.delete(alerte)
        db.session.commit()
        
        return jsonify({'message': 'Alerte supprimée avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Points de terminaison d'historique des alertes

@alertes_bp.route('/history/list', methods=['GET'])
@jwt_required()
def obtenir_historique_alertes():
    """Obtenir l'historique des alertes pour l'utilisateur courant"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Obtenir les paramètres de requête
        jours = request.args.get('days', 30, type=int)
        status = request.args.get('status')
        type_alerte = request.args.get('type')
        sensor_id = request.args.get('sensor_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        # Construire la requête
        if user.role == 'admin':
            query = AlertHistory.query
        else:
            query = AlertHistory.query.filter_by(user_id=id_utilisateur_courant)
        
        # Filtrer par date
        date_debut = datetime.utcnow() - timedelta(days=jours)
        query = query.filter(AlertHistory.created_at >= date_debut)
        
        # Filtrer par statut si fourni
        if status:
            query = query.filter_by(status=status)
        
        # Filtrer par type d'alerte si fourni
        if type_alerte:
            query = query.filter_by(alert_type=type_alerte)
        
        # Filtrer par capteur si fourni
        if sensor_id:
            query = query.filter_by(sensor_id=sensor_id)
        
        # Obtenir les alertes triées par les plus récentes
        alertes = query.order_by(AlertHistory.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'alerts': [alerte.vers_dict() for alerte in alertes],
            'total': len(alertes)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alertes_bp.route('/history/acknowledge/<int:alert_id>', methods=['PUT'])
@jwt_required()
def accuser_reception_alerte(alert_id):
    """Accuser réception d'une alerte de l'historique"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        alerte = AlertHistory.query.get(alert_id)
        
        if not alerte:
            return jsonify({'error': 'Alerte non trouvée'}), 404
        
        user = User.query.get(id_utilisateur_courant)
        if user.role != 'admin' and alerte.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Non autorisé'}), 403
        
        alerte.status = 'acknowledged'
        alerte.acknowledged_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Alerte accusée',
            'alert': alerte.vers_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@alertes_bp.route('/history/resolve/<int:alert_id>', methods=['PUT'])
@jwt_required()
def resoudre_alerte(alert_id):
    """Résoudre une alerte de l'historique"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        alerte = AlertHistory.query.get(alert_id)
        
        if not alerte:
            return jsonify({'error': 'Alerte non trouvée'}), 404
        
        user = User.query.get(id_utilisateur_courant)
        if user.role != 'admin' and alerte.user_id != id_utilisateur_courant:
            return jsonify({'error': 'Non autorisé'}), 403
        
        alerte.status = 'resolved'
        alerte.resolved_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Alerte résolue',
            'alert': alerte.vers_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@alertes_bp.route('/history/stats', methods=['GET'])
@jwt_required()
def obtenir_stats_alertes():
    """Obtenir les statistiques des alertes"""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        user = User.query.get(id_utilisateur_courant)
        jours = request.args.get('days', 30, type=int)
        
        date_debut = datetime.utcnow() - timedelta(days=jours)
        
        if user.role == 'admin':
            query = AlertHistory.query
        else:
            query = AlertHistory.query.filter_by(user_id=id_utilisateur_courant)
        
        query = query.filter(AlertHistory.created_at >= date_debut)
        
        total_alertes = query.count()
        declenchees = query.filter_by(status='triggered').count()
        accusees = query.filter_by(status='acknowledged').count()
        resolues = query.filter_by(status='resolved').count()
        
        # Compter par type
        par_type = {}
        for type_alerte in ['info', 'avertissement', 'critique']:
            par_type[type_alerte] = query.filter_by(alert_type=type_alerte).count()
        
        # Compter par métrique
        par_metrique = {}
        for metrique in ['co2', 'temperature', 'humidity']:
            par_metrique[metrique] = query.filter_by(metric=metrique).count()
        
        return jsonify({
            'totalAlerts': total_alertes,
            'triggered': declenchees,
            'acknowledged': accusees,
            'resolved': resolues,
            'byType': par_type,
            'byMetric': par_metrique
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alertes_bp.route('/predictions', methods=['GET'])
@jwt_required()
def obtenir_predictions():
    """Obtenir les alertes prédictives basées sur l'analyse des tendances, enrichies par Mistral si disponible."""
    try:
        id_utilisateur_courant = get_jwt_identity()
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        
        user = User.query.get(id_utilisateur_courant)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Obtenir les capteurs de l'utilisateur
        if user.role == 'admin':
            capteurs = Sensor.query.all()
        else:
            capteurs = Sensor.query.filter_by(user_id=id_utilisateur_courant).all()
        
        utiliser_prophet = Prophet is not None and not PROPHET_RUNTIME_DISABLED

        predictions = []
        horizon_heures = 24

        # Analyser chaque capteur pour les prédictions
        for capteur in capteurs:
            lectures = SensorReading.query.filter_by(sensor_id=capteur.id)\
                .order_by(SensorReading.recorded_at.desc())\
                .limit(200).all()

            # Fallback pour les capteurs simulés qui n'ont pas encore d'historique persistant.
            if len(lectures) < 20 and capteur.sensor_type == 'simulation':
                lectures = generate_historical_simulated_readings(capteur.name, max(24, horizon_heures))

            if len(lectures) < 20:
                continue

            lectures.reverse()

            for metrique in ['co2', 'temperature', 'humidity']:
                prediction = construire_prediction_prevision(capteur, lectures, metrique, horizon_heures, utiliser_prophet)
                if prediction:
                    predictions.append(prediction)

        predictions = sorted(predictions, key=lambda p: p.get('likelihood', 0), reverse=True)
        predictions = enrichir_predictions_avec_mistral(predictions)
        
        return jsonify({'predictions': predictions}), 200
        
    except Exception as e:
        print(f"Erreur lors de l'obtention des prédictions: {e}")
        return jsonify({'error': str(e)}), 500


def construire_prediction_prevision(capteur, lectures, metrique, horizon_heures, utiliser_prophet):
    """Construire une prédiction basée sur Prophet pour une métrique de capteur, avec solution de repli."""
    global PROPHET_RUNTIME_DISABLED, PROPHET_DISABLE_REASON
    df = None
    valeur_courante = None
    pourcentage_tendance = 0.0
    try:
        lignes = []
        for lecture in lectures:
            if isinstance(lecture, dict):
                valeur = lecture.get(metrique)
                horodatage = lecture.get('recorded_at')
            else:
                valeur = getattr(lecture, metrique, None)
                horodatage = getattr(lecture, 'recorded_at', None)

            if valeur is None or horodatage is None:
                continue

            try:
                lignes.append({'ds': horodatage, 'y': float(valeur)})
            except (TypeError, ValueError):
                continue

        df = pd.DataFrame(lignes)
        if df.empty:
            return None

        df['ds'] = pd.to_datetime(df['ds'])
        df = df.sort_values('ds')

        if len(df) < 20:
            return None

        minutes_intervalle = obtenir_intervalle_median_minutes(df)
        if not minutes_intervalle:
            return None

        valeur_courante = float(df['y'].iloc[-1])
        pourcentage_tendance = calculer_pourcentage_tendance(df['y'])
        seuils = obtenir_seuils_capteur(capteur)

        if utiliser_prophet and not PROPHET_RUNTIME_DISABLED:
            try:
                modele = Prophet(
                    daily_seasonality=True,
                    weekly_seasonality=False,
                    yearly_seasonality=False,
                    seasonality_mode='additive'
                )
                modele.fit(df)

                periodes = max(1, int((horizon_heures * 60) / minutes_intervalle))
                futur = modele.make_future_dataframe(periods=periodes, freq=f'{minutes_intervalle}min')
                prevision = modele.predict(futur).tail(periodes)

                prediction = evaluer_prevision(capteur, metrique, valeur_courante, pourcentage_tendance, prevision, seuils, horizon_heures)
                if prediction:
                    return prediction
            except Exception as erreur_prophet:
                # Désactiver Prophet pour la session après le premier échec.
                if not PROPHET_RUNTIME_DISABLED:
                    PROPHET_RUNTIME_DISABLED = True
                    PROPHET_DISABLE_REASON = str(erreur_prophet)
                    print(
                        f"Prophet indisponible ({erreur_prophet}). "
                        "Désactivation des prévisions Prophet pour cette session; "
                        "utilisation de la solution de repli basée sur les tendances."
                    )

        return construire_prediction_tendance(capteur, df, metrique, horizon_heures, seuils, valeur_courante, pourcentage_tendance)
    except Exception as exc:
        print(f"Erreur de prévision {metrique} pour le capteur {capteur.id}: {exc}")
        if df is None or valeur_courante is None:
            return None
        return construire_prediction_tendance(capteur, df, metrique, horizon_heures, obtenir_seuils_capteur(capteur), valeur_courante, pourcentage_tendance)


def obtenir_intervalle_median_minutes(df):
    if len(df) < 2:
        return None
    deltas = df['ds'].diff().dropna().dt.total_seconds() / 60
    if deltas.empty:
        return None
    median = float(deltas.median())
    if median <= 0:
        return None
    return max(1, int(round(median)))


def calculer_pourcentage_tendance(series):
    if len(series) < 2:
        return 0.0
    first = float(series.iloc[0])
    last = float(series.iloc[-1])
    baseline = abs(first) if abs(first) > 0.001 else 1.0
    return round(((last - first) / baseline) * 100, 1)


def construire_prediction_tendance(capteur, df, metrique, horizon_heures, seuils, valeur_courante, pourcentage_tendance):
    recent = df.tail(12)
    if len(recent) < 6:
        return None

    heure_debut = recent['ds'].iloc[0]
    heure_fin = recent['ds'].iloc[-1]
    portee_heures = max((heure_fin - heure_debut).total_seconds() / 3600.0, 1 / 60)

    valeur_debut = float(recent['y'].iloc[0])
    valeur_fin = float(recent['y'].iloc[-1])
    pente_par_heure = (valeur_fin - valeur_debut) / portee_heures
    projet = valeur_fin + (pente_par_heure * horizon_heures)

    if metrique == 'co2':
        seuil = seuils['co2']
        if projet <= seuil:
            return None
        vraisemblance = estimer_vraisemblance_projection(projet, seuil)
        impact = 'high' if projet >= seuil * 1.2 else 'medium'
        titre = f'Risque de depassement CO2 ({valeur_courante:.0f} ppm)'
        description = f'Projection lineaire au-dessus de {seuil:.0f} ppm dans les prochaines {horizon_heures}h.'
        return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

    if metrique == 'humidity':
        seuil = seuils['humidity']
        if projet <= seuil:
            return None
        vraisemblance = estimer_vraisemblance_projection(projet, seuil)
        impact = 'high' if projet >= seuil + 10 else 'medium'
        titre = f'Risque d\'humidite elevee ({valeur_courante:.0f}%)'
        description = f'Projection lineaire au-dessus de {seuil:.0f}% dans les prochaines {horizon_heures}h.'
        return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

    if metrique == 'temperature':
        temp_min = seuils['temp_min']
        temp_max = seuils['temp_max']

        if projet > temp_max:
            vraisemblance = estimer_vraisemblance_projection(projet, temp_max)
            impact = 'high' if projet >= temp_max + 2 else 'medium'
            titre = f'Risque de chaleur ({valeur_courante:.1f}C)'
            description = f'Projection lineaire au-dessus de {temp_max:.1f}C dans les prochaines {horizon_heures}h.'
            return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

        if projet < temp_min:
            vraisemblance = estimer_vraisemblance_projection(temp_min, projet)
            impact = 'high' if projet <= temp_min - 2 else 'medium'
            titre = f'Risque de froid ({valeur_courante:.1f}C)'
            description = f'Projection lineaire en dessous de {temp_min:.1f}C dans les prochaines {horizon_heures}h.'
            return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

    return None


def estimer_vraisemblance_projection(predit, seuil):
    distance = abs(predit - seuil)
    return float(min(95.0, max(55.0, 55.0 + distance)))


def obtenir_seuils_capteur(capteur):
    return {
        'co2': capteur.threshold_co2 if capteur.threshold_co2 is not None else current_app.config.get('ALERT_CO2_THRESHOLD', 1200),
        'temp_min': capteur.threshold_temp_min if capteur.threshold_temp_min is not None else current_app.config.get('ALERT_TEMP_MIN', 15),
        'temp_max': capteur.threshold_temp_max if capteur.threshold_temp_max is not None else current_app.config.get('ALERT_TEMP_MAX', 28),
        'humidity': capteur.threshold_humidity if capteur.threshold_humidity is not None else current_app.config.get('ALERT_HUMIDITY_THRESHOLD', 80)
    }


def evaluer_prevision(capteur, metrique, valeur_courante, pourcentage_tendance, prevision, seuils, horizon_heures):
    yhat_superieur = prevision['yhat_upper']
    yhat_inferieur = prevision['yhat_lower']
    yhat = prevision['yhat']

    if metrique == 'co2':
        seuil = seuils['co2']
        predit_max = float(yhat_superieur.max())
        if predit_max <= seuil:
            return None
        vraisemblance = estimer_vraisemblance(predit_max, float(yhat_inferieur.max()), seuil)
        impact = 'high' if predit_max >= seuil * 1.2 else 'medium'
        titre = f'Risque de dépassement CO2 ({valeur_courante:.0f} ppm)'
        description = f'CO2 prévu au-dessus de {seuil:.0f} ppm dans les prochaines {horizon_heures}h.'
        return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

    if metrique == 'humidity':
        seuil = seuils['humidity']
        predit_max = float(yhat_superieur.max())
        if predit_max <= seuil:
            return None
        vraisemblance = estimer_vraisemblance(predit_max, float(yhat_inferieur.max()), seuil)
        impact = 'high' if predit_max >= seuil + 10 else 'medium'
        titre = f'Risque d\'humidité élevée ({valeur_courante:.0f}%)'
        description = f'Humidité prévue au-dessus de {seuil:.0f}% dans les prochaines {horizon_heures}h.'
        return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

    if metrique == 'temperature':
        temp_min = seuils['temp_min']
        temp_max = seuils['temp_max']
        predit_min = float(yhat_inferieur.min())
        predit_max = float(yhat_superieur.max())
        predit_superieur_min = float(yhat_superieur.min())

        if predit_min >= temp_min and predit_max <= temp_max:
            return None

        if predit_max > temp_max:
            seuil = temp_max
            vraisemblance = estimer_vraisemblance(predit_max, float(yhat_inferieur.max()), seuil)
            impact = 'high' if predit_max >= temp_max + 2 else 'medium'
            titre = f'Risque de chaleur ({valeur_courante:.1f}°C)'
            description = f'Température prévue au-dessus de {temp_max:.1f}°C dans les prochaines {horizon_heures}h.'
            return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

        seuil = temp_min
        vraisemblance = estimer_vraisemblance_faible(predit_min, predit_superieur_min, seuil)
        impact = 'high' if predit_min <= temp_min - 2 else 'medium'
        titre = f'Risque de froid ({valeur_courante:.1f}°C)'
        description = f'Température prévue en dessous de {temp_min:.1f}°C dans les prochaines {horizon_heures}h.'
        return construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures)

    return None


def estimer_vraisemblance(predit_max, predit_inferieur_max, seuil):
    if predit_max <= seuil:
        return 0.0
    if predit_inferieur_max > seuil:
        return 90.0
    distance = predit_max - seuil
    return float(min(95.0, max(55.0, 55.0 + distance)))


def estimer_vraisemblance_faible(predit_min, predit_superieur_min, seuil):
    if predit_min >= seuil:
        return 0.0
    if predit_superieur_min < seuil:
        return 90.0
    distance = seuil - predit_min
    return float(min(95.0, max(55.0, 55.0 + distance)))


def construire_payload_prediction(capteur, metrique, valeur_courante, pourcentage_tendance, titre, description, vraisemblance, impact, horizon_heures):
    return {
        'id': f'{capteur.id}-{metrique}-{int(datetime.utcnow().timestamp())}',
        'sensorId': capteur.id,
        'sensorName': capteur.name,
        'metric': metrique,
        'currentValue': round(valeur_courante, 1),
        'trendPercentage': pourcentage_tendance,
        'title': titre,
        'likelihood': round(max(0, min(100, vraisemblance)), 1),
        'timeframe': f'Prochaines {horizon_heures}h',
        'impact': impact,
        'description': description
    }


def obtenir_titre_prediction(type_metrique, valeur):
    """Obtenir le titre de prédiction basé sur la métrique et la valeur"""
    if type_metrique == 'co2':
        return f'Risque de dépassement CO2 ({valeur:.0f} ppm)'
    elif type_metrique == 'temperature':
        return f'Température anormale ({valeur:.1f}°C)'
    elif type_metrique == 'humidity':
        return f'Humidité hors normes ({valeur:.0f}%)'
    return 'Prédiction d\'alerte'


def obtenir_description_prediction(type_metrique, valeur, tendance):
    """Obtenir la description de prédiction"""
    direction_tendance = 'augmente' if tendance > 0 else 'diminue'
    if type_metrique == 'co2':
        return f'Le CO2 {direction_tendance}. Valeur actuelle: {valeur:.0f} ppm'
    elif type_metrique == 'temperature':
        return f'La température {direction_tendance}. Valeur actuelle: {valeur:.1f}°C'
    elif type_metrique == 'humidity':
        return f'L\'humidité {direction_tendance}. Valeur actuelle: {valeur:.0f}%'
    return f'Tendance détectée: {direction_tendance}'


def obtenir_delai(magnitude_tendance):
    """Estimer le délai pour la prédiction"""
    if magnitude_tendance > 0.05:
        return 'Prochaines 6h'
    elif magnitude_tendance > 0.02:
        return 'Prochaines 12h'
    else:
        return 'Prochaines 24h'