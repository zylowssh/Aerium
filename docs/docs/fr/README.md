# 🌍 Aerium - Tableau de Bord Qualité de l'Air

Système complet de surveillance de la qualité de l'air en temps réel avec une interface React moderne et un backend Flask robuste.

## 🎯 Fonctionnalités Principales

### Surveillance en Temps Réel
- 📊 Suivi des niveaux de CO2, température et humidité
- 🔄 Mises à jour en direct via WebSocket
- 📈 Graphiques et analytics détaillés
- 🎨 Dashboard intuitif et responsive

### Alertes Intelligentes
- 📧 Notifications par email automatiques
- 🚨 Seuils d'alerte configurables
- 📝 Historique complet des alertes
- 🔔 Reconnaissance et résolution d'alertes

### Gestion des Capteurs
- ➕ Ajouter et gérer plusieurs capteurs
- 🔍 Recherche et filtrage avancés
- 📍 Localisation des capteurs
- 🔄 Support des capteurs externes

### Analyse et Rapports
- 📊 Rapports quotidiens/hebdomadaires/mensuels
- 📥 Export de données en CSV
- 📈 Statistiques détaillées
- 🎯 Insights de qualité de l'air

### Sécurité et Audit
- 🔐 Authentification JWT
- 👤 Contrôle d'accès basé sur les rôles
- 📝 Piste d'audit complète
- 🛡️ Protection contre les abus (rate limiting)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Python 3.9+
- pip (gestionnaire de paquets Python)

### Installation en 5 minutes

1. **Cloner le projet**
```bash
git clone <repo-url>
cd air-sense-dashboard
```

2. **Configurer le backend**
```bash
# Depuis site-v2/
cp .env.example .env

cd backend
pip install -r requirements.txt
cp .env.example .env
python seed_database.py
```

3. **Configurer le frontend**
```bash
npm install
```

4. **Démarrer les serveurs**

Terminal 1:
```bash
cd backend
python app.py  # http://localhost:5000
```

Terminal 2:
```bash
npm run dev  # http://localhost:5173
```

### Comptes de Démonstration

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| demo@aerium.app | demo123 | Utilisateur |
| admin@aerium.app | admin123 | Administrateur |

## 📚 Documentation

### 👤 Pour les Utilisateurs
1. **[QUICKSTART.md](QUICKSTART.md)** - Guide de démarrage rapide
2. **[Dashboard](https://localhost:5173)** - Interface principale

### 💻 Pour les Développeurs
1. **[QUICKSTART.md](QUICKSTART.md)** - Installation et endpoints principaux
2. **[FEATURES.md](FEATURES.md)** - Toutes les 8 fonctionnalités détaillées
3. **[../guides/ARCHITECTURE.md](../guides/ARCHITECTURE.md)** - Architecture système
4. **[../guides/API_REFERENCE.md](../guides/API_REFERENCE.md)** - Tous les endpoints

### 🔧 Pour l'Infrastructure
1. **[../guides/DEPLOYMENT.md](../guides/DEPLOYMENT.md)** - Déploiement production
2. **[../guides/TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md)** - Dépannage
3. **[../guides/ARCHITECTURE.md](../guides/ARCHITECTURE.md)** - Architecture

### 🤝 Pour Contribuer
1. **[../guides/CONTRIBUTING.md](../guides/CONTRIBUTING.md)** - Guide de contribution
2. Voir [GitHub Issues](https://github.com/your-repo/issues)

## 📋 Architecture

### Structure du Projet

```
air-sense-dashboard/
├── docs/                      # 📚 Documentation
│   ├── guides/               # Guides d'implementation
│   │   ├── ARCHITECTURE.md   # Architecture système
│   │   ├── API_REFERENCE.md  # Référence API complète
│   │   ├── DEPLOYMENT.md     # Déploiement production
│   │   ├── TROUBLESHOOTING.md# Dépannage
│   │   └── CONTRIBUTING.md   # Guide de contribution
│   ├── fr/                   # Documentation Française
│   │   ├── README.md         # Ce fichier
│   │   ├── QUICKSTART.md     # Guide rapide
│   │   └── FEATURES.md       # Fonctionnalités
│   └── en/                   # Documentation Anglaise
│
├── backend/                   # 🔙 API Flask
│   ├── routes/               # Endpoints API
│   ├── app.py               # Application principale
│   ├── database.py          # Modèles de données
│   ├── config.py            # Configuration
│   ├── email_service.py     # Service d'email
│   ├── validators.py        # Validation
│   ├── audit_logger.py      # Audit trail
│   └── requirements.txt      # Dépendances
│
├── src/                      # 🎨 Frontend React
│   ├── components/          # Composants React
│   ├── pages/              # Pages
│   ├── hooks/              # Hooks personnalisés
│   ├── lib/                # Utilitaires
│   └── App.tsx             # Application principale
│
└── package.json             # Config Node.js
```

### Stack Technique

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- TailwindCSS (styles)
- shadcn/ui (composants)
- Socket.io (WebSocket temps réel)
- TanStack Query (gestion d'état)

**Backend:**
- Flask 3.0 (framework web)
- SQLAlchemy (ORM)
- SQLite (base de données)
- Flask-JWT-Extended (authentification)
- Flask-SocketIO (WebSocket)
- Bcrypt (hachage mots de passe)
- Flask-Mail (emails)

## 🔐 Sécurité

- ✅ Authentification JWT avec tokens Bearer
- ✅ Hachage des mots de passe avec bcrypt (12 rounds)
- ✅ Contrôle d'accès basé sur les rôles (Admin/Utilisateur/Guest)
- ✅ Protection contre les abus (Rate Limiting: 200/jour, 50/heure, 10/min)
- ✅ Piste d'audit complète (toutes les actions enregistrées)
- ✅ Validation de tous les inputs
- ✅ Protection CORS configurée
- ✅ Logging sécurisé (pas de données sensibles)

## 🌟 8 Fonctionnalités Avancées

| # | Fonctionnalité | Description |
|---|---|---|
| 1️⃣ | **Notifications Email** | Alertes automatiques par email quand seuils dépassés |
| 2️⃣ | **Rate Limiting** | Protection contre les abus (configurable) |
| 3️⃣ | **Logging Complet** | Tous les événements enregistrés avec rotation |
| 4️⃣ | **Piste d'Audit** | Traçabilité complète des actions utilisateurs |
| 5️⃣ | **Recherche Avancée** | Filtrage multi-critères haute performance |
| 6️⃣ | **Validation des Données** | Vérification stricte côté serveur |
| 7️⃣ | **Mise en Cache** | Performance optimisée (réduction ~60% requêtes) |
| 8️⃣ | **Documentation API** | Swagger/OpenAPI à `/api/docs` |

Voir [FEATURES.md](FEATURES.md) pour la documentation complète.

## 📊 Endpoints API Principaux

### Authentification
```
POST   /api/auth/register      # Créer un compte
POST   /api/auth/login         # Se connecter
POST   /api/auth/refresh       # Rafraîchir le token
GET    /api/auth/me            # Infos utilisateur
```

### Capteurs
```
GET    /api/sensors            # Lister les capteurs
POST   /api/sensors            # Créer un capteur
GET    /api/sensors/<id>       # Détails d'un capteur
PUT    /api/sensors/<id>       # Modifier un capteur
DELETE /api/sensors/<id>       # Supprimer un capteur
```

### Lectures
```
GET    /api/readings/sensor/<id>        # Lectures d'un capteur
POST   /api/readings                    # Ajouter une lecture
GET    /api/readings/latest/<id>        # Dernière lecture
GET    /api/readings/aggregate          # Statistiques
```

### Alertes
```
GET    /api/alerts                              # Lister les alertes
GET    /api/alerts/history/list                # Historique
GET    /api/alerts/history/stats               # Statistiques
PUT    /api/alerts/history/acknowledge/<id>    # Reconnaître
PUT    /api/alerts/history/resolve/<id>        # Résoudre
```

### Rapports
```
GET    /api/reports/daily/<id>         # Rapport journalier
GET    /api/reports/weekly/<id>        # Rapport hebdomadaire
GET    /api/reports/monthly/<id>       # Rapport mensuel
GET    /api/reports/export             # Exporter les données
```

Voir [../guides/API_REFERENCE.md](../guides/API_REFERENCE.md) pour la documentation complète.

## 🔧 Configuration

### Variables d'Environnement

Fichier `.env` dans `backend/`:

```env
# Sécurité
SECRET_KEY=votre-clé-secrète
JWT_SECRET_KEY=votre-clé-jwt-secrète

# Email
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app

# Seuils d'alerte
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
ALERT_HUMIDITY_THRESHOLD=80

# Rate Limiting
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/aerium.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=10

# Frontend
FRONTEND_URL=http://localhost:5173
```

Voir `.env.example` pour toutes les options.

## 🧪 Développement

### Démarrage en Mode Dev

```bash
# Backend (rechargement automatique)
cd backend
python app.py

# Frontend (Vite hot reload)
npm run dev
```

### Consulter la Santé de l'API

```bash
curl http://localhost:5000/api/health
```

### Vérifier les Logs

```bash
tail -f backend/logs/aerium.log
```

### Accéder à la Base de Données

```bash
cd backend
sqlite3 instance/aerium.db
.tables
SELECT * FROM user;
```

## 🐛 Dépannage

### Les emails ne sont pas envoyés
1. Vérifier `MAIL_USERNAME` et `MAIL_PASSWORD` dans `.env`
2. Pour Gmail: utiliser mot de passe d'application
3. Vérifier logs: `tail -f backend/logs/aerium.log`
4. Vérifier `ENABLE_EMAIL_NOTIFICATIONS=True`

Voir [../guides/TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md) pour plus.

### "Accès refusé" sur l'API
- Vérifier le token JWT dans les headers
- Format correct: `Authorization: Bearer <token>`
- Se reconnecter si token expiré

### Erreurs de base de données
```bash
rm backend/instance/aerium.db
cd backend && python app.py
python seed_database.py
```

Voir [../guides/TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md) pour plus d'aide.

## 🚀 Déploiement en Production

### Vue d'Ensemble

1. **Préparer les clés de sécurité** (clés fortes, aléatoires)
2. **Configurer l'email** (SMTP production)
3. **Builder le frontend** (`npm run build`)
4. **Lancer avec Gunicorn** (serveur WSGI production)
5. **Servir avec Nginx** (proxy inverse, SSL)

### Étapes Détaillées

Voir [../guides/DEPLOYMENT.md](../guides/DEPLOYMENT.md) pour instructions complètes.

### Quick Deploy

```bash
# Backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Frontend
npm run build
# Servir dist/ via Nginx + SSL
```

## 📞 Support

### Ressources

- **Documentation détaillée**: [FEATURES.md](FEATURES.md)
- **Guide de démarrage**: [QUICKSTART.md](QUICKSTART.md)
- **Référence API**: [../guides/API_REFERENCE.md](../guides/API_REFERENCE.md)
- **Dépannage**: [../guides/TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md)
- **API Interactive**: http://localhost:5000/api/docs

### Debugging

```bash
# Logs backend
tail -f backend/logs/aerium.log

# Console navigateur
F12 → Onglet Console

# Database
sqlite3 backend/instance/aerium.db ".schema"
```

## ✨ Prochaines Étapes

1. ✅ Consulter [QUICKSTART.md](QUICKSTART.md)
2. ✅ Démarrer backend et frontend
3. ✅ Se connecter avec demo@aerium.app
4. ✅ Créer un capteur
5. ✅ Configurer les alertes
6. ✅ Consulter [FEATURES.md](FEATURES.md) pour plus
7. ✅ Voir [../guides/ARCHITECTURE.md](../guides/ARCHITECTURE.md) pour détails système

## 🤝 Contribution

Les contributions sont bienvenues! Voir [../guides/CONTRIBUTING.md](../guides/CONTRIBUTING.md).

## 📜 Fichiers Importants

- `.env.example` - Modèle de configuration
- `backend/config.py` - Configuration Python
- `backend/requirements.txt` - Dépendances Python
- `package.json` - Dépendances Node.js
- `vite.config.ts` - Configuration Vite

## 📈 Statistiques du Projet

- ✅ **3 Rôles**: Admin, User, Guest
- ✅ **7 Routes API**: Auth, Sensors, Readings, Alerts, Reports, Users, Health
- ✅ **14+ Pages Frontend**: Dashboard, Analytics, Alerts, Sensors, Settings, etc.
- ✅ **WebSocket Real-time**: Socket.IO pour mises à jour temps réel
- ✅ **Data Export**: CSV et PDF
- ✅ **Multi-tenant ready**: Capteurs illimités par utilisateur
- ✅ **Production ready**: 2000+ lignes de code, 8 fonctionnalités avancées

---

**Créé avec ❤️ pour une meilleure surveillance de la qualité de l'air**

**Dernière mise à jour:** Février 2026  
**Statut:** Prêt pour la production ✅
