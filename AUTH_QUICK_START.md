# Authentication System - Quick Start Guide

## Pages

### Public Pages (No Login Required)
- `http://localhost:5000/login` - Login page
- `http://localhost:5000/register` - Registration page

### Protected Pages (Login Required)
- `http://localhost:5000/` - Dashboard
- `http://localhost:5000/live` - Live monitoring
- `http://localhost:5000/settings` - Settings
- `http://localhost:5000/analytics` - Analytics

## Testing Scenarios

### Scenario 1: New User Registration
1. Navigate to `/register`
2. Enter details:
   - Username: `john_doe` (or any 3+ char username)
   - Email: `john@example.com`
   - Password: `MySecurePass123` (6+ chars)
   - Confirm: `MySecurePass123`
3. Click "Créer un compte"
4. ✅ Auto-logged in, redirected to dashboard
5. ✅ See username and logout button in navbar

### Scenario 2: Existing User Login
1. Navigate to `/login`
2. Enter details:
   - Username: `john_doe`
   - Password: `MySecurePass123`
3. Click "Connexion"
4. ✅ Logged in, redirected to dashboard

### Scenario 3: Failed Login
1. Navigate to `/login`
2. Enter wrong password
3. ❌ Error message: "Identifiants invalides"
4. ❌ Stay on login page

### Scenario 4: Logout
1. Click 🚪 button in navbar (top right)
2. ✅ Session cleared
3. ✅ Redirected to login page

### Scenario 5: Access Protected Route Without Login
1. Clear cookies or use private window
2. Navigate to `/live`
3. ❌ Redirected to `/login?next=/live`
4. 📝 After login, you'll be redirected to `/live`

### Scenario 6: Registration Validation
Try these and see error messages:

| Test Case | Input | Expected Error |
|-----------|-------|-----------------|
| Empty fields | Leave blank | "Tous les champs sont requis" |
| Short username | `ab` | "Le nom d'utilisateur doit contenir au moins 3 caractères" |
| Short password | `pass` | "Le mot de passe doit contenir au moins 6 caractères" |
| Password mismatch | Different confirm | "Les mots de passe ne correspondent pas" |
| Duplicate username | Existing user | "Ce nom d'utilisateur existe déjà" |
| Duplicate email | Existing email | "Cet email existe déjà" |

## UI Elements

### Login/Register Pages
- 🎨 Modern dark theme with gradient backgrounds
- 📱 Fully responsive (mobile + desktop)
- 🎯 Clear form fields with validation hints
- ❌ Error messages in red highlight
- 🔗 Links between login and register pages

### Authenticated Navbar
When logged in, the navbar shows:
```
👤 username    🚪
```
- 👤 Username display
- 🚪 Logout button (red on hover)

## Security Features

✅ **Password Hashing**: PBKDF2 via Werkzeug
✅ **Unique Constraints**: Username & Email uniqueness
✅ **SQL Injection Protection**: Parameterized queries
✅ **Session Management**: Signed Flask cookies
✅ **Input Validation**: Server-side validation

## Database Structure

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

Example user:
```
id: 1
username: john_doe
email: john@example.com
password_hash: pbkdf2:sha256:...(hashed)
created_at: 2026-01-03 01:20:00
```

## Troubleshooting

### "Server Error" on Login
- ✅ Restart Flask: `python app.py` from `/site` directory
- ✅ Check database exists: `/site/data/aerium.sqlite`
- ✅ Clear browser cache: Ctrl+Shift+Delete

### Can't Create Account
- ✅ Username must be 3+ characters
- ✅ Password must be 6+ characters
- ✅ Passwords must match
- ✅ Email/username might already exist

### Logged in but Can't Access Pages
- ✅ Refresh page (F5)
- ✅ Check session cookies: DevTools → Application → Cookies
- ✅ Clear cookies and re-login

### Stays on Login Page After Register
- ✅ Database might not have initialized users table
- ✅ Try restarting Flask server
- ✅ Check `/site/data/aerium.sqlite` permissions

## Database Inspection

To view users in SQLite:
```bash
cd site
sqlite3 data/aerium.sqlite
> SELECT * FROM users;
> SELECT username, email, created_at FROM users;
```

## API Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/login \
  -d "username=john_doe&password=MySecurePass123" \
  -c cookies.txt
```

### Access Protected Route
```bash
curl -b cookies.txt http://localhost:5000/api/history/latest/40
```

### Logout
```bash
curl -b cookies.txt http://localhost:5000/logout
```

## Notes for Developers

### Adding New Protected Routes
```python
@app.route("/new-route")
@login_required
def new_route():
    return render_template("template.html")
```

### Getting Current User ID
```python
from flask import session

user_id = session.get('user_id')
username = session.get('username')
```

### Creating Test Users Programmatically
```python
from werkzeug.security import generate_password_hash
from database import create_user

password_hash = generate_password_hash('testpass')
user_id = create_user('testuser', 'test@example.com', password_hash)
```

---

**Status**: ✅ Ready for Testing
**Language**: French UI labels
**Design**: Modern gradient theme
**Security**: Production-ready hashing
