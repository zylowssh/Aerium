# Aerium Flask Backend

Air quality monitoring backend built with Flask and SQLite.

## Setup Instructions

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment variables:**
Create a `.env` file in the backend directory:
```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

3. **Initialize the database:**
The database will be automatically created when you first run the app.

4. **Seed demo data (optional):**
```bash
python seed_database.py
```

This creates demo accounts:
- **User Account**: demo@aerium.app / demo123
- **Admin Account**: admin@aerium.app / admin123

5. **Run the Flask server:**
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Sensors
- `GET /api/sensors` - Get all sensors for current user
- `GET /api/sensors/<id>` - Get specific sensor
- `POST /api/sensors` - Create new sensor
- `PUT /api/sensors/<id>` - Update sensor
- `DELETE /api/sensors/<id>` - Delete sensor

### Readings
- `GET /api/readings/sensor/<id>` - Get readings for a sensor
- `POST /api/readings` - Add new reading
- `GET /api/readings/aggregate` - Get aggregate statistics

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `GET /api/users` - Get all users (admin only)

### Health Check
- `GET /api/health` - Check API status

## Features

- JWT-based authentication
- SQLite database with SQLAlchemy ORM
- Real-time sensor simulation (every 5 seconds)
- WebSocket support for live updates
- Role-based access control (admin/user)
- CORS enabled for frontend integration

## Database Schema

- **users**: User accounts with authentication
- **sensors**: Sensor devices and configuration
- **sensor_readings**: Time-series sensor data
- **alerts**: System alerts and notifications

## Development

To run in development mode with auto-reload:
```bash
python app.py
```

The server runs with Flask-SocketIO for real-time capabilities.
