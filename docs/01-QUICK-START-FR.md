# 📖 GUIDE DE DÉMARRAGE RAPIDE - 5 MINUTES

**Soyez opérationnel en 5 minutes**

---

## 🚀 Installation et configuration

### Prérequis
- Python 3.8+
- Flask et Flask-SocketIO installés
- Base de données SQLite

### Accédez au projet
```bash
cd Morpheus/site
```

---

## ⚡ Commandes rapides

### Exécuter l'application
```bash
python app.py
# S'ouvre sur http://localhost:5000
```

### Exécuter les tests
```bash
# Tests de base de données et WebSocket
python test_data_websocket.py

# Tests complets d'unité et d'intégration
python test_suite.py
```

---

## 💻 Utiliser le code

### Utiliser l'optimisation
```python
from optimization import cache_result, optimize_co2_query, RateLimiter

# Mettre en cache les opérations coûteuses
@cache_result(expire_seconds=600)
def get_user_profile(user_id):
    return db.execute("SELECT * FROM users WHERE id = ?", (user_id,))

# Obtenir des données CO2 optimisées
readings = optimize_co2_query(db, days=7, limit=1000)

# Limiter les mises à jour WebSocket
rate_limiter = RateLimiter(max_per_second=10)
if rate_limiter.should_emit('room'):
    socketio.emit('update', data)
```

### Utiliser les outils d'administration
```python
from admin_tools import AdminAnalytics, AdminUserManagement

# Obtenir la santé du système
health = AdminAnalytics.get_system_health()
print(f"Utilisateurs actifs: {health['total_users']}")

# Trouver les utilisateurs inactifs
inactive = AdminUserManagement.get_inactive_users(days=90)
for user in inactive:
    print(f"{user['username']} - Dernière connexion: {user['last_login']}")

# Exporter les utilisateurs en CSV
csv_data = AdminUserManagement.bulk_export_users(format='csv')
```

---

## 📊 Base de données

### Connectez-vous à la base de données
```python
from database import get_db

db = get_db()
results = db.execute("SELECT * FROM co2_readings LIMIT 10").fetchall()
db.close()
```

### Optimiser les requêtes
```python
from optimization import optimize_co2_query

# Utilisez une requête optimisée au lieu du SQL brut
readings = optimize_co2_query(db, days=7, limit=500)
```

---

## 🧪 Tests

### Tester la connexion à la base de données
```bash
python test_data_websocket.py
# Affiche les tests de base de données, WebSocket et API
```

### Suite de tests complète
```bash
python test_suite.py
# Exécute les tests d'unité et d'intégration
```

### Tester avec le serveur en cours d'exécution
```bash
# Terminal 1
python app.py

# Terminal 2
python test_suite.py
```

---

## 📝 Tâches courantes

### Connecter un utilisateur
```python
from database import get_user_by_username
from werkzeug.security import check_password_hash

user = get_user_by_username("testuser")
if user and check_password_hash(user['password_hash'], "password"):
    print("Connexion réussie!")
```

### Obtenir les paramètres utilisateur
```python
from database import get_user_settings

settings = get_user_settings(user_id=1)
print(f"Seuil bon: {settings['good_threshold']}")
```

### Mettre à jour les paramètres
```python
from database import update_user_settings

new_settings = {
    'good_threshold': 700,
    'bad_threshold': 1100
}
update_user_settings(user_id=1, data=new_settings)
```

---

## 🔧 Configuration

### Définir les variables d'environnement
```bash
export FLASK_ENV=development
export FLASK_APP=app.py
export SECRET_KEY=your-secret-key
```

### Configurer l'email (Optionnel)
```bash
export MAIL_SERVER=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

---

## ✅ Liste de vérification de vérification

- [ ] L'application s'exécute: `python app.py`
- [ ] Les tests réussissent: `python test_data_websocket.py`
- [ ] Peut importer l'optimisation: `from optimization import cache_result`
- [ ] Peut importer les outils d'administration: `from admin_tools import AdminAnalytics`
- [ ] Base de données accessible: `from database import get_db`

---

**Suivant → Lisez `02-DEVELOPER-GUIDE-FR.md` pour le développement quotidien** 👨‍💻
