# 🌍 Aerium - Tableau de Bord Qualité de l'Air

Système complet de surveillance de la qualité de l'air en temps réel avec une interface React moderne et un backend Flask robuste.

## 🎯 Fonctionnalités Principales

### Surveillance en Temps Réel
- 📊 Suivi des niveaux de CO2, température et humidité
- 🔄 Mises à jour en direct via WebSocket
- 📈 Graphiques et analytics détaillés
- 🎨 Dashboard intuitif et responsive

### Alertes Intelligentes
-  Seuils d'alerte configurables
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

---

## 📚 Documentation Complète

**Toute la documentation est dans le dossier [`docs/`](docs/README.md)**

### 🚀 Démarrage Rapide

👉 **[Accéder à la documentation](docs/README.md)** pour:
- Installation en 5 minutes
- Guides d'utilisation
- Référence API complète
- Guide de déploiement
- Dépannage

### 🇫🇷 Documentation en Français

1. **[README Français](docs/fr/README.md)** - Vue d'ensemble complète
2. **[Guide Rapide](docs/fr/QUICKSTART.md)** - Installation et endpoints (5 min)
3. **[Fonctionnalités](docs/fr/FEATURES.md)** - Documentation des 8 fonctionnalités
4. **[Index Complet](docs/README.md)** - Tous les guides

### 📋 Guides d'Implementation

- **[Architecture Système](docs/guides/ARCHITECTURE.md)** - Design technique complet
- **[Référence API](docs/guides/API_REFERENCE.md)** - Documentation de tous les endpoints
- **[Déploiement Production](docs/guides/DEPLOYMENT.md)** - Setup serveur complet
- **[Dépannage](docs/guides/TROUBLESHOOTING.md)** - Solutions aux problèmes courants
- **[Contribution](docs/guides/CONTRIBUTING.md)** - Guide de contribution

---

## ⚡ Démarrage en 5 Minutes

### 1. Cloner le Projet
```bash
git clone <repository-url>
cd air-sense-dashboard
```

### 2. Backend (Flask)
```bash
# Depuis site/
cp .env.example .env

cd backend
pip install -r requirements.txt
cp .env.example .env
python seed_database.py   # Charger données démo
python app.py             # Démarrer serveur
# http://localhost:5000
```

Important:
- Le fichier `site/.env` est pour le frontend (variables `VITE_*` uniquement).
- Le fichier `site/backend/.env` est pour le backend Flask (secrets, JWT, Mistral).
- La clé `MISTRAL_API_KEY` doit être dans `site/backend/.env`.

Voir aussi: `docs/CONFIG.md`.

### 3. Frontend (React)
```bash
npm install
npm run dev
# http://localhost:5173
```

### 4. Accéder à l'Application

| Ressource | URL |
|-----------|-----|
| **Dashboard** | http://localhost:5173 |
| **API Backend** | http://localhost:5000/api |
| **Documentation API** | http://localhost:5000/api/docs |

### 5. Comptes de Démo

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| demo@aerium.app | demo123 | Utilisateur |
| admin@aerium.app | admin123 | Administrateur |

---

## 🏗️ Architecture

### Stack Technique

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- TailwindCSS + shadcn/ui
- Socket.IO (WebSocket temps réel)
- TanStack Query (gestion d'état)

**Backend:**
- Flask 3.0 (framework web)
- SQLAlchemy (ORM)
- SQLite (base de données)
- Flask-JWT-Extended (authentification)
- Flask-SocketIO (WebSocket)

### Structure du Projet

```
air-sense-dashboard/
├── docs/                      # 📚 Documentation Complète
│   ├── README.md             # Index et navigation
│   ├── fr/                   # Documentation Française
│   ├── en/                   # Documentation Anglaise
│   └── guides/               # Guides techniques
│
├── backend/                   # 🔙 API Flask
│   ├── routes/               # Endpoints API
│   ├── app.py               # Application
│   └── requirements.txt      # Dépendances Python
│
├── src/                      # 🎨 Frontend React
│   ├── components/          # Composants
│   ├── pages/              # Pages/Routes
│   └── App.tsx             # Application principale
│
└── package.json             # Config Node.js
```

---

## 🔐 Sécurité

- ✅ Authentification JWT avec tokens Bearer
- ✅ Hachage des mots de passe avec bcrypt (12 rounds)
- ✅ Contrôle d'accès basé sur les rôles
- ✅ Protection Rate Limiting (200/jour, 50/heure, 10/min)
- ✅ Piste d'audit complète
- ✅ Validation stricte des inputs
- ✅ Protection CORS

---

## 🌟 8 Fonctionnalités Avancées

| # | Fonctionnalité | Description |
|---|---|---|
| 1️⃣ | Rate Limiting | Protection contre les abus |
| 2️⃣ | Logging Complet | Tous les événements enregistrés |
| 3️⃣ | Piste d'Audit | Traçabilité complète des actions |
| 4️⃣ | Recherche Avancée | Filtrage multi-critères |
| 5️⃣ | Validation Données | Vérification stricte serveur |
| 6️⃣ | Mise en Cache | Performance optimisée |
| 7️⃣ | Documentation API | Swagger/OpenAPI interactive |
| 8️⃣ | Alertes Avancées | Seuils configurables avec historique |

Voir **[Fonctionnalités](docs/fr/FEATURES.md)** pour détails complets.

---

## 📊 Endpoints API Principaux

### Authentification
```
POST   /api/auth/register      # Créer un compte
POST   /api/auth/login         # Se connecter
POST   /api/auth/refresh       # Rafraîchir token
```

### Capteurs
```
GET    /api/sensors            # Lister les capteurs
POST   /api/sensors            # Créer capteur
GET    /api/sensors/<id>       # Détails
PUT    /api/sensors/<id>       # Modifier
DELETE /api/sensors/<id>       # Supprimer
```

### Alertes
```
GET    /api/alerts                              # Lister alertes
GET    /api/alerts/history/list                # Historique
PUT    /api/alerts/history/acknowledge/<id>    # Reconnaître
PUT    /api/alerts/history/resolve/<id>        # Résoudre
```

### Rapports
```
GET    /api/reports/daily/<id>         # Rapport jour
GET    /api/reports/weekly/<id>        # Rapport semaine
GET    /api/reports/monthly/<id>       # Rapport mois
GET    /api/reports/export             # Exporter données
```

Voir **[Référence API Complète](docs/guides/API_REFERENCE.md)** pour tous les endpoints.

---

## 🚀 Déploiement Production

### Étapes Rapides

1. **Builder le frontend** (`npm run build`)
2. **Lancer avec Gunicorn** (serveur WSGI)
3. **Configurer Nginx** (proxy inverse + SSL)
4. **Configurer la base de données** (initialiser SQLite)
5. **Tester les endpoints** (vérifier les routes API)

Voir **[Guide Déploiement Complet](docs/guides/DEPLOYMENT.md)** pour instructions détaillées.

---

## 🐛 Dépannage

**Besoin d'aide?** Consulter le **[Guide de Dépannage](docs/guides/TROUBLESHOOTING.md)** qui couvre:
- Erreurs courantes et solutions
- Configuration problématique
- Problèmes de déploiement
- Logs et debugging

---

## 📈 Statistiques du Projet

- ✅ **3 Rôles**: Admin, User, Guest
- ✅ **7+ Routes API**: Auth, Sensors, Readings, Alerts, Reports, Users, Health
- ✅ **14+ Pages Frontend**: Dashboard, Analytics, Sensors, Alerts, Settings, etc.
- ✅ **WebSocket Real-time**: Socket.IO pour mises à jour temps réel
- ✅ **Data Export**: CSV et PDF
- ✅ **Production Ready**: 2000+ lignes de code, 8 fonctionnalités avancées

---

## 📄 Fichiers Importants

- `.env.example` - Modèle frontend (`VITE_*`)
- `backend/.env.example` - Modèle backend (secrets + IA)
- `backend/config.py` - Configuration Python
- `backend/requirements.txt` - Dépendances Python
- `package.json` - Dépendances Node.js
- `vite.config.ts` - Configuration Vite
- `[docs/README.md](docs/README.md)` - Documentation complète

---

## 📋 Fichiers de Configuration

### `site/.env.example` (Frontend)
```env
# Copier en site/.env
VITE_API_URL=http://localhost:5000/api
VITE_FLASK_ENABLED=true
```

### `site/backend/.env.example` (Backend)
```env
# Copier en site/backend/.env et adapter

SECRET_KEY=...
JWT_SECRET_KEY=...
MISTRAL_API_KEY=...
MISTRAL_MODEL=mistral-small-latest
MISTRAL_MAX_TOKENS=700
ENABLE_PROPHET=False
ENABLE_RATE_LIMITING=True
FRONTEND_URL=http://localhost:5173
```

Voir `site/.env.example` et `site/backend/.env.example` pour toutes les options disponibles.

---

## 📊 Monitoring & Logs

### Logs Backend
```bash
tail -f backend/logs/aerium.log
grep ERROR backend/logs/aerium.log
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Database
```bash
cd backend
sqlite3 instance/aerium.db ".tables"
```

---

## 🎓 Premiers Pas Recommandés

1. ✅ Lire ce README
2. ✅ Consulter [Démarrage Rapide](#-démarrage-en-5-minutes)
3. ✅ Installer backend et frontend
4. ✅ Se connecter avec demo@aerium.app
5. ✅ Créer un capteur
6. ✅ Consulter la [Documentation Complète](docs/README.md)

---

## ✨ À Venir

Améliorations futures:
- [ ] Application mobile (iOS/Android)
- [ ] Notifications Slack/Discord
- [ ] Machine Learning pour anomalies
- [ ] GraphQL endpoint
- [ ] Redis cache
- [ ] Support multilingue
- [ ] Webhooks 3e parties


---

## 🔗 Lien Rapide

👉 **[Accéder à toute la documentation →](docs/README.md)**
