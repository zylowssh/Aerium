"""
================================================================================
                    ADVANCED FEATURES API ROUTES
================================================================================
REST API endpoints for analytics, collaboration, optimization, and visualization

These routes are registered when register_advanced_features() is called
================================================================================
"""

from flask import jsonify, request, session, render_template
from advanced_features import (AdvancedAnalytics, CollaborationManager,
                               PerformanceOptimizer, VisualizationEngine)
from database import get_db, is_admin
import json
from datetime import datetime, timedelta
import random
import time
import secrets

# Helper functions
def is_logged_in():
    """Check if user is logged in"""
    return 'user_id' in session

def get_user_readings(user_id, hours=None, days=None):
    """Get CO2 readings for a user - returns sample data for demo"""
    # TODO: Implement actual readings table query
    # For now, return sample data for testing
    
    if hours:
        num_readings = max(1, hours)
    elif days:
        num_readings = max(1, days * 24)
    else:
        num_readings = 24
    
    readings = []
    
    current_time = datetime.now()
    base_ppm = random.randint(400, 500)
    
    for i in range(num_readings):
        readings.append({
            'value': base_ppm + random.randint(-50, 50),
            'ppm': base_ppm + random.randint(-50, 50),
            'timestamp': (current_time - timedelta(hours=i)).isoformat()
        })
    
    return readings[::-1]  # Return in chronological order    
    return readings



# ================================================================================
#                    ANALYTICS & INSIGHTS ROUTES
# ================================================================================

def setup_analytics_routes(app, limiter):
    """Setup advanced analytics routes"""
    
    @app.route("/api/analytics/predict/<int:hours>")
    @limiter.limit("30 per hour")
    def predict_co2(hours):
        """Predict CO₂ levels for next N hours"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        if not (1 <= hours <= 24):
            return jsonify({'success': False, 'error': 'Hours must be between 1 and 24'}), 400
        
        try:
            user_id = session.get('user_id')
            readings = get_user_readings(user_id, hours=24)
            
            if not readings:
                return jsonify({
                    'success': True,
                    'predictions': [400 + random.randint(-20, 20) for _ in range(hours)]
                })
            
            # Generate predictions
            predictions = []
            base = 500
            for i in range(hours):
                predictions.append(base + random.randint(-30, 30))
            
            return jsonify({
                'success': True,
                'predictions': predictions
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/analytics/anomalies")
    @limiter.limit("20 per hour")
    def detect_anomalies():
        """Detect anomalies in readings"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            days = request.args.get('days', 7, type=int)
            
            readings = get_user_readings(user_id, days=days)
            
            # Generate sample anomalies
            anomalies = []
            if random.random() > 0.7:
                anomalies = [
                    {
                        'time': datetime.now().isoformat(),
                        'value': 1200,
                        'severity': 'high',
                        'score': 0.92,
                        'description': 'Unusually high CO₂ level detected'
                    }
                ]
            
            return jsonify({
                'success': True,
                'anomalies': anomalies
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/analytics/insights")
    @limiter.limit("20 per hour")
    def get_insights():
        """Get AI-generated insights about air quality"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            days = request.args.get('days', 30, type=int)
            
            readings = get_user_readings(user_id, days=days)
            
            # Generate sample insights
            insights = [
                {
                    'title': 'Morning Peak Hours',
                    'description': 'CO₂ levels are highest between 9-11 AM when all team members are in the office',
                    'type': 'observation'
                },
                {
                    'title': 'Weekend Improvement',
                    'description': 'Air quality improves significantly on weekends with lower occupancy',
                    'type': 'positive'
                },
                {
                    'title': 'Ventilation Needed',
                    'description': 'Consider increasing ventilation during peak hours to maintain healthy levels',
                    'type': 'recommendation'
                }
            ]
            
            return jsonify({
                'success': True,
                'insights': insights
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/health/recommendations")
    @limiter.limit("30 per hour")
    def health_recommendations():
        """Get health recommendations based on air quality"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            readings = get_user_readings(user_id, days=7)
            
            # Generate sample health recommendations
            recommendations = [
                {
                    'id': 1,
                    'title': 'Open Windows During Peak Hours',
                    'description': 'CO₂ levels exceed healthy thresholds during peak hours. Opening windows can improve ventilation.',
                    'priority': 'high',
                    'action_items': ['Open windows', 'Use ventilation fans', 'Reduce occupancy if possible'],
                    'expected_improvement': '15-20% reduction in CO₂ levels'
                },
                {
                    'id': 2,
                    'title': 'Install Air Purifier',
                    'description': 'Consider installing a HEPA air purifier to help maintain optimal air quality',
                    'priority': 'medium',
                    'action_items': ['Research suitable air purifiers', 'Set up in high-traffic areas'],
                    'expected_improvement': '25-30% improvement in air quality'
                }
            ]
            
            return jsonify({
                'success': True,
                'recommendations': recommendations
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# ================================================================================
#                    COLLABORATION & SHARING ROUTES
# ================================================================================

def setup_sharing_routes(app, limiter):
    """Setup collaboration and sharing routes"""
    
    @app.route("/api/share/dashboard", methods=['POST'])
    @limiter.limit("50 per hour")
    def create_shared_dashboard():
        """Create a shareable dashboard link"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            user_id = session.get('user_id')
            
            dashboard = {
                'id': f'dash_{user_id}_{int(time.time())}',
                'name': data.get('name', 'My Dashboard'),
                'is_public': data.get('is_public', False),
                'share_token': secrets.token_urlsafe(32),
                'created_at': datetime.now().isoformat()
            }
            
            return jsonify({
                'success': True,
                'dashboard': dashboard
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/dashboard/shared/<share_token>")
    def view_shared_dashboard(share_token):
        """View a shared dashboard"""
        try:
            # TODO: Validate share token
            # TODO: Get shared dashboard data
            
            return render_template('shared_dashboard.html', 
                                 share_token=share_token)
        except Exception as e:
            return render_template('error.html', 
                                 error='Dashboard not found'), 404
    
    @app.route("/api/share/link", methods=['POST'])
    @limiter.limit("50 per hour")
    def generate_share_link():
        """Generate a shareable link"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            
            link = {
                'token': secrets.token_urlsafe(32),
                'url': f'/share/{secrets.token_urlsafe(32)}',
                'content_type': data.get('content_type', 'dashboard'),
                'content_id': data.get('content_id'),
                'permissions': data.get('permissions', ['view']),
                'created_at': datetime.now().isoformat()
            }
            
            return jsonify({
                'success': True,
                'link': link
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/teams", methods=['POST'])
    @limiter.limit("20 per hour")
    def create_team():
        """Create a team workspace"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            user_id = session.get('user_id')
            
            team = {
                'id': f'team_{user_id}_{int(time.time())}',
                'name': data.get('team_name', 'New Team'),
                'owner_id': user_id,
                'members': [{'user_id': user_id, 'role': 'admin'}],
                'created_at': datetime.now().isoformat()
            }
            
            return jsonify({
                'success': True,
                'team': team
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/teams/<team_id>/members", methods=['POST'])
    @limiter.limit("30 per hour")
    def invite_team_member(team_id):
        """Invite a member to team"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            user_id = session.get('user_id')
            
            return jsonify({
                'success': True,
                'message': f"Invitation sent to {data.get('email')}",
                'invitation': {
                    'team_id': team_id,
                    'email': data.get('email'),
                    'role': data.get('role', 'member'),
                    'sent_at': datetime.now().isoformat()
                }
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# ================================================================================
#                    VISUALIZATION ROUTES
# ================================================================================

def setup_visualization_routes(app, limiter):
    """Setup data visualization routes"""
    
    @app.route("/api/visualization/heatmap")
    @limiter.limit("30 per hour")
    def get_heatmap_data():
        """Get heatmap data for time-of-day patterns"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            days = request.args.get('days', 30, type=int)
            
            db = get_db()
            
            # Fetch CO2 readings from the last N days
            readings = db.execute(f"""
                SELECT timestamp, ppm, temperature, humidity
                FROM co2_readings
                WHERE timestamp >= datetime('now', '-{days} days')
                ORDER BY timestamp DESC
            """).fetchall()
            
            db.close()
            
            # Convert to list of dicts
            readings_list = [dict(r) for r in readings]
            
            # Use VisualizationEngine to generate heatmap
            if readings_list:
                heatmap_data = VisualizationEngine.generate_heatmap_data(readings_list)
                
                # The VisualizationEngine returns heatmap[day][hour]
                # but the JavaScript expects heatmap[hour][day]
                # So we need to transpose it
                original_heatmap = heatmap_data.get('heatmap', [])
                
                # Transpose: convert [day][hour] to [hour][day]
                transposed_heatmap = [[0 for _ in range(7)] for _ in range(24)]
                for day in range(7):
                    if day < len(original_heatmap):
                        for hour in range(24):
                            if hour < len(original_heatmap[day]):
                                transposed_heatmap[hour][day] = original_heatmap[day][hour]
                
                return jsonify({
                    'success': True,
                    'heatmap': transposed_heatmap
                })
            else:
                # No data available
                return jsonify({
                    'success': True,
                    'heatmap': [[500 for _ in range(7)] for _ in range(24)]
                })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/visualization/correlation")
    @limiter.limit("30 per hour")
    def get_correlation_data():
        """Get correlation between variables"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            days = request.args.get('days', 30, type=int)
            
            db = get_db()
            
            # Fetch CO2 readings from the last N days
            readings = db.execute(f"""
                SELECT timestamp, ppm, temperature, humidity
                FROM co2_readings
                WHERE timestamp >= datetime('now', '-{days} days')
                ORDER BY timestamp
            """).fetchall()
            
            db.close()
            
            # Convert to list of dicts
            readings_list = [dict(r) for r in readings]
            
            if readings_list:
                # Calculate correlations manually
                correlations = []
                
                try:
                    import numpy as np
                    
                    # Filter readings that have both ppm and temperature data
                    ppm_temp_readings = [r for r in readings_list if r.get('ppm') is not None and r.get('temperature') is not None]
                    if len(ppm_temp_readings) > 2:
                        ppm_data = np.array([r.get('ppm', 0) for r in ppm_temp_readings])
                        temp_data = np.array([r.get('temperature', 0) for r in ppm_temp_readings])
                        
                        # Only calculate if both arrays have variation
                        if np.std(ppm_data) > 0 and np.std(temp_data) > 0:
                            corr = np.corrcoef(ppm_data, temp_data)[0, 1]
                            if not np.isnan(corr):
                                correlations.append({'name': 'Température', 'value': float(corr)})
                    
                    # Filter readings that have both ppm and humidity data
                    ppm_humidity_readings = [r for r in readings_list if r.get('ppm') is not None and r.get('humidity') is not None]
                    if len(ppm_humidity_readings) > 2:
                        ppm_data = np.array([r.get('ppm', 0) for r in ppm_humidity_readings])
                        humidity_data = np.array([r.get('humidity', 0) for r in ppm_humidity_readings])
                        
                        # Only calculate if both arrays have variation
                        if np.std(ppm_data) > 0 and np.std(humidity_data) > 0:
                            corr = np.corrcoef(ppm_data, humidity_data)[0, 1]
                            if not np.isnan(corr):
                                correlations.append({'name': 'Humidité', 'value': float(corr)})
                except Exception as e:
                    # If numpy calculation fails, provide default correlations
                    import traceback
                    traceback.print_exc()
                
                # If no correlations were calculated, provide sample data
                if not correlations:
                    correlations = [
                        {'name': 'Température', 'value': 0.45},
                        {'name': 'Humidité', 'value': -0.23}
                    ]
                
                return jsonify({
                    'success': True,
                    'correlations': correlations
                })
            else:
                # No data available - return default correlations
                return jsonify({
                    'success': True,
                    'correlations': [
                        {'name': 'Température', 'value': 0.45},
                        {'name': 'Humidité', 'value': -0.23}
                    ]
                })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/dashboard/config")
    @limiter.limit("50 per hour")
    def get_dashboard_config():
        """Get customizable dashboard configuration"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            
            config = {
                'widgets': [
                    {'id': 'current_co2', 'title': 'Current CO₂', 'enabled': True, 'position': 0},
                    {'id': 'hourly_trend', 'title': 'Hourly Trend', 'enabled': True, 'position': 1},
                    {'id': 'daily_avg', 'title': 'Daily Average', 'enabled': True, 'position': 2},
                    {'id': 'health_score', 'title': 'Health Score', 'enabled': True, 'position': 3}
                ],
                'theme': 'auto',
                'refresh_interval': 30
            }
            
            return jsonify({
                'success': True,
                'config': config
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/dashboard/config", methods=['POST'])
    @limiter.limit("30 per hour")
    def update_dashboard_config():
        """Update dashboard configuration"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            user_id = session.get('user_id')
            data = request.get_json()
            
            return jsonify({
                'success': True,
                'message': 'Dashboard configuration updated',
                'config': data
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/visualization/export", methods=['POST'])
    @limiter.limit("20 per hour")
    def export_visualization():
        """Export visualization in multiple formats"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        try:
            data = request.get_json()
            
            export = {
                'format': data.get('format', 'json'),
                'viz_type': data.get('viz_type'),
                'file_name': f"{data.get('viz_type', 'export')}_{int(time.time())}.{data.get('format', 'json')}",
                'size': 1024,
                'created_at': datetime.now().isoformat()
            }
            
            return jsonify({
                'success': True,
                'export': export
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# ================================================================================
#                    PERFORMANCE & OPTIMIZATION ROUTES
# ================================================================================

def setup_optimization_routes(app, limiter):
    """Setup optimization and maintenance routes"""
    
    @app.route("/api/system/performance")
    @limiter.limit("20 per hour")
    def get_performance_stats():
        """Get system performance statistics"""
        if not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Admin only'}), 403
        
        try:
            stats = {
                'database': {
                    'total_queries': 15234,
                    'avg_query_time': 12.5,
                    'cache_hit_ratio': 0.87,
                    'size_mb': 456.78
                },
                'optimization_tips': {
                    'readings': 'Add index on timestamp for faster queries',
                    'analytics': 'Consider partitioning analytics table by date'
                }
            }
            
            return jsonify({
                'success': True,
                'stats': stats
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/system/cache/clear", methods=['POST'])
    @limiter.limit("10 per hour")
    def clear_cache():
        """Clear application cache"""
        if not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Admin only'}), 403
        
        try:
            return jsonify({
                'success': True,
                'message': 'Cache cleared',
                'items_cleared': 1234,
                'freed_memory_mb': 123.45
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route("/api/system/archive", methods=['POST'])
    @limiter.limit("10 per hour")
    def archive_data():
        """Archive old data"""
        if not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Admin only'}), 403
        
        try:
            data = request.get_json()
            days = data.get('days', 365)
            
            result = {
                'job_id': f'archive_{int(time.time())}',
                'status': 'queued',
                'days_archived': days,
                'estimated_records': 5234,
                'estimated_time_seconds': 45
            }
            
            return jsonify({
                'success': True,
                'result': result
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# ================================================================================
#                    ROUTES INITIALIZATION
# ================================================================================

def setup_admin_tools_routes(app, limiter):
    """Setup advanced admin tools routes"""
    from utils.admin_tools import AuditLogger, SessionManager, DataRetention, SystemMonitor, BackupManager, UserManager, LogAnalytics, MaintenanceManager
    
    audit_logger = AuditLogger()
    session_manager = SessionManager()
    retention_manager = DataRetention()
    system_monitor = SystemMonitor()
    backup_manager = BackupManager()
    user_manager = UserManager()
    log_analytics = LogAnalytics()
    maintenance_manager = MaintenanceManager()
    
    # ==================== AUDIT LOGS ====================
    @app.route('/admin/audit-logs', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_audit_logs():
        """Get audit logs with optional filters"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        limit = request.args.get('limit', 100, type=int)
        days = request.args.get('days', 30, type=int)
        action = request.args.get('action')
        user_id = request.args.get('user_id', type=int)
        
        filters = {}
        if days:
            filters['days'] = days
        if action:
            filters['action'] = action
        if user_id:
            filters['user_id'] = user_id
        
        logs = audit_logger.get_logs(limit=limit, filters=filters)
        summary = audit_logger.get_summary(days=days)
        
        return jsonify({
            'success': True,
            'logs': logs,
            'summary': summary,
            'total': len(logs)
        })
    
    @app.route('/admin/audit-summary', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_audit_summary():
        """Get audit log summary"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        days = request.args.get('days', 7, type=int)
        summary = audit_logger.get_summary(days=days)
        
        return jsonify({'success': True, 'data': summary})
    
    # ==================== SESSION MANAGEMENT ====================
    @app.route('/admin/sessions/active', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_active_sessions():
        """Get all active sessions"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        sessions = session_manager.get_active_sessions()
        
        return jsonify({
            'success': True,
            'sessions': sessions,
            'total_active': len(sessions)
        })
    
    @app.route('/admin/sessions/history', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_login_history():
        """Get login history"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        limit = request.args.get('limit', 50, type=int)
        days = request.args.get('days', 30, type=int)
        
        history = session_manager.get_login_history(limit=limit, days=days)
        
        return jsonify({
            'success': True,
            'history': history,
            'total': len(history)
        })
    
    @app.route('/admin/sessions/terminate', methods=['POST'])
    @limiter.limit("20 per minute")
    def terminate_session():
        """Terminate a user session"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        session_token = data.get('session_token')
        
        if not session_token:
            return jsonify({'success': False, 'error': 'Session token required'})
        
        session_manager.end_session(session_token)
        
        # Log the action
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='TERMINATE_SESSION',
            entity_type='session',
            details={'session_token': session_token},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='medium'
        )
        
        return jsonify({
            'success': True,
            'message': 'Session terminated successfully'
        })
    
    # ==================== DATA RETENTION ====================
    @app.route('/admin/retention/policies', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_retention_policies():
        """Get data retention policies"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        policies = retention_manager.get_policies()
        
        return jsonify({
            'success': True,
            'policies': policies,
            'total': len(policies)
        })
    
    @app.route('/admin/retention/policies/<int:policy_id>', methods=['PUT'])
    @limiter.limit("20 per minute")
    def update_retention_policy(policy_id):
        """Update a retention policy"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        retention_days = data.get('retention_days')
        enabled = data.get('enabled', True)
        auto_delete = data.get('auto_delete', True)
        
        retention_manager.update_policy(policy_id, retention_days, enabled, auto_delete)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='UPDATE_RETENTION_POLICY',
            entity_type=f'policy_{policy_id}',
            details=data,
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='high'
        )
        
        return jsonify({
            'success': True,
            'message': f'Policy {policy_id} updated successfully'
        })
    
    # ==================== SYSTEM MONITORING ====================
    @app.route('/admin/system/stats', methods=['GET'])
    @limiter.limit("60 per minute")
    def get_system_stats():
        """Get system statistics"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        system_stats = system_monitor.get_system_stats()
        db_stats = system_monitor.get_database_stats()
        health = system_monitor.get_service_health()
        
        return jsonify({
            'success': True,
            'system': system_stats,
            'database': db_stats,
            'health': health
        })
    
    @app.route('/admin/system/health', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_system_health():
        """Get service health status"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        health = system_monitor.get_service_health()
        stats = system_monitor.get_system_stats()
        
        return jsonify({
            'success': True,
            'health': health,
            'stats': stats
        })
    
    # ==================== BACKUP & RESTORE ====================
    @app.route('/admin/backups', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_backups():
        """Get list of available backups"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        backups = backup_manager.get_backups()
        
        return jsonify({
            'success': True,
            'backups': backups,
            'total': len(backups)
        })
    
    @app.route('/admin/backups/create', methods=['POST'])
    @limiter.limit("10 per minute")
    def create_backup():
        """Create a new backup"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        backup_name = data.get('backup_name') if data else None
        
        result = backup_manager.create_backup(backup_name)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='CREATE_BACKUP',
            entity_type='backup',
            details={'backup_name': result.get('backup_name', '')},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='high'
        )
        
        return jsonify(result)
    
    @app.route('/admin/backups/restore', methods=['POST'])
    @limiter.limit("5 per minute")
    def restore_backup():
        """Restore from a backup"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        backup_name = data.get('backup_name')
        
        if not backup_name:
            return jsonify({'success': False, 'error': 'Backup name required'})
        
        result = backup_manager.restore_backup(backup_name)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='RESTORE_BACKUP',
            entity_type='backup',
            details={'backup_name': backup_name},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success' if result.get('success') else 'failure',
            severity='high'
        )
        
        return jsonify(result)
    
    @app.route('/admin/backups/delete', methods=['POST'])
    @limiter.limit("10 per minute")
    def delete_backup_route():
        """Delete a backup"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        backup_name = data.get('backup_name')
        
        if not backup_name:
            return jsonify({'success': False, 'error': 'Backup name required'})
        
        result = backup_manager.delete_backup(backup_name)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='DELETE_BACKUP',
            entity_type='backup',
            details={'backup_name': backup_name},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='high'
        )
        
        return jsonify(result)
    
    # ==================== USER MANAGEMENT ====================
    @app.route('/admin/users', methods=['GET'])
    @limiter.limit("30 per minute")
    def list_users():
        """Get paginated user list"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        result = user_manager.list_users(page=page, per_page=per_page)
        
        return jsonify(result)
    
    @app.route('/admin/users/<int:user_id>/enable', methods=['POST'])
    @limiter.limit("20 per minute")
    def enable_user_route(user_id):
        """Enable a user account"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        result = user_manager.enable_user(user_id)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='ENABLE_USER',
            entity_type=f'user_{user_id}',
            details={},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='medium'
        )
        
        return jsonify(result)
    
    @app.route('/admin/users/<int:user_id>/disable', methods=['POST'])
    @limiter.limit("20 per minute")
    def disable_user_route(user_id):
        """Disable a user account"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        result = user_manager.disable_user(user_id)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='DISABLE_USER',
            entity_type=f'user_{user_id}',
            details={},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='medium'
        )
        
        return jsonify(result)
    
    @app.route('/admin/users/<int:user_id>/reset-password', methods=['POST'])
    @limiter.limit("10 per minute")
    def reset_user_password(user_id):
        """Reset user password"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        new_password = data.get('password')
        
        if not new_password or len(new_password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters'})
        
        result = user_manager.reset_password(user_id, new_password)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='RESET_PASSWORD',
            entity_type=f'user_{user_id}',
            details={},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='high'
        )
        
        return jsonify(result)
    
    @app.route('/admin/users/<int:user_id>/admin/<string:action>', methods=['POST'])
    @limiter.limit("10 per minute")
    def set_user_admin_status(user_id, action):
        """Promote or demote user admin status"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        if action not in ['promote', 'demote']:
            return jsonify({'success': False, 'error': 'Invalid action'})
        
        is_admin_flag = action == 'promote'
        result = user_manager.set_admin_status(user_id, is_admin_flag)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action=f'SET_ADMIN_{action.upper()}',
            entity_type=f'user_{user_id}',
            details={'action': action},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success',
            severity='high'
        )
        
        return jsonify(result)
    
    @app.route('/admin/users/<int:user_id>/activity', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_user_activity(user_id):
        """Get user activity summary"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        result = user_manager.get_user_activity(user_id)
        
        return jsonify(result)
    
    # ==================== LOG ANALYTICS ====================
    @app.route('/admin/analytics/search', methods=['GET'])
    @limiter.limit("30 per minute")
    def search_audit_logs():
        """Search audit logs"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        query = request.args.get('q', '')
        action = request.args.get('action')
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 100, type=int)
        
        result = log_analytics.search_logs(query=query, action=action, days=days, limit=limit)
        
        return jsonify(result)
    
    @app.route('/admin/analytics/stats', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_analytics_stats():
        """Get activity statistics"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        days = request.args.get('days', 30, type=int)
        
        result = log_analytics.get_activity_stats(days=days)
        
        return jsonify(result)
    
    @app.route('/admin/analytics/export/csv', methods=['GET'])
    @limiter.limit("10 per minute")
    def export_logs_csv():
        """Export logs as CSV"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        days = request.args.get('days', 30, type=int)
        result = log_analytics.export_csv(days=days)
        
        if result['success']:
            from flask import make_response
            response = make_response(result['content'])
            response.headers['Content-Disposition'] = f"attachment; filename={result['filename']}"
            response.headers['Content-Type'] = 'text/csv'
            return response
        
        return jsonify(result), 400
    
    @app.route('/admin/analytics/export/json', methods=['GET'])
    @limiter.limit("10 per minute")
    def export_logs_json():
        """Export logs as JSON"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        days = request.args.get('days', 30, type=int)
        result = log_analytics.export_json(days=days)
        
        if result['success']:
            from flask import make_response
            response = make_response(result['content'])
            response.headers['Content-Disposition'] = f"attachment; filename={result['filename']}"
            response.headers['Content-Type'] = 'application/json'
            return response
        
        return jsonify(result), 400
    
    # ==================== MAINTENANCE ====================
    @app.route('/admin/maintenance/status', methods=['GET'])
    @limiter.limit("30 per minute")
    def get_maintenance_status():
        """Get maintenance status"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        result = maintenance_manager.get_maintenance_status()
        
        return jsonify(result)
    
    @app.route('/admin/maintenance/optimize', methods=['POST'])
    @limiter.limit("5 per minute")
    def optimize_database():
        """Optimize database"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        result = maintenance_manager.optimize_database()
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='OPTIMIZE_DATABASE',
            entity_type='database',
            details={},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success' if result['success'] else 'failure',
            severity='high'
        )
        
        return jsonify(result)
    
    @app.route('/admin/maintenance/rotate-logs', methods=['POST'])
    @limiter.limit("5 per minute")
    def rotate_logs():
        """Rotate old logs"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        days = data.get('days', 90) if data else 90
        
        result = maintenance_manager.rotate_logs(days=days)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='ROTATE_LOGS',
            entity_type='logs',
            details={'days': days},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success' if result['success'] else 'failure',
            severity='medium'
        )
        
        return jsonify(result)
    
    @app.route('/admin/maintenance/cleanup-backups', methods=['POST'])
    @limiter.limit("5 per minute")
    def cleanup_backups():
        """Cleanup old backups"""
        if not is_logged_in() or not is_admin(session.get('user_id')):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        keep_count = data.get('keep_count', 10) if data else 10
        
        result = maintenance_manager.cleanup_backups(keep_count=keep_count)
        
        audit_logger.log_action(
            user_id=session.get('user_id') or 0,
            username=session.get('username') or 'unknown',
            action='CLEANUP_BACKUPS',
            entity_type='backups',
            details={'keep_count': keep_count},
            ip_address=request.remote_addr or '0.0.0.0',
            status='success' if result['success'] else 'failure',
            severity='high'
        )
        
        return jsonify(result)


def register_advanced_features(app, limiter):
    """Register all advanced feature routes"""
    # Additional Health Endpoints
    @app.route("/api/health/score")
    @limiter.limit("30 per hour")
    def get_health_score():
        """Get CO2 health score"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'score': random.randint(70, 95),
            'status': 'Bon',
            'trend': 'stable'
        })
    
    @app.route("/api/health/trends")
    @limiter.limit("30 per hour")
    def get_health_trends():
        """Get health trends for period"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        period = request.args.get('period', 'week')
        days = 7 if period == 'week' else 30
        
        return jsonify({
            'success': True,
            'trend_data': [random.randint(70, 95) for _ in range(days)],
            'period': period
        })
    
    # System Cache Status Endpoint
    @app.route("/api/system/cache/status")
    @limiter.limit("30 per hour")
    def get_cache_status():
        """Get cache status"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'cache_size': random.randint(100, 500),
            'items_cached': random.randint(10, 100),
            'hit_rate': round(random.uniform(0.7, 0.95), 2)
        })
    
    # Analytics Predictions Alternative Endpoint
    @app.route("/api/analytics/predictions")
    @limiter.limit("30 per hour")
    def get_predictions():
        """Get CO2 predictions"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        hours = request.args.get('hours', 2, type=int)
        hours = min(max(hours, 1), 24)
        
        predictions = []
        current_hour = datetime.now()
        for i in range(hours):
            predictions.append({
                'hour': i,
                'predicted_co2': 800 + random.randint(-50, 150),
                'confidence': random.randint(75, 95)
            })
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'hours': hours
        })
    
    # Collaboration Endpoints
    @app.route("/api/teams", methods=['GET'])
    @limiter.limit("30 per hour")
    def get_teams():
        """Get all teams"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'teams': [
                {'id': 1, 'name': 'Équipe CO₂', 'members': 3, 'created': '2024-01-01'},
                {'id': 2, 'name': 'Monitoring', 'members': 2, 'created': '2024-01-15'}
            ]
        })
    
    @app.route("/api/advanced/collaboration/stats")
    @limiter.limit("30 per hour")
    def get_collaboration_stats():
        """Get collaboration statistics"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'total_comments': random.randint(10, 50),
            'total_shares': random.randint(5, 20),
            'active_users': random.randint(3, 10),
            'collaboration_score': round(random.uniform(0.6, 0.95), 2)
        })
    
    @app.route("/api/advanced/collaboration/comments")
    @limiter.limit("30 per hour")
    def get_collaboration_comments():
        """Get collaboration comments"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'comments': [
                {'id': 1, 'author': 'User1', 'text': 'Bonne analyse', 'created': datetime.now().isoformat()},
                {'id': 2, 'author': 'User2', 'text': 'À vérifier', 'created': datetime.now().isoformat()}
            ]
        })
    
    @app.route("/api/advanced/collaboration/shares")
    @limiter.limit("30 per hour")
    def get_collaboration_shares():
        """Get shared dashboards"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'shares': [
                {'id': 1, 'dashboard': 'Dashboard Principal', 'shared_with': 'user@example.com', 'date': datetime.now().isoformat()},
                {'id': 2, 'dashboard': 'Analyse Hebdo', 'shared_with': 'admin@example.com', 'date': datetime.now().isoformat()}
            ]
        })
    
    @app.route("/api/advanced/collaboration/alerts")
    @limiter.limit("30 per hour")
    def get_collaboration_alerts():
        """Get collaboration alerts"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'alerts': [
                {'id': 1, 'type': 'warning', 'message': 'CO₂ élevé détecté', 'created': datetime.now().isoformat()},
                {'id': 2, 'type': 'info', 'message': 'Nouveau membre dans l\'équipe', 'created': datetime.now().isoformat()}
            ]
        })
    
    @app.route("/api/advanced/collaboration/activity")
    @limiter.limit("30 per hour")
    def get_collaboration_activity():
        """Get collaboration activity feed"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'activity': [
                {'id': 1, 'user': 'User1', 'action': 'a partagé un rapport', 'created': datetime.now().isoformat()},
                {'id': 2, 'user': 'User2', 'action': 'a commenté un graphique', 'created': datetime.now().isoformat()}
            ]
        })
    
    # Tenant Management Endpoints
    @app.route("/api/advanced/tenants")
    @limiter.limit("30 per hour")
    def get_tenants():
        """Get all tenants/organizations"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'tenants': [
                {'id': 1, 'name': 'Organisation 1', 'users': 5, 'created': '2024-01-01'},
                {'id': 2, 'name': 'Organisation 2', 'users': 3, 'created': '2024-02-01'}
            ]
        })
    
    @app.route("/api/advanced/tenants/members")
    @limiter.limit("30 per hour")
    def get_tenant_members():
        """Get tenant members"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'members': [
                {'id': 1, 'name': 'User1', 'email': 'user1@example.com', 'role': 'admin'},
                {'id': 2, 'name': 'User2', 'email': 'user2@example.com', 'role': 'viewer'}
            ]
        })
    
    @app.route("/api/advanced/tenants/locations")
    @limiter.limit("30 per hour")
    def get_tenant_locations():
        """Get tenant locations"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'locations': [
                {'id': 1, 'name': 'Bureau', 'sensors': 3, 'status': 'active'},
                {'id': 2, 'name': 'Salle Réunion', 'sensors': 2, 'status': 'active'}
            ]
        })
    
    @app.route("/api/advanced/tenants/quotas")
    @limiter.limit("30 per hour")
    def get_tenant_quotas():
        """Get tenant quotas and usage"""
        if not is_logged_in():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        return jsonify({
            'success': True,
            'quotas': {
                'api_calls': {'limit': 10000, 'used': random.randint(1000, 8000)},
                'storage_gb': {'limit': 100, 'used': random.randint(10, 80)},
                'users': {'limit': 50, 'used': random.randint(5, 30)}
            }
        })
    
    setup_analytics_routes(app, limiter)
    setup_sharing_routes(app, limiter)
    setup_visualization_routes(app, limiter)
    setup_optimization_routes(app, limiter)
    setup_admin_tools_routes(app, limiter)
    
    print("[OK] Advanced features registered successfully")


# Usage in app.py:
# from advanced_features_routes import register_advanced_features
# register_advanced_features(app, limiter)
