# 🌍 Aerium - Tableau de Bord Qualité de l'Air

Système complet de surveillance de la qualité de l'air en temps réel avec une interface React moderne et un backend Flask robuste.

[English Version](README.md) | **Version Française**

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

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Python 3.9+
- pip (gestionnaire de paquets Python)

### Installation

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

# Créer la config backend
cp .env.example .env

# Seed la base de données avec des données de démonstration
python seed_database.py
```

3. **Configurer le frontend**
```bash
# Dans le répertoire racine
npm install
# ou avec bun
bun install
```

4. **Démarrer l'application**

Terminal 1 (Backend):
```bash
cd backend
python app.py
# Le serveur démarre sur http://localhost:5000
```

Terminal 2 (Frontend):
```bash
npm run dev
# L'application démarre sur http://localhost:5173
```

5. **Accéder à l'application**

- Dashboard: http://localhost:5173
- API Backend: http://localhost:5000/api
- Documentation API: http://localhost:5000/api/docs

### Comptes de Démonstration

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| demo@aerium.app | demo123 | Utilisateur |
| admin@aerium.app | admin123 | Administrateur |

## 📋 Architecture

### Structure du Projet

```
air-sense-dashboard/
├── backend/                    # API Flask
│   ├── routes/                # Endpoints API
│   ├── app.py                 # Application principale
│   ├── database.py            # Modèles de données
│   ├── config.py              # Configuration
│   ├── email_service.py       # Service d'email
│   ├── validators.py          # Validation des données
│   ├── audit_logger.py        # Piste d'audit
│   └── requirements.txt        # Dépendances Python
│
├── src/                        # Application React
│   ├── components/            # Composants React
│   ├── pages/                 # Pages
│   ├── hooks/                 # Hooks personnalisés
│   ├── lib/                   # Utilitaires
│   └── App.tsx                # Application principale
│
├── FEATURES.md                # Documentation des fonctionnalités
├── QUICKSTART.md              # Guide de démarrage rapide
└── README.md                  # Ce fichier
```

### Stack Technique

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- TailwindCSS (styles)
- shadcn/ui (composants)
- Socket.io (WebSocket)
- TanStack Query (gestion d'état)

**Backend:**
- Flask 3.0 (framework web)
- SQLAlchemy (ORM)
- SQLite (base de données)
- Flask-JWT-Extended (authentification)
- Flask-SocketIO (WebSocket)
- Flask-Limiter (rate limiting)

## 🔧 Configuration

### Variables d'Environnement

Aerium utilise deux fichiers `.env` différents:
- `site-v2/.env`: frontend (variables `VITE_*` uniquement)
- `site-v2/backend/.env`: backend Flask (secrets, JWT, Mistral)

Exemple backend (`site-v2/backend/.env`) :

```env
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Mistral AI (côté serveur)
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-small-latest
MISTRAL_MAX_TOKENS=700

# Limitation de débit
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute

# Seuils d'alerte
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
ALERT_HUMIDITY_THRESHOLD=80
```

`MISTRAL_API_KEY` doit être dans `site-v2/backend/.env` (jamais dans `site-v2/.env`).

Voir `docs/CONFIG.md` pour le détail complet.

## 📚 Documentation

- **[FEATURES.md](FEATURES.md)** - Documentation détaillée de toutes les fonctionnalités (8 fonctionnalités majeures)
- **[QUICKSTART.md](QUICKSTART.md)** - Guide de démarrage rapide avec exemples API
- **[backend/README.md](backend/README.md)** - Référence complète de l'API backend

## 🔐 Sécurité

- ✅ Authentification JWT avec tokens Bearer
- ✅ Hachage des mots de passe avec bcrypt
- ✅ Contrôle d'accès basé sur les rôles (Admin/Utilisateur)
- ✅ Protection contre les abus (Rate Limiting)
- ✅ Piste d'audit complète
- ✅ Validation de tous les inputs
- ✅ Protection CORS

## 🌟 Fonctionnalités Avancées

### 1. Notifications par Email 📧
Recevez des alertes automatiques par email quand les seuils de CO2, température ou humidité sont dépassés.

### 2. Limitation de Débit 🛡️
L'API est protégée contre les abus avec des limites de requêtes configurables.

### 3. Logging Complet 📊
Tous les événements sont enregistrés dans des fichiers avec rotation automatique.

### 4. Piste d'Audit 📝
Toutes les actions des utilisateurs sont enregistrées pour la conformité.

### 5. Recherche Avancée 🔍
Trouvez des capteurs par nom, localisation ou autres critères avec filtrage.

### 6. Validation des Données ✅
Tous les inputs sont validés côté serveur avec messages d'erreur clairs.

### 7. Mise en Cache ⚡
Les données fréquemment accédées sont mises en cache pour améliorer les performances.

### 8. Documentation API 📚
Accédez à la documentation Swagger complète à `/api/docs`.

Voir [FEATURES.md](FEATURES.md) pour plus de détails.

## 📊 Endpoints API Principaux

### Authentification
```
POST   /api/auth/register      # Créer un compte
POST   /api/auth/login         # Se connecter
POST   /api/auth/refresh       # Rafraîchir le token
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
POST   /api/readings/external/<id>      # Données de capteur externe
```

### Alertes
```
GET    /api/alerts             # Lister les alertes
GET    /api/alerts/history     # Historique des alertes
GET    /api/alerts/stats       # Statistiques
```

### Rapports
```
GET    /api/reports/daily/<id>         # Rapport journalier
GET    /api/reports/weekly/<id>        # Rapport hebdomadaire
GET    /api/reports/monthly/<id>       # Rapport mensuel
GET    /api/reports/export             # Exporter les données
```

Voir [backend/README.md](backend/README.md) pour la documentation API complète.

## 🧪 Développement

### Démarrage en Mode Développement

```bash
# Backend (avec rechargement automatique)
cd backend
python app.py

# Frontend (avec Vite)
npm run dev
```

### Vérifier la Santé de l'API

```bash
curl http://localhost:5000/api/health
```

### Consulter les Logs

```bash
# Logs backend
tail -f backend/logs/aerium.log
```

### Accéder à la Base de Données

```bash
cd backend
sqlite3 aerium.db
.tables
SELECT * FROM user;
```

## 🐛 Dépannage

### Les emails ne sont pas envoyés
1. Vérifier que `MAIL_USERNAME` et `MAIL_PASSWORD` sont corrects dans `.env`
2. Pour Gmail, utiliser un mot de passe d'application, pas le mot de passe régulier
3. Vérifier les logs: `tail -f backend/logs/aerium.log`
4. Vérifier que `ENABLE_EMAIL_NOTIFICATIONS=True`

### "Accès refusé" sur l'API
- Vérifier que le token JWT est inclus dans les headers
- Format: `Authorization: Bearer <token>`
- Le token a peut-être expiré, se reconnecter

### Erreurs de base de données
```bash
# Réinitialiser la base de données
rm backend/aerium.db
cd backend && python app.py  # Crée une nouvelle BD
python seed_database.py      # Ajoute les données de démo
```

### Rate limiting trop strict
Modifier `.env`:
```env
ENABLE_RATE_LIMITING=False  # Désactiver en développement
```

## 🚀 Déploiement en Production

### Préparation

1. **Définir des clés fortes**
```env
SECRET_KEY=<clé-aléatoire-forte>
JWT_SECRET_KEY=<clé-aléatoire-forte>
FLASK_ENV=production
FLASK_DEBUG=False
```

2. **Configurer l'email**
```env
MAIL_SERVER=<votre-serveur-smtp>
MAIL_USERNAME=<votre-email>
MAIL_PASSWORD=<votre-mot-de-passe>
```

3. **Construire le frontend**
```bash
npm run build
```

4. **Lancer avec gunicorn**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📞 Support

### Ressources

- **Documentation détaillée**: Voir [FEATURES.md](FEATURES.md)
- **Guide de démarrage**: Voir [QUICKSTART.md](QUICKSTART.md)
- **Référence API**: Voir [backend/README.md](backend/README.md)
- **Documentation en ligne**: http://localhost:5000/api/docs

### Logs et Débogage

```bash
# Logs backend
cat backend/logs/aerium.log

# Console du navigateur
F12 → Onglet Console
```

## 📄 Fichiers Importants

- `.env.example` - Modèle de configuration
- `backend/config.py` - Configuration Python
- `backend/requirements.txt` - Dépendances Python
- `package.json` - Dépendances Node.js
- `vite.config.ts` - Configuration Vite

## 🎓 Apprentissage

### Pour Débuter
1. Lire ce README
2. Consulter [QUICKSTART.md](QUICKSTART.md)
3. Essayer les comptes de démo

### Pour Approfondir
1. Lire [FEATURES.md](FEATURES.md)
2. Consulter [backend/README.md](backend/README.md)
3. Explorer le code source

## ✨ À Venir

Améliorations futures envisagées:
- [ ] Alertes SMS (intégration Twilio)
- [ ] Notifications Slack/Discord
- [ ] Application mobile iOS/Android
- [ ] Machine Learning pour détection d'anomalies
- [ ] Endpoint GraphQL
- [ ] Redis pour mise en cache
- [ ] Support multilingue
- [ ] Webhooks pour 3e parties

## 📜 Licence

[À définir selon votre licence]

## 🙏 Contribution

Les contributions sont bienvenues! Veuillez:
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos modifications (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

**Créé avec ❤️ pour une meilleure surveillance de la qualité de l'air**

**Dernière mise à jour**: Février 2026
**Statut**: Prêt pour la production ✅
