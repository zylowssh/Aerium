# 02 - DEVELOPER GUIDE

**Daily reference for working with the codebase**

---

## 📂 Project Structure

```
site/
├── app.py                    # Main Flask application (1667 lines)
├── database.py              # SQLite database functions
├── optimization.py          # Performance utilities (NEW)
├── admin_tools.py          # Admin features (NEW)
├── test_data_websocket.py  # Integration tests (NEW)
├── test_suite.py           # Unit tests (NEW)
├── templates/              # HTML files
│   ├── base.html          # Base template
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── admin.html
│   └── ...
├── static/
│   ├── css/
│   │   ├── style.css      # Main styles
│   │   └── report.css     # Report page styles
│   ├── js/
│   │   ├── live.js        # WebSocket handler
│   │   ├── analytics.js   # Charts
│   │   └── ...
│   └── images/
└── data/
    └── aerium.sqlite      # Database file
```

---

## 🔨 Core Modules

### app.py (Main Application)
**Contains**: Flask app, routes, WebSocket handlers, authentication

**Key Routes**:
```
GET  /                      # Home/dashboard
GET  /login                 # Login page
POST /login                 # Process login
GET  /register              # Register page
POST /register              # Process registration
GET  /dashboard             # User dashboard
GET  /admin                 # Admin panel
GET  /api/readings          # CO2 readings endpoint
POST /api/settings          # Update settings
GET  /report                # Daily report
```

**Key WebSocket Events**:
```
connect                     # Client connects
start_monitoring           # Start CO2 updates
stop_monitoring            # Stop CO2 updates
send_message               # Chat/notification
disconnect                 # Client disconnects
```

**Example Usage**:
```python
# In app.py routes
@app.route('/api/readings')
def get_readings():
    readings = db.execute("SELECT * FROM co2_readings LIMIT 100").fetchall()
    return jsonify(readings)

@socketio.on('start_monitoring')
def on_monitoring(data):
    socketio.emit('update', {'co2': 450, 'timestamp': '12:30'})
```

### database.py (Data Access)
**Contains**: SQLite functions for users, CO2 data, settings

**Key Functions**:
```python
get_user_by_username(username)       # Get user object
get_user_by_id(user_id)              # Get user by ID
create_user(username, email, password) # Create account
get_co2_readings(limit=100)          # Get recent readings
update_user_settings(user_id, data)  # Update settings
get_daily_stats(date)                # Daily aggregates
```

**Example Usage**:
```python
from database import get_user_by_username, get_co2_readings

user = get_user_by_username("john")
if user:
    print(f"Email: {user['email']}")

readings = get_co2_readings(limit=50)
for r in readings:
    print(f"{r['timestamp']}: {r['co2']}ppm")
```

### optimization.py (Performance) - NEW
**Contains**: Caching, pagination, rate limiting, query optimization

**Key Functions**:
```python
@cache_result(expire_seconds=600)     # Decorator - cache results
optimize_co2_query(db, days, limit)   # Indexed queries
paginate_results(data, page, size)    # Pagination
batch_user_query(db, user_ids)        # Prevent N+1 queries
batch_archive_old_readings(db, days)  # Clean old data
RateLimiter(max_per_second=10)        # Rate limiting class
```

**Usage Examples**:

```python
from optimization import cache_result, optimize_co2_query, RateLimiter

# 1. Cache a function (10 minute TTL)
@cache_result(expire_seconds=600)
def expensive_calculation():
    return sum_all_user_data()

# 2. Get optimized CO2 readings (10-100x faster)
readings = optimize_co2_query(db, days=7, limit=1000)

# 3. Paginate large result sets
page1 = paginate_results(all_readings, page=1, size=50)
page2 = paginate_results(all_readings, page=2, size=50)

# 4. Batch load users (avoid loop queries)
users = batch_user_query(db, user_ids=[1,2,3,4,5])

# 5. Archive old readings (keep DB lean)
batch_archive_old_readings(db, days_to_keep=90)

# 6. Rate limit WebSocket messages
limiter = RateLimiter(max_per_second=10)
if limiter.should_emit('room_123'):
    socketio.emit('update', data)
```

### admin_tools.py (Admin Features) - NEW
**Contains**: Analytics, user management, auditing, maintenance

**Key Classes**:
```
AdminAnalytics              # System metrics and reporting
AdminUserManagement         # User/session management
AdminAuditTools             # Security and compliance
AdminDatabaseMaintenance    # Database optimization
```

**Usage Examples**:

```python
from admin_tools import AdminAnalytics, AdminUserManagement, AdminAuditTools

# Get system health dashboard
analytics = AdminAnalytics()
health = analytics.get_system_health()
print(f"Total users: {health['total_users']}")
print(f"Active today: {health['active_users_24h']}")

# Find inactive users
user_mgmt = AdminUserManagement()
inactive = user_mgmt.get_inactive_users(days=90)

# Export all users
csv_content = user_mgmt.bulk_export_users(format='csv')

# Find suspicious activity
audit = AdminAuditTools()
suspicious = audit.detect_suspicious_activity(days=7)

# Optimize database
from admin_tools import AdminDatabaseMaintenance
maint = AdminDatabaseMaintenance()
maint.optimize_database(db)
```

### test_data_websocket.py (Integration Tests) - NEW
**Contains**: Database and WebSocket integration tests

**Test Cases**:
```
test_database_connection()        # SQLite connectivity
test_co2_readings_query()         # Time-series queries
test_daily_statistics()           # Aggregation functions
test_websocket_connection()       # SocketIO connection
test_websocket_data_stream()      # Real-time updates
test_api_readings()               # REST endpoint
test_data_consistency()           # DB vs API sync
test_user_creation()              # User registration
test_email_verification()         # Email flows
test_settings_update()            # Settings persistence
```

**Run**:
```bash
python test_data_websocket.py
```

### test_suite.py (Unit Tests) - NEW
**Contains**: Unit and integration tests for auth, API, validation

**Test Classes**:
```
DatabaseTestCase              # 6 database tests
AuthenticationTestCase        # 5 auth flow tests
APITestCase                   # 3 endpoint tests
ValidationTestCase            # Input validation tests
```

**Run**:
```bash
python test_suite.py
```

---

## 🔄 Common Development Tasks

### 1. Add a New Route
```python
# In app.py
@app.route('/api/my-endpoint', methods=['GET'])
def my_endpoint():
    data = db.execute("SELECT ...").fetchall()
    return jsonify(data)
```

### 2. Add Authentication Check
```python
@app.route('/protected')
def protected():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = get_user_by_id(session['user_id'])
    return render_template('page.html', user=user)
```

### 3. Add WebSocket Event
```python
@socketio.on('my_event')
def handle_event(data):
    # Process data
    result = process(data)
    # Broadcast to all clients
    socketio.emit('response', result, broadcast=True)
```

### 4. Optimize a Query with Cache
```python
from optimization import cache_result

@cache_result(expire_seconds=300)
def get_expensive_data():
    return db.execute("SELECT complex query...").fetchall()
```

### 5. Rate Limit an Endpoint
```python
from optimization import RateLimiter

limiter = RateLimiter(max_per_second=5)

@app.route('/api/expensive')
def expensive_endpoint():
    if not limiter.should_emit('user_123'):
        return {'error': 'Rate limited'}, 429
    
    return jsonify(process())
```

### 6. Use Admin Tools
```python
from admin_tools import AdminAnalytics

@app.route('/admin/health')
def admin_health():
    if session.get('is_admin'):
        health = AdminAnalytics.get_system_health()
        return jsonify(health)
    return {'error': 'Unauthorized'}, 403
```

---

## 🐛 Debugging

### Enable Debug Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
app.logger.debug("My debug message")
```

### Debug Database Queries
```python
# Print SQL before executing
query = "SELECT * FROM users WHERE id = ?"
print(f"Executing: {query}")
result = db.execute(query, (user_id,)).fetchone()
```

### Debug WebSocket
```javascript
// In live.js
socket.on('connect', () => {
    console.log('WebSocket connected:', socket.id);
});

socket.on('update', (data) => {
    console.log('Received update:', data);
});
```

### Check Database
```bash
# Open SQLite CLI
sqlite3 site/data/aerium.sqlite

# List tables
.tables

# Query data
SELECT * FROM users;
SELECT COUNT(*) FROM co2_readings;
```

---

## 🚀 Deployment Checklist

- [ ] Set `DEBUG=False` in app.py
- [ ] Set strong `SECRET_KEY` environment variable
- [ ] Configure production database
- [ ] Set up email credentials
- [ ] Run tests: `python test_suite.py`
- [ ] Optimize database: `python -c "from admin_tools import AdminDatabaseMaintenance; AdminDatabaseMaintenance().optimize_database(db)"`
- [ ] Test WebSocket under load
- [ ] Set up logging/monitoring

---

## 💡 Best Practices

1. **Always null-check user lookups**:
   ```python
   user = get_user_by_id(user_id)
   if not user:
       return {'error': 'User not found'}, 404
   ```

2. **Use parameterized queries** (prevents SQL injection):
   ```python
   # ✅ GOOD
   db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
   
   # ❌ BAD
   db.execute(f"SELECT * FROM users WHERE id = {user_id}")
   ```

3. **Cache expensive operations**:
   ```python
   @cache_result(expire_seconds=600)
   def get_daily_stats():
       return expensive_calculation()
   ```

4. **Rate limit WebSocket broadcasts**:
   ```python
   if rate_limiter.should_emit('room'):
       socketio.emit('update', data)
   ```

5. **Log important events**:
   ```python
   app.logger.info(f"User {user_id} logged in")
   app.logger.error(f"Database error: {error}")
   ```

---

**Next → Read `03-TECHNICAL-DETAILS.md` for architecture deep dive** 🏗️
