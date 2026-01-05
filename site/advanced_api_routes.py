"""
Advanced Features API Routes
Integration of all new modules (export, multi-tenant, analytics, collaboration, recommendations, optimization)
"""

from flask import Blueprint, request, jsonify, send_file, session
from functools import wraps
from datetime import datetime
import io

from export_manager import DataExporter, ScheduledExporter
from tenant_manager import TenantManager
from ml_analytics import MLAnalytics
from collaboration import CollaborationManager
from ai_recommender import AIRecommender
from performance_optimizer import optimizer, rate_limiter

# Create blueprint
advanced_api = Blueprint('advanced_api', __name__, url_prefix='/api/advanced')

# Initialize managers
data_exporter = DataExporter()
tenant_mgr = TenantManager()
ml_analytics = MLAnalytics()
collab_mgr = CollaborationManager()
recommender = AIRecommender()

# Initialize performance optimization
optimizer.initialize()


def require_login(f):
    """Require user to be logged in"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Not logged in'}), 401
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# EXPORT FEATURES (Feature 3)
# ============================================================================

@advanced_api.route('/export/csv', methods=['POST'])
@require_login
def export_csv():
    """Export sensor data as CSV"""
    try:
        sensor_id = request.json.get('sensor_id')
        days = request.json.get('days', 30)
        
        # Get data
        from database import get_db
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT timestamp, ppm, temperature, humidity 
            FROM sensor_readings 
            WHERE sensor_id = ? AND timestamp > datetime('now', ? || ' days')
            ORDER BY timestamp
        ''', (sensor_id, f'-{days}'))
        
        data = cursor.fetchall()
        csv_data = data_exporter.export_to_csv(data)
        
        if csv_data:
            return send_file(
                csv_data,
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'co2_data_{sensor_id}.csv'
            )
        return jsonify({'error': 'Export failed'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/export/excel', methods=['POST'])
@require_login
def export_excel():
    """Export sensor data as Excel"""
    try:
        sensor_id = request.json.get('sensor_id')
        days = request.json.get('days', 30)
        include_charts = request.json.get('include_charts', True)
        
        # Get data
        from database import get_db
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT timestamp, ppm, temperature, humidity 
            FROM sensor_readings 
            WHERE sensor_id = ? AND timestamp > datetime('now', ? || ' days')
            ORDER BY timestamp
        ''', (sensor_id, f'-{days}'))
        
        readings = cursor.fetchall()
        data = [{'timestamp': r[0], 'ppm': r[1], 'temperature': r[2], 'humidity': r[3]} 
                for r in readings]
        
        charts_data = {'ppm': [r['ppm'] for r in data]} if include_charts else None
        excel_data = data_exporter.export_to_excel(data, charts_data=charts_data)
        
        if excel_data:
            return send_file(
                excel_data,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f'co2_report_{sensor_id}.xlsx'
            )
        return jsonify({'error': 'openpyxl not installed'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/export/pdf', methods=['POST'])
@require_login
def export_pdf():
    """Export sensor data as PDF report"""
    try:
        sensor_id = request.json.get('sensor_id')
        days = request.json.get('days', 30)
        
        # Get data
        from database import get_db
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT timestamp, ppm, temperature, humidity 
            FROM sensor_readings 
            WHERE sensor_id = ? AND timestamp > datetime('now', ? || ' days')
            ORDER BY timestamp
        ''', (sensor_id, f'-{days}'))
        
        readings = cursor.fetchall()
        data = [{'timestamp': r[0], 'ppm': r[1], 'temperature': r[2], 'humidity': r[3]} 
                for r in readings]
        
        # Get sensor name
        cursor.execute('SELECT name FROM sensors WHERE id = ?', (sensor_id,))
        sensor_name = cursor.fetchone()[0] if cursor.fetchone() else 'Sensor'
        
        pdf_data = data_exporter.export_to_pdf(data, title=f'{sensor_name} Report')
        
        if pdf_data:
            return send_file(
                pdf_data,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'co2_report_{sensor_id}.pdf'
            )
        return jsonify({'error': 'WeasyPrint not installed'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/export/schedule', methods=['POST'])
@require_login
def schedule_export():
    """Schedule automated exports"""
    try:
        sensor_id = request.json.get('sensor_id')
        format = request.json.get('format')  # csv, excel, pdf
        frequency = request.json.get('frequency')  # daily, weekly, monthly
        email = request.json.get('email')
        
        scheduler = ScheduledExporter()
        export_id = scheduler.create_export_schedule(
            sensor_id, format, frequency, email
        )
        
        return jsonify({
            'success': True,
            'export_id': export_id,
            'message': f'Export scheduled {frequency}'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# MULTI-TENANT FEATURES (Feature 6)
# ============================================================================

@advanced_api.route('/tenants', methods=['POST'])
@require_login
def create_tenant():
    """Create new organization"""
    try:
        tenant_mgr.init_tenant_schema()
        
        tenant_id = tenant_mgr.create_tenant(
            name=request.json.get('name'),
            owner_user_id=session['user_id'],
            subscription_tier=request.json.get('tier', 'free')
        )
        
        return jsonify({
            'success': True,
            'tenant_id': tenant_id,
            'message': 'Organization created'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/tenants/<int:tenant_id>/members', methods=['POST'])
@require_login
def add_tenant_member(tenant_id):
    """Add member to organization"""
    try:
        success = tenant_mgr.add_tenant_member(
            tenant_id,
            request.json.get('user_id'),
            request.json.get('role', 'member'),
            request.json.get('permissions', ['read'])
        )
        
        if success:
            return jsonify({'success': True, 'message': 'Member added'})
        return jsonify({'error': 'Failed to add member'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/tenants/<int:tenant_id>/locations', methods=['POST'])
@require_login
def create_location(tenant_id):
    """Create location within organization"""
    try:
        location_id = tenant_mgr.create_location(
            tenant_id,
            request.json.get('name'),
            request.json.get('address'),
            request.json.get('latitude'),
            request.json.get('longitude')
        )
        
        return jsonify({
            'success': True,
            'location_id': location_id,
            'message': 'Location created'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/tenants/<int:tenant_id>/stats', methods=['GET'])
@require_login
def get_tenant_stats(tenant_id):
    """Get organization statistics"""
    try:
        stats = tenant_mgr.get_tenant_statistics(tenant_id)
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ML ANALYTICS (Feature 7)
# ============================================================================

@advanced_api.route('/analytics/predict/<int:sensor_id>', methods=['GET'])
@require_login
def predict_co2(sensor_id):
    """Get CO₂ predictions"""
    try:
        hours = request.args.get('hours', 24, type=int)
        predictions = ml_analytics.predict_co2_levels(sensor_id, hours)
        
        if predictions:
            return jsonify({
                'predictions': predictions,
                'hours': hours,
                'model': 'linear-regression'
            })
        return jsonify({'error': 'sklearn not available'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/analytics/anomalies/<int:sensor_id>', methods=['GET'])
@require_login
def detect_anomalies(sensor_id):
    """Detect anomalies in CO₂ readings"""
    try:
        threshold = request.args.get('threshold', 0.95, type=float)
        anomalies = ml_analytics.detect_anomalies(sensor_id, threshold)
        
        if anomalies is not None:
            return jsonify({
                'anomalies': anomalies,
                'count': len(anomalies),
                'model': 'isolation-forest'
            })
        return jsonify({'error': 'sklearn not available'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/analytics/trends/<int:sensor_id>', methods=['GET'])
@require_login
def get_trends(sensor_id):
    """Get trend analysis"""
    try:
        days = request.args.get('days', 30, type=int)
        trends = ml_analytics.analyze_trends(sensor_id, days)
        return jsonify(trends)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/analytics/insights/<int:sensor_id>', methods=['GET'])
@require_login
def get_insights(sensor_id):
    """Get AI insights"""
    try:
        insights = ml_analytics.get_insights(sensor_id)
        correlations = ml_analytics.get_correlation_analysis(sensor_id)
        
        return jsonify({
            'insights': insights,
            'correlations': correlations
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# COLLABORATION FEATURES (Feature 10)
# ============================================================================

@advanced_api.route('/collaboration/share', methods=['POST'])
@require_login
def create_share():
    """Share sensor dashboard with team"""
    try:
        share_id = collab_mgr.create_team_share(
            session['user_id'],
            request.json.get('sensor_id'),
            request.json.get('team_members', []),
            request.json.get('permission_level', 'viewer')
        )
        
        return jsonify({
            'success': True,
            'share_id': share_id,
            'message': 'Dashboard shared'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/collaboration/alerts', methods=['POST'])
@require_login
def create_shared_alert():
    """Create alert that notifies team"""
    try:
        alert_id = collab_mgr.create_shared_alert(
            request.json.get('team_share_id'),
            request.json.get('alert_name'),
            request.json.get('condition'),
            request.json.get('threshold_value'),
            request.json.get('notify_users', [])
        )
        
        return jsonify({
            'success': True,
            'alert_id': alert_id,
            'message': 'Alert created'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/collaboration/comments/<int:reading_id>', methods=['POST'])
@require_login
def add_comment(reading_id):
    """Add comment to reading"""
    try:
        comment_id = collab_mgr.add_comment(
            reading_id,
            session['user_id'],
            request.json.get('comment')
        )
        
        return jsonify({
            'success': True,
            'comment_id': comment_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/collaboration/comments/<int:reading_id>', methods=['GET'])
@require_login
def get_comments(reading_id):
    """Get comments on reading"""
    try:
        comments = collab_mgr.get_reading_comments(reading_id)
        return jsonify({'comments': comments})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/collaboration/activity/<int:team_share_id>', methods=['GET'])
@require_login
def get_activity(team_share_id):
    """Get team activity feed"""
    try:
        limit = request.args.get('limit', 50, type=int)
        activities = collab_mgr.get_team_activity_feed(team_share_id, limit)
        return jsonify({'activities': activities})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# AI RECOMMENDATIONS (Feature 14)
# ============================================================================

@advanced_api.route('/recommendations/<int:sensor_id>', methods=['GET'])
@require_login
def get_recommendations(sensor_id):
    """Get AI recommendations"""
    try:
        building_type = request.args.get('building_type', 'office')
        occupancy = request.args.get('occupancy', 10, type=int)
        
        recommendations = recommender.get_recommendations(
            sensor_id, building_type, occupancy
        )
        
        return jsonify({
            'recommendations': recommendations,
            'building_type': building_type,
            'occupancy': occupancy
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/recommendations/track', methods=['POST'])
@require_login
def track_effectiveness():
    """Track recommendation effectiveness"""
    try:
        effectiveness = recommender.track_recommendation_effectiveness(
            request.json.get('sensor_id'),
            request.json.get('recommendation_id'),
            request.json.get('action'),
            request.json.get('co2_before'),
            request.json.get('co2_after')
        )
        
        return jsonify(effectiveness)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# PERFORMANCE & OPTIMIZATION
# ============================================================================

@advanced_api.route('/performance/report', methods=['GET'])
@require_login
def get_performance_report():
    """Get performance metrics"""
    try:
        report = optimizer.get_performance_report()
        return jsonify(report)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/cache/invalidate', methods=['POST'])
@require_login
def invalidate_cache():
    """Invalidate cache"""
    try:
        pattern = request.json.get('pattern')
        optimizer.invalidate_cache(pattern)
        return jsonify({'success': True, 'message': 'Cache invalidated'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@advanced_api.route('/health', methods=['GET'])
@require_login
def health():
    """Health check with performance data"""
    return jsonify({
        'status': 'healthy',
        'cache_size': optimizer.cache.stats()['size'],
        'timestamp': datetime.now().isoformat()
    })
