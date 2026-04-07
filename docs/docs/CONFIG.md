# ⚙️ Guide de Configuration

Guide complet des options de configuration d'Aerium.

## 🔧 Variables d'Environnement Backend

Créez un fichier `.env` à la racine du backend:

```bash
# Backend Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False

# Database
DATABASE_URL=sqlite:///instance/aerium.db

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/aerium.log

# Rate Limiting
RATELIMIT_ENABLED=True
RATELIMIT_DEFAULT=100 per hour

# Alert Thresholds
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
```

### Explication des Variables

| Variable | Défaut | Description |
|----------|--------|-------------|
| `FLASK_ENV` | production | Mode développement/production |
| `FLASK_DEBUG` | False | Activer débogage (JAMAIS en production) |
| `DATABASE_URL` | sqlite:///instance/aerium.db | URI de la base de données |
| `CORS_ORIGINS` | localhost:5173 | Domaines autorisés CORS |
| `LOG_LEVEL` | INFO | Niveau de logs (DEBUG/INFO/WARNING/ERROR) |
| `RATELIMIT_ENABLED` | True | Activer limitation de débit |

---

## 🎨 Variables d'Environnement Frontend

Créez un fichier `.env.local` à la racine du frontend:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000

# Features
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true

# Build
VITE_APP_TITLE=Aerium Air Quality Dashboard
```

### Explication des Variables

| Variable | Défaut | Description |
|----------|--------|-------------|
| `VITE_API_URL` | http://localhost:5000 | URL de l'API backend |
| `VITE_API_TIMEOUT` | 30000 | Timeout des requêtes (ms) |
| `VITE_ENABLE_WEBSOCKET` | true | Activer WebSocket pour live updates |
| `VITE_ENABLE_ANALYTICS` | false | Activer l'analytique |
| `VITE_ENABLE_NOTIFICATIONS` | true | Activer notifications |

---

## 🛡️ Configuration de Sécurité

### En Développement

```bash
# .env.development
SECRET_KEY=dev-key-not-secure
FLASK_DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173
JWT_ACCESS_TOKEN_EXPIRES=86400  # 24h pour dev
```

### En Production

```bash
# .env.production
SECRET_KEY=<generate-secure-random-key>
FLASK_ENV=production
FLASK_DEBUG=False
CORS_ORIGINS=https://yourdomain.com

# Generate with:
# python -c "import secrets; print(secrets.token_hex(32))"
```

### Génération de Clés Sécurisées

```bash
# Backend
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

---

## 📊 Configuration de la Base de Données

### SQLite (Par défaut)

```python
# backend/config.py
SQLALCHEMY_DATABASE_URI = 'sqlite:///instance/aerium.db'
SQLALCHEMY_TRACK_MODIFICATIONS = False
```

### PostgreSQL

```python
# Installez d'abord:
# pip install psycopg2-binary

# backend/config.py
SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@localhost:5432/aerium'
```

### MySQL

```python
# Installez d'abord:
# pip install mysql-connector-python

# backend/config.py
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://user:password@localhost:3306/aerium'
```

---

## 🔐 Configuration JWT

### Durées d'Expiration

```python
# backend/config.py

# Accès (court terme)
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

# Rafraîchissement (long terme)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
```

### Algorithme

```python
JWT_ALGORITHM = 'HS256'  # HMAC-SHA256 (par défaut)
```

---

## 🚦 Configuration Rate Limiting

### Limites par Défaut

```python
# backend/app.py

# Limite globale: 100 requêtes par heure
limiter = Limiter(app=app, key_func=rate_limit_key)

# Routes spécifiques:
@limiter.limit("5 per minute")  # 5 par minute
def login():
    ...

@limiter.limit("100 per hour")  # 100 par heure
def get_data():
    ...
```

### Personnalisation

```bash
# .env
RATELIMIT_DEFAULT=100 per hour
RATELIMIT_LOGIN=5 per minute
RATELIMIT_API=100 per hour
```

---

## 🎯 Configuration des Seuils d'Alerte

### Niveaux CO2

```python
# backend/config.py
CO2_THRESHOLDS = {
    'good': (0, 800),        # ppm
    'moderate': (800, 1000),
    'poor': (1000, 1200),
    'very_poor': (1200, float('inf'))
}

ALERT_LEVELS = {
    'info': 800,
    'warning': 1000,
    'critical': 1200
}
```

### Température et Humidité

```python
TEMP_THRESHOLDS = {
    'min': 15,  # °C
    'max': 28
}

HUMIDITY_THRESHOLDS = {
    'min': 30,  # %
    'max': 70
}
```

---

## 🎨 Configuration Theme Frontend

### Fichier de Thème

```typescript
// src/components/ui/theme.ts
export const theme = {
  colors: {
    primary: '#3B82F6',      // Bleu
    success: '#10B981',      // Vert
    warning: '#F59E0B',      // Ambre
    danger: '#EF4444',       // Rouge
    neutral: '#6B7280'       // Gris
  },
  
  chart: {
    co2: '#8B5CF6',
    temperature: '#F59E0B',
    humidity: '#3B82F6',
    particulates: '#10B981'
  }
}
```

---

## 🏗️ Configuration de Build

### Vite (Frontend)

```typescript
// vite.config.ts
export default {
  // Mode développement
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  // Optimisation de build
  build: {
    outDir: 'dist',
    sourcemap: false,  // Désactiver en production
    minify: 'terser'
  }
}
```

### Flask (Backend)

```python
# backend/app.py
app = create_app(
    config_name='production',  # production/development/testing
    enable_cors=True,
    enable_limiter=True
)
```

---

## 📦 Configuration des Dépendances

### Frontend

```json
// package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "framer-motion": "^10.12.0",
    "recharts": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.3.0",
    "eslint": "^8.40.0"
  }
}
```

### Backend

```txt
# requirements.txt
Flask==2.3.0
Flask-SQLAlchemy==3.0.0
Flask-JWT-Extended==4.4.0
Flask-CORS==3.0.0
Flask-Limiter==3.3.0
python-dotenv==1.0.0
```

---

## 🔧 Plugins et Extensions

### Backend Plugins

```python
# Ajouter des plugins dans backend/app.py:

from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

from flask_compress import Compress
Compress(app)
```

### Frontend Extensions

```typescript
// Ajouter des dépendances:
npm install framer-motion@latest
npm install zustand  // State management
npm install react-query  // Data fetching
```

---

## 🐳 Configuration Docker

```dockerfile
# Dockerfile.backend
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

ENV FLASK_APP=app.py
ENV FLASK_ENV=production
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## ✅ Checklist Configuration Production

- [ ] Générer `SECRET_KEY` et `JWT_SECRET_KEY` sécurisés
- [ ] Configurer CORS pour le domaine en production
- [ ] Activer HTTPS/SSL
- [ ] Configurer base de données production (PostgreSQL)
- [ ] Configurer service email (SendGrid/Gmail)
- [ ] Activer logs
- [ ] Désactiver FLASK_DEBUG
- [ ] Configurer rate limiting
- [ ] Activer compression
- [ ] Configurer backups base de données
- [ ] Configurer monitoring/alertes
- [ ] Tester tous les scénarios d'alerte

---

## 📞 Besoin d'Aide?

- 📖 [Installation](INSTALLATION.md)
- 📖 [Utilisation](USAGE.md)
- 🏗️ [Architecture](guides/ARCHITECTURE.md)
- 🔌 [API](guides/API_REFERENCE.md)
- 🐛 [Dépannage](guides/TROUBLESHOOTING.md)
