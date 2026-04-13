"""
Routes AI — Aerium
  POST /api/ai/chat           → streaming SSE chatbot (Mistral)
  POST /api/ai/recommendations → AI-powered recommendations (Mistral JSON)
  GET  /api/ai/predictions    → 24h forecast (numpy/pandas) + narrative (Mistral)
  GET  /api/ai/status         → key check
"""

from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, User, Sensor, SensorReading, Alert
from datetime import datetime, timedelta
import os
import json
import logging
from sensor_simulator import generate_historical_simulated_readings

ai_bp = Blueprint('ai', __name__)
logger = logging.getLogger(__name__)

MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'


# ===========================================================================
# Shared helpers
# ===========================================================================

def _mistral_key():
    return os.getenv('MISTRAL_API_KEY', '').strip()

def _mistral_model():
    return os.getenv('MISTRAL_MODEL', 'mistral-small-latest')


def _get_sensor_context(user_id: int, is_admin: bool) -> dict:
    """Snapshot live de l'état des capteurs (dernière heure)."""
    try:
        sensors = Sensor.query.all() if is_admin else Sensor.query.filter_by(user_id=user_id).all()
        sensor_ids = [s.id for s in sensors]
        since = datetime.utcnow() - timedelta(hours=1)

        readings = []
        if sensor_ids:
            readings = SensorReading.query.filter(
                SensorReading.sensor_id.in_(sensor_ids),
                SensorReading.recorded_at >= since
            ).all()

        def _avg(values):
            return round(sum(values) / len(values), 1) if values else None

        alert_q = Alert.query.filter_by(status='nouvelle')
        if not is_admin:
            alert_q = alert_q.filter_by(user_id=user_id)

        return {
            'total_sensors': len(sensors),
            'online':          sum(1 for s in sensors if s.status == 'en ligne'),
            'warning':         sum(1 for s in sensors if s.status == 'avertissement'),
            'offline':         sum(1 for s in sensors if s.status == 'hors ligne'),
            'avg_co2':         _avg([r.co2          for r in readings]),
            'avg_temperature': _avg([r.temperature  for r in readings]),
            'avg_humidity':    _avg([r.humidity     for r in readings]),
            'active_alerts':   alert_q.count(),
            'sensor_names':    [s.name for s in sensors[:6]],
        }
    except Exception as exc:
        logger.error(f'[AI] Erreur contexte: {exc}')
        return {}


def _build_chat_system_prompt(ctx: dict) -> str:
    lines = []
    if ctx.get('total_sensors') is not None:
        lines.append(
            f"- Capteurs: {ctx['total_sensors']} au total "
            f"({ctx.get('online',0)} en ligne, "
            f"{ctx.get('warning',0)} en avertissement, "
            f"{ctx.get('offline',0)} hors ligne)"
        )
    if ctx.get('sensor_names'):
        lines.append(f"- Capteurs: {', '.join(ctx['sensor_names'])}")
    if ctx.get('avg_co2') is not None:
        lines.append(f"- CO₂ moyen (1h): {ctx['avg_co2']} ppm")
    if ctx.get('avg_temperature') is not None:
        lines.append(f"- Température moyenne: {ctx['avg_temperature']}°C")
    if ctx.get('avg_humidity') is not None:
        lines.append(f"- Humidité moyenne: {ctx['avg_humidity']}%")
    if ctx.get('active_alerts') is not None:
        lines.append(f"- Alertes actives non résolues: {ctx['active_alerts']}")

    ctx_block = '\n'.join(lines) if lines else 'Aucune donnée disponible.'

    return f"""Tu es Aéria, l'assistante IA de la plateforme Aerium de surveillance de la qualité de l'air intérieur.
Tu aides les utilisateurs à comprendre leurs données, interpréter les alertes et améliorer leur environnement.

=== ÉTAT ACTUEL DU SYSTÈME ===
{ctx_block}

=== SEUILS DE RÉFÉRENCE ===
- CO₂ : Excellent <600 | Bon 600-800 | Acceptable 800-1000 | Mauvais 1000-1500 | Dangereux >1500 ppm
- Température : Optimale 20-24°C
- Humidité : Optimale 40-60%

=== INSTRUCTIONS ===
- Réponds en français, de façon concise et pratique.
- Utilise le markdown pour structurer les réponses longues (**gras**, listes avec -, ###).
- Utilise les données actuelles pour personnaliser chaque réponse.
- Mentionne proactivement tout problème détecté (CO₂ élevé, alertes, capteurs hors ligne).
- Reste dans ton domaine (qualité de l'air, capteurs, santé environnementale).
- Émojis avec parcimonie (🌿 ⚠️ ✅ 🌡️).
"""


def _compute_health_score(avg_co2: float, avg_temp: float, avg_hum: float) -> int:
    """Score 0-100 pondéré: CO2 (50%), température (25%), humidité (25%)."""
    def _clamp(value: float, min_value: float, max_value: float) -> float:
        return max(min_value, min(max_value, value))

    if avg_co2 <= 600:
        co2_score = 100.0
    elif avg_co2 <= 800:
        co2_score = 100.0 - ((avg_co2 - 600.0) / 200.0) * 20.0
    elif avg_co2 <= 1000:
        co2_score = 80.0 - ((avg_co2 - 800.0) / 200.0) * 20.0
    elif avg_co2 <= 1500:
        co2_score = 60.0 - ((avg_co2 - 1000.0) / 500.0) * 30.0
    elif avg_co2 <= 2500:
        co2_score = 30.0 - ((avg_co2 - 1500.0) / 1000.0) * 30.0
    else:
        co2_score = 0.0

    temp_deviation = max(0.0, abs(avg_temp - 22.0) - 2.0)
    temp_score = 100.0 - temp_deviation * 8.0

    hum_deviation = max(0.0, abs(avg_hum - 50.0) - 10.0)
    hum_score = 100.0 - hum_deviation * 2.5

    weighted = co2_score * 0.5 + temp_score * 0.25 + hum_score * 0.25
    return round(_clamp(weighted, 0.0, 100.0))


def _call_mistral_json(messages: list, max_tokens: int = 800) -> str | None:
    """Appel Mistral synchrone, retourne le texte brut ou None en cas d'erreur."""
    try:
        import requests as req
        resp = req.post(
            MISTRAL_URL,
            headers={
                'Authorization': f'Bearer {_mistral_key()}',
                'Content-Type': 'application/json',
            },
            json={
                'model': _mistral_model(),
                'messages': messages,
                'stream': False,
                'max_tokens': max_tokens,
                'temperature': 0.4,
            },
            timeout=30,
        )
        if resp.status_code != 200:
            logger.error(f'[AI] Mistral HTTP {resp.status_code}: {resp.text[:200]}')
            return None
        data = resp.json()
        return data['choices'][0]['message']['content']
    except Exception as exc:
        logger.error(f'[AI] Erreur Mistral JSON: {exc}')
        return None


# ===========================================================================
# Endpoint 1 — Chat streaming
# ===========================================================================

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """Streaming SSE chatbot powered by Mistral."""
    if not _mistral_key():
        return jsonify({'error': 'Clé API Mistral non configurée.'}), 503

    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        data = request.get_json(silent=True) or {}
        messages = data.get('messages', [])
        if not messages:
            return jsonify({'error': 'Le champ "messages" est requis'}), 400

        ctx = _get_sensor_context(user_id, user.role == 'admin')
        system_prompt = _build_chat_system_prompt(ctx)

        mistral_messages = [
            {'role': 'system', 'content': system_prompt},
            *messages[-20:],
        ]

        def generate():
            try:
                import requests as req
                resp = req.post(
                    MISTRAL_URL,
                    headers={
                        'Authorization': f'Bearer {_mistral_key()}',
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream',
                    },
                    json={
                        'model': _mistral_model(),
                        'messages': mistral_messages,
                        'stream': True,
                        'max_tokens': int(os.getenv('MISTRAL_MAX_TOKENS', 700)),
                        'temperature': 0.65,
                    },
                    stream=True,
                    timeout=30,
                )

                if resp.status_code != 200:
                    yield f"data: {json.dumps({'error': f'Erreur Mistral ({resp.status_code})'})}\n\n"
                    return

                for raw_line in resp.iter_lines():
                    if not raw_line:
                        continue
                    line = raw_line.decode('utf-8') if isinstance(raw_line, bytes) else raw_line
                    if not line.startswith('data: '):
                        continue
                    payload = line[6:]
                    if payload.strip() == '[DONE]':
                        yield f"data: {json.dumps({'done': True})}\n\n"
                        return
                    try:
                        chunk = json.loads(payload)
                        content = chunk.get('choices', [{}])[0].get('delta', {}).get('content', '')
                        if content:
                            yield f"data: {json.dumps({'token': content})}\n\n"
                    except json.JSONDecodeError:
                        continue

                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as exc:
                logger.error(f'[AI] Streaming error: {exc}')
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        return Response(
            stream_with_context(generate()),
            content_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
                'Connection': 'keep-alive',
            },
        )

    except Exception as exc:
        logger.error(f'[AI] Chat endpoint error: {exc}')
        return jsonify({'error': str(exc)}), 500


# ===========================================================================
# Endpoint 2 — AI Recommendations (JSON, non-streaming)
# ===========================================================================

_DEFAULT_RECOMMENDATIONS = [
    {
        'title': 'Améliorer la ventilation',
        'description': 'Un renouvellement d\'air régulier maintient le CO₂ en dessous de 800 ppm.',
        'impact': 'élevé',
        'category': 'ventilation',
        'action': 'Aérer 10 minutes toutes les 2 heures, ou installer une VMC.',
        'savings': '+15% de productivité et concentration',
    },
    {
        'title': 'Maintenir la température entre 20-24°C',
        'description': 'Les températures hors plage réduisent le confort et la performance cognitive.',
        'impact': 'moyen',
        'category': 'temperature',
        'action': 'Programmer le chauffage/climatisation pour maintenir 22°C en journée.',
        'savings': '+10% de confort thermique',
    },
    {
        'title': 'Contrôler l\'humidité relative',
        'description': 'Une humidité entre 40-60% prévient la prolifération de moisissures.',
        'impact': 'moyen',
        'category': 'humidite',
        'action': 'Utiliser un humidificateur/déshumidificateur selon les mesures.',
        'savings': 'Réduction risques sanitaires',
    },
    {
        'title': 'Planifier la maintenance préventive',
        'description': 'Des capteurs bien calibrés garantissent des mesures fiables.',
        'impact': 'faible',
        'category': 'maintenance',
        'action': 'Calibrer les capteurs tous les 6 mois et vérifier les batteries.',
        'savings': 'Données fiables à long terme',
    },
]


@ai_bp.route('/recommendations', methods=['POST'])
@jwt_required()
def recommendations():
    """
    Génère des recommandations personnalisées basées sur les données réelles.
    Retourne du JSON structuré (non-streaming).
    """
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        ctx = _get_sensor_context(user_id, user.role == 'admin')

        # Calcul du health score local (fallback si Mistral indisponible)
        avg_co2  = ctx.get('avg_co2')  or 700
        avg_temp = ctx.get('avg_temperature') or 22
        avg_hum  = ctx.get('avg_humidity')    or 50

        health_score = _compute_health_score(avg_co2, avg_temp, avg_hum)

        # Si pas de clé Mistral → fallback immédiat
        if not _mistral_key():
            return jsonify({
                'recommendations': _DEFAULT_RECOMMENDATIONS,
                'health_score': health_score,
                'summary': 'Recommandations basées sur les bonnes pratiques de qualité d\'air intérieur.',
                'generated_at': datetime.utcnow().isoformat(),
                'fallback': True,
            })

        # Construction du prompt
        ctx_lines = [
            f"- CO₂ moyen: {avg_co2} ppm",
            f"- Température: {avg_temp}°C",
            f"- Humidité: {avg_hum}%",
            f"- Capteurs actifs: {ctx.get('online', 0)}/{ctx.get('total_sensors', 0)}",
            f"- Capteurs en avertissement: {ctx.get('warning', 0)}",
            f"- Alertes actives non résolues: {ctx.get('active_alerts', 0)}",
            f"- Score santé calculé: {health_score}/100",
        ]

        prompt = f"""Tu es un expert en qualité de l'air intérieur. Analyse ces données et génère exactement 4 recommandations pratiques et personnalisées.

DONNÉES ACTUELLES:
{chr(10).join(ctx_lines)}

Réponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour:
{{
  "health_score": {health_score},
  "summary": "2 phrases max résumant l'état actuel et le niveau de risque basé sur les données",
  "recommendations": [
    {{
      "title": "Titre court et actionnable (max 6 mots)",
      "description": "Explication en 1-2 phrases citant les valeurs mesurées si pertinent",
      "impact": "élevé|moyen|faible",
      "category": "ventilation|temperature|humidite|maintenance|organisation",
      "action": "Action concrète et immédiate en 1 phrase",
      "savings": "Bénéfice attendu (ex: +15% productivité)"
    }}
  ]
}}"""

        raw = _call_mistral_json(
            [{'role': 'user', 'content': prompt}],
            max_tokens=900,
        )

        if raw:
            # Strip code fences if present
            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = '\n'.join(cleaned.split('\n')[1:])
            if cleaned.endswith('```'):
                cleaned = '\n'.join(cleaned.split('\n')[:-1])
            cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
                # Ensure required fields
                if 'recommendations' not in parsed:
                    raise ValueError('Missing recommendations key')

                return jsonify({
                    'recommendations': parsed.get('recommendations', _DEFAULT_RECOMMENDATIONS),
                    'health_score':    parsed.get('health_score', health_score),
                    'summary':         parsed.get('summary', ''),
                    'generated_at':    datetime.utcnow().isoformat(),
                    'fallback':        False,
                })
            except (json.JSONDecodeError, ValueError) as parse_err:
                logger.warning(f'[AI] Recommendations JSON parse error: {parse_err} — raw: {raw[:300]}')

        # Fallback if Mistral failed or JSON malformed
        return jsonify({
            'recommendations': _DEFAULT_RECOMMENDATIONS,
            'health_score': health_score,
            'summary': f'Score de santé: {health_score}/100. Recommandations génériques appliquées.',
            'generated_at': datetime.utcnow().isoformat(),
            'fallback': True,
        })

    except Exception as exc:
        logger.error(f'[AI] Recommendations error: {exc}')
        return jsonify({'error': str(exc)}), 500


# ===========================================================================
# Endpoint 3 — AI Predictions (numpy trend + Mistral narrative)
# ===========================================================================

def _compute_forecast(df_dict: list, hours_ahead: int = 24) -> dict | None:
    """
    Calcule une prévision 24h par décomposition tendance + saisonnalité horaire.
    df_dict: list of {'recorded_at': datetime, 'co2': float, 'temperature': float, 'humidity': float}
    """
    try:
        import numpy as np
        import pandas as pd

        if len(df_dict) < 6:
            return None

        df = pd.DataFrame(df_dict)
        df['recorded_at'] = pd.to_datetime(df['recorded_at'])
        df = df.sort_values('recorded_at')

        # Resample to hourly means
        df = df.set_index('recorded_at').resample('1h').mean().reset_index()
        df = df.dropna(subset=['co2'])

        if len(df) < 4:
            return None

        now_h = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        n = len(df)
        t = np.arange(n, dtype=float)

        def _forecast_metric(values: np.ndarray, hours: list[int]) -> list[float]:
            """Trend + hourly seasonal pattern → forecast list."""
            slope, intercept = np.polyfit(t, values, 1)
            trend = np.polyval([slope, intercept], t)
            residuals = values - trend
            std = float(np.std(residuals)) or 1.0

            # Hourly seasonal pattern (deviation from mean)
            hour_of_day = df['recorded_at'].dt.hour.values
            pattern = {}
            for h in range(24):
                mask = hour_of_day == h
                pattern[h] = float(np.mean(residuals[mask])) if mask.any() else 0.0

            result = []
            for i, h in enumerate(hours):
                t_fut = n + i
                trend_val  = slope * t_fut + intercept
                seasonal   = pattern.get(h % 24, 0.0) * 0.6   # dampen seasonal component
                predicted  = trend_val + seasonal
                result.append(float(np.clip(predicted, 350, 2500)))
            return result, slope, std

        future_hours = [(now_h + timedelta(hours=i+1)).hour for i in range(hours_ahead)]
        future_ts    = [now_h + timedelta(hours=i+1) for i in range(hours_ahead)]

        co2_vals  = df['co2'].values
        temp_vals = df['temperature'].values if 'temperature' in df.columns else np.full(n, 22.0)
        hum_vals  = df['humidity'].values    if 'humidity'    in df.columns else np.full(n, 50.0)

        co2_pred,  co2_slope,  co2_std  = _forecast_metric(co2_vals,  future_hours)
        temp_pred, _,          _         = _forecast_metric(temp_vals, future_hours)
        hum_pred,  _,          _         = _forecast_metric(hum_vals,  future_hours)

        # Confidence intervals (±1.5σ for CO₂, tighter for others)
        forecast = []
        for i in range(hours_ahead):
            forecast.append({
                'hour':        future_ts[i].strftime('%H:%M'),
                'timestamp':   future_ts[i].isoformat(),
                'co2':         round(co2_pred[i]),
                'co2_lower':   round(max(350,   co2_pred[i] - 1.5 * co2_std)),
                'co2_upper':   round(min(2500,   co2_pred[i] + 1.5 * co2_std)),
                'temperature': round(float(np.clip(temp_pred[i], 10, 40)), 1),
                'humidity':    round(float(np.clip(hum_pred[i],  0, 100))),
            })

        # Trend metadata
        first_co2 = float(co2_vals[-6:].mean()) if n >= 6 else float(co2_vals[0])
        last_co2  = forecast[-1]['co2']
        change_pct = round((last_co2 - first_co2) / max(first_co2, 1) * 100, 1)

        if abs(change_pct) < 3:
            direction = 'stable'
        elif change_pct > 0:
            direction = 'rising'
        else:
            direction = 'falling'

        peak_entry = max(forecast, key=lambda x: x['co2'])
        peak_co2   = peak_entry['co2']

        if peak_co2 > 1000:
            risk = 'high'
        elif peak_co2 > 800:
            risk = 'moderate'
        else:
            risk = 'low'

        return {
            'forecast':        forecast,
            'hourly_count':    n,
            'slope':           round(co2_slope, 3),
            'std':             round(co2_std, 1),
            'co2_change_pct':  change_pct,
            'co2_direction':   direction,
            'peak_co2':        peak_co2,
            'peak_hour':       peak_entry['hour'],
            'risk_level':      risk,
            'current_avg_co2': round(first_co2),
        }

    except Exception as exc:
        logger.error(f'[AI] Forecast computation error: {exc}')
        return None


@ai_bp.route('/predictions', methods=['GET'])
@jwt_required()
def predictions():
    """
    Génère une prévision 24h + narrative Mistral.
    Utilise numpy/pandas (toujours disponibles) pour le calcul de tendance.
    """
    try:
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Récupérer les capteurs
        sensors = (
            Sensor.query.all() if user.role == 'admin'
            else Sensor.query.filter_by(user_id=user_id).all()
        )
        sensor_ids = [s.id for s in sensors]

        if not sensor_ids:
            return jsonify({'error': 'Aucun capteur disponible.'}), 404

        # Lectures des 7 derniers jours
        since = datetime.utcnow() - timedelta(days=7)
        readings = SensorReading.query.filter(
            SensorReading.sensor_id.in_(sensor_ids),
            SensorReading.recorded_at >= since,
        ).order_by(SensorReading.recorded_at.asc()).all()

        df_dict = [
            {
                'sensor_id':    r.sensor_id,
                'recorded_at': r.recorded_at,
                'co2':         r.co2,
                'temperature': r.temperature,
                'humidity':    r.humidity,
            }
            for r in readings
        ]

        # Fallback pour capteurs simulés sans historique persistant suffisant.
        lectures_par_capteur: dict[int, int] = {}
        for item in df_dict:
            sid = int(item['sensor_id'])
            lectures_par_capteur[sid] = lectures_par_capteur.get(sid, 0) + 1

        for sensor in sensors:
            if sensor.sensor_type != 'simulation':
                continue

            if lectures_par_capteur.get(sensor.id, 0) >= 6:
                continue

            sim_readings = generate_historical_simulated_readings(sensor.name, 24)
            for r in sim_readings:
                ts = r.get('recorded_at')
                try:
                    recorded_at = datetime.fromisoformat(str(ts)) if ts else datetime.utcnow()
                except ValueError:
                    recorded_at = datetime.utcnow()

                df_dict.append({
                    'sensor_id': sensor.id,
                    'recorded_at': recorded_at,
                    'co2': float(r.get('co2', 0)),
                    'temperature': float(r.get('temperature', 0)),
                    'humidity': float(r.get('humidity', 0)),
                })

        if len(df_dict) < 6:
            return jsonify({'error': 'Pas assez de données historiques (minimum 6 lectures).'}), 422

        df_dict.sort(key=lambda x: x['recorded_at'])

        forecast_data = _compute_forecast(df_dict)

        if not forecast_data:
            return jsonify({'error': 'Impossible de calculer les prévisions avec les données disponibles.'}), 422

        # Générer le narratif Mistral si clé disponible
        narrative = None
        if _mistral_key():
            f = forecast_data
            direction_fr = {
                'rising':  'en hausse',
                'falling': 'en baisse',
                'stable':  'stable',
            }.get(f['co2_direction'], 'stable')

            risk_fr = {
                'low':      'faible',
                'moderate': 'modéré',
                'high':     'élevé',
            }.get(f['risk_level'], 'modéré')

            narrative_prompt = f"""Tu es Aéria, experte en qualité de l'air intérieur. Analyse ces prévisions CO₂ et rédige une analyse concise.

DONNÉES DE PRÉVISION (24 prochaines heures):
- CO₂ actuel moyen: {f['current_avg_co2']} ppm
- Tendance: {direction_fr} ({f['co2_change_pct']:+.1f}% sur 24h)
- Pic prévu: {f['peak_co2']} ppm vers {f['peak_hour']}
- Niveau de risque: {risk_fr}
- Données sources: {f['hourly_count']} heures d'historique

Rédige une analyse en **3 paragraphes courts** en utilisant le markdown:
1. **État prévu** — résume la tendance et le pic attendu avec les valeurs
2. **Risques** — identifie les moments critiques et leur impact sur les occupants  
3. **Actions recommandées** — 2-3 actions concrètes avec timing (ex: "Aérer entre 14h et 16h")

Sois précis, utilise les données chiffrées, et reste actionnable."""

            narrative = _call_mistral_json(
                [{'role': 'user', 'content': narrative_prompt}],
                max_tokens=450,
            )

        # Réponse finale
        timestamps = [item['recorded_at'] for item in df_dict if item.get('recorded_at')]
        if len(timestamps) >= 2:
            hours_covered = round((max(timestamps) - min(timestamps)).total_seconds() / 3600)
        else:
            hours_covered = 0

        return jsonify({
            'forecast':      forecast_data['forecast'],
            'trends': {
                'co2_direction':   forecast_data['co2_direction'],
                'co2_change_pct':  forecast_data['co2_change_pct'],
                'peak_co2':        forecast_data['peak_co2'],
                'peak_hour':       forecast_data['peak_hour'],
                'risk_level':      forecast_data['risk_level'],
                'current_avg_co2': forecast_data['current_avg_co2'],
            },
            'narrative':     narrative,
            'data_hours':    hours_covered,
            'reading_count': len(df_dict),
            'generated_at':  datetime.utcnow().isoformat(),
        })

    except Exception as exc:
        logger.error(f'[AI] Predictions error: {exc}')
        return jsonify({'error': str(exc)}), 500


# ===========================================================================
# Endpoint 4 — Status check
# ===========================================================================

@ai_bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    """Vérifie si la clé Mistral est configurée."""
    return jsonify({
        'configured': bool(_mistral_key()),
        'model':      _mistral_model(),
    })
