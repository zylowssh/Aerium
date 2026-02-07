from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Alert, AlertHistory, Sensor, User, SensorReading
from datetime import datetime, timedelta
import pandas as pd

try:
    from prophet import Prophet
except Exception:  # pragma: no cover - handled at runtime
    Prophet = None

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('', methods=['GET'])
@jwt_required()
def get_alerts():
    """Get alerts for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert to int if string
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        status = request.args.get('status')  # 'nouvelle', 'reconnue', 'résolue'
        limit = request.args.get('limit', 50, type=int)
        
        # Check if alerts table exists
        try:
            # Build query
            if user.role == 'admin':
                query = Alert.query
            else:
                query = Alert.query.filter_by(user_id=current_user_id)
            
            # Filter by status if provided
            if status:
                query = query.filter_by(status=status)
            
            # Get alerts ordered by most recent first
            alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
            
            return jsonify({'alerts': [alert.to_dict() for alert in alerts]}), 200
        except Exception as query_error:
            # If table doesn't exist or query fails, return empty list
            print(f"Query error (returning empty): {query_error}")
            return jsonify({'alerts': []}), 200
        
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'alerts': []}), 200


@alerts_bp.route('/<int:alert_id>', methods=['PUT'])
@jwt_required()
def update_alert_status(alert_id):
    """Update alert status"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Check ownership unless admin
        if user.role != 'admin' and alert.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access to this alert'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['nouvelle', 'reconnue', 'résolue']:
            return jsonify({'error': 'Invalid status'}), 400
        
        alert.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': 'Alert status updated successfully',
            'alert': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@alerts_bp.route('/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    """Delete an alert"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        # Check ownership unless admin
        if user.role != 'admin' and alert.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access to this alert'}), 403
        
        db.session.delete(alert)
        db.session.commit()
        
        return jsonify({'message': 'Alert deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Alert History Endpoints

@alerts_bp.route('/history/list', methods=['GET'])
@jwt_required()
def get_alert_history():
    """Get alert history for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        status = request.args.get('status')
        alert_type = request.args.get('type')
        sensor_id = request.args.get('sensor_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        # Build query
        if user.role == 'admin':
            query = AlertHistory.query
        else:
            query = AlertHistory.query.filter_by(user_id=current_user_id)
        
        # Filter by date
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(AlertHistory.created_at >= start_date)
        
        # Filter by status if provided
        if status:
            query = query.filter_by(status=status)
        
        # Filter by alert type if provided
        if alert_type:
            query = query.filter_by(alert_type=alert_type)
        
        # Filter by sensor if provided
        if sensor_id:
            query = query.filter_by(sensor_id=sensor_id)
        
        # Get alerts ordered by most recent first
        alerts = query.order_by(AlertHistory.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'alerts': [alert.to_dict() for alert in alerts],
            'total': len(alerts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alerts_bp.route('/history/acknowledge/<int:alert_id>', methods=['PUT'])
@jwt_required()
def acknowledge_alert(alert_id):
    """Acknowledge an alert from history"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        alert = AlertHistory.query.get(alert_id)
        
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        user = User.query.get(current_user_id)
        if user.role != 'admin' and alert.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        alert.status = 'acknowledged'
        alert.acknowledged_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Alert acknowledged',
            'alert': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@alerts_bp.route('/history/resolve/<int:alert_id>', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    """Resolve an alert from history"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        alert = AlertHistory.query.get(alert_id)
        
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        user = User.query.get(current_user_id)
        if user.role != 'admin' and alert.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        alert.status = 'resolved'
        alert.resolved_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Alert resolved',
            'alert': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@alerts_bp.route('/history/stats', methods=['GET'])
@jwt_required()
def get_alert_stats():
    """Get alert statistics"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        user = User.query.get(current_user_id)
        days = request.args.get('days', 30, type=int)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        if user.role == 'admin':
            query = AlertHistory.query
        else:
            query = AlertHistory.query.filter_by(user_id=current_user_id)
        
        query = query.filter(AlertHistory.created_at >= start_date)
        
        total_alerts = query.count()
        triggered = query.filter_by(status='triggered').count()
        acknowledged = query.filter_by(status='acknowledged').count()
        resolved = query.filter_by(status='resolved').count()
        
        # Count by type
        by_type = {}
        for alert_type in ['info', 'avertissement', 'critique']:
            by_type[alert_type] = query.filter_by(alert_type=alert_type).count()
        
        # Count by metric
        by_metric = {}
        for metric in ['co2', 'temperature', 'humidity']:
            by_metric[metric] = query.filter_by(metric=metric).count()
        
        return jsonify({
            'totalAlerts': total_alerts,
            'triggered': triggered,
            'acknowledged': acknowledged,
            'resolved': resolved,
            'byType': by_type,
            'byMetric': by_metric
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alerts_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    """Get predictive alerts based on trend analysis"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's sensors
        if user.role == 'admin':
            sensors = Sensor.query.all()
        else:
            sensors = Sensor.query.filter_by(user_id=current_user_id).all()
        
        use_prophet = Prophet is not None

        predictions = []
        horizon_hours = 24

        # Analyze each sensor for predictions
        for sensor in sensors:
            readings = SensorReading.query.filter_by(sensor_id=sensor.id)\
                .order_by(SensorReading.recorded_at.desc())\
                .limit(200).all()

            if len(readings) < 20:
                continue

            readings.reverse()

            for metric in ['co2', 'temperature', 'humidity']:
                prediction = build_forecast_prediction(sensor, readings, metric, horizon_hours, use_prophet)
                if prediction:
                    predictions.append(prediction)
        
        return jsonify({'predictions': predictions}), 200
        
    except Exception as e:
        print(f"Error getting predictions: {e}")
        return jsonify({'error': str(e)}), 500


def build_forecast_prediction(sensor, readings, metric, horizon_hours, use_prophet):
    """Build a Prophet-based prediction for a sensor metric, with fallback."""
    df = None
    current_value = None
    trend_percentage = 0.0
    try:
        df = pd.DataFrame([
            {'ds': r.recorded_at, 'y': float(getattr(r, metric))}
            for r in readings
        ])
        if df.empty:
            return None

        df['ds'] = pd.to_datetime(df['ds'])
        df = df.sort_values('ds')

        if len(df) < 20:
            return None

        interval_minutes = get_median_interval_minutes(df)
        if not interval_minutes:
            return None

        current_value = float(df['y'].iloc[-1])
        trend_percentage = compute_trend_percentage(df['y'])
        thresholds = get_sensor_thresholds(sensor)

        if use_prophet:
            try:
                model = Prophet(
                    daily_seasonality=True,
                    weekly_seasonality=False,
                    yearly_seasonality=False,
                    seasonality_mode='additive'
                )
                model.fit(df)

                periods = max(1, int((horizon_hours * 60) / interval_minutes))
                future = model.make_future_dataframe(periods=periods, freq=f'{interval_minutes}min')
                forecast = model.predict(future).tail(periods)

                prediction = evaluate_forecast(sensor, metric, current_value, trend_percentage, forecast, thresholds, horizon_hours)
                if prediction:
                    return prediction
            except Exception as prophet_error:
                # Prophet failed, fall back to trend-based prediction
                print(f"Prophet forecasting failed for {metric} on sensor {sensor.id}: {prophet_error}. Using trend-based fallback.")

        return build_trend_prediction(sensor, df, metric, horizon_hours, thresholds, current_value, trend_percentage)
    except Exception as exc:
        print(f"Error forecasting {metric} for sensor {sensor.id}: {exc}")
        if df is None or current_value is None:
            return None
        return build_trend_prediction(sensor, df, metric, horizon_hours, get_sensor_thresholds(sensor), current_value, trend_percentage)


def get_median_interval_minutes(df):
    if len(df) < 2:
        return None
    deltas = df['ds'].diff().dropna().dt.total_seconds() / 60
    if deltas.empty:
        return None
    median = float(deltas.median())
    if median <= 0:
        return None
    return max(1, int(round(median)))


def compute_trend_percentage(series):
    if len(series) < 2:
        return 0.0
    first = float(series.iloc[0])
    last = float(series.iloc[-1])
    baseline = abs(first) if abs(first) > 0.001 else 1.0
    return round(((last - first) / baseline) * 100, 1)


def build_trend_prediction(sensor, df, metric, horizon_hours, thresholds, current_value, trend_percentage):
    recent = df.tail(12)
    if len(recent) < 6:
        return None

    start_time = recent['ds'].iloc[0]
    end_time = recent['ds'].iloc[-1]
    hours_span = max((end_time - start_time).total_seconds() / 3600.0, 1 / 60)

    start_value = float(recent['y'].iloc[0])
    end_value = float(recent['y'].iloc[-1])
    slope_per_hour = (end_value - start_value) / hours_span
    projected = end_value + (slope_per_hour * horizon_hours)

    if metric == 'co2':
        threshold = thresholds['co2']
        if projected <= threshold:
            return None
        likelihood = estimate_projection_likelihood(projected, threshold)
        impact = 'high' if projected >= threshold * 1.2 else 'medium'
        title = f'Risque de depassement CO2 ({current_value:.0f} ppm)'
        description = f'Projection lineaire au-dessus de {threshold:.0f} ppm dans les prochaines {horizon_hours}h.'
        return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

    if metric == 'humidity':
        threshold = thresholds['humidity']
        if projected <= threshold:
            return None
        likelihood = estimate_projection_likelihood(projected, threshold)
        impact = 'high' if projected >= threshold + 10 else 'medium'
        title = f'Risque d\'humidite elevee ({current_value:.0f}%)'
        description = f'Projection lineaire au-dessus de {threshold:.0f}% dans les prochaines {horizon_hours}h.'
        return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

    if metric == 'temperature':
        temp_min = thresholds['temp_min']
        temp_max = thresholds['temp_max']

        if projected > temp_max:
            likelihood = estimate_projection_likelihood(projected, temp_max)
            impact = 'high' if projected >= temp_max + 2 else 'medium'
            title = f'Risque de chaleur ({current_value:.1f}C)'
            description = f'Projection lineaire au-dessus de {temp_max:.1f}C dans les prochaines {horizon_hours}h.'
            return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

        if projected < temp_min:
            likelihood = estimate_projection_likelihood(temp_min, projected)
            impact = 'high' if projected <= temp_min - 2 else 'medium'
            title = f'Risque de froid ({current_value:.1f}C)'
            description = f'Projection lineaire en dessous de {temp_min:.1f}C dans les prochaines {horizon_hours}h.'
            return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

    return None


def estimate_projection_likelihood(predicted, threshold):
    distance = abs(predicted - threshold)
    return float(min(95.0, max(55.0, 55.0 + distance)))


def get_sensor_thresholds(sensor):
    return {
        'co2': sensor.threshold_co2 if sensor.threshold_co2 is not None else current_app.config.get('ALERT_CO2_THRESHOLD', 1200),
        'temp_min': sensor.threshold_temp_min if sensor.threshold_temp_min is not None else current_app.config.get('ALERT_TEMP_MIN', 15),
        'temp_max': sensor.threshold_temp_max if sensor.threshold_temp_max is not None else current_app.config.get('ALERT_TEMP_MAX', 28),
        'humidity': sensor.threshold_humidity if sensor.threshold_humidity is not None else current_app.config.get('ALERT_HUMIDITY_THRESHOLD', 80)
    }


def evaluate_forecast(sensor, metric, current_value, trend_percentage, forecast, thresholds, horizon_hours):
    yhat_upper = forecast['yhat_upper']
    yhat_lower = forecast['yhat_lower']
    yhat = forecast['yhat']

    if metric == 'co2':
        threshold = thresholds['co2']
        predicted_max = float(yhat_upper.max())
        if predicted_max <= threshold:
            return None
        likelihood = estimate_likelihood(predicted_max, float(yhat_lower.max()), threshold)
        impact = 'high' if predicted_max >= threshold * 1.2 else 'medium'
        title = f'Risque de dépassement CO2 ({current_value:.0f} ppm)'
        description = f'CO2 prévu au-dessus de {threshold:.0f} ppm dans les prochaines {horizon_hours}h.'
        return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

    if metric == 'humidity':
        threshold = thresholds['humidity']
        predicted_max = float(yhat_upper.max())
        if predicted_max <= threshold:
            return None
        likelihood = estimate_likelihood(predicted_max, float(yhat_lower.max()), threshold)
        impact = 'high' if predicted_max >= threshold + 10 else 'medium'
        title = f'Risque d\'humidité élevée ({current_value:.0f}%)'
        description = f'Humidité prévue au-dessus de {threshold:.0f}% dans les prochaines {horizon_hours}h.'
        return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

    if metric == 'temperature':
        temp_min = thresholds['temp_min']
        temp_max = thresholds['temp_max']
        predicted_min = float(yhat_lower.min())
        predicted_max = float(yhat_upper.max())
        predicted_upper_min = float(yhat_upper.min())

        if predicted_min >= temp_min and predicted_max <= temp_max:
            return None

        if predicted_max > temp_max:
            threshold = temp_max
            likelihood = estimate_likelihood(predicted_max, float(yhat_lower.max()), threshold)
            impact = 'high' if predicted_max >= temp_max + 2 else 'medium'
            title = f'Risque de chaleur ({current_value:.1f}°C)'
            description = f'Température prévue au-dessus de {temp_max:.1f}°C dans les prochaines {horizon_hours}h.'
            return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

        threshold = temp_min
        likelihood = estimate_likelihood_low(predicted_min, predicted_upper_min, threshold)
        impact = 'high' if predicted_min <= temp_min - 2 else 'medium'
        title = f'Risque de froid ({current_value:.1f}°C)'
        description = f'Température prévue en dessous de {temp_min:.1f}°C dans les prochaines {horizon_hours}h.'
        return build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours)

    return None


def estimate_likelihood(predicted_max, predicted_lower_max, threshold):
    if predicted_max <= threshold:
        return 0.0
    if predicted_lower_max > threshold:
        return 90.0
    distance = predicted_max - threshold
    return float(min(95.0, max(55.0, 55.0 + distance)))


def estimate_likelihood_low(predicted_min, predicted_upper_min, threshold):
    if predicted_min >= threshold:
        return 0.0
    if predicted_upper_min < threshold:
        return 90.0
    distance = threshold - predicted_min
    return float(min(95.0, max(55.0, 55.0 + distance)))


def build_prediction_payload(sensor, metric, current_value, trend_percentage, title, description, likelihood, impact, horizon_hours):
    return {
        'id': f'{sensor.id}-{metric}-{int(datetime.utcnow().timestamp())}',
        'sensorId': sensor.id,
        'sensorName': sensor.name,
        'metric': metric,
        'currentValue': round(current_value, 1),
        'trendPercentage': trend_percentage,
        'title': title,
        'likelihood': round(max(0, min(100, likelihood)), 1),
        'timeframe': f'Prochaines {horizon_hours}h',
        'impact': impact,
        'description': description
    }


def get_prediction_title(metric_type, value):
    """Get prediction title based on metric and value"""
    if metric_type == 'co2':
        return f'Risque de dépassement CO2 ({value:.0f} ppm)'
    elif metric_type == 'temperature':
        return f'Température anormale ({value:.1f}°C)'
    elif metric_type == 'humidity':
        return f'Humidité hors normes ({value:.0f}%)'
    return 'Prédiction d\'alerte'


def get_prediction_description(metric_type, value, trend):
    """Get prediction description"""
    trend_dir = 'augmente' if trend > 0 else 'diminue'
    if metric_type == 'co2':
        return f'Le CO2 {trend_dir}. Valeur actuelle: {value:.0f} ppm'
    elif metric_type == 'temperature':
        return f'La température {trend_dir}. Valeur actuelle: {value:.1f}°C'
    elif metric_type == 'humidity':
        return f'L\'humidité {trend_dir}. Valeur actuelle: {value:.0f}%'
    return f'Tendance détectée: {trend_dir}'


def get_timeframe(trend_magnitude):
    """Estimate timeframe for prediction"""
    if trend_magnitude > 0.05:
        return 'Prochaines 6h'
    elif trend_magnitude > 0.02:
        return 'Prochaines 12h'
    else:
        return 'Prochaines 24h'