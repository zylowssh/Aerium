# 🚀 Guide d'Installation

Ce guide vous montre comment installer et configurer Aerium sur votre machine.

## 📋 Prérequis

### Système d'Exploitation
- Windows 10+, macOS 10.14+, ou Linux (Ubuntu 20.04+)
- Minimum 4 GB RAM
- 500 MB espace disque libre

### Logiciels Requis
- **Node.js** 18.0 ou supérieur ([télécharger](https://nodejs.org/))
- **Python** 3.10 ou supérieur ([télécharger](https://www.python.org/))
- **Git** ([télécharger](https://git-scm.com/))
- **Bun** (optionnel, pour meilleure performance) ([télécharger](https://bun.sh/))

## ⚡ Installation Rapide (5 minutes)

### 1. Cloner le Projet

```bash
git clone https://github.com/yourusername/air-sense-dashboard.git
cd air-sense-dashboard
```

### 2. Configuration Backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate

# Activer l'environnement (macOS/Linux)
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
>>>     db.create_all()
>>> exit()
```

### 3. Configuration Frontend

```bash
# Retour à la racine
cd ..

# Installer les dépendances
npm install
# ou si vous utilisez Bun
bun install
```

### 4. Créer les fichiers .env

**Backend** - `backend/.env`:
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///aerium.db
ENABLE_RATE_LIMITING=True
ENABLE_EMAIL_NOTIFICATIONS=False
```

**Frontend** - `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 5. Démarrer l'Application

```bash
# Lancer les services (Frontend + Backend)
./start.sh    # macOS/Linux
start.bat     # Windows
```

L'application sera disponible à:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000

## 🔑 Identifiants de Test

Après le démarrage, utilisez ces comptes pour tester:

| Rôle | Email | Mot de Passe |
|------|-------|-------------|
| Admin | admin@aerium.app | admin123 |
| Utilisateur | demo@aerium.app | demo123 |

## 📦 Installation Manuelle (Détaillée)

### Setup Backend Complet

```bash
cd backend

# 1. Créer l'environnement virtuel
python3 -m venv venv

# 2. Activer
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Mettre à jour pip
pip install --upgrade pip

# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Initialiser la BD avec des données de démo
python seed_database.py

# 6. Lancer le serveur
python app.py
```

Le serveur démarrera sur `http://localhost:5000`

### Setup Frontend Complet

```bash
# À la racine du projet

# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env
# VITE_API_URL=http://localhost:5000/api

# 3. Lancer en mode développement
npm run dev
```

Le frontend démarrera sur `http://localhost:8080`

## 🐳 Installation avec Docker (Optionnel)

```bash
# À implémenter - fichiers Docker à créer
```

## ✅ Vérification de l'Installation

Après le démarrage, testez ces URLs:

1. **Frontend**: http://localhost:8080 - Vous devriez voir la page d'accueil
2. **Backend**: http://localhost:5000/api/sensors - Vous devriez voir un message d'erreur 401 (normal sans authentification)
3. **Login**: http://localhost:8080/auth - Connectez-vous avec demo@aerium.app

## 🐛 Dépannage

### Backend ne démarre pas

```bash
# Vérifier la version Python
python --version  # Doit être 3.10+

# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall

# Vérifier si le port 5000 est utilisé
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -i :5000
```

### Frontend ne démarre pas

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Vider le cache Vite
rm -rf dist
npm run dev
```

### Erreurs de Base de Données

```bash
# Supprimer la BD existante
rm backend/instance/aerium.db

# Réinitialiser
cd backend
python seed_database.py
cd ..
```

### Erreurs CORS

- Vérifier que le frontend est sur http://localhost:8080
- Vérifier que le backend est sur http://localhost:5000
- Vérifier le fichier `.env` du frontend

## 📖 Prochaines Étapes

- 📚 [Guide d'Utilisation](USAGE.md) - Comment utiliser l'application
- 🏗️ [Architecture](guides/ARCHITECTURE.md) - Comprendre la structure
- 🔌 [API Reference](guides/API_REFERENCE.md) - Détails des endpoints
- 🚀 [Déploiement](guides/DEPLOYMENT.md) - Mise en production
