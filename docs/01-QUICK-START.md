# 01 - QUICK START GUIDE

**Get up and running in 5 minutes**

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Flask, Flask-SocketIO installed
- SQLite database

### Clone/Navigate to Project
```bash
cd Morpheus/site
```

---

## ⚡ Quick Commands

### Run the Application
```bash
python app.py
# Opens on http://localhost:5000
```

### Run Tests
```bash
# Database and WebSocket tests
python test_data_websocket.py

# Full unit and integration tests
python test_suite.py
```

---

## 💻 Using the Code

### Use Optimization
```python
from optimization import cache_result, optimize_co2_query, RateLimiter

# Cache expensive operations
@cache_result(expire_seconds=600)
def get_user_profile(user_id):
    return db.execute("SELECT * FROM users WHERE id = ?", (user_id,))

# Get optimized CO2 data
readings = optimize_co2_query(db, days=7, limit=1000)

# Rate limit WebSocket updates
rate_limiter = RateLimiter(max_per_second=10)
if rate_limiter.should_emit('room'):
    socketio.emit('update', data)
```

### Use Admin Tools
```python
from admin_tools import AdminAnalytics, AdminUserManagement

# Get system health
health = AdminAnalytics.get_system_health()
print(f"Active users: {health['total_users']}")

# Find inactive users
inactive = AdminUserManagement.get_inactive_users(days=90)
for user in inactive:
    print(f"{user['username']} - Last login: {user['last_login']}")

# Export users to CSV
csv_data = AdminUserManagement.bulk_export_users(format='csv')
```

---

## 📊 Database

### Connect to Database
```python
from database import get_db

db = get_db()
results = db.execute("SELECT * FROM co2_readings LIMIT 10").fetchall()
db.close()
```

### Optimize Queries
```python
from optimization import optimize_co2_query

# Use optimized query instead of raw SQL
readings = optimize_co2_query(db, days=7, limit=500)
```

---

## 🧪 Testing

### Test Database Connection
```bash
python test_data_websocket.py
# Shows database, WebSocket, and API tests
```

### Test Full Suite
```bash
python test_suite.py
# Runs unit and integration tests
```

### Test with Server Running
```bash
# Terminal 1
python app.py

# Terminal 2
python test_suite.py
```

---

## 📝 Common Tasks

### Login a User
```python
from database import get_user_by_username
from werkzeug.security import check_password_hash

user = get_user_by_username("testuser")
if user and check_password_hash(user['password_hash'], "password"):
    print("Login successful!")
```

### Get User Settings
```python
from database import get_user_settings

settings = get_user_settings(user_id=1)
print(f"Good threshold: {settings['good_threshold']}")
```

### Update Settings
```python
from database import update_user_settings

new_settings = {
    'good_threshold': 700,
    'bad_threshold': 1100
}
update_user_settings(user_id=1, data=new_settings)
```

---

## 🔧 Configuration

### Set Environment Variables
```bash
export FLASK_ENV=development
export FLASK_APP=app.py
export SECRET_KEY=your-secret-key
```

### Configure Email (Optional)
```bash
export MAIL_SERVER=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

---

## 📚 Documentation

- `02-DEVELOPER-GUIDE.md` - Day-to-day reference
- `03-TECHNICAL-DETAILS.md` - Technical deep dive
- `TESTING-GUIDE.md` - More testing info
- `API-REFERENCE.md` - API endpoints
- `TROUBLESHOOTING.md` - Problem solving

---

## ✅ Verification Checklist

- [ ] Application runs: `python app.py`
- [ ] Tests pass: `python test_data_websocket.py`
- [ ] Can import optimization: `from optimization import cache_result`
- [ ] Can import admin tools: `from admin_tools import AdminAnalytics`
- [ ] Database accessible: `from database import get_db`

---

**Next → Read `02-DEVELOPER-GUIDE.md` for daily development** 👨‍💻
