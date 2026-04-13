# Aerium - Système de Surveillance de la Qualité de l'Air CO₂

<div align="center">

![Python Version](https://img.shields.io/badge/python-3.8%2B-blue)
![Flask](https://img.shields.io/badge/flask-3.0%2B-green)
![Licence](https://img.shields.io/badge/licence-MIT-orange)
![Statut](https://img.shields.io/badge/statut-production-brightgreen)

**Une application web de surveillance de la qualité de l'air en temps réel pour suivre et analyser les niveaux de CO₂**

[Démarrage Rapide](#-démarrage-rapide) • [Documentation](docs/INDEX.md) • [Démo](#-captures-décran)

</div>

---

## 📖 À Propos

Aerium est une application web complète de surveillance de la qualité de l'air construite avec Flask et SocketIO. Elle permet de suivre en temps réel les niveaux de CO₂ dans vos espaces de travail, bureaux, écoles ou maisons, avec des analyses avancées et des alertes intelligentes.

### 🎯 Pourquoi Aerium ?

- **🏢 Espaces de Travail** : Surveillez la qualité de l'air dans vos bureaux pour améliorer la productivité
- **🏫 Établissements Scolaires** : Assurez un environnement d'apprentissage optimal
- **🏠 Usage Domestique** : Surveillez la ventilation et la qualité de l'air intérieur
- **🔬 Recherche** : Collectez et analysez des données environnementales
- **🏭 Industrie** : Conformité aux normes de qualité de l'air

## ✨ Fonctionnalités

- **Surveillance en Temps Réel**: Mises à jour des données CO₂ en direct via WebSocket
- **Système Multi-utilisateurs**: Authentification sécurisée avec contrôle d'accès basé sur les rôles (utilisateur/admin)
- **Gestion des Capteurs**: Support de plusieurs capteurs avec seuils individuels
- **Analyses de Données**: Analyse des données historiques, tendances et recommandations basées sur le ML
- **Export & Planification**: Export des données vers CSV/Excel avec exports automatisés programmés
- **Tableau de Bord Admin**: Surveillance de la santé du système, gestion des utilisateurs et journaux d'audit
- **Optimisation des Performances**: Mise en cache, pagination et limitation de débit pour la scalabilité

## 🚀 Démarrage rapide

### Prérequis

- Python 3.8+

### Installation et exécution (cross-platform)

1) Créez et activez un environnement virtuel (Windows/macOS/Linux):

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1   # PowerShell (Windows)
# ou .\\.venv\\Scripts\\activate    # cmd.exe (Windows)
```

```bash
python3 -m venv .venv
source .venv/bin/activate          # macOS / Linux
```

2) Installez les dépendances:

```bash
python -m pip install -r requirements.txt
```

3) Initialisez la base de données si nécessaire (exemple) :

```bash
mkdir -p data
python site/app.py --init-db
```

4) Lancez l'application :

```bash
cd site
python app.py
# ou avec flask: set FLASK_APP=app.py && flask run
```

5) Ouvrez votre navigateur à : `http://localhost:5000`

### Premiers Pas

1. Créez un nouveau compte
2. Configurez vos capteurs CO₂
3. Définissez les alertes de seuil
4. Commencez la surveillance !

## 📚 Documentation

Une documentation complète est disponible dans le dossier [`docs/`](docs/) :

- 📘 **[Index de Documentation](docs/INDEX.md)** - Hub principal de documentation
- 🚀 **[Guide de Démarrage](docs/GUIDE-DEMARRAGE.md)** - Installation et utilisation de base
- 📖 **[Guide Utilisateur](docs/GUIDE-UTILISATEUR.md)** - Présentation complète des fonctionnalités
- 🔌 **[Référence API](docs/REFERENCE-API.md)** - Documentation de l'API REST et WebSocket
- 💻 **[Guide Développeur](docs/GUIDE-DEVELOPPEUR.md)** - Contribution et configuration de développement
- 🆘 **[Dépannage](docs/DEPANNAGE.md)** - Problèmes courants et solutions

## 🏗️ Structure du Projet

```
Aerium/
├── site/                  # Application principale
│   ├── app.py            # Application Flask
│   ├── database.py       # Opérations de base de données
│   ├── admin_tools.py    # Utilitaires admin
│   ├── static/           # CSS, JS, images
│   ├── templates/        # Templates HTML
│   └── sensors/          # Gestion des capteurs
├── app/                   # Utilitaires supplémentaires
│   ├── datamanager.py    # Traitement des données
│   └── sensors/          # Interfaces des capteurs
├── data/                  # Base de données et sauvegardes
├── docs/                  # Documentation
└── tests/                 # Suite de tests
```

## 🔧 Configuration

Options de configuration principales dans `app.py` :

```python
# Paramètres du serveur
app.config['SECRET_KEY'] = 'votre-clé-secrète'
HOST = '0.0.0.0'
PORT = 5000

# Base de données
DATABASE = 'data/aerium.db'

# Fonctionnalités
ENABLE_CACHING = True
CACHE_TIMEOUT = 600  # secondes
```

## 🧪 Tests

Exécutez la suite de tests (recommandé `pytest` lorsque disponible) :

```bash
# Exécuter l'ensemble des tests
pytest -q

# ou lancer des tests individuels
python test_api_endpoints.py
```

## 📊 Captures d'Écran

### Tableau de Bord Principal
*Interface de surveillance en temps réel avec graphiques et indicateurs de statut*

### Gestion des Capteurs
*Configuration et gestion de plusieurs capteurs avec seuils personnalisés*

### Analyses & Rapports
*Visualisation des tendances historiques et statistiques avancées*

> 💡 **Note** : Ajoutez vos propres captures d'écran dans ce dossier : `docs/images/`
