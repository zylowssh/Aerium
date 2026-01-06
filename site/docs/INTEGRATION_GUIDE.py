"""
INTEGRATION GUIDE - Advanced Features Setup
Copy/paste these sections into your app.py file
"""

# ============================================================================
# STEP 1: Add imports to the top of your app.py
# ============================================================================

# Add these lines to your imports section:
"""
from advanced_api_routes import advanced_api
from performance_optimizer import optimizer
from tenant_manager import TenantManager
from ml_analytics import MLAnalytics
from collaboration import CollaborationManager
"""

# ============================================================================
# STEP 2: Initialize advanced features (after creating Flask app)
# ============================================================================

# Add this after: app = Flask(__name__)
"""
# Initialize advanced features
optimizer.initialize()  # Set up caching, indexing, rate limiting
tenant_manager = TenantManager()
tenant_manager.init_tenant_schema()  # Create multi-tenant tables

ml_analytics = MLAnalytics()
collab_manager = CollaborationManager()  # Creates collaboration tables

# Register advanced API routes
app.register_blueprint(advanced_api)

print("✓ Advanced features initialized:")
print("  - Data Export (CSV, Excel, PDF)")
print("  - Multi-Tenant Support (Organizations)")
print("  - ML Analytics (Predictions, Anomalies, Trends)")
print("  - Collaboration (Team Dashboards, Comments)")
print("  - AI Recommendations (Smart Suggestions)")
print("  - Performance Optimization (Caching, Indexing)")
"""

# ============================================================================
# STEP 3: Use cached readings in your existing routes
# ============================================================================

# Replace your sensor readings query with:
"""
# OLD WAY:
# readings = db.cursor().execute(
#     'SELECT * FROM sensor_readings WHERE sensor_id = ? LIMIT 100',
#     (sensor_id,)
# ).fetchall()

# NEW WAY (with caching):
readings = optimizer.cache_reading(sensor_id, hours=24)
"""

# ============================================================================
# STEP 4: WebSocket integration for real-time collaboration
# ============================================================================

# Add to your existing WebSocket handlers:
"""
from flask_socketio import emit, join_room, leave_room

# When user joins a shared dashboard
@socketio.on('join_team_share')
def on_join_share(data):
    team_share_id = data['team_share_id']
    user_id = session['user_id']
    
    # Join the room for real-time updates
    join_room(f'team_{team_share_id}')
    
    # Broadcast that user joined
    emit('user_joined', {
        'user_id': user_id,
        'team_share_id': team_share_id
    }, room=f'team_{team_share_id}')

# When CO₂ reading occurs, broadcast to team
@socketio.on('new_reading')
def on_new_reading(data):
    team_share_id = data['team_share_id']
    
    # Emit to all team members
    emit('reading_update', data, room=f'team_{team_share_id}')
    
    # Check shared alerts
    shared_alerts = db.cursor().execute(
        'SELECT * FROM shared_alerts WHERE team_share_id = ?',
        (team_share_id,)
    ).fetchall()
    
    for alert in shared_alerts:
        # Trigger alert if condition met
        pass
"""

# ============================================================================
# STEP 5: Environment and Dependencies Check
# ============================================================================

# Run this once to ensure all dependencies are installed:
"""
python -m pip install openpyxl WeasyPrint pandas scikit-learn
"""

# All are already in requirements.txt, but scikit-learn might need this:
"""
python -m pip install scikit-learn --upgrade
"""

# ============================================================================
# EXAMPLE API USAGE IN YOUR FRONTEND
# ============================================================================

# JavaScript/Fetch examples for your templates:

"""
// Export CO₂ data as PDF
fetch('/api/advanced/export/pdf', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        sensor_id: 1,
        days: 30
    })
})
.then(r => r.blob())
.then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'co2_report.pdf';
    a.click();
});

// Get CO₂ predictions
fetch('/api/advanced/analytics/predict/1?hours=24')
    .then(r => r.json())
    .then(data => {
        console.log('Next 24 hours predictions:', data.predictions);
    });

// Get AI recommendations
fetch('/api/advanced/recommendations/1?building_type=office&occupancy=20')
    .then(r => r.json())
    .then(data => {
        data.recommendations.forEach(rec => {
            console.log(rec.title, '-', rec.description);
        });
    });

// Share dashboard with team
fetch('/api/advanced/collaboration/share', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        sensor_id: 1,
        team_members: [2, 3, 4],
        permission_level: 'viewer'
    })
})
.then(r => r.json())
.then(data => console.log('Share ID:', data.share_id));

// Get team activity
fetch('/api/advanced/collaboration/activity/1?limit=20')
    .then(r => r.json())
    .then(data => console.log('Recent activities:', data.activities));

// Detect anomalies
fetch('/api/advanced/analytics/anomalies/1')
    .then(r => r.json())
    .then(data => {
        console.log('Found', data.count, 'anomalies');
        data.anomalies.forEach(anomaly => {
            console.log(anomaly.timestamp, '-', anomaly.ppm, 'ppm (Severity:', anomaly.severity + ')');
        });
    });
"""

# ============================================================================
# DATABASE SCHEMA ADDITIONS
# ============================================================================

# These are created automatically, but for reference:
"""
-- Multi-tenant tables (in tenant_manager.py)
CREATE TABLE tenants (...)
CREATE TABLE tenant_members (...)
CREATE TABLE tenant_locations (...)

-- Collaboration tables (in collaboration.py)
CREATE TABLE team_shares (...)
CREATE TABLE shared_alerts (...)
CREATE TABLE reading_comments (...)
CREATE TABLE team_activity (...)

-- Performance indexes (in performance_optimizer.py)
CREATE INDEX idx_sensor_readings_sensor_timestamp
CREATE INDEX idx_sensor_readings_timestamp
CREATE INDEX idx_users_username
CREATE INDEX idx_audit_log_user_timestamp
CREATE INDEX idx_sensors_user_id
CREATE INDEX idx_readings_ppm_timestamp
"""

# ============================================================================
# NEXT STEPS
# ============================================================================

"""
IMPLEMENTATION CHECKLIST:

1. ✓ Add imports to app.py
2. ✓ Initialize advanced features (optimizer, tenant_manager, etc)
3. ✓ Register advanced_api blueprint
4. ✓ Test API endpoints with curl or Postman
5. □ Create frontend UI components for new features
6. □ Add WebSocket handlers for real-time collaboration
7. □ Create admin dashboard to manage organizations
8. □ Set up scheduled exports (celery/APScheduler)
9. □ Add email notifications for recommendations
10. □ Monitor performance metrics

QUICK TEST:
    curl http://localhost:5000/api/advanced/health
    # Should return: {"status": "healthy", ...}

VERIFY INSTALLATION:
    python -c "from ml_analytics import MLAnalytics; print('✓ ML Analytics imported')"
    python -c "from collaboration import CollaborationManager; print('✓ Collaboration imported')"
    python -c "from tenant_manager import TenantManager; print('✓ Tenant Manager imported')"
"""
