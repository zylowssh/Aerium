# 📖 Documentation d'Architecture

**Date:** février 2026  
**Version:** 1.0

## 🏗️ Vue d'Ensemble Générale

Aerium est une application de surveillance de qualité de l'air en temps réel avec une architecture moderne client-serveur. Elle se compose d'un backend Flask robuste et d'un frontend React performant.

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT (Frontend)                     │
│         React 18 + TypeScript + TanStack Query          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pages (Dashboard, Alertes, Capteurs, etc.)      │  │
│  │  Composants (UI, Charts, Tables)                 │  │
│  │  WebSocket Client (Socket.IO)                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP + WebSocket
                     │
┌────────────────────▼─────────────────────────────────────┐
│              API GATEWAY / PROXY                         │
│  (CORS, Rate Limiting, Authentication)                 │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│                SERVER (Backend)                         │
│          Flask + SQLAlchemy + Flask-SocketIO            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes (Auth, Sensors, Readings, etc.)     │  │
│  │  Business Logic                                  │  │
│  │  WebSocket Server (Socket.IO)                    │  │
│  │  Scheduler (Simulation capteurs)                 │  │
│  │  Email Service                                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│                  DATA LAYER                             │
│         SQLite + SQLAlchemy ORM                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Users | Sensors | Readings | Alerts | Logs    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔙 Architecture Backend

### Stack Technique

```
Flask 3.0
├── Flask-CORS (gestion des requêtes cross-origin)
├── Flask-JWT-Extended (authentification JWT)
├── Flask-SQLAlchemy (ORM base de données)
├── Flask-SocketIO (communication temps réel WebSocket)
├── python-dotenv (gestion des variables d'environnement)
├── APScheduler (tâches planifiées)
├── Bcrypt (hachage mot de passe)
├── Marshmallow (validation des données)
└── SQLite (base de données)
```

### Structures de Fichiers

```
backend/
├── app.py                  # Point d'entrée Flask
├── config.py              # Configuration de l'app
├── database.py            # Modèles ORM/Schémas
├── email_service.py       # Service d'emails
├── audit_logger.py        # Logging d'audit
├── validators.py          # Validateurs personnalisés
├── scheduler.py           # Scheduler APScheduler
├── requirements.txt       # Dépendances Python
│
├── routes/               # Endpoints API
│   ├── auth.py          # Authentification
│   ├── sensors.py       # Gestion capteurs
│   ├── readings.py      # Données capteurs
│   ├── alerts.py        # Gestion alertes
│   ├── reports.py       # Génération rapports
│   ├── users.py         # Gestion utilisateurs
│   └── __init__.py
│
├── instance/            # Configuration spécifique instance
│   └── config.py        # Config locale (production)
│
└── logs/               # Fichiers de log
    └── aerium.log
```

### Modèles de Base de Données

#### Utilisateurs (users)
```python
class User:
    id: int (PK)
    email: str (unique)
    password_hash: str (bcrypt)
    full_name: str
    role: enum (admin, user, guest)
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

#### Capteurs (sensors)
```python
class Sensor:
    id: int (PK)
    user_id: int (FK)
    name: str
    location: str
    sensor_type: enum (CO2, TEMPERATURE, HUMIDITY, MULTI, CUSTOM)
    external_id: str (optional)
    is_active: bool
    last_reading_at: datetime
    created_at: datetime
    updated_at: datetime
```

#### Lectures (sensor_readings)
```python
class SensorReading:
    id: int (PK)
    sensor_id: int (FK)
    co2_level: float (0-5000 ppm)
    temperature: float (-50 à +100°C)
    humidity: float (0-100%)
    timestamp: datetime
    created_at: datetime
```

#### Alertes (alerts)
```python
class Alert:
    id: int (PK)
    sensor_id: int (FK)
    alert_type: enum (CO2, TEMPERATURE, HUMIDITY)
    threshold: float
    is_active: bool
    last_triggered: datetime
    created_at: datetime
```

#### Historique d'Alertes (alert_history)
```python
class AlertHistory:
    id: int (PK)
    sensor_id: int (FK)
    user_id: int (FK)
    alert_type: enum
    value: float
    threshold: float
    is_acknowledged: bool
    acknowledged_at: datetime
    is_resolved: bool
    resolved_at: datetime
    created_at: datetime
```

#### Journal d'Audit (audit_log)
```python
class AuditLog:
    id: int (PK)
    user_id: int (FK)
    action: str (CREATE_SENSOR, UPDATE_SENSOR, etc.)
    resource_type: str (SENSOR, READING, ALERT, etc.)
    resource_id: int
    details: json (données complètes de l'action)
    ip_address: str
    created_at: datetime
```

### Flow d'Authentification

```
1. Inscription/Connexion
   ├─ POST /api/auth/register
   └─ POST /api/auth/login
        ├─ Valider identifiants
        ├─ Vérifier mot de passe (bcrypt)
        ├─ Générer tokens JWT (access + refresh)
        └─ Retourner tokens au client

2. Requête Authentifiée
   ├─ Client envoie Authorization: Bearer {token}
   ├─ Backend vérifie token avec @jwt_required()
   ├─ Décoder claims du JWT
   └─ Continuer la requête

3. Renouvellement du Token
   ├─ POST /api/auth/refresh
   ├─ Valider refresh token
   ├─ Générer nouveau access token
   └─ Retourner nouveau token
```

### Flow des Données en Temps Réel

```
Backend Schedule (APScheduler)
  └─ Toutes les 5 secondes
     ├─ Générer données simulées OU lire capteur réel
     ├─ Créer SensorReading
     ├─ Vérifier seuils d'alertes
     ├─ Émettre via WebSocket: "new_reading"
     └─ Émettre via WebSocket: "alert_triggered" (si dépassement)

Client Frontend
  ├─ Socket.IO connect() au backend
  ├─ Écouter: socket.on("new_reading")
  ├─ Écouter: socket.on("alert_triggered")
  └─ Mettre à jour UI en temps réel
```

---

## 🎨 Architecture Frontend

### Stack Technique

```
React 18 + TypeScript
├── Vite (build tool)
├── React Router v6 (navigation)
├── TanStack Query (gestion état données)
├── Axios (client HTTP)
├── Socket.IO Client (WebSocket)
├── Recharts (graphiques)
├── Tailwind CSS (styling)
├── shadcn/ui (composants)
├── Framer Motion (animations)
└── Zod (validation)
```

### Structure des Fichiers

```
src/
├── main.tsx               # Point d'entrée
├── App.tsx               # Composant racine
├── index.css             # Styles globaux
│
├── components/           # Composants réutilisables
│   ├── ui/              # Composants shadcn/ui
│   ├── layout/          # Layout (Sidebar, TopBar, etc.)
│   ├── dashboard/       # Composants dashboard
│   ├── sensors/         # Composants capteurs
│   └── widgets/         # Widgets personnalisés
│
├── pages/               # Pages/Routes
│   ├── Dashboard.tsx
│   ├── Sensors.tsx
│   ├── Alerts.tsx
│   ├── Analytics.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   ├── Admin.tsx
│   └── Auth.tsx
│
├── contexts/            # Context API
│   ├── AuthContext.tsx
│   ├── SettingsContext.tsx
│   └── WebSocketContext.tsx
│
├── hooks/               # Custom Hooks
│   ├── useAuth.ts
│   ├── useSensors.ts
│   ├── useTheme.ts
│   └── use-mobile.tsx
│
├── lib/                 # Utilitaires
│   ├── apiClient.ts    # Configuration Axios
│   ├── utils.ts        # Fonctions utilitaires
│   ├── sensorData.ts   # Logique métier capteurs
│   └── exportUtils.ts  # Export CSV/PDF
│
└── test/               # Tests
    └── example.test.ts
```

### Architecture Composants

```
App
├── AuthContext (wrapper)
├── Router
│   ├── Layout
│   │   ├── Sidebar
│   │   ├── TopBar
│   │   └── Route Content
│   │       ├── Dashboard
│   │       │   ├── AirQualityGauge
│   │       │   ├── SensorCard (list)
│   │       │   ├── AlertCard (list)
│   │       │   └── TrendChart
│   │       ├── Sensors
│   │       ├── Alerts
│   │       ├── Analytics
│   │       ├── Reports
│   │       └── Settings
```

### Communication Client-Serveur

```
REST API (TanStack Query)
├─ GET /api/sensors
├─ POST /api/sensors
├─ PUT /api/sensors/:id
├─ DELETE /api/sensors/:id
├─ GET /api/readings/sensor/:id
├─ POST /api/readings
├─ GET /api/alerts
├─ PUT /api/alerts/history/acknowledge/:id
└─ GET /api/reports/:type/:id

WebSocket (Socket.IO)
├─ new_reading: Nouvelle lecture
├─ alert_triggered: Alerte déclenchée
├─ sensor_connected: Capteur connecté
├─ sensor_disconnected: Capteur déconnecté
└─ connection/disconnect: État connexion
```

### Gestion de l'État

```
TanStack Query (données serveur)
├─ Caching automatique
├─ Invalidation intelligente
├─ Retry automatique
└─ Synchronisation données

Context API (état local)
├─ AuthContext: infos utilisateur
├─ SettingsContext: préférences
└─ WebSocketContext: état connexion

Hooks personnalisés
├─ useAuth(): authentification
├─ useSensors(): gestion capteurs
├─ useTheme(): thème UI
└─ use-mobile(): détection mobile
```

---

## 🔐 Sécurité

### Authentification & Autorisation

```
┌─────────────────────────────────────────────┐
│  Frontend - Stockage Sécurisé              │
│  ├─ Access Token (localStorage)            │
│  ├─ Refresh Token (httpOnly cookie)        │
│  └─ User Info (Context)                    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Request - Headers                         │
│  └─ Authorization: Bearer {access_token}  │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Backend - Validation                      │
│  ├─ @jwt_required()                        │
│  ├─ Valider signature token                │
│  ├─ Vérifier expiration                    │
│  ├─ Extraire user_id                       │
│  └─ Vérifier permissions (role)            │
└──────────────┬──────────────────────────────┘
               │
               ▼ OK
          Exécuter requête
```

### Mécanismes de Protection

1. **JWT (JSON Web Tokens)**
   - Access token: 15 min
   - Refresh token: 7 jours
   - Signature HS256

2. **Hachage de Mots de Passe**
   - Algorithme: bcrypt
   - Coût: 12 rounds
   - Salt: généré automatiquement

3. **Contrôle d'Accès Basé sur les Rôles (RBAC)**
   - Admin: accès complet
   - User: accès ses propres données
   - Guest: accès lecture seule

4. **Rate Limiting**
   - 200 requêtes/jour
   - 50 requêtes/heure
   - 10 requêtes/minute

5. **CORS Protection**
   - Whitelist d'origines
   - Validation headers
   - Preflight requests

6. **Input Validation**
   - Marshmallow schemas
   - Type checking
   - Range validation

---

## 📊 Flux de Données

### Créer un Nouveau Capteur

```
Frontend:
1. Utilisateur remplit formulaire AddSensorDialog
2. onClick "Créer"
3. POST /api/sensors {name, location, type}
4. Avec header Authorization: Bearer {token}

Backend:
1. Route POST /api/sensors
2. Décoder JWT, récupérer user_id
3. Valider données avec Marshmallow schema
4. Créer Sensor instance
5. db.session.add() + db.session.commit()
6. Log dans audit_log
7. Émettre WebSocket: "sensor_created"
8. Retourner 201 + données capteur

Frontend:
1. TanStack Query invalide cache
2. Recharger liste capteurs
3. Afficher toast succès
4. Mettre à jour UI
```

### Recevoir une Lecture Temps Réel

```
Backend Scheduler (toutes les 5s):
1. Parcourir tous les capteurs actifs
2. Générer OU lire données
3. Créer SensorReading
4. Vérifier seuils (CO2 > 1200?)
5. Si alerte: créer AlertHistory + envoyer email
6. Émettre WebSocket: "new_reading"
   {sensor_id, co2, temp, humidity, timestamp}
7. Si alerte: émettre "alert_triggered"
   {sensor_id, type, value, threshold}

Frontend Socket.IO Client:
1. socket.on("new_reading", (data) => {})
   ├─ Mettre à jour graphique
   ├─ Mettre à jour carte capteur
   └─ Mettre à jour jauge
   
2. socket.on("alert_triggered", (data) => {})
   ├─ Afficher notification toast
   ├─ Jouer son alerte
   ├─ Ajouter à historique alertes
   └─ Mettre à jour couleur capteur
```

---

## 🚀 Performance

### Optimisations Implémentées

1. **Lazy Loading**
   - Routes React Router chargées à la demande
   - Code splitting automatique

2. **Caching**
   - Cache en mémoire (5 min TTL)
   - Cache navigateur (HTTP headers)
   - TanStack Query caching

3. **Compression**
   - Gzip compression (backend)
   - Minification assets (frontend)

4. **Pagination**
   - Limite résultats API
   - Récupération incrémentale

5. **Virtualisation**
   - Tables longues virtualisées
   - Améliore performance scrolling

### Métriques de Performance

| Opération | Temps |
|-----------|-------|
| Charger dashboard | ~2-3s |
| Charger capteurs | ~500ms |
| Créer capteur | ~1s |
| Recevoir alerte (WebSocket) | <100ms |
| Export CSV | ~2-5s |

---

## 🔄 Déploiement

### Étapes Déploiement Production

```
1. Build Frontend
   ├─ npm run build
   ├─ Vite bundling
   └─ Output: dist/

2. Build Backend
   ├─ pip install -r requirements.txt
   ├─ Vérifier config .env
   └─ Prêt à lancer

3. Lancer Services
   ├─ Backend: gunicorn app:app
   ├─ Frontend: servir dist/ via nginx
   └─ Vérifier health endpoint

4. Post-Deploy
   ├─ Vérifier logs
   ├─ Tester endpoints
   ├─ Vérifier WebSocket
   └─ Monitorer performance
```

### Configuration Production

```
.env:
├─ SECRET_KEY: généré sécure
├─ JWT_SECRET_KEY: généré sécure
├─ FLASK_ENV: production
├─ DEBUG: False
├─ DATABASE_URL: production DB
├─ MAIL_SERVER: production SMTP
├─ FRONTEND_URL: domaine production
└─ LOG_LEVEL: INFO ou WARNING
```

---

## 📞 Support & Troubleshooting

Voir [TROUBLESHOOTING.md](TROUBLESHOOTING.md) pour les problèmes courants.

### Questions Fréquentes Arch

**Q: Pourquoi Flask et pas Django?**
A: Flask est plus léger et flexible, idéal pour une API REST.

**Q: Pourquoi SQLite et pas PostgreSQL?**
A: SQLite suffit pour la majorité des cas. PostgreSQL pour haute charge.

**Q: Pourquoi WebSocket?**
A: Pour mises à jour temps réel sans polling constant.

**Q: Comment scale l'app?**
A: Voir section Déploiement et guide déploiement.

---

**Dernière mise à jour:** février 2026
