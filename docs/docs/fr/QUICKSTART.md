# ⚡ Guide de Démarrage Rapide

Guide de référence rapide du Tableau de Bord Aerium Qualité de l'Air.

## 🚀 Installation (10 minutes)

### Backend
```bash
# Depuis site-v2/
cp .env.example .env

cd backend
pip install -r requirements.txt
cp .env.example .env  # Créer la config backend
python seed_database.py   # Charger les données de démo
python app.py             # Lancer le serveur
# http://localhost:5000
```

Note:
- `site-v2/.env` = frontend (`VITE_*`)
- `site-v2/backend/.env` = backend (secrets, Mistral)

### Frontend
```bash
# Dans le répertoire racine
npm install
npm run dev
# http://localhost:5173
```

## 🔑 Accès Rapide

| Ressource | URL |
|-----------|-----|
| **Dashboard** | http://localhost:5173 |
| **API Backend** | http://localhost:5000/api |
| **API Docs** | http://localhost:5000/api/docs |
| **Health Check** | http://localhost:5000/api/health |

## 👤 Comptes de Démo

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| demo@aerium.app | demo123 | Utilisateur |
| admin@aerium.app | admin123 | Admin |

## 🔌 Endpoints API Principaux

### Authentification
```bash
# Enregistrement
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Jean Dupont"
}

# Connexion
POST /api/auth/login
{
  "email": "demo@aerium.app",
  "password": "demo123"
}
# Réponse: {"access_token": "eyJ..."}
```

### Capteurs
```bash
# Lister les capteurs
GET /api/sensors

# Créer un capteur
POST /api/sensors
{
  "name": "Cuisine",
  "location": "Rez-de-chaussée",
  "sensor_type": "MULTI"
}

# Détails d'un capteur
GET /api/sensors/1

# Modifier un capteur
PUT /api/sensors/1
{
  "name": "Cuisine Étage 1"
}

# Supprimer un capteur
DELETE /api/sensors/1
```

### Lectures (Données)
```bash
# Ajouter une lecture
POST /api/readings
{
  "sensor_id": 1,
  "co2": 850,
  "temperature": 22.5,
  "humidity": 45
}

# Lectures pour un capteur
GET /api/readings/sensor/1

# Dernière lecture
GET /api/readings/latest/1

# Données d'un capteur externe
POST /api/readings/external/1
{
  "co2": 900,
  "temperature": 23,
  "humidity": 50
}
```

### Alertes
```bash
# Lister les alertes
GET /api/alerts

# Historique des alertes
GET /api/alerts/history/list

# Statistiques des alertes
GET /api/alerts/history/stats

# Reconnaître une alerte
PUT /api/alerts/history/acknowledge/1

# Résoudre une alerte
PUT /api/alerts/history/resolve/1
```

### Rapports
```bash
# Rapport journalier
GET /api/reports/daily/1

# Rapport hebdomadaire
GET /api/reports/weekly/1

# Rapport mensuel
GET /api/reports/monthly/1

# Exporter les données
GET /api/reports/export
```

## 🔍 Recherche & Filtrage

### Paramètres

```bash
?search=cuisine           # Cherche dans nom/localisation
&status=en%20ligne       # Filtre par statut
&type=MULTI              # Filtre par type
&active=true             # Filtre par activité
&sort=updated_at         # Trier les résultats
&limit=50                # Nombre de résultats
```

### Exemples

```bash
# Chercher "Cuisine"
GET /api/sensors?search=cuisine

# Statut "Avertissement"
GET /api/sensors?status=avertissement

# Chercher et trier
GET /api/sensors?search=bureau&sort=updated_at&limit=10

# Filtres multiples
GET /api/sensors?search=étage&status=en%20ligne&type=MULTI&active=true&sort=name
```

## 📧 Configuration Email (Optionnel)

### 1. Gmail

```env
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app
```

**Important pour Gmail**: Utiliser "Mot de passe d'application", pas le mot de passe régulier.

1. Aller sur https://myaccount.google.com/apppasswords
2. Générer un mot de passe d'application
3. Utiliser ce mot de passe dans MAIL_PASSWORD

### 2. Seuils d'Alerte

```env
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
ALERT_HUMIDITY_THRESHOLD=80
```

## 🛡️ Rate Limiting

### Activation

```env
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute
```

### Désactiver en Développement

```env
ENABLE_RATE_LIMITING=False
```

### Réponse Quand Limité

```json
{
  "error": "Rate limit exceeded. Try again later."
}
```

Status HTTP: **429**

## 📊 Logging

### Configuration

```env
LOG_LEVEL=INFO              # INFO, DEBUG, WARNING, ERROR
LOG_FILE=logs/aerium.log
LOG_MAX_BYTES=10485760      # 10MB
LOG_BACKUP_COUNT=10         # Garder 10 fichiers
```

### Consulter les Logs

```bash
# Dernier 100 lignes
tail -100 backend/logs/aerium.log

# Suivi en temps réel
tail -f backend/logs/aerium.log

# Chercher des erreurs
grep ERROR backend/logs/aerium.log
```

## 📝 Piste d'Audit

### Accéder à l'Audit

```python
from audit_logger import get_user_audit_history, get_resource_audit_history

# Actions d'un utilisateur
logs = get_user_audit_history(user_id=1, limit=50)

# Modifications d'une ressource
logs = get_resource_audit_history('SENSOR', resource_id=5)

for log in logs:
    print(f"{log['timestamp']}: {log['action']}")
```

## 🧪 Tester avec cURL

### Exemple Complet

```bash
# 1. Connexion
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@aerium.app","password":"demo123"}' \
  | jq -r '.access_token')

# 2. Lister les capteurs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/sensors | jq

# 3. Créer un capteur
curl -X POST http://localhost:5000/api/sensors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chambre",
    "location": "Étage",
    "sensor_type": "MULTI"
  }' | jq

# 4. Ajouter une lecture
curl -X POST http://localhost:5000/api/readings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "co2": 950,
    "temperature": 21,
    "humidity": 55
  }' | jq
```

## 🐛 Dépannage Rapide

### "Connection refused"
```bash
# Backend ne s'exécute pas?
cd backend && python app.py

# Frontend ne s'exécute pas?
npm run dev
```

### "Invalid token"
```bash
# Se reconnecter pour obtenir nouveau token
# Format correct: Authorization: Bearer <token>
```

### "Email not sent"
```bash
# 1. Vérifier .env
cat backend/.env | grep MAIL

# 2. Vérifier les logs
tail -f backend/logs/aerium.log

# 3. Pour Gmail: utiliser mot de passe d'application
```

### "Database error"
```bash
# Réinitialiser la BD
rm backend/instance/aerium.db
cd backend && python app.py
python seed_database.py
```

### "Rate limit exceeded"
```env
ENABLE_RATE_LIMITING=False  # Désactiver en dev
```

## 📊 Base de Données

### Accéder à la BD

```bash
cd backend
sqlite3 instance/aerium.db

# Voir les tables
.tables

# Voir les utilisateurs
SELECT * FROM user;

# Voir les capteurs
SELECT * FROM sensor;

# Quitter
.quit
```

### Réinitialiser la BD

```bash
rm backend/instance/aerium.db
python app.py  # Crée nouvelle BD
python seed_database.py  # Ajoute les données
```

## 🔐 Sécurité

### En Développement

```env
SECRET_KEY=dev-key-not-secure
JWT_SECRET_KEY=jwt-dev-key-not-secure
ENABLE_RATE_LIMITING=False
```

### En Production

```env
SECRET_KEY=<clé-aléatoire-longue>
JWT_SECRET_KEY=<clé-aléatoire-longue>
ENABLE_RATE_LIMITING=True
FLASK_ENV=production
FLASK_DEBUG=False
```

## 🚀 Déploiement Production

### Construire Frontend
```bash
npm run build
# Produit: dist/
```

### Lancer avec Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📚 Documentation Complète

- **README.md** - Vue d'ensemble du projet
- **FEATURES.md** - Toutes les fonctionnalités détaillées
- **../guides/ARCHITECTURE.md** - Architecture système
- **../guides/API_REFERENCE.md** - Référence API complète
- **http://localhost:5000/api/docs** - Documentation interactive

## ✨ Astuces

1. **Toujours inclure le token JWT**
   ```
   Authorization: Bearer <votre-token>
   ```

2. **Vérifier les logs** quand quelque chose ne marche pas
   ```bash
   tail -f backend/logs/aerium.log
   ```

3. **Utiliser l'API docs** à `/api/docs` pour tester les endpoints

4. **Désactiver rate limiting** en développement
   ```env
   ENABLE_RATE_LIMITING=False
   ```

5. **Configurer email** pour recevoir les alertes
   ```env
   ENABLE_EMAIL_NOTIFICATIONS=True
   MAIL_USERNAME=votre-email
   MAIL_PASSWORD=votre-mot-de-passe-app
   ```

## 🎯 Premiers Pas

1. ✅ Installer backend + frontend
2. ✅ Lancer les deux serveurs
3. ✅ Connectez-vous avec demo@aerium.app
4. ✅ Créez un capteur
5. ✅ Ajouter une lecture
6. ✅ Vérifier le dashboard
7. ✅ Tester la recherche
8. ✅ Consulter la piste d'audit

## 📞 Besoin d'Aide?

- Consulter les logs: `backend/logs/aerium.log`
- Voir la documentation API: `http://localhost:5000/api/docs`
- Lire FEATURES.md pour détails complètes
- Vérifier README.md pour instructions d'installation
- Voir ../guides/TROUBLESHOOTING.md pour dépannage

---

**Vous êtes prêt à démarrer!** 🎉

**Dernière mise à jour:** Février 2026
