# Guide Développeur

Guide pour les développeurs contribuant ou étendant le système de surveillance CO₂ Morpheus.

## 📋 Table des Matières

1. [Configuration de Développement](#configuration-de-développement)
2. [Architecture du Projet](#architecture-du-projet)
3. [Modules Principaux](#modules-principaux)
4. [Schéma de Base de Données](#schéma-de-base-de-données)
5. [Développement API](#développement-api)
6. [Développement Frontend](#développement-frontend)
7. [Tests](#tests)
8. [Directives de Contribution](#directives-de-contribution)
9. [Déploiement](#déploiement)

---

## 🛠️ Configuration de Développement

### Prérequis

- Python 3.8+
- Git
- Éditeur de code (VS Code recommandé)
- Navigateur SQLite (optionnel, pour l'inspection de la base de données)

### Cloner et Configurer

```bash
# Cloner le dépôt
git clone <url-dépôt>
cd Morpheus

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Installer les dépendances de développement
pip install pytest pytest-cov black flake8
```

### Lancer le Serveur de Développement

```bash
cd site
python app.py
```

Le serveur s'exécute avec :
- **Rechargement automatique** : Les modifications déclenchent un redémarrage automatique
- **Mode debug** : Messages d'erreur détaillés
- **Port 5000** : http://localhost:5000

### Configuration IDE (VS Code)

Extensions recommandées :
- Python
- Pylance
- SQLite Viewer
- Better Jinja

`.vscode/settings.json` :
```json
{
  \"python.linting.enabled\": true,
  \"python.linting.flake8Enabled\": true,
  \"python.formatting.provider\": \"black\",
  \"editor.formatOnSave\": true
}
```

---

## 🏗️ Architecture du Projet

### Structure des Répertoires

```
Morpheus/
├── site/                      # Application Flask principale
│   ├── app.py                # App Flask + routes (2845 lignes)
│   ├── database.py           # Opérations base de données
│   ├── optimization.py       # Utilitaires de performance
│   ├── admin_tools.py        # Fonctionnalités admin
│   ├── advanced_features.py  # ML & analyses
│   ├── export_manager.py     # Fonctionnalité export
│   ├── collaboration.py      # Fonctionnalités équipe
│   ├── templates/            # Templates HTML Jinja2
│   ├── static/               # CSS, JS, images
│   └── sensors/              # Interfaces capteurs
├── app/                       # Utilitaires supplémentaires
│   ├── datamanager.py        # Traitement données
│   ├── co2_reader.py         # Lecture capteur
│   └── sensors/              # Code spécifique capteur
├── data/                      # Base de données et sauvegardes
│   ├── morpheus.db           # Base de données SQLite
│   └── backups/              # Sauvegardes automatiques
├── docs/                      # Documentation
├── tests/                     # Suite de tests
└── requirements.txt          # Dépendances Python
```

### Stack Technologique

**Backend** :
- **Flask** : Framework web
- **Flask-SocketIO** : Support WebSocket
- **SQLite** : Base de données
- **bcrypt** : Hachage mot de passe
- **pandas** : Manipulation de données
- **scikit-learn** : Analyses ML

**Frontend** :
- **HTML/CSS/JavaScript** : Technologies web de base
- **Chart.js** : Visualisation de données
- **Socket.IO** : Mises à jour en temps réel
- **Bootstrap** : Framework UI (optionnel)

### Flux de l'Application

```
Requête Utilisateur → Route Flask → Requête Base de Données → Réponse
                     ↓
              Événements WebSocket → Mises à Jour Temps Réel
                     ↓
              Tâches en Arrière-plan → Tâches Programmées
```

---

## 🔧 Modules Principaux

### app.py - Application Principale

**Composants Clés** :

1. **Initialisation App Flask** :
```python
from flask import Flask, jsonify, render_template, request, session
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'votre-clé-secrète'
socketio = SocketIO(app, cors_allowed_origins=\"*\")
```

2. **Décorateur d'Authentification** :
```python
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')
```

3. **Routes API REST** :
```python
@app.route('/api/readings', methods=['GET'])
@login_required
def get_readings():
    days = request.args.get('days', 7, type=int)
    user_id = session['user_id']
    
    db = get_db()
    readings = optimize_co2_query(db, days=days, limit=1000)
    
    return jsonify({
        'status': 'success',
        'data': readings,
        'count': len(readings)
    })
```

4. **Gestionnaires WebSocket** :
```python
@socketio.on('start_monitoring')
def handle_monitoring(data):
    interval = data.get('interval', 5)
    user_id = session.get('user_id')
    
    # Rejoindre la salle pour les mises à jour ciblées
    join_room(f'user_{user_id}')
    
    # Démarrer la tâche en arrière-plan
    socketio.start_background_task(
        target=send_updates,
        user_id=user_id,
        interval=interval
    )
```

### database.py - Couche d'Accès aux Données

**Gestion de Connexion** :
```python
import sqlite3
from flask import g

def get_db():
    \"\"\"Obtenir la connexion base de données\"\"\"
    if 'db' not in g:
        g.db = sqlite3.connect('data/morpheus.db')
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    \"\"\"Fermer la connexion base de données\"\"\"
    db = g.pop('db', None)
    if db is not None:
        db.close()
```

**Fonctions Clés** :

```python
# Gestion Utilisateurs
def create_user(username, email, password_hash):
    \"\"\"Créer un nouveau compte utilisateur\"\"\"
    db = get_db()
    cursor = db.execute(
        \"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)\",
        (username, email, password_hash)
    )
    db.commit()
    return cursor.lastrowid

def get_user_by_username(username):
    \"\"\"Récupérer l'utilisateur par nom d'utilisateur\"\"\"
    db = get_db()
    user = db.execute(
        \"SELECT * FROM users WHERE username = ?\",
        (username,)
    ).fetchone()
    return dict(user) if user else None

# Données Capteur
def log_sensor_reading(sensor_id, co2_ppm, temperature=None, humidity=None):
    \"\"\"Enregistrer une nouvelle lecture de capteur\"\"\"
    db = get_db()
    db.execute(
        \"\"\"INSERT INTO sensor_readings 
           (sensor_id, co2_ppm, temperature, humidity, timestamp)
           VALUES (?, ?, ?, ?, datetime('now'))\"\"\",
        (sensor_id, co2_ppm, temperature, humidity)
    )
    db.commit()

def get_sensor_readings(sensor_id, days=7, limit=1000):
    \"\"\"Obtenir les lectures pour un capteur\"\"\"
    db = get_db()
    readings = db.execute(
        \"\"\"SELECT * FROM sensor_readings
           WHERE sensor_id = ?
           AND timestamp >= datetime('now', '-' || ? || ' days')
           ORDER BY timestamp DESC
           LIMIT ?\"\"\",
        (sensor_id, days, limit)
    ).fetchall()
    return [dict(row) for row in readings]
```

### optimization.py - Couche de Performance

**Mise en Cache** :
```python
import time
from functools import wraps

cache = {}

def cache_result(expire_seconds=600):
    \"\"\"Décorateur pour mettre en cache les résultats de fonction\"\"\"
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f\"{func.__name__}:{args}:{kwargs}\"
            
            # Vérifier le cache
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < expire_seconds:
                    return result
            
            # Exécuter et mettre en cache
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            return result
        return wrapper
    return decorator

# Utilisation
@cache_result(expire_seconds=300)
def get_user_statistics(user_id):
    # Calcul coûteux
    return calculate_stats(user_id)
```

**Limitation de Débit** :
```python
class RateLimiter:
    \"\"\"Limiteur de débit pour les émissions WebSocket\"\"\"
    def __init__(self, max_per_second=10):
        self.max_per_second = max_per_second
        self.last_emit = {}
    
    def should_emit(self, key):
        \"\"\"Vérifier si l'émission est autorisée\"\"\"
        now = time.time()
        last = self.last_emit.get(key, 0)
        
        if now - last >= (1.0 / self.max_per_second):
            self.last_emit[key] = now
            return True
        return False

# Utilisation
limiter = RateLimiter(max_per_second=5)

@socketio.on('update_request')
def handle_update():
    if limiter.should_emit('user_' + str(session['user_id'])):
        emit('data_update', get_latest_data())
```

---

## 🗄️ Schéma de Base de Données

### Tables Principales

**users** :
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',  -- 'user' ou 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT 0
);
```

**sensors** :
```sql
CREATE TABLE sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    type TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reading TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**sensor_readings** :
```sql
CREATE TABLE sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER NOT NULL,
    co2_ppm INTEGER NOT NULL,
    temperature REAL,
    humidity REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);

-- Index de performance
CREATE INDEX idx_readings_sensor ON sensor_readings(sensor_id);
CREATE INDEX idx_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX idx_readings_sensor_time ON sensor_readings(sensor_id, timestamp);
```

---

## 🧪 Tests

### Structure des Tests

```
tests/
├── test_api_endpoints.py      # Tests API REST
├── test_sensor_api.py          # Tests spécifiques capteurs
├── test_webapp_integration.py  # Tests d'intégration
└── test_thresholds.py         # Tests logique métier
```

### Écrire des Tests

**Exemple Test Unitaire** :
```python
import unittest
from database import create_user, get_user_by_username

class TestUserManagement(unittest.TestCase):
    def setUp(self):
        \"\"\"Configurer la base de données de test\"\"\"
        init_test_db()
    
    def test_create_user(self):
        \"\"\"Tester la création d'utilisateur\"\"\"
        user_id = create_user('testuser', 'test@exemple.com', 'hash123')
        self.assertIsNotNone(user_id)
        
        user = get_user_by_username('testuser')
        self.assertEqual(user['email'], 'test@exemple.com')
    
    def tearDown(self):
        \"\"\"Nettoyer la base de données de test\"\"\"
        cleanup_test_db()

if __name__ == '__main__':
    unittest.main()
```

### Lancer les Tests

```bash
# Lancer tous les tests
python -m pytest tests/

# Lancer un fichier de test spécifique
python test_api_endpoints.py

# Lancer avec couverture
pytest --cov=site tests/
```

---

## 🤝 Directives de Contribution

### Style de Code

**Python (PEP 8)** :
- 4 espaces pour l'indentation
- Longueur de ligne max : 88 caractères (formateur Black)
- Docstrings pour toutes les fonctions
- Hints de type lorsque applicable

```python
def calculate_average(values: list[float]) -> float:
    \"\"\"
    Calculer la moyenne d'une liste de valeurs.
    
    Args:
        values : Liste de valeurs numériques
    
    Returns:
        Valeur moyenne en float
    
    Raises:
        ValueError : Si la liste est vide
    \"\"\"
    if not values:
        raise ValueError(\"Impossible de calculer la moyenne d'une liste vide\")
    return sum(values) / len(values)
```

**JavaScript** :
- 2 espaces pour l'indentation
- Utiliser const/let, éviter var
- Points-virgules requis
- camelCase pour les variables

### Workflow Git

```bash
# Créer une branche de fonctionnalité
git checkout -b feature/nouveau-type-capteur

# Faire des modifications et committer
git add .
git commit -m \"Ajouter support pour capteur MH-Z19C\"

# Pousser et créer PR
git push origin feature/nouveau-type-capteur
```

**Format de Message de Commit** :
```
<type> : <sujet>

<corps>

<pied>
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Exemple :
```
feat : Ajouter export CSV pour données capteur

- Implémenter fonction export_to_csv
- Ajouter route de téléchargement /api/export/csv
- Inclure tests pour fonctionnalité export

Ferme #123
```

---

## 🚀 Déploiement

### Configuration Production

**Modifications app.py** :
```python
# Désactiver le mode debug
app.config['DEBUG'] = False

# Utiliser les variables d'environnement
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

# Définir l'hôte approprié
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
```

**Variables d'Environnement** :
```bash
export SECRET_KEY=\"votre-clé-secrète-production\"
export DATABASE_URL=\"chemin/vers/production.db\"
export FLASK_ENV=\"production\"
```

### Déploiement WSGI (Gunicorn)

**Installer** :
```bash
pip install gunicorn eventlet
```

**Lancer** :
```bash
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app
```

### Déploiement Docker

**Dockerfile** :
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY site/ ./site/
COPY data/ ./data/

WORKDIR /app/site

EXPOSE 5000

CMD [\"python\", \"app.py\"]
```

**Construire et Lancer** :
```bash
docker build -t morpheus .
docker run -p 5000:5000 -v $(pwd)/data:/app/data morpheus
```

### Proxy Inverse Nginx

```nginx
server {
    listen 80;
    server_name morpheus.exemple.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }
}
```

---

## 📚 Ressources Supplémentaires

- [Documentation Flask](https://flask.palletsprojects.com/)
- [Documentation Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- [Documentation SQLite](https://www.sqlite.org/docs.html)
- [Documentation Chart.js](https://www.chartjs.org/docs/)

---

**Questions ?** Ouvrez un ticket ou consultez la [Référence API](REFERENCE-API.md).
