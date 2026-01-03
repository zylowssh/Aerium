# TROUBLESHOOTING GUIDE

**Solutions for common issues and problems**

---

## 🚀 Startup Issues

### Problem: "Address already in use"
```
Error: [Errno 48] Address already in use
OSError: [Errno 98] Address already in use
```

**Cause**: Flask server already running on port 5000

**Solution**:

**Windows**:
```bash
# Find process on port 5000
netstat -ano | findstr :5000
# Returns: TCP    127.0.0.1:5000    0.0.0.0:0    LISTENING    12345

# Kill process
taskkill /PID 12345 /F

# Or use different port
# Edit app.py: app.run(port=5001)
```

**Linux/Mac**:
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>

# Or use different port
export FLASK_PORT=5001
python app.py
```

---

### Problem: "ModuleNotFoundError: No module named 'flask'"
```
ModuleNotFoundError: No module named 'flask'
```

**Cause**: Dependencies not installed

**Solution**:
```bash
cd site
pip install -r requirements.txt
# Or install individually:
pip install Flask Flask-SocketIO Flask-Mail Werkzeug WeasyPrint
```

**Verify installation**:
```bash
python -c "import flask; print(flask.__version__)"
# Should print version number
```

---

### Problem: "Database file not found"
```
Error: unable to open database file
sqlite3.OperationalError: unable to open database file
```

**Cause**: Database not initialized

**Solution**:
```bash
cd site
# Initialize database with schema
python -c "from database import init_db; init_db()"

# Or manually create
sqlite3 data/aerium.sqlite < schema.sql
```

**Verify database**:
```bash
cd site/data
sqlite3 aerium.sqlite ".tables"
# Should list: users, co2_readings, user_settings, etc.
```

---

### Problem: "No such table: users"
```
sqlite3.OperationalError: no such table: users
```

**Cause**: Database schema not created

**Solution**:
```bash
cd site
python << 'EOF'
from database import get_db
import sqlite3

db = get_db()

# Create tables
db.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
""")

db.execute("""
CREATE TABLE IF NOT EXISTS co2_readings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    co2_ppm INTEGER NOT NULL,
    temperature REAL,
    humidity REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
""")

db.commit()
print("✓ Tables created successfully")
EOF
```

---

## 🔐 Authentication Issues

### Problem: "Cannot POST /login"
```
405 Method Not Allowed
```

**Cause**: Wrong HTTP method or route doesn't exist

**Solution**:
```bash
# Verify route exists
grep -n "def login" site/app.py

# Make sure using POST
curl -X POST http://localhost:5000/login \
  -d "username=test&password=test"

# NOT GET
curl http://localhost:5000/login  # Wrong
```

---

### Problem: "Invalid username or password"
After entering correct credentials

**Cause**: 
1. Password not hashed correctly during registration
2. Database case-sensitivity

**Solution**:
```bash
cd site
python << 'EOF'
from database import get_user_by_username
from werkzeug.security import generate_password_hash, check_password_hash

# Check if user exists
user = get_user_by_username("testuser")
if not user:
    print("User not found")
else:
    print(f"User found: {user}")
    
    # Test password hashing
    test_password = "password123"
    hashed = generate_password_hash(test_password)
    is_valid = check_password_hash(hashed, test_password)
    print(f"Password valid: {is_valid}")
EOF
```

---

### Problem: "Session cookie not working"
Can't stay logged in

**Cause**: 
1. SECRET_KEY not set
2. Cookie settings incorrect

**Solution**:
```python
# In app.py, verify:
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# Set environment variable
export SECRET_KEY=your-long-random-key

# Or hardcode (development only):
app.secret_key = 'super-secret-development-key'

# Verify cookie settings
app.config['SESSION_COOKIE_SECURE'] = False  # True for HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 24 * 3600  # 24 hours
```

---

## 🗄️ Database Issues

### Problem: "Database is locked"
```
sqlite3.OperationalError: database is locked
```

**Cause**: Multiple processes writing to database

**Solution**:
```bash
# Stop all Flask instances
pkill -f "python app.py"

# Check for stuck processes
sqlite3 data/aerium.sqlite "PRAGMA integrity_check;"

# Backup and recreate database
cp data/aerium.sqlite data/aerium.sqlite.backup
rm data/aerium.sqlite
python -c "from database import init_db; init_db()"
```

---

### Problem: "Disk I/O error"
```
sqlite3.OperationalError: disk I/O error
```

**Cause**: Database file corruption or permission issues

**Solution**:
```bash
# Check file permissions
ls -la site/data/aerium.sqlite
# Should be readable/writable by user

# Fix permissions
chmod 644 site/data/aerium.sqlite

# Or recreate from backup
if [ -f site/data/aerium.sqlite.backup ]; then
    cp site/data/aerium.sqlite.backup site/data/aerium.sqlite
fi
```

---

### Problem: Slow database queries
Taking 5+ seconds to load dashboard

**Cause**: Missing database indexes or inefficient queries

**Solution**:
```bash
cd site
python << 'EOF'
from optimization import optimize_co2_query
from database import get_db

db = get_db()

# Create indexes
db.execute("""
CREATE INDEX IF NOT EXISTS idx_co2_readings_user_timestamp 
ON co2_readings(user_id, timestamp DESC)
""")

db.execute("""
CREATE INDEX IF NOT EXISTS idx_login_history_user_time
ON login_history(user_id, login_time DESC)
""")

db.commit()
print("✓ Indexes created")

# Use optimized queries
readings = optimize_co2_query(db, days=7, limit=100)
print(f"✓ Query returned {len(readings)} readings")
EOF
```

---

## 🌐 WebSocket Issues

### Problem: "WebSocket connection failed"
Real-time updates not working

**Cause**: 
1. Server not emitting updates
2. Client not listening properly
3. Port blocked by firewall

**Solution**:

**Check server**:
```python
# In app.py, verify SocketIO handler
@socketio.on('connect')
def on_connect():
    print(f"Client {request.sid} connected")

@socketio.on('start_monitoring')
def on_monitoring(data):
    print(f"Monitoring started for {request.sid}")
    socketio.emit('update', {'co2': 450}, room=request.sid)
```

**Check client** (JavaScript):
```javascript
// Make sure script loaded
console.log(typeof io);  // Should be 'function'

// Check connection
socket.on('connect', () => {
    console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('update', (data) => {
    console.log('Received update:', data);
});
```

---

### Problem: "Emit to room failed"
Broadcasting not working

**Solution**:
```python
from flask_socketio import socketio, emit, join_room

# Correct way to emit
socketio.emit('update', {'co2': 450}, room='room_id')

# Correct way to join room
@socketio.on('join_room')
def on_join(data):
    room = data['room']
    join_room(room)
    emit('message', f'User joined {room}', room=room)

# Correct way in route (NOT inside WebSocket handler)
@app.route('/api/trigger-update')
def trigger():
    socketio.emit('update', {'co2': 450}, room='monitoring')
    return {'status': 'sent'}
```

---

## 📧 Email Issues

### Problem: "SMTPException: SMTP AUTH extension not supported"
Email not sending

**Cause**: Email credentials not configured

**Solution**:
```bash
# Set email credentials
export MAIL_SERVER=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password

# Or in app.py
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
```

**For Gmail**:
1. Enable "Less secure app access": https://myaccount.google.com/lesssecureapps
2. Or create "App Password": https://myaccount.google.com/apppasswords
3. Use app password instead of account password

---

### Problem: "Connection refused" for email
```
smtplib.SMTPConnectionError: (111, 'Connection refused')
```

**Cause**: Wrong SMTP server or port

**Solution**:
```bash
# Test SMTP connection
python << 'EOF'
import smtplib

try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    print("✓ SMTP connection successful")
    server.quit()
except Exception as e:
    print(f"✗ Connection failed: {e}")
EOF
```

**Common SMTP Servers**:
```
Gmail: smtp.gmail.com:587
Outlook: smtp-mail.outlook.com:587
Office365: smtp.office365.com:587
SendGrid: smtp.sendgrid.net:587
Mailgun: smtp.mailgun.org:587
```

---

## 🧪 Testing Issues

### Problem: "Test database locked"
Tests fail with database locked error

**Cause**: Previous test didn't clean up

**Solution**:
```python
# In test setUp
class TestCase(unittest.TestCase):
    def setUp(self):
        # Use separate test database
        self.app = create_app(testing=True)
        self.db = self.app.test_db
        
        # Clear tables before each test
        self.db.execute("DELETE FROM co2_readings")
        self.db.execute("DELETE FROM users")
        self.db.commit()
    
    def tearDown(self):
        # Clean up after test
        self.db.close()
```

---

### Problem: "Test times out"
```
TimeoutError: Timeout waiting for response
```

**Cause**: Server not responding to test requests

**Solution**:
```bash
# Make sure server running
python app.py &

# Then run tests in different terminal
python test_suite.py

# Or run tests against test database
FLASK_ENV=testing python test_suite.py
```

---

### Problem: "AssertionError in test"
Test fails with unclear error

**Solution**: Add debugging
```python
def test_login(self):
    response = client.post('/login', data={
        'username': 'test',
        'password': 'test123'
    })
    
    print(f"Status: {response.status_code}")  # Debug output
    print(f"Data: {response.data[:200]}")     # First 200 chars
    print(f"Session: {session}")               # Session content
    
    assert response.status_code == 302
```

Run with output:
```bash
python -u test_suite.py  # Unbuffered output
```

---

## 📊 Performance Issues

### Problem: Dashboard very slow to load
Takes 10+ seconds

**Cause**: 
1. Unoptimized database queries
2. Missing indexes
3. Too much data loading

**Solution**:
```python
# Use optimization utilities
from optimization import cache_result, optimize_co2_query

# Cache dashboard data (10 min TTL)
@cache_result(expire_seconds=600)
def get_dashboard_data(user_id):
    return {
        'readings': optimize_co2_query(db, days=7),
        'stats': get_daily_stats(),
        'settings': get_user_settings(user_id)
    }

# Profile queries
import time
start = time.time()
readings = db.execute("SELECT * FROM co2_readings LIMIT 100").fetchall()
elapsed = time.time() - start
print(f"Query took {elapsed:.3f}s")
```

---

### Problem: High server memory usage
Server crashes or becomes unresponsive

**Cause**: 
1. Unclosed database connections
2. Memory leak in WebSocket handler
3. Large result sets not paginated

**Solution**:
```python
# Always close connections
from database import get_db

db = get_db()
try:
    results = db.execute("SELECT ...").fetchall()
finally:
    db.close()

# Or use context manager
from contextlib import closing

with closing(get_db()) as db:
    results = db.execute("SELECT ...").fetchall()

# Paginate large results
from optimization import paginate_results

all_readings = db.execute("SELECT ...").fetchall()
page_1 = paginate_results(all_readings, page=1, size=100)
```

---

## 🔧 Advanced Debugging

### Enable Debug Logging
```python
import logging

# In app.py
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# Add handler to log to file
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.DEBUG)
app.logger.addHandler(file_handler)

# Log in routes
@app.route('/dashboard')
def dashboard():
    app.logger.debug(f"User {session['user_id']} accessing dashboard")
    return render_template('dashboard.html')
```

**Run**:
```bash
tail -f app.log  # Watch logs in real-time
```

---

### Database Inspector
```bash
sqlite3 site/data/aerium.sqlite

# Check schema
.schema

# Count rows
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM co2_readings;

# View recent readings
SELECT * FROM co2_readings ORDER BY timestamp DESC LIMIT 5;

# Check database size
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();
```

---

### Browser DevTools
```javascript
// Console
console.log('Debug:', data);
console.table(readings);  // Pretty print

// Network tab
// Watch HTTP requests and WebSocket frames
// Check response headers, timing

// Storage tab
// Check cookies, localStorage, sessionStorage
```

---

## 📞 Getting Help

If you're stuck:

1. **Check logs**: `tail -f app.log`
2. **Read error message carefully**: Full stack trace usually points to issue
3. **Google error message**: Exact error text often has known solutions
4. **Check GitHub issues**: Similar problems might be documented
5. **Try minimal reproduction**: Isolate the issue in smallest possible test
6. **Ask for help**: Include logs, error message, and what you were doing

---

**Previous → Read `API-REFERENCE.md` for API documentation** 📡
