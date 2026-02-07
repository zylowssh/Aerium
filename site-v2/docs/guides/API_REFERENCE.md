# 📚 Référence API Complète

**Date:** février 2026

Tous les endpoints de l'API Aerium avec exemples détaillés.

---

## 🔐 Authentification

### Enregistrement

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Jean Dupont"
}
```

**Réponse (201):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "message": "User created successfully"
}
```

### Connexion

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@aerium.app",
  "password": "demo123"
}
```

**Réponse (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "demo@aerium.app",
    "full_name": "Demo User",
    "role": "user"
  }
}
```

### Infos Utilisateur Actuel

```bash
GET /api/auth/me
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "id": 1,
  "email": "demo@aerium.app",
  "full_name": "Demo User",
  "role": "user",
  "created_at": "2026-02-01T10:00:00"
}
```

### Renouveler Token

```bash
POST /api/auth/refresh
Authorization: Bearer {refresh_token}
```

**Réponse (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Déconnexion

```bash
POST /api/auth/logout
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

## 📡 Capteurs (Sensors)

### Lister Capteurs

```bash
GET /api/sensors
Authorization: Bearer {access_token}
Query Parameters:
  - search: string (optionnel)
  - status: string (optionnel)
  - sort: string (optionnel)
  - limit: integer (optionnel, défaut: 50)
```

**Exemple:**
```bash
GET /api/sensors?search=cuisine&status=en%20ligne&sort=updated_at&limit=10
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "sensors": [
    {
      "id": 1,
      "name": "Cuisine",
      "location": "Rez-de-chaussée",
      "sensor_type": "MULTI",
      "status": "en ligne",
      "is_active": true,
      "external_id": null,
      "last_reading_at": "2026-02-02T14:30:45",
      "created_at": "2026-01-15T09:00:00"
    }
  ],
  "count": 1,
  "filters": {
    "search": "cuisine",
    "status": "en ligne"
  }
}
```

### Créer Capteur

```bash
POST /api/sensors
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Salon",
  "location": "Étage 1",
  "sensor_type": "MULTI",
  "is_active": true,
  "external_id": "EXT001"
}
```

**Réponse (201):**
```json
{
  "id": 5,
  "name": "Salon",
  "location": "Étage 1",
  "sensor_type": "MULTI",
  "is_active": true,
  "created_at": "2026-02-02T15:00:00"
}
```

### Détails Capteur

```bash
GET /api/sensors/1
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "id": 1,
  "name": "Cuisine",
  "location": "Rez-de-chaussée",
  "sensor_type": "MULTI",
  "status": "en ligne",
  "is_active": true,
  "last_reading": {
    "co2": 850,
    "temperature": 22.5,
    "humidity": 45
  },
  "last_reading_at": "2026-02-02T14:30:45"
}
```

### Mettre à Jour Capteur

```bash
PUT /api/sensors/1
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Cuisine Principale",
  "location": "RDC",
  "is_active": true
}
```

**Réponse (200):**
```json
{
  "id": 1,
  "name": "Cuisine Principale",
  "location": "RDC",
  "updated_at": "2026-02-02T15:00:00"
}
```

### Supprimer Capteur

```bash
DELETE /api/sensors/1
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "message": "Sensor deleted successfully"
}
```

---

## 📊 Lectures (Readings)

### Ajouter Lecture

```bash
POST /api/readings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "sensor_id": 1,
  "co2": 1150,
  "temperature": 23.5,
  "humidity": 52,
  "timestamp": "2026-02-02T14:30:45"
}
```

**Réponse (201):**
```json
{
  "id": 1001,
  "sensor_id": 1,
  "co2": 1150,
  "temperature": 23.5,
  "humidity": 52,
  "created_at": "2026-02-02T14:30:45"
}
```

### Lectures d'un Capteur

```bash
GET /api/readings/sensor/1
Authorization: Bearer {access_token}
Query Parameters:
  - limit: integer (optionnel, défaut: 100)
  - offset: integer (optionnel, défaut: 0)
```

**Exemple:**
```bash
GET /api/readings/sensor/1?limit=50&offset=0
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "readings": [
    {
      "id": 1001,
      "sensor_id": 1,
      "co2": 1150,
      "temperature": 23.5,
      "humidity": 52,
      "timestamp": "2026-02-02T14:30:45"
    },
    {
      "id": 1000,
      "sensor_id": 1,
      "co2": 1100,
      "temperature": 23.2,
      "humidity": 51,
      "timestamp": "2026-02-02T14:25:45"
    }
  ],
  "count": 2,
  "total": 1500
}
```

### Dernière Lecture

```bash
GET /api/readings/latest/1
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "id": 1001,
  "sensor_id": 1,
  "co2": 1150,
  "temperature": 23.5,
  "humidity": 52,
  "timestamp": "2026-02-02T14:30:45"
}
```

### Agrégations Statistiques

```bash
GET /api/readings/aggregate
Authorization: Bearer {access_token}
Query Parameters:
  - sensor_id: integer (optionnel)
  - period: string (hour|day|week|month)
```

**Exemple:**
```bash
GET /api/readings/aggregate?sensor_id=1&period=day
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "average": {
    "co2": 950,
    "temperature": 22.1,
    "humidity": 48
  },
  "min": {
    "co2": 800,
    "temperature": 20.5,
    "humidity": 40
  },
  "max": {
    "co2": 1200,
    "temperature": 24.3,
    "humidity": 55
  },
  "count": 288,
  "period": "day"
}
```

---

## 🚨 Alertes (Alerts)

### Lister Alertes

```bash
GET /api/alerts
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "alerts": [
    {
      "id": 1,
      "sensor_id": 1,
      "alert_type": "CO2",
      "threshold": 1200,
      "is_active": true,
      "last_triggered": "2026-02-02T14:30:45"
    }
  ],
  "count": 1
}
```

### Créer Alerte

```bash
POST /api/alerts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "sensor_id": 1,
  "alert_type": "CO2",
  "threshold": 1200
}
```

**Réponse (201):**
```json
{
  "id": 1,
  "sensor_id": 1,
  "alert_type": "CO2",
  "threshold": 1200,
  "created_at": "2026-02-02T15:00:00"
}
```

### Historique d'Alertes

```bash
GET /api/alerts/history/list
Authorization: Bearer {access_token}
Query Parameters:
  - sensor_id: integer (optionnel)
  - limit: integer (optionnel)
  - offset: integer (optionnel)
```

**Réponse (200):**
```json
{
  "alerts": [
    {
      "id": 42,
      "sensor_id": 1,
      "alert_type": "CO2",
      "value": 1500,
      "threshold": 1200,
      "is_acknowledged": false,
      "is_resolved": false,
      "created_at": "2026-02-02T14:30:45"
    }
  ],
  "count": 1
}
```

### Reconnaître Alerte

```bash
PUT /api/alerts/history/acknowledge/42
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "comment": "Alert reviewed"
}
```

**Réponse (200):**
```json
{
  "id": 42,
  "is_acknowledged": true,
  "acknowledged_at": "2026-02-02T15:00:00"
}
```

### Résoudre Alerte

```bash
PUT /api/alerts/history/resolve/42
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "resolution": "Aération effectuée"
}
```

**Réponse (200):**
```json
{
  "id": 42,
  "is_resolved": true,
  "resolved_at": "2026-02-02T15:05:00"
}
```

### Statistiques Alertes

```bash
GET /api/alerts/history/stats
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "total": 150,
  "acknowledged": 120,
  "resolved": 100,
  "pending": 30,
  "by_type": {
    "CO2": 80,
    "TEMPERATURE": 50,
    "HUMIDITY": 20
  }
}
```

---

## 📈 Rapports (Reports)

### Rapport Journalier

```bash
GET /api/reports/daily/1
Authorization: Bearer {access_token}
Query Parameters:
  - date: string (optionnel, YYYY-MM-DD)
```

**Réponse (200):**
```json
{
  "sensor_id": 1,
  "date": "2026-02-02",
  "summary": {
    "avg_co2": 950,
    "avg_temp": 22.1,
    "avg_humidity": 48
  },
  "alerts_count": 2,
  "readings_count": 288,
  "max_values": {
    "co2": 1200,
    "temperature": 24.3,
    "humidity": 55
  },
  "min_values": {
    "co2": 800,
    "temperature": 20.5,
    "humidity": 40
  }
}
```

### Rapport Hebdomadaire

```bash
GET /api/reports/weekly/1
Authorization: Bearer {access_token}
Query Parameters:
  - week: integer (optionnel)
  - year: integer (optionnel)
```

**Réponse (200):** Format similaire au rapport journalier

### Rapport Mensuel

```bash
GET /api/reports/monthly/1
Authorization: Bearer {access_token}
Query Parameters:
  - month: integer
  - year: integer
```

**Réponse (200):** Format similaire aux rapports

### Exporter Données

```bash
GET /api/reports/export
Authorization: Bearer {access_token}
Query Parameters:
  - sensor_id: integer (optionnel)
  - format: string (csv|pdf)
  - start_date: string (YYYY-MM-DD)
  - end_date: string (YYYY-MM-DD)
```

**Exemple CSV:**
```bash
GET /api/reports/export?sensor_id=1&format=csv&start_date=2026-02-01&end_date=2026-02-02
Authorization: Bearer {token}
```

**Réponse (200):** Fichier CSV téléchargé

### Télécharger PDF

```bash
GET /api/reports/export?format=pdf&start_date=2026-02-01
Authorization: Bearer {token}
```

**Réponse (200):** Fichier PDF téléchargé

---

## 👥 Utilisateurs (Users)

### Profil Utilisateur

```bash
GET /api/users/profile
Authorization: Bearer {access_token}
```

**Réponse (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Jean Dupont",
  "role": "user",
  "created_at": "2026-01-15T09:00:00",
  "updated_at": "2026-02-02T10:00:00"
}
```

### Mettre à Jour Profil

```bash
PUT /api/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "full_name": "Jean Dupont Nouveau",
  "email": "nouveau-email@example.com"
}
```

**Réponse (200):**
```json
{
  "id": 1,
  "full_name": "Jean Dupont Nouveau",
  "email": "nouveau-email@example.com",
  "updated_at": "2026-02-02T15:00:00"
}
```

### Changer Mot de Passe

```bash
POST /api/users/change-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "old_password",
  "new_password": "new_secure_password"
}
```

**Réponse (200):**
```json
{
  "message": "Password changed successfully"
}
```

### Lister Utilisateurs (Admin)

```bash
GET /api/users
Authorization: Bearer {admin_token}
```

**Réponse (200):**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "User Name",
      "role": "user"
    }
  ],
  "count": 1
}
```

---

## 🏥 Santé Système

### Health Check

```bash
GET /api/health
```

**Réponse (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "cache": "active",
  "features": {
    "email_notifications": true,
    "rate_limiting": true,
    "audit_logging": true,
    "websocket": true
  },
  "timestamp": "2026-02-02T15:00:00"
}
```

---

## 🔧 Codes de Statut

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Créé |
| 204 | Sans contenu |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 429 | Trop de requêtes (Rate limit) |
| 500 | Erreur serveur |

---

## 📋 Erreurs Courantes

### 401 Unauthorized
Token manquant ou invalide:
```json
{
  "error": "Invalid token",
  "message": "Token expired or invalid"
}
```

### 403 Forbidden
Pas de permission:
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 429 Too Many Requests
Rate limit dépassé:
```json
{
  "error": "Rate limit exceeded",
  "message": "Try again later"
}
```

### 400 Bad Request
Validation échouée:
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Shorter than minimum length 1"],
    "email": ["Invalid email format"]
  }
}
```

---

## 📚 Variables d'Environnement pour Tests

```bash
# .env.test
TEST_USER_EMAIL=test@aerium.app
TEST_USER_PASSWORD=test123
TEST_ADMIN_EMAIL=admin@aerium.app
TEST_ADMIN_PASSWORD=admin123

API_URL=http://localhost:5000
API_TIMEOUT=10000
```

---

**Dernière mise à jour:** février 2026
