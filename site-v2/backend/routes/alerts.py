from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db, Alert, AlertHistory, Sensor, User, SensorReading
from datetime import datetime, timedelta
from statistics import mean, stdev

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
        
        predictions = []
        
        # Analyze each sensor for predictions
        for sensor in sensors:
            # Get last 48 readings for trend analysis
            readings = SensorReading.query.filter_by(sensor_id=sensor.id)\
                .order_by(SensorReading.recorded_at.desc())\
                .limit(48).all()
            
            if len(readings) < 10:
                continue
            
            readings.reverse()  # Oldest to newest
            
            # Analyze CO2 trend
            co2_values = [r.co2 for r in readings]
            co2_prediction = analyze_trend(co2_values, 'co2', sensor)
            if co2_prediction:
                predictions.append(co2_prediction)
            
            # Analyze temperature trend
            temp_values = [r.temperature for r in readings]
            temp_prediction = analyze_trend(temp_values, 'temperature', sensor)
            if temp_prediction:
                predictions.append(temp_prediction)
            
            # Analyze humidity trend
            humidity_values = [r.humidity for r in readings]
            humidity_prediction = analyze_trend(humidity_values, 'humidity', sensor)
            if humidity_prediction:
                predictions.append(humidity_prediction)
        
        return jsonify({'predictions': predictions}), 200
        
    except Exception as e:
        print(f"Error getting predictions: {e}")
        return jsonify({'error': str(e)}), 500


def analyze_trend(values, metric_type, sensor):
    """Analyze metric trend and predict if threshold will be exceeded"""
    if len(values) < 3:
        return None
    
    try:
        # Calculate trend
        recent = values[-10:]  # Last 10 readings
        oldest = values[:10]   # First 10 readings
        
        recent_avg = mean(recent)
        oldest_avg = mean(oldest)
        trend = (recent_avg - oldest_avg) / (oldest_avg + 0.001)  # Percentage change
        
        # Define thresholds
        thresholds = {
            'co2': {'critical': 1200, 'warning': 1000},
            'temperature': {'critical': 28, 'warning': 26},
            'humidity': {'critical': 70, 'warning': 65}
        }
        
        current_value = values[-1]
        metric_threshold = thresholds.get(metric_type, {})
        
        # Check if trend suggests crossing threshold
        likelihood = 0
        
        if metric_type == 'co2':
            if current_value > metric_threshold.get('warning', 1000) and trend > 0:
                likelihood = min(95, 50 + (abs(trend) * 100))
                impact = 'high' if current_value > metric_threshold.get('critical', 1200) else 'medium'
            elif current_value > metric_threshold.get('critical', 1200):
                likelihood = 90
                impact = 'high'
            else:
                likelihood = 0
        
        elif metric_type == 'temperature':
            if abs(current_value - 22) > 3 and abs(trend) > 0.02:
                likelihood = min(85, 40 + (abs(trend) * 100))
                impact = 'high' if abs(current_value - 22) > 5 else 'medium'
            elif abs(current_value - 22) > 5:
                likelihood = 75
                impact = 'high'
            else:
                likelihood = 0
        
        elif metric_type == 'humidity':
            if (current_value < 40 or current_value > 60) and abs(trend) > 0.02:
                likelihood = min(80, 45 + (abs(trend) * 100))
                impact = 'medium'
            elif current_value < 30 or current_value > 75:
                likelihood = 70
                impact = 'high'
            else:
                likelihood = 0
        
        if likelihood > 0:
            return {
                'id': f'{sensor.id}-{metric_type}-{int(datetime.utcnow().timestamp())}',
                'sensorId': sensor.id,
                'sensorName': sensor.name,
                'metric': metric_type,
                'currentValue': round(current_value, 1),
                'trendPercentage': round(trend * 100, 1),
                'title': get_prediction_title(metric_type, current_value),
                'likelihood': round(max(0, min(100, likelihood)), 1),
                'timeframe': get_timeframe(abs(trend)),
                'impact': impact,
                'description': get_prediction_description(metric_type, current_value, trend)
            }
        
        return None
    
    except Exception as e:
        print(f"Error analyzing trend: {e}")
        return None


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