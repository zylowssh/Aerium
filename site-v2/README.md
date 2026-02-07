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
cd backend
pip install -r requirements.txt
cp ../.env.example .env
python seed_database.py   # Charger données démo
python app.py             # Démarrer serveur
# http://localhost:5000
```

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
| 1️⃣ | Notifications Email | Alertes automatiques par email |
| 2️⃣ | Rate Limiting | Protection contre les abus |
| 3️⃣ | Logging Complet | Tous les événements enregistrés |
| 4️⃣ | Piste d'Audit | Traçabilité complète des actions |
| 5️⃣ | Recherche Avancée | Filtrage multi-critères |
| 6️⃣ | Validation Données | Vérification stricte serveur |
| 7️⃣ | Mise en Cache | Performance optimisée |
| 8️⃣ | Documentation API | Swagger/OpenAPI interactive |

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

1. **Préparer les clés de sécurité** (clés aléatoires fortes)
2. **Configurer l'email** (SMTP production)
3. **Builder le frontend** (`npm run build`)
4. **Lancer avec Gunicorn** (serveur WSGI)
5. **Configurer Nginx** (proxy inverse + SSL)

Voir **[Guide Déploiement Complet](docs/guides/DEPLOYMENT.md)** pour instructions détaillées.

---

## 🐛 Dépannage

**Besoin d'aide?** Consulter le **[Guide de Dépannage](docs/guides/TROUBLESHOOTING.md)** qui couvre:
- Erreurs courantes et solutions
- Configuration problématique
- Problèmes de déploiement
- Logs et debugging

---

## 📞 Support

### Ressources

- 📚 **Documentation Complète**: [docs/README.md](docs/README.md)
- 🚀 **Guide Rapide**: [docs/fr/QUICKSTART.md](docs/fr/QUICKSTART.md)
- 📖 **Architecture**: [docs/guides/ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)
- 🔌 **API Référence**: [docs/guides/API_REFERENCE.md](docs/guides/API_REFERENCE.md)
- 🛠️ **Dépannage**: [docs/guides/TROUBLESHOOTING.md](docs/guides/TROUBLESHOOTING.md)

### Contacter

- 💬 Créer une issue GitHub
- 📧 Consulter la documentation
- 🔍 Vérifier les logs: `backend/logs/aerium.log`

---

## 🤝 Contribution

Les contributions sont bienvenues! Voir **[Guide de Contribution](docs/guides/CONTRIBUTING.md)** pour:
- Processus de contribution
- Conventions de code
- Types de contributions
- Pull request template

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

- `.env.example` - Modèle de configuration
- `backend/config.py` - Configuration Python
- `backend/requirements.txt` - Dépendances Python
- `package.json` - Dépendances Node.js
- `vite.config.ts` - Configuration Vite
- `[docs/README.md](docs/README.md)` - Documentation complète

---

## 📋 Fichiers de Configuration

### `.env.example` (Backend)
```env
# Copier en .env et adapter

# Sécurité
SECRET_KEY=votre-clé-secrète
JWT_SECRET_KEY=votre-clé-jwt-secrète

# Email (optionnel)
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=votre-email@gmail.com

# Seuils d'alerte
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28

# Rate Limiting
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute
```

Voir `.env.example` pour toutes les options disponibles.

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

## 📜 Licence

[À définir selon votre licence]

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

**Créé avec ❤️ pour une meilleure surveillance de la qualité de l'air**

---

## 🔗 Lien Rapide

👉 **[Accéder à toute la documentation →](docs/README.md)**

---

**Dernière mise à jour:** Février 2026  
**Statut:** Production Ready ✅  
**Version:** 1.0.0
