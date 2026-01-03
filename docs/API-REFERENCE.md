# API REFERENCE

**Complete REST & WebSocket API documentation**

---

## 🌐 Base URL
```
http://localhost:5000
```

---

## 🔐 Authentication

All protected endpoints require:
```
Session Cookie: session=<session_id>
OR
Header: Authorization: Bearer <token>
```

### Get Current User
```python
# In request
if 'user_id' in session:
    user_id = session['user_id']
```

---

## 📡 REST API Endpoints

### Authentication

#### POST /login
Login with username and password
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john&password=secret123"
```

**Request**:
```
username: string (required)
password: string (required)
```

**Response** (302 redirect or 200):
```json
{
  "status": "success",
  "message": "Logged in successfully",
  "redirect": "/dashboard"
}
```

**Status Codes**:
- 302: Redirect to dashboard
- 200: Re-render login form (invalid credentials)
- 400: Missing fields

---

#### POST /register
Create new user account
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john&email=john@example.com&password=secret123"
```

**Request**:
```
username: string (required, 3-50 chars)
email: string (required, valid email)
password: string (required, 6+ chars)
```

**Response** (302 redirect):
```json
{
  "status": "success",
  "message": "Account created. Check email to verify."
}
```

**Status Codes**:
- 302: Redirect to verification pending
- 400: Validation error
- 409: Username/email already exists

---

#### GET /logout
Logout current user
```bash
curl -X GET http://localhost:5000/logout
```

**Response** (302 redirect):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

#### POST /verify-email
Verify email with token
```bash
curl -X POST http://localhost:5000/verify-email \
  -d "token=abc123def456"
```

**Request**:
```
token: string (from email link)
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

---

#### POST /forgot-password
Request password reset
```bash
curl -X POST http://localhost:5000/forgot-password \
  -d "email=john@example.com"
```

**Request**:
```
email: string (user's email)
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Reset link sent to email"
}
```

---

#### POST /reset-password
Reset password with token
```bash
curl -X POST http://localhost:5000/reset-password \
  -d "token=abc123def456&password=newpassword123"
```

**Request**:
```
token: string (from email link)
password: string (new password, 6+ chars)
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

### User Data

#### GET /api/readings
Get CO2 readings for current user
```bash
curl -X GET "http://localhost:5000/api/readings?days=7&limit=100"
```

**Query Parameters**:
```
days: integer (optional, default=7)
limit: integer (optional, default=100, max=1000)
start_date: string (optional, format: YYYY-MM-DD)
end_date: string (optional, format: YYYY-MM-DD)
```

**Response** (200):
```json
{
  "readings": [
    {
      "id": 1,
      "user_id": 1,
      "co2_ppm": 450,
      "temperature": 23.5,
      "humidity": 45.0,
      "timestamp": "2024-01-15 14:30:00"
    },
    ...
  ],
  "count": 150,
  "total_average": 520.5
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized (not logged in)
- 400: Invalid parameters

---

#### POST /api/readings
Insert new CO2 reading
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "co2_ppm": 450,
    "temperature": 23.5,
    "humidity": 45.0
  }'
```

**Request**:
```json
{
  "co2_ppm": number (required, 0-5000),
  "temperature": number (optional, -20-50°C),
  "humidity": number (optional, 0-100%)
}
```

**Response** (201):
```json
{
  "status": "success",
  "reading_id": 12345,
  "message": "Reading inserted"
}
```

**Status Codes**:
- 201: Created
- 400: Invalid data
- 401: Unauthorized

---

#### GET /api/statistics
Get aggregated statistics
```bash
curl -X GET "http://localhost:5000/api/statistics?days=30"
```

**Query Parameters**:
```
days: integer (optional, default=30)
metric: string (optional: avg, min, max, latest)
```

**Response** (200):
```json
{
  "daily_average": 520.5,
  "min_co2": 380,
  "max_co2": 1200,
  "readings_count": 4320,
  "good_percent": 65,
  "bad_percent": 15,
  "peak_hours": [9, 12, 17]
}
```

---

#### GET /api/settings
Get user settings
```bash
curl -X GET http://localhost:5000/api/settings
```

**Response** (200):
```json
{
  "id": 1,
  "user_id": 1,
  "good_threshold": 800,
  "bad_threshold": 1200,
  "notification_enabled": true,
  "timezone": "UTC",
  "notification_email": "john@example.com",
  "language": "en"
}
```

---

#### POST /api/settings
Update user settings
```bash
curl -X POST http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "good_threshold": 750,
    "bad_threshold": 1100,
    "notification_enabled": true
  }'
```

**Request**:
```json
{
  "good_threshold": number (optional),
  "bad_threshold": number (optional),
  "notification_enabled": boolean (optional),
  "timezone": string (optional),
  "language": string (optional)
}
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Settings updated"
}
```

---

#### GET /api/profile
Get user profile
```bash
curl -X GET http://localhost:5000/api/profile
```

**Response** (200):
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com",
  "is_admin": false,
  "created_at": "2024-01-01 10:00:00",
  "last_login": "2024-01-15 14:30:00"
}
```

---

#### POST /api/profile
Update profile
```bash
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone": "+1234567890"
  }'
```

**Request**:
```json
{
  "full_name": string (optional),
  "phone": string (optional),
  "avatar_url": string (optional)
}
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Profile updated"
}
```

---

#### POST /api/change-password
Change password
```bash
curl -X POST http://localhost:5000/api/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldpass123",
    "new_password": "newpass123",
    "confirm_password": "newpass123"
  }'
```

**Request**:
```json
{
  "current_password": string (required),
  "new_password": string (required, 6+ chars),
  "confirm_password": string (required)
}
```

**Response** (200):
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

---

### Admin Endpoints

#### GET /admin/analytics
Get system analytics (admin only)
```bash
curl -X GET http://localhost:5000/admin/analytics
```

**Response** (200):
```json
{
  "total_users": 150,
  "active_users_24h": 45,
  "database_size_mb": 28.5,
  "total_readings": 450000,
  "average_response_time_ms": 125
}
```

---

#### GET /admin/users
List all users (admin only)
```bash
curl -X GET "http://localhost:5000/admin/users?page=1&limit=20"
```

**Query Parameters**:
```
page: integer (optional, default=1)
limit: integer (optional, default=20, max=100)
search: string (optional, search by username/email)
sort: string (optional: created_at, last_login, username)
```

**Response** (200):
```json
{
  "users": [
    {
      "id": 1,
      "username": "john",
      "email": "john@example.com",
      "is_admin": false,
      "created_at": "2024-01-01",
      "last_login": "2024-01-15"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

---

#### GET /admin/audit-logs
Get audit logs (admin only)
```bash
curl -X GET "http://localhost:5000/admin/audit-logs?days=30&action=login"
```

**Query Parameters**:
```
days: integer (optional, default=30)
user_id: integer (optional)
action: string (optional)
resource: string (optional)
```

**Response** (200):
```json
{
  "logs": [
    {
      "id": 1,
      "user_id": 1,
      "action": "login",
      "timestamp": "2024-01-15 14:30:00",
      "ip_address": "192.168.1.1"
    }
  ],
  "total": 2450
}
```

---

#### GET /health
Health check (no auth)
```bash
curl -X GET http://localhost:5000/health
```

**Response** (200):
```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "database": "connected",
  "workers": 4
}
```

---

## 🔌 WebSocket Events

### Connection

#### Connect
```python
socket = io.connect('http://localhost:5000')
```

**Response**:
```python
@socket.on('connect')
def on_connect():
    print("Connected!")
    # Automatically authenticated if user logged in
```

---

#### Disconnect
```python
socket.disconnect()
```

---

### CO2 Monitoring

#### start_monitoring
Request CO2 updates
```python
socket.emit('start_monitoring', {
    'interval': 5  # Update every 5 seconds
})
```

**Response**:
```python
@socket.on('update')
def on_update(data):
    print(data)
    # {
    #   'co2': 450,
    #   'temperature': 23.5,
    #   'humidity': 45.0,
    #   'timestamp': '2024-01-15 14:30:00'
    # }
```

---

#### stop_monitoring
Stop CO2 updates
```python
socket.emit('stop_monitoring')
```

---

### Notifications

#### send_message
Send notification
```python
socket.emit('send_message', {
    'type': 'alert',
    'title': 'High CO2',
    'body': 'CO2 level exceeded threshold'
})
```

**Response**:
```python
@socket.on('message')
def on_message(data):
    print(data)
    # Display notification to user
```

---

### Data Sync

#### sync_readings
Request data sync
```python
socket.emit('sync_readings', {
    'since': '2024-01-15 10:00:00'
})
```

**Response**:
```python
@socket.on('readings_sync')
def on_sync(data):
    readings = data['readings']
    # Update local database
```

---

## 📊 Response Formats

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed",
  "data": {}
}
```

### Error Response
```json
{
  "status": "error",
  "message": "User not found",
  "code": "USER_NOT_FOUND",
  "details": {}
}
```

### Paginated Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 🔄 Rate Limits

```
Authentication: 5 requests/minute per IP
API Reads: 100 requests/minute per user
API Writes: 20 requests/minute per user
WebSocket: 10 messages/second per connection
Admin: 1000 requests/minute per admin
```

---

## 🔒 Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Username/password incorrect |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `EMAIL_ALREADY_USED` | 409 | Email in use |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 403 | Insufficient permissions |
| `TOKEN_EXPIRED` | 401 | Verification/reset token expired |
| `DATABASE_ERROR` | 500 | Database connection issue |
| `RATE_LIMITED` | 429 | Too many requests |

---

## 📚 Example Integrations

### Python Requests
```python
import requests

session = requests.Session()

# Login
response = session.post('http://localhost:5000/login', data={
    'username': 'john',
    'password': 'secret123'
})

# Get readings
response = session.get('http://localhost:5000/api/readings?days=7')
readings = response.json()['readings']

# Insert reading
response = session.post('http://localhost:5000/api/readings', json={
    'co2_ppm': 450,
    'temperature': 23.5,
    'humidity': 45.0
})
```

### JavaScript Fetch
```javascript
// Login
const response = await fetch('/login', {
    method: 'POST',
    body: new FormData(document.querySelector('form'))
});

// Get readings
const response = await fetch('/api/readings?days=7');
const data = await response.json();
console.log(data.readings);

// Insert reading
await fetch('/api/readings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        co2_ppm: 450,
        temperature: 23.5,
        humidity: 45.0
    })
});
```

### JavaScript Socket.IO
```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('Connected');
    socket.emit('start_monitoring', { interval: 5 });
});

socket.on('update', (data) => {
    console.log(`CO2: ${data.co2} ppm`);
});
```

---

**Next → Read `TROUBLESHOOTING.md` for common issues** 🔧
