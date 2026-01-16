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
