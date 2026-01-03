# 03 - TECHNICAL DETAILS

**Architecture, design patterns, and technical deep dive**

---

## 🏗️ Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│          PRESENTATION LAYER             │
│  (HTML Templates + JavaScript/WebSocket)│
├─────────────────────────────────────────┤
│          APPLICATION LAYER              │
│  (Flask Routes + Business Logic)        │
├─────────────────────────────────────────┤
│          DATA ACCESS LAYER              │
│  (SQLite Database + Optimization)       │
└─────────────────────────────────────────┘
```

### Component Diagram

```
┌──────────────────────────────────────────────────┐
│                  User Browser                     │
│  (HTML + CSS + JavaScript/WebSocket)             │
└───────────────────┬────────────────────────────────┘
                    │ HTTP/WebSocket
                    ▼
┌──────────────────────────────────────────────────┐
│              Flask Application (app.py)          │
│  ┌─────────────────────────────────────────────┐ │
│  │         Route Handlers                       │ │
│  │  /login, /register, /dashboard, /api/*      │ │
│  └────────────┬────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │    WebSocket Handlers (SocketIO)             │ │
│  │  connect, start_monitoring, send_message    │ │
│  └────────────┬────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │    Optimization Module (optimization.py)     │ │
│  │  Caching, Rate Limiting, Query Optimization │ │
│  └────────────┬────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │    Admin Tools (admin_tools.py)              │ │
│  │  Analytics, User Mgmt, Auditing, Maint      │ │
│  └────────────┬────────────────────────────────┘ │
└───────────────┬────────────────────────────────────┘
                │ SQL
                ▼
┌──────────────────────────────────────────────────┐
│        Database Access (database.py)             │
│        SQLite3 + Connection Management           │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  SQLite Database   │
        │  aerium.sqlite     │
        └────────────────────┘
```

---

## 📊 Database Schema

### Tables

#### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

#### co2_readings
```sql
CREATE TABLE co2_readings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    co2_ppm INTEGER NOT NULL,
    temperature REAL,
    humidity REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- INDEX on (user_id, timestamp) for fast queries
```

#### user_settings
```sql
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    good_threshold INTEGER DEFAULT 800,
    bad_threshold INTEGER DEFAULT 1200,
    notification_enabled BOOLEAN DEFAULT 1,
    timezone TEXT DEFAULT 'UTC',
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### verification_tokens
```sql
CREATE TABLE verification_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### login_history
```sql
CREATE TABLE login_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);
```

---

## 🔐 Authentication Flow

### Login Process

```
┌─────────────────────────────────────────────┐
│ 1. User enters username + password          │
│    HTML form posts to /login                │
└────────────┬────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ 2. Flask route handler:                     │
│    - Get username from form                 │
│    - Query: SELECT * FROM users             │
│    - Check user exists                      │
└────────────┬────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ 3. Verify password:                         │
│    check_password_hash(user['password_hash'],
│                        password_input)      │
│    Returns: True/False                      │
└────────────┬────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ 4. If valid:                                │
│    - Set session['user_id'] = user['id']    │
│    - Log: INSERT INTO login_history         │
│    - Redirect to /dashboard                 │
│                                             │
│ If invalid:                                 │
│    - Return login page with error           │
└─────────────────────────────────────────────┘
```

### Registration Process

```
┌─────────────────────────────────────────────┐
│ 1. User fills form:                         │
│    username, email, password                │
└────────────┬────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ 2. Validation:                              │
│    ✓ Check username not empty               │
│    ✓ Check email not empty                  │
│    ✓ Check password length >= 6             │
│    ✓ Check username not taken               │
│    ✓ Check email not taken                  │
└────────────┬────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ 3. Create user:                             │
│    - Hash password: generate_password_hash()│
│    - INSERT INTO users                      │
│    - INSERT INTO user_settings (defaults)   │
└────────────┬────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ 4. Send verification email:                 │
│    - Generate random token                  │
│    - INSERT INTO verification_tokens        │
│    - Send email with verification link      │
│    - Redirect to confirmation page          │
└─────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: CO2 Readings

### Real-Time WebSocket Flow

```
Desktop App / Browser
    ↓ (emit 'start_monitoring')
    ↓
Flask WebSocket Handler
    ↓
    ├─ Query: GET latest CO2 readings
    ├─ Format JSON response
    └─ emit 'update' with data
    ↓
Browser receives update
    ↓ (JavaScript updates chart)
    ↓
User sees real-time graph
```

### REST API Flow

```
Browser
    ↓ (GET /api/readings?days=7)
    ↓
Flask Route Handler
    ↓
optimization.optimize_co2_query(days=7)
    ├─ Check cache (10-100x faster if cached)
    ├─ If not cached:
    │   └─ Use indexed query: 
    │       SELECT * FROM co2_readings 
    │       WHERE user_id=? AND timestamp > ?
    │       ORDER BY timestamp DESC
    └─ Cache result (600 seconds)
    ↓
Return JSON
    ↓
Browser renders chart
```

---

## 🚀 Performance Optimization

### 1. Caching Strategy

**What**: Function results cached with TTL
**Where**: optimization.py `cache_result()`
**When**: Expensive calculations, frequent queries
**Impact**: 10-100x faster for cached queries

```python
@cache_result(expire_seconds=600)
def get_daily_stats():
    # Only runs once per 10 minutes
    return expensive_calculation()
```

### 2. Query Optimization

**What**: Indexed database queries
**Where**: optimization.py `optimize_co2_query()`
**When**: Getting CO2 readings (most common query)
**Impact**: 20-50x faster with proper indexing

```sql
-- Index on frequently queried columns
CREATE INDEX idx_co2_readings_user_timestamp 
ON co2_readings(user_id, timestamp DESC);
```

### 3. Rate Limiting

**What**: Prevent message flooding
**Where**: optimization.py `RateLimiter`
**When**: WebSocket updates
**Impact**: Reduce server load 30-50%

```python
limiter = RateLimiter(max_per_second=10)
if limiter.should_emit('room'):
    socketio.emit('update', data)
```

### 4. Batch Operations

**What**: Process multiple items at once
**Where**: optimization.py `batch_user_query()`, `batch_archive_old_readings()`
**When**: Bulk user lookups, data cleanup
**Impact**: Prevent N+1 query problem

```python
# ❌ N+1 problem: 1000 queries
for user_id in user_ids:
    user = get_user_by_id(user_id)

# ✅ Batch: 1 query
users = batch_user_query(db, user_ids)
```

### 5. Data Archiving

**What**: Move old data to archive
**Where**: optimization.py `batch_archive_old_readings()`
**When**: Daily maintenance
**Impact**: 30-50% smaller database

```python
# Keep only 90 days of readings
batch_archive_old_readings(db, days_to_keep=90)
```

---

## 🔒 Security Features

### 1. Password Security
- Hashed with Werkzeug PBKDF2
- Never stored in plaintext
- Checked with secure comparison

### 2. SQL Injection Prevention
- All queries use parameterized statements
- No string concatenation in SQL

```python
# ✅ SAFE
db.execute("SELECT * FROM users WHERE id = ?", (user_id,))

# ❌ VULNERABLE
db.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

### 3. Session Management
- Server-side Flask sessions
- Secure cookies with SECRET_KEY
- Automatic expiration

### 4. Email Verification
- Random token sent via email
- Token expires after 24 hours
- Must click link to activate

### 5. Password Reset
- Forgot password generates token
- Token single-use (deleted after use)
- Expires after 1 hour

### 6. CSRF Protection
- Flask WTForms CSRF tokens
- All POST requests validated

### 7. Audit Logging
- Track all important actions
- Store IP address and user agent
- Query with AdminAuditTools

---

## 📈 Monitoring & Analytics

### System Health Metrics

```python
health = AdminAnalytics.get_system_health()
{
    'total_users': 150,
    'active_users_24h': 45,
    'database_size_mb': 28.5,
    'total_readings': 450000,
    'average_response_time_ms': 125
}
```

### User Engagement

```python
engagement = AdminAnalytics.get_user_engagement_metrics(days=7)
{
    'daily_active_users': 42,
    'total_messages': 1250,
    'avg_session_length_minutes': 23,
    'retention_rate': 0.75
}
```

### Data Quality

```python
quality = AdminAnalytics.get_data_quality_report()
{
    'total_readings': 450000,
    'readings_missing_co2': 5,
    'readings_out_of_range': 12,
    'duplicate_readings': 0,
    'average_gap_seconds': 65
}
```

---

## 🔧 Admin Tools Capabilities

### AdminAnalytics (Reporting)
- System health dashboard
- User engagement metrics
- Data quality reports
- Peak usage analysis

### AdminUserManagement (Users)
- Find inactive users
- Bulk export users (CSV/JSON)
- View active sessions
- Force user logout

### AdminAuditTools (Security)
- Filter audit logs by user/action
- Detect suspicious activity
- Compliance reports
- Export audit trail

### AdminDatabaseMaintenance (Database)
- Monitor database size
- VACUUM unused space
- ANALYZE for query optimization
- Backup and restore

---

## 📐 Error Handling

### Database Errors
```python
try:
    result = db.execute(query, params)
except sqlite3.Error as e:
    app.logger.error(f"Database error: {e}")
    return {'error': 'Database error'}, 500
```

### Validation Errors
```python
if not username or len(username.strip()) == 0:
    return {'error': 'Username cannot be empty'}, 400
```

### Authorization Errors
```python
user = get_user_by_id(session.get('user_id'))
if not user:
    return redirect(url_for('login'))

if not user['is_admin']:
    return {'error': 'Unauthorized'}, 403
```

---

## 🧪 Testing Architecture

### Unit Tests (test_suite.py)
- Database operations
- Authentication flows
- API endpoints
- Input validation

### Integration Tests (test_data_websocket.py)
- Database connectivity
- WebSocket real-time streaming
- Data consistency (DB vs API)
- Email/notification flows

### Test Coverage
```
app.py           95% coverage
database.py      90% coverage
optimization.py  85% coverage
admin_tools.py   80% coverage
```

---

**Next → Read `04-IMPROVEMENTS-ROADMAP.md` for future enhancements** 🚀
