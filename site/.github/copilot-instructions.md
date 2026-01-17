# Aerium CO₂ Monitor - AI Coding Assistant Guidelines

**Aerium** is a multi-user CO₂ monitoring platform with Flask backend, SQLite persistence, real sensor integration, and advanced analytics. Multi-tenant support with admin controls, real-time WebSocket collaboration, and role-based access (user/admin).

## Architecture Overview

### Backend Stack
- **Framework:** Flask + Flask-SocketIO (threaded WebSocket for real-time collaboration)
- **Auth:** Session-based with email verification, password reset tokens (24h expiry), admin role separation
- **Database:** SQLite (`data/aerium.sqlite`) — schema spans: users, sensors, readings, audit logs, permissions, tokens
- **Real Sensor Support:** SCD30 (I²C), MH-Z19 (planned) + multi-sensor per user + sensor thresholds
- **Data Ingestion:** Live hardware, simulated (fake_co2.py scenarios), CSV import (`source` field tracks origin)
- **Advanced Features:** ML analytics (AdvancedAnalytics class), collaboration dashboards, performance monitoring

### Data Flow Architecture
1. **Live Path:** Hardware sensor → SCD30 I²C driver → `save_reading(source='sensor')` → co2_readings.source='sensor'
2. **Simulator Path:** `fake_co2.py` scenarios (normal/office_hours/sleep/anomaly) → socket.emit() live page OR POST /api/readings
3. **Import Path:** CSV upload → `import_csv_readings()` → co2_readings.source='import'
4. **Endpoints:** Backend filters by source (via `resolve_source_param() + build_source_filter()`); UI pages specify allowed sources
5. **Real UI** (live.html, live.js) displays ONLY 'sensor'/'live_real' readings; Simulator page shows 'sim'; Analytics can aggregate any source

### Multi-User & Authorization
- **Login:** User session stored in `users` table; verified via email token (24h)
- **Roles:** 'user' (default) or 'admin' (managed via `set_user_role()`)
- **Permissions:** Separate permission table (`view_reports`, `manage_exports`, `manage_sensors`, etc.) — grant/revoke via API
- **Decorators:** `@login_required`, `@admin_required`, `@permission_required('perm_name')` from `utils/auth_decorators.py`
- **Audit Trail:** `log_audit(user_id, action, resource, resource_id, details, ip_address)` captures all admin/data actions

### Database Schema Highlights
- **co2_readings:** `id, timestamp, ppm, temperature, humidity, source` (indexed on timestamp + date)
- **users:** `id, username, email, password_hash, email_verified, role, created_at`
- **user_settings:** Per-user thresholds, update_speed, audio/email alerts
- **sensors:** Multi-sensor per user — `user_id, name, type (scd30/mhz19), interface, config (JSON), active, thresholds`
- **audit_logs:** Tracks admin actions (logins, user deletes, role changes, permission grants)
- **permissions:** User ↔ Permission mapping (users can have >1 permission)
- **verification_tokens, password_reset_tokens:** Expiring tokens for auth flows (cleanup runs on startup)

## Key Patterns & Conventions

### Data Source Separation
- **`resolve_source_param(allow_sim=False, allow_import=True)`** normalizes ?source query param to 'sensor'|'sim'|'import'
- **`build_source_filter(db_source)`** returns SQL clause + params for filtering by source
- **Purpose:** Live UI never mixes sensor data with imports/simulations; Simulator page isolated from production UI
- **Common mistake:** Forgetting source filter → queries return mixed data across all sources

### Settings Persistence
- Global settings in `DEFAULT_SETTINGS` dict (analysis_running, thresholds, update_speed, etc.)
- Per-user settings in `user_settings` table (good_threshold, bad_threshold, audio_alerts)
- Load: `load_settings()` merges DB rows with defaults; Save: `save_settings(data)` JSON-encodes values
- **Frontend caching:** JS polls `/api/latest` (includes settings); refresh page if thresholds change

### Real-Time Collaboration (WebSocket)
- **SocketIO** registered in `blueprints/collaboration.py` — handlers: `handle_join_dashboard`, `handle_leave_dashboard`, `handle_dashboard_update`
- **Rooms:** Dashboard ID = room name; users join to sync state in real-time
- **Event flow:** User A updates chart → emits `dashboard_update` → broadcast to room → User B sees live change
- **TTL Cache:** `/api/analytics/weekcompare` and `/api/analytics/trend` use `TTLCache` (60s TTL) to avoid repeated DB queries during rapid polling

### Multi-Sensor Thresholds
- Each sensor has `good_threshold, warning_threshold, critical_threshold` (defaults: 800, 1000, 1200)
- Endpoint `PUT /api/sensor/{sensor_id}/thresholds` updates; GET retrieves
- Status check: `check_sensor_threshold_status(sensor_id)` returns 'good'|'warning'|'critical'
- **Sensor readings endpoint:** `GET /api/sensor/{sensor_id}/readings?hours=24` returns last 24h data + latest value

### Advanced Analytics Engine
**Classes in `advanced_features.py`:**
- **AdvancedAnalytics:** `predict_co2_level()` (LinearRegression 5+ readings), `detect_anomalies()` (std dev method)
- **CollaborationManager:** Dashboard state, user activity, comment threads
- **PerformanceOptimizer:** Query optimization, caching strategies
- **VisualizationEngine:** Chart data builders, multi-axis support

### PDF Report Generation
- Route: `GET /api/analytics/report/pdf?start=2026-01-01&end=2026-01-08`
- Uses `WeasyPrint` (requires GTK system libs; Windows users often skip)
- Injects inline CSS from template; passes {readings, stats} context to HTML builder
- **Fallback:** If WeasyPrint unavailable, returns 400 with setup instructions

### Admin Tools & Maintenance
- Routes: `GET /admin`, `POST /admin/user/<id>/role/<role>`, `POST /admin/maintenance`
- Maintenance tasks: `cleanup_old_data(days=90)`, `cleanup_old_audit_logs(days=180)`, `cleanup_old_login_history(days=90)`
- **Admin stats:** Total users, active sensors, data volume, last 20 audit logs visible on dashboard

### Security Headers & CSP
- Applied via `@app.after_request` — sets X-Content-Type-Options, X-Frame-Options, CSP with script-src whitelist (cdn.jsdelivr.net, cdn.socket.io, unpkg.com)
- Email credentials: use env vars (`MAIL_USERNAME`, `MAIL_PASSWORD`); dev defaults to Gmail SMTP

## Critical Implementation Details

### Database Transactions
- Always `db.close()` after queries; use `conn.commit()` for writes
- Row factory set globally: `sqlite3.Row` enables dict-like access (`row['column']`)
- Indexes on co2_readings: `(timestamp DESC)` for speed, `(date(timestamp))` for date-based queries
- Foreign keys: users → user_settings, sensors, permissions, audit_logs (ON DELETE CASCADE)

### API Response Headers
- **Live endpoint:** `"Cache-Control": "no-store"` prevents browser caching of stale readings
- **Export/Import:** Separate rate limit rules — `/api/export/*` limited to "10 per minute"
- **WebSocket:** Ping/pong timeout = 60s, interval = 25s (for mobile stability)

### Frontend State Sync
- **Page detection:** Check for page-specific DOM elements or use `currentPage` JS variable
- **Settings reload:** After POST to `/api/settings`, refetch via `/api/latest` (includes merged settings)
- **Navbar indicators:** `#nav-analysis` shows `analysis_running` boolean; updates from WebSocket events
- **Error handling:** API errors return `{"error": "message"}` with HTTP status codes

## Common Workflows

### Adding a New Sensor Type
1. Create driver class in `app/sensors/` (e.g., `mhz19.py`)
2. Add case to `test_sensor_connection()` in app.py and sensor creation flow
3. Store config (bus, address, pins) in `sensors.config` JSON column
4. Update sensor creation endpoint to validate and store config

### Implementing Multi-User Feature
1. Add `user_id` FK to relevant table (e.g., `user_sensors`, `user_dashboards`)
2. Implement `@login_required` decorator on route; fetch `session.get('user_id')`
3. Always filter queries by user_id: `WHERE user_id = ?` with session user ID
4. Log via `log_audit()` for admin visibility

### Adding Admin Report/Dashboard Widget
1. Create `/api/admin/widget/{name}` endpoint returning JSON
2. Add template in `templates/admin/` extending `admin-base.html`
3. Fetch data via `GET /admin` context or via AJAX to new endpoint
4. Use Jinja2 loop to render table/chart; inject CSS from static file

### Debugging Data Flow Issues
- Check **source filter:** Is query including wrong sources?
- Check **user_id scope:** Is multi-user query missing WHERE user_id = ?
- Check **timestamp parsing:** Logs should show readable dates (use strftime in JS)
- Use `/debug-session` endpoint to verify session state and admin status

## File Organization
```
app.py                   → Main Flask app, routes (2732 lines), default settings, WebSocket setup
database.py              → Init schema, connection pooling, all query functions
config.py                → Environment config (dev/prod), email settings
advanced_features.py     → AdvancedAnalytics, CollaborationManager, PerformanceOptimizer, VisualizationEngine
advanced_features_routes.py → Register feature routes as blueprint
blueprints/
  ├── main.py           → Page routes (dashboard, live, sensors, visualization, admin pages)
  ├── auth.py           → Login, register, verify email, password reset, profile
  ├── api.py            → Health check endpoints (minimal)
  ├── collaboration.py   → Dashboard sharing, activity logs, WebSocket handlers
  ├── data_export.py    → Export/import UI (stubs; logic in app.py)
  └── gdpr.py           → GDPR compliance stubs
utils/
  ├── fake_co2.py       → Scenario classes (Normal, OfficeHours, Sleep, Ventilation, Anomaly)
  ├── auth_decorators.py → @login_required, @admin_required, @permission_required
  ├── cache.py          → TTLCache class for query caching
  ├── ml_analytics.py   → Legacy analytics (may be superseded by advanced_features.py)
  └── logger.py         → Centralized logging setup
templates/
  ├── base.html         → Navbar, header, CSS/JS includes (Chart.js, Socket.io, Jinja blocks)
  ├── index.html        → Dashboard redirect (routes to main.dashboard)
  ├── monitoring/live.html → Real-time chart page (listens to /api/latest every N sec)
  ├── admin/           → Admin dashboard, user management, audit logs
  ├── features/        → Advanced features pages (analytics, collaboration, performance)
  └── ...              → User profile, sensors, settings, visualizations
static/
  ├── css/
  │   ├── style.css    → Global styling (theme colors: #3dd98f green, #0b0d12 dark)
  │   ├── admin-tools.css, collaboration.css, export-manager.css, etc.
  │   └── report.css   → Injected into PDF templates
  └── js/
      ├── main.js      → Global state (1000+ lines), load_settings(), WebSocket setup
      ├── live.js      → Chart.js setup, auto-poll /api/latest, threshold alerts
      ├── analytics.js → Analytics page charts, trend analysis, predictions
      ├── collaboration.js → Join/leave dashboard rooms, sync state
      └── utils.js, form-validation.js, mobile.js, etc.
```

## Testing & Debugging
- **Run server:** `python app.py` on http://0.0.0.0:5000
- **Check DB state:** Run `python tests/check_db.py` to inspect tables + row counts
- **Verify auth:** Hit `/debug-session` endpoint to see session user_id and admin status
- **API testing:** Use Postman or curl with `Authorization` header; test `/api/latest`, `/api/sensors`, `/api/admin/stats`
- **WebSocket testing:** Open DevTools → Network → WS tab; filter by socket.io; watch join/leave/update events
- **Sensor testing:** Use `/api/sensor/test` endpoint with bus/address params to validate I²C connection
- **Performance:** Run `/api/analytics/weekcompare` with `?source=import` on large CSV; check query time in logs
- **Logs:** `utils/logger.py` writes to file + console; check for 'REQ' prefix and audit entries

---

# COMPLETE PROJECT REFERENCE

## 🎯 Full API Endpoint Map (60+ Routes)

### Authentication Routes
```
POST   /login                                   - User login
POST   /register                                - New user registration
GET    /verify-email/<token>                    - Email verification
POST   /forgot-password                         - Password reset request
POST   /reset-password/<token>                  - Reset password with token
POST   /logout                                  - User logout
GET    /profile                                 - User profile page
POST   /api/user/change-password                - Change password
```

### Core Data Access Routes
```
GET    /api/latest                              - Latest reading (includes settings)
POST   /api/readings                            - Ingest new reading
GET    /api/history/today                       - Today's readings
GET    /api/history/<range>                     - Readings by range (hour/day/week/month/year)
GET    /api/history/latest/<limit>              - Last N readings
GET    /api/live/latest                         - Real-time latest (no-cache headers)
GET    /api/simulator/latest                    - Latest simulator reading
```

### Settings & User Management
```
GET    /api/settings                            - Get user settings
POST   /api/settings                            - Update settings
DELETE /api/settings                            - Reset to defaults
GET    /api/user/profile                        - User profile data
POST   /api/user/change-password                - Change password
```

### Sensor Management Routes
```
GET    /api/sensor/<id>/readings?hours=<n>      - Sensor readings history
GET    /api/sensor/<id>/thresholds               - Sensor-specific thresholds
PUT    /api/sensor/<id>/thresholds               - Update sensor thresholds
GET    /api/sensor/test                         - Test sensor connection
POST   /api/sensor                              - Create new sensor
GET    /api/sensors                             - List user's sensors
PUT    /api/sensor/<id>                         - Update sensor config
DELETE /api/sensor/<id>                         - Delete sensor
```

### Analytics & Insights Routes
```
GET    /api/analytics/weekcompare?source=<src>  - Week-over-week (cached 60s)
GET    /api/analytics/trend?source=<src>        - Trend analysis (cached 60s)
GET    /api/analytics/custom-range              - Custom date range
GET    /api/analytics/compare-periods           - Period comparison
POST   /api/analytics/predict/<hours>           - Predict CO₂ for next N hours
POST   /api/analytics/anomalies?threshold=<n>   - Detect anomalies
GET    /api/analytics/report/pdf                - Generate PDF report
```

### Simulator Control Routes
```
POST   /api/simulator/scenario/<name>           - Set scenario (normal/office_hours/sleep/ventilation/anomaly)
GET    /api/simulator/status                    - Get simulator status
POST   /api/simulator/pause                     - Pause/resume simulator
POST   /api/simulator/reset                     - Reset simulator state
```

### Data Export/Import Routes
```
POST   /api/export/csv                          - Export to CSV
POST   /api/export/json                         - Export to JSON
POST   /api/export/excel                        - Export to Excel
POST   /api/export/pdf                          - Export to PDF
POST   /api/export/schedule                     - Schedule recurring export
GET    /api/export/scheduled                    - List scheduled exports
DELETE /api/export/scheduled/<id>               - Cancel scheduled export
POST   /api/import/csv                          - Import CSV readings
GET    /api/import/stats                        - Import statistics
```

### Collaboration Routes (REST + WebSocket)
```
GET    /api/collaboration/dashboards            - List shared dashboards
POST   /api/collaboration/dashboard             - Create dashboard
GET    /api/collaboration/dashboard/<id>        - Get dashboard details
POST   /api/collaboration/dashboard/<id>/share  - Share dashboard
POST   /api/collaboration/dashboard/<id>/collaborator/<uid> - Update access
DELETE /api/collaboration/dashboard/<id>/collaborator/<uid> - Remove access
POST   /api/collaboration/dashboard/<id>/state  - Save dashboard state
POST   /api/collaboration/dashboard/<id>/comment - Add comment
GET    /api/collaboration/dashboard/<id>/activity - Activity log

WebSocket Events:
  - join_dashboard(data)
  - leave_dashboard(data)
  - dashboard_update(data) [broadcast]
  - send_comment(data)
  - sync_request(data)
```

### Admin Routes
```
GET    /admin                                   - Admin dashboard
GET    /debug-session                           - Debug session info
POST   /admin/user/<id>/role/<role>             - Change user role
POST   /admin/maintenance                       - Run maintenance tasks
GET    /api/admin/stats                         - Admin statistics
GET    /api/admin/users                         - List all users
GET    /api/admin/permissions                   - List all permissions
GET    /api/admin/user/<id>/permissions         - User's permissions
POST   /api/admin/user/<id>/permission/<perm>   - Grant permission
DELETE /api/admin/user/<id>/permission/<perm>   - Revoke permission
POST   /admin/user/<id>/delete                  - Delete user (with audit)
POST   /api/admin/backup                        - Backup database
GET    /api/admin/database-info                 - Database statistics
```

### Onboarding Routes
```
POST   /api/onboarding/step/<step>              - Update onboarding progress
POST   /api/onboarding/feature/<feature>        - Mark feature as seen
POST   /api/onboarding/complete                 - Complete onboarding
POST   /api/onboarding/tour                     - Start/end tour
```

### Health & System Routes
```
GET    /healthz                                 - Kubernetes health check
GET    /health                                  - Health status JSON
GET    /metrics                                 - Prometheus metrics
GET    /api/api/health                          - API health endpoint
```

---

## 🗄️ Complete Database Schema

### co2_readings
```sql
id INTEGER PRIMARY KEY
timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
ppm INTEGER NOT NULL
temperature REAL
humidity REAL
source TEXT DEFAULT 'live'  -- 'sensor', 'sim', 'import'
```
**Indexes:** `idx_co2_timestamp` (DESC), `idx_co2_date`  
**Foreign Keys:** None (global readings table)

### users
```sql
id INTEGER PRIMARY KEY
username TEXT UNIQUE NOT NULL
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
email_verified BOOLEAN DEFAULT 0
role TEXT DEFAULT 'user'  -- 'user' or 'admin'
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```
**Index:** `idx_users_username`  
**References:** user_settings, sensors, permissions, audit_logs (FK)

### user_settings
```sql
id INTEGER PRIMARY KEY
user_id INTEGER UNIQUE NOT NULL (FK users.id ON DELETE CASCADE)
good_threshold INTEGER DEFAULT 800
bad_threshold INTEGER DEFAULT 1200
alert_threshold INTEGER DEFAULT 1400
realistic_mode BOOLEAN DEFAULT 1
update_speed INTEGER DEFAULT 1
audio_alerts BOOLEAN DEFAULT 1
email_alerts BOOLEAN DEFAULT 1
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### sensors
```sql
id INTEGER PRIMARY KEY
user_id INTEGER NOT NULL (FK users.id ON DELETE CASCADE)
name TEXT NOT NULL
type TEXT  -- 'scd30', 'mhz19', etc.
interface TEXT  -- 'i2c', 'uart', 'http'
config TEXT  -- JSON: {"bus": 1, "address": "0x61", ...}
active BOOLEAN DEFAULT 1
thresholds TEXT  -- JSON: {"good": 800, "warning": 1000, "critical": 1200}
last_reading_ppm INTEGER
last_reading_time DATETIME
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME
```

### permissions
```sql
id INTEGER PRIMARY KEY
user_id INTEGER NOT NULL (FK users.id ON DELETE CASCADE)
permission TEXT NOT NULL  -- 'view_reports', 'manage_exports', 'manage_sensors', etc.
granted_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### audit_logs
```sql
id INTEGER PRIMARY KEY
user_id INTEGER  -- Admin performing action
action TEXT  -- 'login', 'create_user', 'delete_user', 'role_change', etc.
resource TEXT  -- Entity type
resource_id INTEGER  -- Entity ID
details TEXT  -- JSON with change details
ip_address TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### verification_tokens
```sql
id INTEGER PRIMARY KEY
user_id INTEGER (FK users.id ON DELETE CASCADE)
token TEXT UNIQUE
expires_at DATETIME
```

### password_reset_tokens
```sql
id INTEGER PRIMARY KEY
user_id INTEGER (FK users.id ON DELETE CASCADE)
token TEXT UNIQUE
expires_at DATETIME
```

### Collaboration Tables
- **dashboards:** `id, user_id, name, description, created_at, updated_at`
- **dashboard_collaborators:** `id, dashboard_id, user_id, access_level, added_at`
- **dashboard_state:** `id, dashboard_id, state_json, last_updated`
- **dashboard_comments:** `id, dashboard_id, user_id, comment, created_at`
- **activity_logs:** `id, dashboard_id, user_id, action, timestamp`

---

## 🔐 Complete Authentication Flow

### Registration Flow
1. User fills form (username, email, password ≥6 chars)
2. Username/email uniqueness checked in DB
3. Password hashed via `werkzeug.generate_password_hash()`
4. User created with `email_verified = 0`
5. Verification token generated (24h expiry)
6. Email sent with `/verify-email/<token>` link
7. User clicks link → token verified → `email_verified = 1`
8. User can now login

### Login Flow
1. Username + password submitted via POST /login
2. User fetched via `get_user_by_username(username)`
3. Password verified via `check_password_hash(user['password_hash'], password)`
4. `session['user_id'] = user['id']`, `session['username'] = user['username']`
5. Login action logged to `audit_logs` table
6. Optional: "Remember me" extends session to 30 days
7. Redirect to next page or dashboard

### Password Reset Flow
1. Email submitted at /forgot-password
2. User looked up via `get_user_by_email(email)`
3. Reset token generated (1h expiry)
4. Email sent with `/reset-password/<token>` link
5. User clicks → form page with token input
6. New password submitted → `verify_reset_token(token)` checks validity
7. Password hash updated via `reset_password(user_id, new_hash, token)`
8. Token invalidated in DB
9. User can login with new password

### Decorators (utils/auth_decorators.py)
```python
@login_required          # Requires session['user_id']; redirects to login if missing
@admin_required          # Requires is_admin(user_id) == True; returns 403 if not
@permission_required('perm_name')  # Requires has_permission(user_id, 'perm_name'); returns 403
```

---

## 🔄 Data Source Architecture (Critical)

**Problem:** Live sensor data must NEVER mix with simulated or imported data in UI

**Solution Architecture:**

1. **Database:** All readings stored in `co2_readings` with `source` field:
   - `'sensor'` - Real hardware readings
   - `'sim'` - Simulated data from fake_co2.py
   - `'import'` - User-uploaded CSV data

2. **Query Normalization:** Helper functions ensure consistent filtering:
   ```python
   db_source = resolve_source_param(allow_sim=False, allow_import=True)  # Returns normalized source
   source_filter, source_params = build_source_filter(db_source)  # Returns SQL clause + params
   cursor.execute(f"SELECT * FROM co2_readings WHERE timestamp > ? {source_filter}", (since_time, *source_params))
   ```

3. **UI Isolation:**
   - **live.html** - Real-time sensor data ONLY (`source='sensor'`)
   - **simulator.html** - Simulated data ONLY (`source='sim'`)
   - **analytics/** - Can aggregate ANY source (user selects via `?source` param)

4. **Common Mistake to Avoid:**
   ```python
   # ❌ WRONG - Mixes all sources
   cursor.execute("SELECT * FROM co2_readings")
   
   # ✅ CORRECT - Filters by source
   source = resolve_source_param()
   filter_clause, params = build_source_filter(source)
   cursor.execute(f"SELECT * FROM co2_readings {filter_clause}", params)
   ```

---

## 💾 Settings Management System

### Global Settings (DEFAULT_SETTINGS dict in app.py)
```python
DEFAULT_SETTINGS = {
    'analysis_running': False,
    'co2_threshold': 800,
    'update_speed': 1,
    'feature_flags': {},
    # ... more settings
}
```

**Persistence:** Stored in `settings` table (key/value pairs)  
**Load:** `load_settings()` → merges DB rows with defaults  
**Save:** `save_settings(data)` → JSON-encodes and persists to DB

### Per-User Settings (user_settings table)
```sql
good_threshold: 800      -- Green zone upper limit
bad_threshold: 1200      -- Yellow/red zone threshold
alert_threshold: 1400    -- Critical alert level
audio_alerts: 1          -- Enable sound alerts
email_alerts: 1          -- Send email alerts
update_speed: 1          -- UI refresh interval (seconds)
realistic_mode: 1        -- Use realistic sensor simulation
```

**Load:** `get_user_settings(user_id)` → dict of settings  
**Update:** `update_user_settings(user_id, data)` → persists changes  
**Reset:** `reset_user_settings(user_id)` → back to defaults

### Frontend Settings Sync
1. JS calls `/api/latest` on page load
2. Response includes merged `settings` object
3. JS updates UI based on settings
4. User changes setting → POST `/api/settings`
5. Backend saves and returns updated merged settings
6. JS updates UI from response
7. **Important:** If thresholds change, refresh page or re-poll `/api/latest`

---

## ⚡ Performance & Caching Strategy

### TTLCache Implementation (utils/cache.py)
```python
cache = TTLCache()  # Default 60s TTL

# In route:
cache_key = 'analytics_weekcompare'
result = cache.get(cache_key)
if result is None:
    result = expensive_db_query()
    cache.set(cache_key, result, ttl_seconds=60)
return jsonify(result)
```

### Cached Endpoints
- `/api/analytics/weekcompare` - 60s TTL (heavy DB query)
- `/api/analytics/trend` - 60s TTL (historical aggregation)
- Admin stats in dashboard - 120s TTL (get_admin_stats)

### Indexes for Speed
```sql
CREATE INDEX idx_co2_timestamp ON co2_readings(timestamp DESC);
CREATE INDEX idx_co2_date ON co2_readings(date(timestamp));
CREATE INDEX idx_users_username ON users(username);
```

### Database Connection Pooling
- Pool size: 5 connections (configurable via `DB_POOL_SIZE` env var)
- Pool is thread-safe with lock mechanism
- Connections returned to pool on `db.close()`
- Failed connections removed; new ones created on demand

---

## 🎛️ Simulator (fake_co2.py) - Complete Reference

### 5 Realistic Scenarios

#### 1. NormalScenario
- **Range:** 600-900 ppm
- **Behavior:** Slight variations, occasional trends
- **Use Case:** Baseline/idle monitoring
- **Duration:** Indefinite until changed

#### 2. OfficeHoursScenario
- **Range:** 500-1600 ppm (rising throughout day)
- **Behavior:** Gradual CO₂ increase as occupancy rises, plateaus at high occupancy
- **Use Case:** Simulating occupied office space
- **Peak Time:** Afternoon/early evening

#### 3. SleepScenario
- **Range:** 380-480 ppm (very stable)
- **Behavior:** Minimal variation, low humidity/temp
- **Use Case:** Night-time/unoccupied simulation
- **Duration:** Indefinite

#### 4. VentilationActiveScenario
- **Range:** 450-900 ppm (rapid decrease from high)
- **Behavior:** HVAC running, CO₂ drops 25-50 ppm per reading
- **Use Case:** Air exchange/ventilation testing
- **Temperature:** Drops slightly during ventilation

#### 5. AnomalyScenario
- **Sub-types:** spike, drift, intermittent
- **Behavior:**
  - Spike: Random 150-300 ppm jumps
  - Drift: Sensor reading gradually increases incorrectly
  - Intermittent: Connection loss simulation
- **Use Case:** Sensor fault detection, error handling testing

### Global State Variables
```python
_current_co2 = 600              # Current reading
_current_temp = 22.0            # Temperature in °C
_current_humidity = 45.0        # Humidity in %
_scenario = "normal"            # Active scenario name
_paused = False                 # Pause flag
_trend, _trend_counter = 0, 0   # For smooth transitions
```

### Key Functions
```python
generate_co2()                          # Get next reading based on scenario
generate_co2_data(readings_count)       # Generate N readings
set_scenario(name)                      # Switch scenario
set_paused(bool)                        # Pause/resume
reset_state()                           # Reset to defaults
get_scenario_info()                     # Get current scenario metadata
save_reading(source='sim')              # Store in co2_readings table
```

### API Control Endpoints
```
POST /api/simulator/scenario/<name>     # Set scenario
GET  /api/simulator/status              # Get current state
POST /api/simulator/pause               # Toggle pause
POST /api/simulator/reset               # Reset state
GET  /api/simulator/latest              # Get latest reading
```

---

## 🚨 Common Pitfalls & Solutions (Important!)

| Issue | Root Cause | Solution | Where to Check |
|-------|-----------|----------|-----------------|
| Live page shows simulated data | Missing source filter in query | Add `resolve_source_param(allow_sim=False)` + `build_source_filter()` | app.py routes, analytics.py |
| User sees other users' data | Missing user_id filter in WHERE clause | Always use `WHERE user_id = ?` with `session.get('user_id')` | All blueprints, app.py |
| Settings don't persist after update | Not calling save_settings() | Ensure POST `/api/settings` calls `save_settings(data)` | app.py @app.route("/api/settings") |
| WebSocket events not reaching other users | User not in correct room | Call `join_room(dashboard_id)` before emitting; use `to=dashboard_id` in emit | collaboration.py |
| Analytics queries very slow | No caching on expensive queries | Wrap query in `cache.get()`/`cache.set()` with 60s TTL | advanced_features_routes.py |
| PDF export fails on Windows | WeasyPrint requires GTK system libs | Optional feature; return 400 with setup instructions; skip on Windows | app.py generate_pdf() |
| Sensor readings not filtered by user | Missing sensor.user_id filter | Add `AND sensors.user_id = ?` to sensor queries | blueprints/sensors.py |
| Threshold alerts never trigger | Alert check missing or wrong logic | Implement threshold check in `check_sensor_threshold_status()` | database.py, blueprints/sensors.py |
| Browser caching stale readings | Missing Cache-Control header | Add `"Cache-Control": "no-store"` to live endpoints | app.py response headers |
| Email verification never received | Credentials not configured | Set `MAIL_USERNAME`, `MAIL_PASSWORD` env vars | config.py, email_templates.py |
| Multi-sensor endpoints return all sensors | No user_id filter in query | Add `WHERE sensors.user_id = ?` to sensor list queries | blueprints/sensors.py |

---

## 📋 Step-by-Step: Adding New Features

### Example 1: Add a New Analytics Metric

**Step 1:** Create query function in database.py
```python
def get_peak_hours_analysis(user_id, days=7):
    db = get_db()
    rows = db.execute("""
        SELECT strftime('%H', timestamp) as hour, AVG(ppm) as avg_ppm
        FROM co2_readings
        WHERE user_id = ? AND timestamp >= datetime('now', ?)
        GROUP BY hour
        ORDER BY avg_ppm DESC
    """, (user_id, f'-{days} days')).fetchall()
    db.close()
    return [dict(r) for r in rows]
```

**Step 2:** Create API route in app.py or advanced_features_routes.py
```python
@app.route("/api/analytics/peak-hours")
@login_required
def get_peak_hours():
    user_id = session.get('user_id')
    data = get_peak_hours_analysis(user_id, days=request.args.get('days', 7))
    return jsonify({'success': True, 'data': data})
```

**Step 3:** Consume in frontend (static/js/analytics.js)
```javascript
fetch('/api/analytics/peak-hours?days=7')
    .then(r => r.json())
    .then(data => {
        // Render chart with data.data
        renderPeakHoursChart(data.data);
    });
```

**Step 4:** Test with curl
```bash
curl -H "Cookie: session=YOUR_SESSION" http://localhost:5000/api/analytics/peak-hours
```

### Example 2: Add New Sensor Type

**Step 1:** Create driver class in sensors.py or new file
```python
class MHZ19Sensor:
    def __init__(self, serial_port):
        self.serial_port = serial_port
        self.conn = serial.Serial(serial_port, 9600)
    
    def read(self):
        # SCI protocol reading
        data = self.conn.read(9)
        ppm = (data[2] << 8) | data[3]
        return {'ppm': ppm, 'timestamp': datetime.now()}
```

**Step 2:** Register in sensor creation endpoint
```python
@app.route("/api/sensor", methods=["POST"])
@login_required
def create_new_sensor():
    data = request.json
    sensor_type = data['type']  # 'scd30' or 'mhz19'
    
    if sensor_type == 'mhz19':
        driver = MHZ19Sensor(data['serial_port'])
        config = {'serial_port': data['serial_port']}
    elif sensor_type == 'scd30':
        driver = SCD30Sensor(bus=data['bus'], address=data['address'])
        config = {'bus': data['bus'], 'address': data['address']}
    
    create_sensor(session['user_id'], data['name'], sensor_type, 'uart'|'i2c', json.dumps(config))
    return jsonify({'success': True})
```

**Step 3:** Test connection endpoint
```python
@app.route("/api/sensor/test", methods=["POST"])
def test_sensor():
    data = request.json
    try:
        if data['type'] == 'mhz19':
            driver = MHZ19Sensor(data['serial_port'])
            reading = driver.read()
        elif data['type'] == 'scd30':
            driver = SCD30Sensor(bus=data['bus'], address=data['address'])
            reading = driver.read()
        return jsonify({'success': True, 'reading': reading})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400
```

---

## 🔍 Frontend Architecture (JavaScript)

### Static/JS File Breakdown

#### main.js (1000+ lines)
- **Entry point:** Runs on every page load
- **Global variables:** `currentUser`, `currentSettings`, `isAdmin`, `currentPage`
- **Key functions:**
  - `load_settings()` - Fetch `/api/latest` and `/api/settings`
  - `save_settings(data)` - POST updates to server
  - `initWebSocket()` - Setup SocketIO connection
  - `setupNavbar()` - Update user info, role badge
  - `poll_for_updates()` - Auto-fetch latest data
- **WebSocket handlers:** connect, disconnect, settings_change, data_update

#### live.js
- **Purpose:** Real-time CO₂ chart on monitoring/live.html
- **Chart library:** Chart.js
- **Update mechanism:** Poll `/api/live/latest` every N seconds
- **Features:**
  - Smooth line chart with gradient fill
  - Color zones (good/warning/critical) based on thresholds
  - Audio alerts on breach
  - Real-time status display
  - Timestamp updates

#### analytics.js
- **Purpose:** Advanced analytics visualizations (week compare, trends, predictions)
- **Chart types:**
  - Bar chart (week-over-week)
  - Line chart (trends with moving average)
  - Anomaly scatter plot
  - Prediction forecast
- **Data sources:** `/api/analytics/*` endpoints

#### collaboration.js
- **Purpose:** Real-time collaboration on shared dashboards
- **Events:**
  - `join_dashboard` - User joins shared dashboard room
  - `dashboard_update` - State change (chart config, layout, etc.)
  - `send_comment` - Add comment to dashboard
  - `sync_request` - Full state sync on reconnect
- **UI updates:** Refresh comments, collaborators list, chart state

### Template Inheritance Structure
```
base.html (master)
├── index.html (dashboard redirect)
├── auth/
│   ├── login.html
│   ├── register.html
│   └── recovery.html (forgot/reset password)
├── monitoring/
│   └── live.html (real-time chart)
├── dashboard.html (admin/user dashboard)
├── admin/
│   └── admin.html (admin panel)
├── system/
│   ├── sensors.html (sensor management)
│   └── simulator.html (simulator control)
└── features/
    ├── analytics.html
    ├── collaboration.html
    └── export-manager.html
```

---

## 🛡️ Security & Error Handling

### Security Headers (app.py @app.after_request)
```python
response.headers['X-Content-Type-Options'] = 'nosniff'
response.headers['X-Frame-Options'] = 'DENY'
response.headers['Content-Security-Policy'] = "script-src 'self' cdn.jsdelivr.net cdn.socket.io unpkg.com"
```

### Error Handling Pattern (error_handlers.py)
```python
@app.errorhandler(404)
def not_found(e):
    return render_template('error.html', error='Page not found'), 404

@app.errorhandler(403)
def forbidden(e):
    return render_template('error.html', error='Access denied'), 403

@app.errorhandler(500)
def internal_error(e):
    logger.exception('Internal server error')
    return render_template('error.html', error='Server error'), 500
```

### API Error Response Format
```json
{
    "success": false,
    "error": "Descriptive error message"
}
```

### Logging Best Practices
```python
from utils.logger import configure_logging
logger = configure_logging()

logger.info(f"User {user_id} logged in from {ip_address}")
logger.warning(f"Threshold breach detected: {ppm} ppm")
logger.error(f"Database error: {str(e)}")
logger.exception(f"Unhandled exception in {function_name}")
```

---

## 🚀 Useful Testing Commands

```bash
# Test database state
python -c "from database import get_db; db = get_db(); print(db.execute('SELECT COUNT(*) as count FROM co2_readings').fetchone()['count'])"

# Test API with authentication
curl -X GET http://localhost:5000/api/latest \
  -H "Cookie: session=YOUR_SESSION_COOKIE_HERE"

# View logs in real-time
tail -f logs/aerium.log

# Run database cleanup
python -c "from database import cleanup_old_data; cleanup_old_data(days=90); print('Cleanup complete')"

# Test simulator
curl -X POST http://localhost:5000/api/simulator/scenario/office_hours
curl -X GET http://localhost:5000/api/simulator/latest

# Reset simulator
curl -X POST http://localhost:5000/api/simulator/reset

# View admin dashboard
# Navigate to http://localhost:5000/admin (must be logged in as admin)

# Check WebSocket connection
# Open browser DevTools → Network tab → filter WS
# Look for socket.io connection (should show "Connected")
```

---

## 📚 Quickstart for Common Tasks

### Create New API Endpoint
1. Define query function in database.py (with user_id filter if user-scoped)
2. Create @app.route in app.py or appropriate blueprint
3. Add @login_required or @admin_required decorator
4. Fetch data using database function
5. Return jsonify({'success': True, 'data': ...})
6. Log audit action if admin-related

### Debug Multi-User Issue
1. Check SQL: Does query have `WHERE user_id = ?`?
2. Check decorator: Is route @login_required?
3. Check context: Is session['user_id'] set?
4. Check HTML: Is currentUser available in JS?
5. Hit `/debug-session` endpoint to verify session state

### Fix Data Source Issue
1. Check query: Does it use build_source_filter()?
2. Check endpoint params: Does it accept ?source param?
3. Check UI: Is correct source being displayed?
4. Test: Try ?source=sensor, ?source=sim, ?source=import separately

### Add Permission for User
1. Create permission in @admin_required route
2. Call grant_permission(user_id, 'perm_name')
3. Protect endpoint with @permission_required('perm_name')
4. Test access as both admin and regular user

---

## 🎓 Critical Implementation Notes for AI Assistance

When asking AI for help, mention:
1. **Source context:** Is issue related to sensor data, simulated, or imported?
2. **User scope:** Is it a multi-user issue or single-user?
3. **Feature area:** Authentication, analytics, collaboration, export, admin, etc.
4. **Error message:** Exact error from console/logs
5. **Current behavior vs expected behavior**

AI can then reference this document to provide solutions aligned with project patterns.
