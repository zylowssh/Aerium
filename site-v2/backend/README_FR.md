# 🔧 Aerium Backend - Référence API

API Flask complète pour le Tableau de Bord Aerium Qualité de l'Air.

[English Version](backend/README.md) | **Version Française**

## 🚀 Démarrage Rapide

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Configuration

Créez `.env`:
```env
ENABLE_RATE_LIMITING=True
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
FLASK_ENV=development
FLASK_DEBUG=True
```

### Lancer

```bash
python app.py
# Serveur sur http://localhost:5000
```

## 📊 Endpoints Complets

### ✅ Authentification

```
POST   /api/auth/register      Créer un compte
POST   /api/auth/login         Se connecter
POST   /api/auth/refresh       Rafraîchir le token
```

#### Enregistrement
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "Jean Dupont"
  }'
```

Réponse:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Jean Dupont",
    "role": "user"
  }
}
```

#### Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@aerium.app",
    "password": "demo123"
  }'
```

Réponse:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "demo@aerium.app",
    "full_name": "Demo User"
  }
}
```

### 📡 Capteurs

```
GET    /api/sensors                     Lister tous les capteurs
POST   /api/sensors                     Créer un capteur
GET    /api/sensors/<id>                Détails d'un capteur
PUT    /api/sensors/<id>                Modifier un capteur
DELETE /api/sensors/<id>                Supprimer un capteur
```

#### Lister (Avec Recherche & Filtrage)
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/sensors?search=cuisine&status=en%20ligne&sort=updated_at"
```

Paramètres:
- `search` - Cherche dans nom/localisation
- `status` - Filtre par statut (en ligne, avertissement, offline)
- `type` - Filtre par type (CO2, TEMPERATURE, HUMIDITY, MULTI)
- `active` - Filtre par activité (true/false)
- `sort` - Trier par (name, updated_at, status)
- `limit` - Nombre max de résultats

#### Créer
```bash
curl -X POST http://localhost:5000/api/sensors \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cuisine",
    "location": "Rez-de-chaussée",
    "sensor_type": "MULTI"
  }'
```

### 📖 Lectures

```
GET    /api/readings/sensor/<id>       Readings pour un capteur
POST   /api/readings                    Ajouter une lecture
GET    /api/readings/latest/<id>       Dernière lecture
GET    /api/readings/aggregate          Données agrégées
POST   /api/readings/external/<id>      Données de capteur externe
```

#### Ajouter une Lecture
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "co2": 950,
    "temperature": 22.5,
    "humidity": 45
  }'
```

L'ajout d'une lecture:
1. Valide les seuils
2. Envoie un email d'alerte si activé
3. Enregistre dans la piste d'audit
4. Retourne la lecture créée

#### Capteur Externe
```bash
curl -X POST http://localhost:5000/api/readings/external/1 \
  -H "Content-Type: application/json" \
  -d '{
    "co2": 1100,
    "temperature": 23,
    "humidity": 50
  }'
```

Pas besoin d'authentification pour les capteurs externes (configurable).

### 🚨 Alertes

```
GET    /api/alerts                           Lister les alertes
GET    /api/alerts/<id>                      Détails d'une alerte
PUT    /api/alerts/<id>                      Modifier le statut
DELETE /api/alerts/<id>                      Supprimer une alerte
GET    /api/alerts/history/list              Historique des alertes
GET    /api/alerts/history/acknowledge/<id>  Reconnaître une alerte
GET    /api/alerts/history/resolve/<id>      Résoudre une alerte
GET    /api/alerts/history/stats             Statistiques
```

#### Historique des Alertes
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/alerts/history/list?days=30&status=triggered"
```

Paramètres:
- `days` - Nombre de jours à retourner (défaut: 30)
- `status` - Filtre par statut (triggered, acknowledged, resolved)
- `alert_type` - Filtre par type (info, avertissement, critique)
- `sensor_id` - Filtre par capteur
- `limit` - Nombre max (défaut: 100)

#### Statistiques
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/alerts/history/stats?days=30"
```

Réponse:
```json
{
  "totalAlerts": 15,
  "triggered": 10,
  "acknowledged": 3,
  "resolved": 2,
  "byType": {
    "info": 5,
    "avertissement": 7,
    "critique": 3
  }
}
```

### 📊 Rapports

```
GET    /api/reports/daily/<id>          Rapport journalier
GET    /api/reports/weekly/<id>         Rapport hebdomadaire
GET    /api/reports/monthly/<id>        Rapport mensuel
GET    /api/reports/export              Exporter en CSV
```

#### Rapport Journalier
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/reports/daily/1"
```

Réponse:
```json
{
  "sensor_id": 1,
  "date": "2026-02-02",
  "readings_count": 288,
  "co2": {
    "min": 450,
    "max": 1500,
    "avg": 850
  },
  "temperature": {
    "min": 18,
    "max": 26,
    "avg": 22.5
  },
  "humidity": {
    "min": 30,
    "max": 75,
    "avg": 52
  }
}
```

#### Export CSV
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/reports/export" \
  > data.csv
```

### 👥 Utilisateurs

```
GET    /api/users/profile              Profil utilisateur
PUT    /api/users/profile              Modifier le profil
POST   /api/users/change-password      Changer le mot de passe
GET    /api/users                      Lister les utilisateurs (Admin)
```

#### Profil
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/users/profile
```

### 🔍 Système

```
GET    /api/health                     Santé de l'API
GET    /api/docs                       Documentation API
```

#### Santé
```bash
curl http://localhost:5000/api/health
```

Réponse:
```json
{
  "status": "healthy",
  "message": "Aerium API is running",
  "features": {
    "email_notifications": true,
    "rate_limiting": true
  }
}
```

## 🔐 Authentification JWT

### Format

Toutes les requêtes protégées nécessitent:
```
Authorization: Bearer <token>
```

### Exemple

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:5000/api/sensors
```

### Token Expiré

La réponse:
```json
{
  "error": "Token has expired"
}
```

Solution: Se reconnecter pour obtenir un nouveau token.

## 📋 Codes de Statut

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## 🛡️ Features

### Email Notifications 📧
```env
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app
```

Quand une lecture dépasse les seuils, un email est envoyé automatiquement.

### Rate Limiting 🛡️
```env
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute
```

Retourne 429 si dépassé.

### Logging 📊
```env
LOG_LEVEL=INFO
LOG_FILE=logs/aerium.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=10
```

Consultez: `tail -f backend/logs/aerium.log`

### Audit 📝
Toutes les actions sont enregistrées:

```python
from audit_logger import get_user_audit_history
logs = get_user_audit_history(1)
```

## 📦 Dépendances

```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
Flask-JWT-Extended==4.6.0
Flask-SocketIO==5.3.6
Flask-Limiter==3.5.0
Flask-Caching==2.1.0
Flask-Mail==0.9.1
marshmallow==3.20.1
email-validator==2.1.0
```

## 🐛 Dépannage

### Erreur: "Address already in use"
```bash
# Port 5000 déjà utilisé?
# Utiliser un port différent:
python app.py --port 5001
```

### Erreur: "No module named 'flask'"
```bash
# Réinstaller les dépendances:
pip install -r requirements.txt
```

### Erreur: "Database is locked"
```bash
# Trop d'accès simultanés à SQLite
# Utiliser PostgreSQL en production
```

### Erreur CORS
```env
# Vérifier les origines autorisées dans app.py
# Ajouter votre URL frontend si nécessaire
```

## 🚀 Production

### Construire avec Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Variables Production

```env
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=<clé-longue-aléatoire>
JWT_SECRET_KEY=<clé-longue-aléatoire>
ENABLE_RATE_LIMITING=True
MAIL_SERVER=<serveur-smtp-production>
```

### Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Schéma Base de Données

### Table: user
```sql
id, email, password_hash, full_name, avatar_url, 
role (user/admin), created_at, updated_at
```

### Table: sensor
```sql
id, user_id, name, location, sensor_type, status, 
battery, is_live, is_active, external_id, 
created_at, updated_at
```

### Table: sensor_reading
```sql
id, sensor_id, co2, temperature, humidity, recorded_at
```

### Table: alert
```sql
id, user_id, sensor_id, alert_type, threshold, 
is_active, created_at
```

### Table: alert_history
```sql
id, user_id, sensor_id, alert_type, message, status, 
acknowledged_at, resolved_at, created_at
```

### Table: audit_log
```sql
id, user_id, action, resource_type, resource_id, 
details (JSON), ip_address, timestamp
```

## 🔄 Workflow Typique

1. **Utilisateur se connecte** → POST /api/auth/login → Récoit JWT token
2. **Utilisateur crée un capteur** → POST /api/sensors → Enregistré dans audit_log
3. **Capteur envoie une lecture** → POST /api/readings → Vérifie les seuils
4. **Seuil dépassé** → Email envoyé + Alerte créée
5. **Utilisateur consulte alertes** → GET /api/alerts/history/list
6. **Utilisateur reconnaît alerte** → PUT /api/alerts/history/acknowledge/<id>

## 📚 Autres Ressources

- Voir [README_FR.md](README_FR.md) pour vue d'ensemble
- Voir [FEATURES_FR.md](FEATURES_FR.md) pour détails des fonctionnalités
- Voir [QUICKSTART_FR.md](QUICKSTART_FR.md) pour guide rapide
- Consulter http://localhost:5000/api/docs pour documentation interactive

---

**API Aerium Tableau de Bord Qualité de l'Air**

Prêt pour la production ✅
