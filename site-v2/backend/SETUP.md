# Aerium Flask Backend

Air quality monitoring backend built with Flask and SQLite with advanced features including email notifications, rate limiting, audit logging, and search/filtering.

## Features

- 🔐 JWT Authentication with role-based access control
- 📧 Email alerts for sensor threshold violations
- 🛡️ Rate limiting to prevent API abuse
- 📊 Comprehensive logging with rotating file handler
- 🔍 Advanced search and filtering for sensors and alerts
- 📝 Audit trail for all user actions
- 🔄 WebSocket support for real-time updates
- ⚡ Data caching for performance
- ✅ Input validation with Marshmallow schemas
- 📚 API documentation endpoint

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```env
# Core Configuration
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Email Notifications (optional)
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Alert Thresholds
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
ALERT_HUMIDITY_THRESHOLD=80

# Rate Limiting
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute

# Logging
LOG_LEVEL=INFO
```

### 3. Initialize Database

The database will be automatically created when you first run the app.

### 4. Seed Demo Data (optional)

```bash
python seed_database.py
```

This creates demo accounts:
- **User Account**: demo@aerium.app / demo123
- **Admin Account**: admin@aerium.app / admin123

### 5. Run the Backend

```bash
python app.py
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh JWT token

### Sensors
- `GET /api/sensors` - List sensors with search/filter
- `GET /api/sensors/<id>` - Get specific sensor
- `POST /api/sensors` - Create new sensor
- `PUT /api/sensors/<id>` - Update sensor
- `DELETE /api/sensors/<id>` - Delete sensor

**Query Parameters:**
```
?search=kitchen          # Search by name/location
&status=en%20ligne      # Filter by status
&type=CO2               # Filter by type
&active=true            # Filter by active status
&sort=updated_at        # Sort by field
&limit=50               # Limit results
```

### Readings
- `GET /api/readings/sensor/<sensor_id>` - Get readings for sensor
- `POST /api/readings` - Add new reading
- `GET /api/readings/aggregate` - Get aggregate data
- `POST /api/readings/external/<sensor_id>` - Add external sensor data
- `GET /api/readings/latest/<sensor_id>` - Get latest reading

### Alerts
- `GET /api/alerts` - List alerts
- `PUT /api/alerts/<id>` - Update alert status
- `DELETE /api/alerts/<id>` - Delete alert
- `GET /api/alerts/history/list` - Get alert history
- `PUT /api/alerts/history/acknowledge/<id>` - Acknowledge alert
- `GET /api/alerts/history/stats` - Get alert statistics

### Reports
- `GET /api/reports/daily/<sensor_id>` - Daily report
- `GET /api/reports/weekly/<sensor_id>` - Weekly report
- `GET /api/reports/monthly/<sensor_id>` - Monthly report
- `GET /api/reports/export` - Export data as CSV

### System
- `GET /api/health` - Health check with feature status
- `GET /api/docs` - API documentation

## Configuration

See `.env.example` for all available configuration options.

Key features:
- **Email Alerts**: Configure SMTP to send alerts when thresholds exceeded
- **Rate Limiting**: Prevent API abuse with configurable request limits
- **Logging**: Comprehensive logging with rotating file handler
- **Audit Trail**: All user actions are tracked and can be audited

## Email Alerts

When a reading exceeds configured thresholds, the system automatically sends an email alert to the user. Set these environment variables to enable:

```env
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## Search and Filtering

```bash
# Search by name
GET /api/sensors?search=kitchen

# Filter by status
GET /api/sensors?status=avertissement

# Search and sort
GET /api/sensors?search=office&sort=updated_at&limit=10

# Complex filter
GET /api/sensors?search=floor&status=en%20ligne&type=MULTI&active=true&sort=name
```

## Audit Logging

All user actions are logged:

```python
from audit_logger import get_user_audit_history, get_resource_audit_history

# Get user's recent actions
logs = get_user_audit_history(user_id=1, limit=50)

# Get changes to specific sensor
logs = get_resource_audit_history('SENSOR', sensor_id=5)
```

## Rate Limiting

Default limits (configurable via environment):
- **Daily**: 200 requests
- **Hourly**: 50 requests
- **Per minute**: 10 requests

When exceeded:
```json
{
    "error": "Rate limit exceeded. Try again later."
}
```

## Database Schema

### Core Tables
- **user**: User accounts with authentication
- **sensor**: Sensor devices and configuration
- **sensor_reading**: Time-series sensor data
- **alert**: Alert configurations
- **alert_history**: Alert events log
- **audit_log**: User action audit trail

## Troubleshooting

### Email alerts not sending
1. Check `.env` has correct `MAIL_USERNAME` and `MAIL_PASSWORD`
2. For Gmail, enable "Less secure apps" or use App Password
3. Check `logs/aerium.log` for error details
4. Verify `ENABLE_EMAIL_NOTIFICATIONS=True`

### Rate limiting too strict
```env
ENABLE_RATE_LIMITING=False  # Disable in development
```

### Database errors
```bash
# Reset database
rm aerium.db
python app.py  # Creates new database
python seed_database.py  # Add demo data
```

## Development

```bash
python app.py  # Runs with auto-reload
```

Check `logs/aerium.log` for detailed logging.

## Production Deployment

1. Set strong secret keys in `.env`
2. Enable rate limiting and logging
3. Configure email service
4. Run with production server:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Documentation

See [FEATURES.md](../FEATURES.md) for detailed feature documentation.
