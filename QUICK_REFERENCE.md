# ⚡ QUICK REFERENCE - API Endpoints & Usage

## 🚀 Quick Start (2 minutes)

### 1. Add to app.py (after `app = Flask(__name__)`)
```python
from advanced_api_routes import advanced_api
from performance_optimizer import optimizer

app.register_blueprint(advanced_api)
optimizer.initialize()
```

### 2. Restart Flask
```bash
python site/app.py
```

### 3. Test
```bash
curl http://localhost:5000/api/advanced/health
```

---

## 📊 All API Endpoints (28+)

### Export APIs (5 endpoints)

```bash
# Export as CSV
curl -X POST http://localhost:5000/api/advanced/export/csv \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": 1, "days": 30}'

# Export as Excel (formatted)
curl -X POST http://localhost:5000/api/advanced/export/excel \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": 1, "days": 30, "include_charts": true}'

# Export as PDF (styled report)
curl -X POST http://localhost:5000/api/advanced/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": 1, "days": 30}'

# Schedule automated exports
curl -X POST http://localhost:5000/api/advanced/export/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "format": "pdf",
    "frequency": "daily",
    "email": "user@example.com"
  }'
```

---

### Multi-Tenant APIs (4 endpoints)

```bash
# Create organization
curl -X POST http://localhost:5000/api/advanced/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "tier": "pro"}'

# Add team member
curl -X POST http://localhost:5000/api/advanced/tenants/1/members \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "role": "admin", "permissions": ["read", "write"]}'

# Create location
curl -X POST http://localhost:5000/api/advanced/tenants/1/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NYC Office",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Get organization stats
curl http://localhost:5000/api/advanced/tenants/1/stats
```

---

### ML Analytics APIs (4 endpoints)

```bash
# Get CO₂ predictions (next 24 hours)
curl http://localhost:5000/api/advanced/analytics/predict/1?hours=24

# Detect anomalies
curl http://localhost:5000/api/advanced/analytics/anomalies/1

# Analyze trends (last 30 days)
curl http://localhost:5000/api/advanced/analytics/trends/1?days=30

# Get AI insights
curl http://localhost:5000/api/advanced/analytics/insights/1
```

---

### Collaboration APIs (5 endpoints)

```bash
# Share dashboard with team
curl -X POST http://localhost:5000/api/advanced/collaboration/share \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "team_members": [2, 3, 4],
    "permission_level": "viewer"
  }'

# Create team alert
curl -X POST http://localhost:5000/api/advanced/collaboration/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "team_share_id": 1,
    "alert_name": "High CO₂",
    "condition": "ppm > 800",
    "threshold_value": 800,
    "notify_users": [2, 3, 4]
  }'

# Add comment on reading
curl -X POST http://localhost:5000/api/advanced/collaboration/comments/123 \
  -H "Content-Type: application/json" \
  -d '{"comment": "Meeting at 3pm caused spike"}'

# Get comments on reading
curl http://localhost:5000/api/advanced/collaboration/comments/123

# Get team activity feed
curl http://localhost:5000/api/advanced/collaboration/activity/1?limit=20
```

---

### Recommendation APIs (2 endpoints)

```bash
# Get recommendations
curl 'http://localhost:5000/api/advanced/recommendations/1?building_type=office&occupancy=20'

# Track recommendation effectiveness
curl -X POST http://localhost:5000/api/advanced/recommendations/track \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "recommendation_id": "ventilation",
    "action": "Opened windows for 5 minutes",
    "co2_before": 750,
    "co2_after": 620
  }'
```

---

### Performance APIs (3 endpoints)

```bash
# Get performance report (cache hit rate, query times)
curl http://localhost:5000/api/advanced/performance/report

# Clear cache
curl -X POST http://localhost:5000/api/advanced/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"pattern": "readings_*"}'

# Health check
curl http://localhost:5000/api/advanced/health
```

---

## 🎯 Common Use Cases (JavaScript/Fetch)

### Export CO₂ Data as PDF
```javascript
async function exportToPDF() {
    const response = await fetch('/api/advanced/export/pdf', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            sensor_id: 1,
            days: 30
        })
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'co2_report.pdf';
    a.click();
}
```

### Get CO₂ Predictions
```javascript
async function getPredictions() {
    const response = await fetch('/api/advanced/analytics/predict/1?hours=24');
    const data = await response.json();
    console.log('Next 24 hours:', data.predictions);
    // Plot predictions on chart
    plotChart(data.predictions);
}
```

### Get AI Recommendations
```javascript
async function getRecommendations() {
    const response = await fetch(
        '/api/advanced/recommendations/1?building_type=office&occupancy=20'
    );
    const data = await response.json();
    
    data.recommendations.forEach(rec => {
        console.log(`${rec.title} (${rec.priority})`);
        console.log(`  Action: ${rec.action}`);
        console.log(`  Impact: ${rec.impact}`);
        console.log(`  Confidence: ${rec.confidence}`);
    });
}
```

### Share Dashboard with Team
```javascript
async function shareWithTeam() {
    const response = await fetch('/api/advanced/collaboration/share', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            sensor_id: 1,
            team_members: [2, 3, 4],  // User IDs
            permission_level: 'viewer'
        })
    });
    
    const data = await response.json();
    console.log('Share ID:', data.share_id);
    // Now team can view this sensor in real-time
}
```

### Create Team Alert
```javascript
async function createTeamAlert() {
    const response = await fetch('/api/advanced/collaboration/alerts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            team_share_id: 1,
            alert_name: 'High CO₂',
            condition: 'ppm > 800',
            threshold_value: 800,
            notify_users: [2, 3, 4]
        })
    });
    
    const data = await response.json();
    console.log('Alert created:', data.alert_id);
    // Team will be notified when CO₂ exceeds 800 ppm
}
```

### Detect Anomalies
```javascript
async function detectAnomalies() {
    const response = await fetch('/api/advanced/analytics/anomalies/1');
    const data = await response.json();
    
    console.log(`Found ${data.count} anomalies:`);
    data.anomalies.forEach(anom => {
        console.log(
            `${anom.timestamp}: ${anom.ppm} ppm (Severity: ${anom.severity})`
        );
    });
}
```

---

## 🔧 Python Backend Usage

### Using DataExporter
```python
from export_manager import DataExporter

exporter = DataExporter()

# Export to Excel
excel_bytes = exporter.export_to_excel(
    data=[
        {'timestamp': '2024-01-01 10:00', 'ppm': 520, 'temp': 22, 'humidity': 45},
        # ... more readings
    ],
    title='January CO₂ Report',
    charts_data={'ppm': [520, 530, 540, ...]}
)

# Send to user
return send_file(excel_bytes, as_attachment=True, download_name='report.xlsx')
```

### Using TenantManager
```python
from tenant_manager import TenantManager

tm = TenantManager()
tm.init_tenant_schema()  # Run once

# Create organization
tenant_id = tm.create_tenant('Acme Corp', owner_user_id=1, subscription_tier='pro')

# Add member
tm.add_tenant_member(tenant_id, user_id=2, role='admin', permissions=['read', 'write'])

# Get stats
stats = tm.get_tenant_statistics(tenant_id)
print(f"Members: {stats['members']}, Sensors: {stats['sensors']}")
```

### Using MLAnalytics
```python
from ml_analytics import MLAnalytics

ml = MLAnalytics()

# Get predictions
predictions = ml.predict_co2_levels(sensor_id=1, hours=24)
# [520, 535, 545, 560, ...]

# Find anomalies
anomalies = ml.detect_anomalies(sensor_id=1)
# [{'timestamp': '...', 'ppm': 1200, 'severity': 'high'}, ...]

# Get insights
insights = ml.get_insights(sensor_id=1)
# ["CO₂ increased 15% today..."]
```

### Using CollaborationManager
```python
from collaboration import CollaborationManager

collab = CollaborationManager()

# Share with team
share_id = collab.create_team_share(
    user_id=1,
    sensor_id=1,
    team_members=[2, 3, 4],
    permission_level='viewer'
)

# Create alert
alert_id = collab.create_shared_alert(
    team_share_id=share_id,
    alert_name='High CO₂',
    condition='ppm > 800',
    threshold_value=800,
    notify_users=[2, 3, 4]
)
```

### Using AIRecommender
```python
from ai_recommender import AIRecommender

rec = AIRecommender()

# Get recommendations
recommendations = rec.get_recommendations(
    sensor_id=1,
    building_type='office',
    occupancy_count=20
)

for r in recommendations:
    print(f"{r['title']} ({r['priority']})")
    print(f"  Action: {r['action']}")
    print(f"  Confidence: {r['confidence']}")
```

### Using PerformanceOptimizer
```python
from performance_optimizer import optimizer, cache_result

optimizer.initialize()

# Cache readings (10x faster after first request)
readings = optimizer.cache_reading(sensor_id=1, hours=24)

# Get performance metrics
report = optimizer.get_performance_report()
print(f"Cache size: {report['cache']['size']}")
print(f"Slow queries: {report['slow_queries']}")

# Decorator for caching
@cache_result(ttl=300)  # 5-minute cache
def expensive_calculation():
    return complex_analysis()
```

---

## 🎓 Learning Path

1. **5 min**: Read FINAL_SUMMARY.md
2. **5 min**: Read FEATURES_IMPLEMENTED.md
3. **5 min**: Integrate 4 lines into app.py
4. **2 min**: Run `curl http://localhost:5000/api/advanced/health`
5. **30 min**: Try all endpoints with Postman or curl
6. **1 hour**: Read each module's docstrings
7. **2+ hours**: Build UI components for new features

---

## 📞 Quick Troubleshooting

**ImportError: No module named 'openpyxl'**
```bash
pip install openpyxl
```

**ImportError: No module named 'sklearn'**
```bash
pip install scikit-learn
```

**Database error when initializing**
```python
# Make sure to call this once on startup
optimizer.initialize()
tenant_manager.init_tenant_schema()
collab_mgr = CollaborationManager()  # Creates tables automatically
```

**Rate limiting blocking requests**
```python
from performance_optimizer import rate_limiter
wait_time = rate_limiter.get_wait_time(user_id)
# Wait {wait_time} seconds before retry
```

---

## ✨ Quick Commands

```bash
# Verify everything is installed
python verify_features.py

# View architecture diagram
python ARCHITECTURE_DIAGRAM.py

# Test an endpoint
curl http://localhost:5000/api/advanced/health

# Integration guide
cat site/INTEGRATION_GUIDE.py

# Quick setup
cat site/QUICKSTART_INTEGRATION.py
```

---

**That's all you need to know! Go build amazing things! 🚀**
