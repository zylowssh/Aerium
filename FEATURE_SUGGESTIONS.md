# 🚀 Feature Suggestions for Aerium

Based on your current implementation, here are prioritized features you can add:

---

## 🎯 High Priority Features

### 1. **CSV Export Functionality** ⭐⭐⭐
**Status:** Mentioned in README but not implemented  
**Impact:** High - Essential for data analysis

**Implementation:**
- Add download button on analytics page
- Export filtered date ranges
- Include metadata (thresholds, timestamps)
- Format: timestamp, ppm, quality_level

**Files to modify:**
- `site/app.py` - Add `/api/export/csv` endpoint
- `site/static/js/analytics.js` - Add export button handler

---

### 2. **Alert System with Persistence** ⭐⭐⭐
**Status:** Partially implemented (visual only)  
**Impact:** High - Core safety feature

**Features:**
- Store alerts in database
- Alert history page
- Configurable alert cooldown
- Sound notifications (web + mobile)
- Email/SMS notifications

**Database schema:**
```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    ppm INTEGER,
    threshold_type TEXT,  -- 'bad' or 'critical'
    acknowledged BOOLEAN DEFAULT 0
)
```

**New endpoints:**
- `GET /api/alerts` - Get alert history
- `POST /api/alerts/{id}/acknowledge` - Mark as read
- `DELETE /api/alerts` - Clear history

---

### 3. **Data Retention & Cleanup UI** ⭐⭐
**Status:** Function exists but no UI  
**Impact:** Medium - Prevents database bloat

**Add to settings page:**
- Slider for retention period (7-365 days)
- Current database size display
- Manual cleanup button
- Automatic cleanup scheduling

---

### 4. **User Authentication** ⭐⭐⭐
**Status:** Not implemented  
**Impact:** High - Security for production

**Features:**
- Login/logout system
- User roles (admin, viewer)
- Token-based auth for WebSocket
- Session management

**Stack:**
- Flask-Login for web
- JWT tokens for API/WebSocket

---

### 5. **Real Sensor Integration** ⭐⭐⭐
**Status:** Simulation only  
**Impact:** High - Core functionality

**Supported sensors:**
- MH-Z19B (UART/Serial)
- SCD30 (I2C)
- SCD40/41 (I2C)
- CCS811 (I2C)

**Implementation:**
```python
# site/sensor_driver.py
class SensorReader:
    def read_co2(self):
        # Read from actual hardware
        pass
```

---

## 🎨 Medium Priority Features

### 6. **Mobile App Features** ⭐⭐
**KivyMD App Enhancements:**

#### a. **Historical Graph View**
```python
from kivy_garden.graph import Graph, MeshLinePlot

class HistoryScreen(MDScreen):
    # Display last 24h with zoomable graph
    pass
```

#### b. **Push Notifications**
```python
from plyer import notification

def send_alert():
    notification.notify(
        title="CO₂ Alert",
        message=f"High CO₂: {ppm} ppm",
        app_name="Aerium",
        timeout=10
    )
```

#### c. **Widget/Home Screen Display**
- Show current CO₂ on home screen
- Quick glance at air quality
- Update every 5 minutes

#### d. **Multiple Server Support**
- Connect to different locations
- Switch between rooms/buildings
- Compare multiple sensors

---

### 7. **Advanced Analytics** ⭐⭐
**Status:** Basic analytics exist  
**Enhancements:**

- **Trend Analysis:**
  - Week-over-week comparison
  - Month-over-month growth
  - Time-of-day patterns

- **Predictive Alerts:**
  - Predict when CO₂ will reach threshold
  - Recommend ventilation timing

- **Correlation Analysis:**
  - Room occupancy vs CO₂
  - Time spent in each quality zone
  - Best/worst times of day

**New page:** `/analytics/advanced`

---

### 8. **Customizable Dashboard** ⭐⭐
**Status:** Fixed layout  
**Features:**
- Drag-and-drop widgets
- Choose which metrics to display
- Custom time ranges
- Save layout preferences

---

### 9. **API Rate Limiting** ⭐⭐
**Status:** Not implemented  
**Impact:** Medium - Prevents abuse

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route("/api/latest")
@limiter.limit("60 per minute")
def api_latest():
    pass
```

---

### 10. **Backup & Restore** ⭐
**Features:**
- Export entire database
- Import historical data
- Scheduled backups
- Cloud sync (optional)

---

## 🌟 Advanced Features

### 11. **Multi-Room Support** ⭐⭐⭐
**Status:** Single sensor only  
**Features:**
- Multiple sensors per installation
- Room/location management
- Comparative view
- Room selection dropdown

**Database changes:**
```sql
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY,
    name TEXT,
    location TEXT
);

ALTER TABLE co2_readings ADD COLUMN room_id INTEGER;
```

---

### 12. **Ventilation Control** ⭐⭐
**Hardware integration:**
- Control smart ventilation systems
- Automatic window opening (smart home)
- HVAC system integration
- GPIO relay control (Raspberry Pi)

---

### 13. **Machine Learning Features** ⭐
**Predictive models:**
- Predict CO₂ levels based on time/day
- Anomaly detection
- Optimal ventilation scheduling
- Energy optimization

---

### 14. **Multi-Language Support** ⭐
**Status:** French only  
**Add:** English, Spanish, German
**Use:** Flask-Babel for i18n

---

### 15. **Dark/Light Theme Toggle** ⭐
**Status:** Dark mode only  
**Add:** Theme switcher in settings
**Persist:** User preference in localStorage

---

## 📱 Mobile-Specific Features

### 16. **Offline Mode**
- Cache last 24h of data
- Work without internet
- Sync when reconnected

### 17. **Geolocation**
- Auto-detect nearest sensor
- Location-based alerts
- Map view of multiple sensors

### 18. **Voice Commands**
- "What's the current CO₂?"
- "Show me today's graph"
- "Set alert threshold to 1000"

### 19. **Wear OS / Apple Watch Support**
- Quick glance widget
- Haptic alerts
- Complication support

---

## 🔧 Technical Improvements

### 20. **Logging System** ⭐⭐
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aerium.log'),
        logging.StreamHandler()
    ]
)
```

### 21. **Health Check Endpoint** ⭐
```python
@app.route("/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "connected",
        "websocket": "running",
        "version": "1.0.0"
    })
```

### 22. **Docker Support** ⭐⭐
Create `Dockerfile` for easy deployment:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY site/ .
EXPOSE 5000
CMD ["python", "app.py"]
```

### 23. **Unit Tests** ⭐⭐
```python
# tests/test_api.py
def test_latest_endpoint():
    response = client.get('/api/latest')
    assert response.status_code == 200
    assert 'ppm' in response.json
```

### 24. **CI/CD Pipeline** ⭐
- GitHub Actions for automated testing
- Automatic deployment
- Version tagging

---

## 🎯 Immediate Next Steps (Recommended Order)

1. **CSV Export** (2-3 hours) - Completes documented feature
2. **Alert System** (4-6 hours) - Critical safety feature
3. **Real Sensor Integration** (6-8 hours) - Makes it production-ready
4. **Mobile App Enhancements** (ongoing) - Improves user experience
5. **Authentication** (4-6 hours) - Secures the system

---

## 💡 Quick Wins (Easy to implement)

- ✅ Add "Clear All Data" button in settings
- ✅ Show total readings count
- ✅ Add keyboard shortcuts (ESC = close, R = refresh)
- ✅ Favicon for browser tab
- ✅ Meta tags for sharing (Open Graph)
- ✅ Print stylesheet for reports
- ✅ Tooltips on all controls
- ✅ Loading skeletons for data fetch

---

## 📊 Feature Implementation Priority Matrix

```
High Impact, Low Effort:
- CSV Export
- Dark/Light theme toggle
- Health check endpoint

High Impact, High Effort:
- Alert system with DB
- Real sensor integration
- Authentication system
- Multi-room support

Low Impact, Low Effort:
- Keyboard shortcuts
- Tooltips
- Loading states

Low Impact, High Effort:
- Machine learning
- Voice commands
- Wear OS support
```

---

Let me know which features you'd like to implement first, and I'll help you build them! 🚀
