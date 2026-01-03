# FILES STRUCTURE

**Complete overview of all files and directories**

---

## 📁 Directory Tree

```
Morpheus/
├── docs/                              # Documentation (NEW)
│   ├── README.md                      # Docs index & navigation
│   ├── 00-OVERVIEW.md                 # Project overview
│   ├── 01-QUICK-START.md              # Getting started (5 min)
│   ├── 02-DEVELOPER-GUIDE.md          # Daily reference
│   ├── 03-TECHNICAL-DETAILS.md        # Architecture deep dive
│   ├── 04-IMPROVEMENTS-ROADMAP.md     # Future enhancements
│   ├── FILES-STRUCTURE.md             # This file
│   ├── TESTING-GUIDE.md               # Test documentation
│   ├── API-REFERENCE.md               # API endpoints
│   └── TROUBLESHOOTING.md             # Common issues
│
├── site/                              # Main Flask application
│   ├── app.py                         # Main Flask app (1667 lines)
│   ├── database.py                    # SQLite database functions
│   ├── optimization.py                # Performance utilities (NEW)
│   ├── admin_tools.py                 # Admin features (NEW)
│   ├── test_data_websocket.py        # Integration tests (NEW)
│   ├── test_suite.py                  # Unit tests (NEW)
│   ├── requirements.txt               # Python dependencies
│   │
│   ├── data/
│   │   └── aerium.sqlite              # SQLite database file
│   │
│   ├── static/                        # Static assets
│   │   ├── css/
│   │   │   ├── style.css              # Main stylesheet (900+ lines)
│   │   │   └── report.css             # Report styling
│   │   ├── js/
│   │   │   ├── live.js                # WebSocket handler
│   │   │   ├── analytics.js           # Chart.js integration
│   │   │   └── ...                    # Other JavaScript files
│   │   └── images/
│   │       └── favicon.ico
│   │
│   └── templates/                     # HTML templates (Jinja2)
│       ├── base.html                  # Base layout
│       ├── index.html                 # Home page
│       ├── login.html                 # Login form
│       ├── register.html              # Registration form
│       ├── dashboard.html             # User dashboard
│       ├── live.html                  # Real-time monitoring
│       ├── admin.html                 # Admin panel
│       ├── analytics.html             # Analytics/charts
│       ├── profile.html               # User profile
│       ├── settings.html              # User settings
│       ├── change_password.html       # Password change
│       ├── forgot_password.html       # Forgot password
│       ├── reset_password.html        # Password reset
│       ├── email_verified.html        # Verification confirmation
│       ├── onboarding.html            # First-time user flow
│       ├── report_daily.html          # Daily report
│       ├── visualization.html         # Data visualization
│       └── error.html                 # Error page
│
├── app/                               # Desktop Kivy application
│   ├── alarmcard.py                   # Alarm component
│   ├── co2_reader.py                  # CO2 sensor reader
│   ├── co2_websocket_client.py        # WebSocket connection
│   ├── datamanager.py                 # Data management
│   ├── homepage.py                    # Main UI
│   ├── select_days.py                 # Date selection
│   ├── assets/                        # Images, fonts
│   └── ...                            # Other Kivy components
│
├── tests/                             # Old test directory
│   ├── main.py
│   ├── test.py
│   └── ...
│
├── requirements.txt                   # Python dependencies (root)
├── README.md                          # Main README
├── README2.md                         # Additional docs
├── start_server.bat                   # Windows startup script
│
└── [Various Documentation Files]      # Phase summaries, guides, etc.
    ├── QUICK_REFERENCE.md
    ├── MASTER_SUMMARY.md
    ├── AUTH_IMPLEMENTATION_SUMMARY.md
    ├── WEBSOCKET_IMPLEMENTATION.md
    ├── FEATURE_IMPLEMENTATION_GUIDE.md
    ├── DEPLOYMENT_CHECKLIST.md
    └── ...
```

---

## 🔥 Key Files Explained

### Production Code (site/)

#### app.py (1667 lines)
**Purpose**: Main Flask web application
**Key Sections**:
- Lines 1-50: Imports and Flask initialization
- Lines 51-150: Database connection and setup
- Lines 151-300: Authentication routes (login, register, logout)
- Lines 301-450: User dashboard routes
- Lines 451-600: CO2 data API endpoints
- Lines 601-750: Settings and profile routes
- Lines 751-900: Admin panel routes
- Lines 901-1100: WebSocket handlers
- Lines 1101-1400: Email verification and password reset
- Lines 1401-1667: Helper functions and utilities

**Key Functions**:
```python
def get_user_by_username(username)       # Database lookup
def verify_email_token(token)            # Email verification
def authenticate_user(username, password) # Login logic
def create_daily_report(user_id)         # Report generation
def broadcast_co2_update(user_id, co2)   # WebSocket broadcast
```

**Dependencies**: Flask, Flask-SocketIO, Flask-Mail, Werkzeug, WeasyPrint

#### database.py
**Purpose**: SQLite database interface
**Key Functions**:
- `get_db()` - Get database connection
- `get_user_by_username(username)` - Query user
- `create_user(username, email, password_hash)` - Insert user
- `get_co2_readings(user_id, limit)` - Query readings
- `insert_co2_reading(user_id, co2, temp, humidity)` - Insert reading
- `get_user_settings(user_id)` - Get settings
- `update_user_settings(user_id, data)` - Update settings

#### optimization.py (380 lines) - NEW
**Purpose**: Performance optimization utilities
**Key Classes**:
- `@cache_result(expire_seconds)` - TTL caching decorator
- `RateLimiter(max_per_second)` - Rate limiting class
- Functions:
  - `optimize_co2_query(db, days, limit)` - Indexed queries
  - `paginate_results(data, page, size)` - Pagination
  - `batch_user_query(db, user_ids, fields)` - Batch lookup
  - `batch_archive_old_readings(db, days_to_keep)` - Data archiving
  - `get_optimized_daily_stats(db, date)` - Efficient aggregation

#### admin_tools.py (430 lines) - NEW
**Purpose**: Advanced admin features
**Key Classes**:
- `AdminAnalytics` - System metrics, health, engagement
- `AdminUserManagement` - User/session management
- `AdminAuditTools` - Security and compliance
- `AdminDatabaseMaintenance` - Database optimization

#### test_data_websocket.py (285 lines) - NEW
**Purpose**: Integration tests
**Test Cases**:
- `test_database_connection()`
- `test_co2_readings_query()`
- `test_websocket_connection()`
- `test_websocket_data_stream()`
- `test_api_readings()`
- `test_data_consistency()`
- And 4 more integration tests

**Run**: `python test_data_websocket.py`

#### test_suite.py (340 lines) - NEW
**Purpose**: Unit and integration tests
**Test Classes**:
- `DatabaseTestCase` - 6 database tests
- `AuthenticationTestCase` - 5 auth flow tests
- `APITestCase` - 3 endpoint tests
- `ValidationTestCase` - Input validation tests

**Run**: `python test_suite.py`

---

### Frontend (site/templates/ & site/static/)

#### Templates (Jinja2)

| Template | Purpose | Lines |
|----------|---------|-------|
| `base.html` | Layout wrapper | 50-100 |
| `index.html` | Home page | 50-80 |
| `login.html` | Login form | 40-60 |
| `register.html` | Registration form | 50-70 |
| `dashboard.html` | User dashboard | 150-200 |
| `live.html` | Real-time monitoring | 100-150 |
| `admin.html` | Admin panel | 200-300 |
| `analytics.html` | Charts/graphs | 150-200 |
| `settings.html` | User settings | 80-120 |
| `report_daily.html` | Daily report | 100-150 |

#### Stylesheets (CSS)

| File | Purpose | Lines |
|------|---------|-------|
| `style.css` | Main styles | 900+ |
| `report.css` | Report styling | 200+ |
| Mobile responsive | All templates | Included |
| Dark mode | Optional | Included |

#### JavaScript

| File | Purpose | Key Features |
|------|---------|--------------|
| `live.js` | WebSocket handler | Connect, emit, receive |
| `analytics.js` | Chart.js integration | Line/bar/pie charts |
| Other JS files | UI interactions | Dropdowns, modals, etc. |

---

### Desktop App (app/)

| File | Purpose | Lines |
|------|---------|-------|
| `homepage.py` | Main UI window | 300-400 |
| `co2_reader.py` | Sensor interface | 150-200 |
| `co2_websocket_client.py` | Backend connection | 100-150 |
| `datamanager.py` | Local data storage | 150-200 |
| `alarmcard.py` | Alarm component | 100-150 |
| `select_days.py` | Date picker | 50-100 |

---

### Configuration Files

#### requirements.txt
```
Flask==2.3.0
Flask-SocketIO==5.3.0
Flask-Mail==0.9.1
Flask-Limiter==3.3.0
python-socketio==5.9.0
python-engineio==4.7.0
Werkzeug==2.3.0
WeasyPrint==59.2
openpyxl==3.1.0
Kivy==2.1.0
requests==2.31.0
python-dotenv==1.0.0
```

#### start_server.bat
```batch
@echo off
cd /d "%~dp0site"
python app.py
```

---

## 📊 File Statistics

### Production Code
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| app.py | 1667 | Main Flask app | ✅ Tested |
| database.py | 400 | Database layer | ✅ Tested |
| optimization.py | 380 | Optimization utils | ✅ New |
| admin_tools.py | 430 | Admin features | ✅ New |
| test_data_websocket.py | 285 | Integration tests | ✅ New |
| test_suite.py | 340 | Unit tests | ✅ New |

**Total Production**: ~3,500 lines

### Frontend Code
| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| Templates | 13 | 1,300+ | HTML pages |
| Stylesheets | 2 | 1,100+ | CSS styling |
| JavaScript | 5+ | 800+ | Frontend logic |

**Total Frontend**: ~3,200 lines

### Documentation
| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| Docs/ | 8 | 2,500+ | API docs, guides |
| Root | 30+ | 5,000+ | Phase summaries, specs |

**Total Documentation**: ~7,500+ lines

---

## 🔄 Data Flow

### Request Flow (HTTP)
```
Browser Request
    ↓
Flask Route Handler (app.py)
    ↓
Database Query (database.py)
    ↓
Optimization/Caching (optimization.py)
    ↓
Response to Browser
    ↓
JavaScript Updates UI (live.js)
```

### Real-Time Flow (WebSocket)
```
Browser Connection
    ↓
SocketIO Handler (app.py)
    ↓
Admin Tools Analytics (admin_tools.py)
    ↓
Broadcast Update
    ↓
All Connected Clients Receive
```

---

## 📦 Dependencies

### Backend
- Flask 2.3+
- Flask-SocketIO 5.3+
- Flask-Mail 0.9+
- Werkzeug 2.3+
- SQLite3 (built-in)

### Testing
- unittest (built-in)
- pytest (optional)
- coverage (optional)

### Desktop App
- Kivy 2.1+
- requests
- python-socketio

### Optional
- Redis (for distributed caching)
- Gunicorn (for production WSGI)
- Nginx (for reverse proxy)

---

## 🚀 Deployment Files

### Windows
- `start_server.bat` - Start Flask on Windows

### Linux/Mac
- (Create `start_server.sh`):
```bash
#!/bin/bash
cd "$(dirname "$0")/site"
python app.py
```

### Docker
- (Not yet created):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY site/ .
CMD ["python", "app.py"]
```

---

## 📝 Documentation Files in Root

**Note**: These are being migrated to `/docs/`

- README.md - Main project info
- README2.md - Additional documentation
- MASTER_SUMMARY.md - Complete feature summary
- AUTH_IMPLEMENTATION_SUMMARY.md - Auth details
- WEBSOCKET_IMPLEMENTATION.md - WebSocket setup
- FEATURE_IMPLEMENTATION_GUIDE.md - Feature guide
- DEPLOYMENT_CHECKLIST.md - Deployment steps
- QUICK_REFERENCE.md - Quick lookup
- And 20+ more...

**Next Step**: Archive these to /docs/ folder

---

**Next → Read `TESTING-GUIDE.md` for testing instructions** 🧪
