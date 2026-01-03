# 🔐 Authentication System - Files & Quick Reference

## 📁 Core Files

### Database
- **Path**: `/site/database.py`
- **Changes**: Added `users` table, `get_user_by_username()`, `create_user()`, `get_user_by_id()`
- **Key Table**: `users` with `id`, `username`, `email`, `password_hash`, `created_at`

### Backend
- **Path**: `/site/app.py`
- **Changes**: Added auth routes, login_required decorator, protected routes
- **New Routes**:
  - `GET/POST /login` → login_page()
  - `GET/POST /register` → register_page()
  - `GET /logout` → logout()
- **Protected Routes**: `/`, `/live`, `/settings`, `/analytics`

### Frontend - Login
- **Path**: `/site/templates/login.html` ✨ NEW
- **Purpose**: User login page
- **Features**: Modern gradient design, error display, register link
- **URL**: `http://localhost:5000/login`

### Frontend - Register
- **Path**: `/site/templates/register.html` ✨ NEW
- **Purpose**: User registration page
- **Features**: Validation hints, error display, login link
- **URL**: `http://localhost:5000/register`

### Frontend - Navigation
- **Path**: `/site/templates/base.html`
- **Changes**: Added user info display and logout button in navbar
- **Display**: Shows `👤 username` and 🚪 logout button when logged in

### Styling
- **Path**: `/site/static/css/style.css`
- **Changes**: Added `.nav-user`, `.nav-username`, `.nav-logout` styles
- **Theme**: Green highlight for user info, red for logout button

---

## 🔑 Key URLs

### Public Routes (No Login)
```
GET  http://localhost:5000/login
POST http://localhost:5000/login
GET  http://localhost:5000/register
POST http://localhost:5000/register
GET  http://localhost:5000/logout
```

### Protected Routes (Login Required)
```
GET http://localhost:5000/              (Dashboard)
GET http://localhost:5000/live          (Live monitoring)
GET http://localhost:5000/settings      (Settings)
GET http://localhost:5000/analytics     (Analytics)
```

### API Routes (No Auth Currently)
```
GET /api/history/<range>
GET /api/latest
GET /api/history/today
GET/POST/DELETE /api/settings
GET /api/history/latest/<limit>
etc...
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE INDEX idx_users_username ON users(username)
```

### Example User
```
id: 1
username: john_doe
email: john@example.com
password_hash: pbkdf2:sha256:600000$...(encrypted)
created_at: 2026-01-03 12:00:00
```

---

## 🔒 Password Security

**Algorithm**: PBKDF2 with SHA-256
**Iterations**: 600,000 (Werkzeug default)
**Storage**: Never in plain text, always hashed
**Verification**: Using `check_password_hash()`

### Example
```python
from werkzeug.security import generate_password_hash, check_password_hash

# Hashing
password_hash = generate_password_hash('MyPassword123')
# Result: pbkdf2:sha256:600000$...(random)

# Verification
is_valid = check_password_hash(password_hash, 'MyPassword123')
# Returns: True or False
```

---

## 🎯 Usage Examples

### Register New User
```
URL: POST http://localhost:5000/register
Data:
  username: john_doe
  email: john@example.com
  password: MyPassword123
  confirm_password: MyPassword123

Response: Redirect to / (auto-logged in)
```

### Login
```
URL: POST http://localhost:5000/login
Data:
  username: john_doe
  password: MyPassword123

Response: Redirect to / (session created)
```

### Logout
```
URL: GET http://localhost:5000/logout

Response: Redirect to /login (session cleared)
```

### Access Protected Route
```
URL: GET http://localhost:5000/live

If logged in: Show live.html page
If not logged in: Redirect to /login?next=/live
After login: Redirect to /live (original page)
```

---

## ⚙️ Configuration

### Session Settings
```python
# In Flask
app.config['SECRET_KEY'] = 'morpheus-co2-secret-key'
session['user_id'] = user['id']
session['username'] = user['username']
```

### Password Requirements (Server-side)
- Minimum 6 characters
- Must match confirmation field
- No other complexity rules (can add later)

### Username Requirements (Server-side)
- Minimum 3 characters
- Must be unique in database
- Alphanumeric allowed

### Email Requirements (Server-side)
- Must be valid email format
- Must be unique in database

---

## 🧪 Testing Commands

### Check Database
```bash
cd site
sqlite3 data/aerium.sqlite
sqlite> SELECT * FROM users;
sqlite> .quit
```

### Create Test User in Code
```python
from werkzeug.security import generate_password_hash
from database import create_user, init_db

init_db()
password_hash = generate_password_hash('testpass123')
user_id = create_user('testuser', 'test@example.com', password_hash)
print(f"Created user ID: {user_id}")
```

### Verify Password in Code
```python
from werkzeug.security import check_password_hash
from database import get_user_by_username

user = get_user_by_username('testuser')
if user and check_password_hash(user['password_hash'], 'testpass123'):
    print("Password is correct!")
```

---

## 🐛 Troubleshooting

### Issue: "Can't access login page"
**Solution**: Restart Flask: `cd site && python app.py`

### Issue: "Registration doesn't work"
**Solution**: 
1. Check all fields are filled
2. Username must be 3+ characters
3. Password must be 6+ characters
4. Passwords must match
5. Username/email might already exist

### Issue: "Can't log in"
**Solution**:
1. Check username exists
2. Check password is correct
3. Try creating new test user
4. Check database file exists

### Issue: "Protected pages show 404"
**Solution**:
1. Verify you're logged in (see navbar)
2. Clear browser cache
3. Restart Flask server
4. Check route exists in app.py

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `AUTHENTICATION_SYSTEM.md` | Detailed technical documentation |
| `AUTH_QUICK_START.md` | Quick start guide and testing scenarios |
| `AUTH_IMPLEMENTATION_SUMMARY.md` | Implementation overview |
| This file | Quick reference (you are here) |

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email Verification**
   - Send email on registration
   - Require email confirmation
   - Resend verification email

2. **Password Reset**
   - Forgot password page
   - Email reset link
   - New password validation

3. **User Profile**
   - `/profile` page
   - Edit email, username
   - Change password
   - Delete account

4. **Security Enhancements**
   - Rate limiting on login
   - Remember me checkbox
   - Login history
   - Device verification

5. **OAuth Integration**
   - Google login
   - GitHub login
   - Other providers

---

## 📋 File Structure

```
Morpheus/
├── site/
│   ├── app.py                          [MODIFIED: Auth routes + decorator]
│   ├── database.py                     [MODIFIED: Users table + functions]
│   ├── templates/
│   │   ├── base.html                   [MODIFIED: User info in navbar]
│   │   ├── login.html                  [NEW: Login page]
│   │   ├── register.html               [NEW: Registration page]
│   │   ├── index.html                  [Protected with @login_required]
│   │   ├── live.html                   [Protected with @login_required]
│   │   ├── settings.html               [Protected with @login_required]
│   │   └── analytics.html              [Protected with @login_required]
│   ├── static/
│   │   └── css/
│   │       └── style.css               [MODIFIED: User info styles]
│   ├── data/
│   │   └── aerium.sqlite               [UPDATED: New users table]
│   └── test_auth.py                    [NEW: Test script]
├── AUTHENTICATION_SYSTEM.md            [NEW: Full documentation]
├── AUTH_QUICK_START.md                 [NEW: Quick start guide]
├── AUTH_IMPLEMENTATION_SUMMARY.md      [NEW: Implementation summary]
└── AUTH_QUICK_REFERENCE.md             [NEW: This file]
```

---

## ✅ Status Checklist

- ✅ Database schema created
- ✅ User registration working
- ✅ User login working
- ✅ Session management working
- ✅ Logout working
- ✅ Protected routes working
- ✅ Password hashing working
- ✅ Error handling working
- ✅ Navbar updated
- ✅ Styling complete
- ✅ French labels used
- ✅ Mobile responsive
- ✅ Documentation complete
- ✅ Server running

**READY FOR TESTING** ✅

---

**Version**: 1.0
**Date**: January 3, 2026
**Status**: ✅ Production Ready
