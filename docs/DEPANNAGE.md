# Guide de Dépannage

Solutions aux problèmes et questions courants avec le système de surveillance CO₂ Morpheus.

## 📋 Table des Matières

1. [Problèmes d'Installation & Démarrage](#problèmes-dinstallation--démarrage)
2. [Problèmes d'Authentification](#problèmes-dauthentification)
3. [Problèmes de Base de Données](#problèmes-de-base-de-données)
4. [Problèmes de Connexion WebSocket](#problèmes-de-connexion-websocket)
5. [Problèmes d'Intégration Capteurs](#problèmes-dintégration-capteurs)
6. [Problèmes de Performance](#problèmes-de-performance)
7. [Problèmes d'Export & Données](#problèmes-dexport--données)
8. [Débogage Général](#débogage-général)

---

## 🚀 Problèmes d'Installation & Démarrage

### Port Déjà Utilisé

**Erreur** : `Address already in use` ou `Port 5000 already in use`

**Solution** :

**Windows** :
```powershell
# Trouver ce qui utilise le port 5000
netstat -ano | findstr :5000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# Ou changer le port dans app.py
PORT = 5001
```

**Linux/Mac** :
```bash
# Trouver le processus
lsof -i :5000

# Le tuer
kill -9 <PID>
```

### Dépendances Manquantes

**Erreur** : `ModuleNotFoundError: No module named 'flask'`

**Solution** :
```bash
# Installer toutes les dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip list | grep -i flask

# Si les problèmes persistent, essayer de mettre à jour pip
python -m pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Base de Données Non Trouvée

**Erreur** : `unable to open database file`

**Solution** :
```bash
cd site

# Initialiser la base de données
python -c \"from database import init_db; init_db()\"

# Vérifier
ls -la data/  # Devrait voir morpheus.db ou aerium.sqlite
```

### Problèmes de Version Python

**Erreur** : `SyntaxError` ou fonctionnalités ne fonctionnent pas

**Solution** :
```bash
# Vérifier la version Python (besoin 3.8+)
python --version

# Utiliser une version Python spécifique
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔐 Problèmes d'Authentification

### Impossible de Se Connecter

**Problème** : \"Nom d'utilisateur ou mot de passe invalide\" avec des identifiants corrects

**Diagnostiquer** :
```python
# Vérifier si l'utilisateur existe
python -c \"
from database import get_user_by_username
user = get_user_by_username('votre_username')
print('Utilisateur existe:', user is not None)
\"
```

**Solutions** :

1. **Réinitialiser le mot de passe** :
```bash
cd site
python << 'EOF'
from database import get_db
from werkzeug.security import generate_password_hash

db = get_db()
new_hash = generate_password_hash('nouveaumotdepasse')
db.execute(
    \"UPDATE users SET password_hash = ? WHERE username = ?\",
    (new_hash, 'votre_username')
)
db.commit()
print(\"Réinitialisation du mot de passe terminée\")
EOF
```

2. **Vérifier SECRET_KEY** :
```python
# Dans app.py, assurez-vous que ceci existe :
app.config['SECRET_KEY'] = 'votre-clé-secrète'
```

### Session Expire Immédiatement

**Problème** : Déconnecté après chaque rechargement de page

**Solution** :
```python
# Dans app.py, ajouter :
from datetime import timedelta

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_COOKIE_SECURE'] = False  # Mettre True pour HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

@app.before_request
def make_session_permanent():
    session.permanent = True
```

### Problèmes de Vérification Email

**Problème** : Les emails de vérification ne sont pas envoyés

**Solution** :
```python
# Vérifier la configuration email dans app.py
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'votre-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'votre-mot-de-passe-app'  # Pas le mot de passe normal !
```

---

## 🗄️ Problèmes de Base de Données

### Base de Données Verrouillée

**Erreur** : `database is locked`

**Solution** :
```bash
# Arrêter tous les processus Flask
pkill -f \"python app.py\"  # Linux/Mac
# ou
taskkill /F /IM python.exe  # Windows

# Attendre quelques secondes, puis redémarrer
cd site
python app.py
```

### Tables Manquantes

**Erreur** : `no such table: users` ou similaire

**Solution** :
```bash
cd site
python << 'EOF'
from database import init_db
init_db()
print(\"Base de données initialisée avec succès\")
EOF
```

### Corruption de Base de Données

**Erreur** : `database disk image is malformed`

**Solution** :
```bash
cd site/data

# Sauvegarder la base de données actuelle
cp morpheus.db morpheus.db.corrupt

# Essayer de récupérer
sqlite3 morpheus.db.corrupt \".dump\" | sqlite3 morpheus.db

# Si cela échoue, restaurer depuis la sauvegarde
cp backups/morpheus.db.backup morpheus.db
```

### Requêtes Lentes

**Problème** : Le tableau de bord prend 5+ secondes à charger

**Solution** :
```python
# Exécuter ceci une fois pour créer les index
from database import get_db

db = get_db()

db.execute(\"\"\"
    CREATE INDEX IF NOT EXISTS idx_readings_sensor_time 
    ON sensor_readings(sensor_id, timestamp DESC)
\"\"\")

db.execute(\"\"\"
    CREATE INDEX IF NOT EXISTS idx_readings_time 
    ON sensor_readings(timestamp DESC)
\"\"\")

db.commit()
print(\"Index créés\")
```

---

## 🔌 Problèmes de Connexion WebSocket

### WebSocket Ne Se Connecte Pas

**Problème** : Pas de mises à jour en temps réel, statut \"Déconnecté\"

**Diagnostiquer** :
```javascript
// Ouvrir la console du navigateur (F12), vérifier les erreurs
// Devrait voir : \"Connecté au serveur\"
```

**Solutions** :

1. **Vérifier la Correspondance des Versions Socket.IO** :
```bash
# Les versions serveur et client doivent correspondre
pip show flask-socketio
# S'assurer que static/js utilise un socket.io.js compatible
```

2. **Vérifier les Paramètres CORS** :
```python
# Dans app.py
socketio = SocketIO(app, cors_allowed_origins=\"*\")
# Ou origine spécifique :
# cors_allowed_origins=[\"http://localhost:5000\"]
```

3. **Problèmes de Pare-feu** :
```bash
# Autoriser le port 5000
# Pare-feu Windows : Ajouter une règle entrante pour le port 5000
# Linux : sudo ufw allow 5000
```

### Connexion Se Déconnecte Constamment

**Problème** : Se connecte puis se déconnecte à répétition

**Solution** :
```python
# Augmenter le délai dans app.py
socketio = SocketIO(
    app, 
    cors_allowed_origins=\"*\",
    ping_timeout=60,
    ping_interval=25
)
```

### Pas de Réception des Mises à Jour

**Problème** : Connecté mais pas de mises à jour de données

**Diagnostiquer** :
```python
# Vérifier si la surveillance a démarré
# Console navigateur :
socket.emit('start_monitoring', { interval: 5 });
```

**Solution** :
```python
# Débogage côté serveur dans app.py
@socketio.on('start_monitoring')
def handle_monitoring(data):
    print(f\"Surveillance démarrée pour l'utilisateur : {session.get('user_id')}\")
    # ... reste du code
```

---

## 📡 Problèmes d'Intégration Capteurs

### Capteur Non Détecté

**Problème** : Capteur USB/réseau non reconnu

**Solutions** :

1. **Capteurs USB** :
```bash
# Linux : Vérifier les permissions
ls -la /dev/ttyUSB*
sudo usermod -a -G dialout $USER  # Ajouter l'utilisateur au groupe dialout
# Se déconnecter et se reconnecter

# Windows : Vérifier le Gestionnaire de périphériques
# S'assurer que le pilote est installé pour le capteur
```

2. **Capteurs Réseau** :
```bash
# Tester la connectivité
ping <ip-capteur>

# Vérifier le pare-feu
telnet <ip-capteur> <port-capteur>
```

### Les Lectures Ne Sont Pas Enregistrées

**Problème** : Les données du capteur n'apparaissent pas dans la base de données

**Diagnostiquer** :
```python
# Tester l'écriture dans la base de données
from database import log_sensor_reading

sensor_id = 1
log_sensor_reading(sensor_id, 450, temperature=22.5)
print(\"Lecture de test enregistrée\")

# Vérifier si elle apparaît
from database import get_sensor_readings
readings = get_sensor_readings(sensor_id, days=1)
print(f\"Trouvé {len(readings)} lectures\")
```

### Lectures Incorrectes

**Problème** : Les valeurs de CO₂ semblent incorrectes (ex : toujours 400 ou 5000)

**Solutions** :

1. **Calibrer le capteur** - Suivre les instructions du fabricant
2. **Vérifier le type de capteur** - S'assurer du bon pilote/analyseur
3. **Vérifier les unités** - Certains capteurs rapportent dans différentes unités

---

## ⚡ Problèmes de Performance

### Chargement Lent du Tableau de Bord

**Solutions** :

1. **Activer la Mise en Cache** :
```python
# Dans l'utilisation de optimization.py
from optimization import cache_result

@cache_result(expire_seconds=300)
def get_dashboard_data():
    # ... opérations coûteuses
    return data
```

2. **Limiter la Plage de Données** :
```python
# Obtenir les dernières 24 heures au lieu de toutes les données
readings = get_sensor_readings(sensor_id, days=1, limit=500)
```

3. **Archiver les Anciennes Données** :
```bash
cd site
python << 'EOF'
from optimization import batch_archive_old_readings
from database import get_db

db = get_db()
batch_archive_old_readings(db, days_to_keep=90)
print(\"Anciennes données archivées\")
EOF
```

### Utilisation Mémoire Élevée

**Solutions** :

1. **Vider le Cache** :
```python
from optimization import cache
cache.clear()
```

2. **Réduire la Fréquence WebSocket** :
```javascript
// Changer l'intervalle de 1 à 5 secondes
socket.emit('start_monitoring', { interval: 5 });
```

### Exports Lents

**Problème** : L'export CSV/Excel prend trop de temps

**Solution** :
```python
# Utiliser la pagination pour les exports volumineux
def export_data_paginated(sensor_id, days):
    page_size = 10000
    page = 1
    
    while True:
        readings = get_sensor_readings(
            sensor_id, days, 
            limit=page_size, 
            offset=(page-1)*page_size
        )
        if not readings:
            break
        
        # Écrire dans le fichier
        yield readings
        page += 1
```

---

## 💾 Problèmes d'Export & Données

### Échec de l'Export

**Erreur** : \"Échec de l'export\" ou CSV vide

**Solutions** :

1. **Vérifier les Permissions** :
```bash
# S'assurer des permissions d'écriture sur le répertoire export
chmod 755 site/exports
```

2. **Vérifier l'Espace Disque** :
```bash
df -h  # Linux/Mac
# ou Windows : clic droit sur le lecteur → Propriétés
```

3. **Tester la Fonction d'Export** :
```python
from export_manager import export_to_csv

data = [{'timestamp': '2026-01-05', 'co2': 450}]
result = export_to_csv(data, 'test_export.csv')
print(\"Export réussi :\", result)
```

### Format CSV Invalide

**Problème** : Impossible d'ouvrir le CSV exporté dans Excel

**Solution** :
```python
# S'assurer d'un encodage et BOM appropriés
import csv

with open('export.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['timestamp', 'co2'])
    writer.writeheader()
    writer.writerows(data)
```

---

## 🐛 Débogage Général

### Activer le Mode Debug

```python
# Dans app.py
app.config['DEBUG'] = True

# Lancer avec sortie verbeuse
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

### Vérifier les Journaux

```bash
# Voir la sortie console
python app.py 2>&1 | tee app.log

# Ou rediriger vers fichier
python app.py > app.log 2>&1
```

### Débogage Console Navigateur

```javascript
// Ouvrir les Outils de Développement (F12)
// L'onglet Console affiche les erreurs

// Vérifier l'activité réseau
// Onglet Réseau → Filtrer : WS (WebSockets)

// Vérifier ce qui est envoyé
socket.on('connect', () => console.log('Connecté!'));
socket.on('disconnect', () => console.log('Déconnecté!'));
socket.on('error', (error) => console.error('Erreur socket:', error));
```

### Inspection de la Base de Données

```bash
# Ouvrir la base de données
sqlite3 site/data/morpheus.db

# Commandes utiles :
.tables                          # Lister toutes les tables
.schema users                    # Montrer la structure de table
SELECT COUNT(*) FROM users;      # Compter les enregistrements
SELECT * FROM users LIMIT 5;     # Voir des exemples de données
.quit                            # Quitter
```

### Débogage Python

```python
# Ajouter des points d'arrêt
import pdb; pdb.set_trace()

# Ou utiliser le débogage print
print(f\"DEBUG : user_id = {user_id}, data = {data}\")

# Vérifier les types de variables
print(f\"Type de data : {type(data)}\")
```

---

## 🆘 Toujours des Problèmes ?

### Collecter les Informations de Diagnostic

Exécutez ce script de diagnostic :

```python
# diagnostic.py
import sys
import flask
import sqlite3
import os

print(\"=== Infos Diagnostic Morpheus ===\")
print(f\"Version Python : {sys.version}\")
print(f\"Version Flask : {flask.__version__}\")
print(f\"Répertoire actuel : {os.getcwd()}\")
print(f\"Base de données existe : {os.path.exists('data/morpheus.db')}\")

try:
    db = sqlite3.connect('data/morpheus.db')
    cursor = db.execute(\"SELECT COUNT(*) FROM users\")
    print(f\"Nombre d'utilisateurs : {cursor.fetchone()[0]}\")
    db.close()
except Exception as e:
    print(f\"Erreur base de données : {e}\")

print(\"==================================\")
```

### Tout Réinitialiser

**Réinitialisation complète** (ATTENTION : supprime toutes les données) :

```bash
# Sauvegarder d'abord !
cp -r site/data site/data.backup

# Supprimer la base de données
rm site/data/morpheus.db

# Vider le cache
rm -rf site/__pycache__

# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall

# Initialiser une base de données fraîche
cd site
python -c \"from database import init_db; init_db()\"

# Démarrer le serveur
python app.py
```

---

## 📚 Aide Supplémentaire

- Consultez le [Guide de Démarrage](GUIDE-DEMARRAGE.md) pour les étapes de configuration
- Vérifiez la [Référence API](REFERENCE-API.md) pour les détails des endpoints
- Voir le [Guide Développeur](GUIDE-DEVELOPPEUR.md) pour le débogage au niveau code
- Cherchez dans les tickets fermés sur GitHub
- Créez un nouveau ticket avec les infos de diagnostic

---

**La plupart des problèmes résolus ?** Super ! Retour au [Guide Utilisateur](GUIDE-UTILISATEUR.md).
