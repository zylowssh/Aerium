# Morpheus - Système de Surveillance de la Qualité de l'Air CO₂

<div align="center">

![Python Version](https://img.shields.io/badge/python-3.8%2B-blue)
![Flask](https://img.shields.io/badge/flask-3.0%2B-green)
![Licence](https://img.shields.io/badge/licence-MIT-orange)
![Statut](https://img.shields.io/badge/statut-production-brightgreen)

**Une application web de surveillance de la qualité de l'air en temps réel pour suivre et analyser les niveaux de CO₂**

[Démarrage Rapide](#-démarrage-rapide) • [Documentation](docs/INDEX.md) • [Démo](#-captures-décran) • [Contribuer](#-contribuer)

</div>

---

## 📖 À Propos

Morpheus est une application web complète de surveillance de la qualité de l'air construite avec Flask et SocketIO. Elle permet de suivre en temps réel les niveaux de CO₂ dans vos espaces de travail, bureaux, écoles ou maisons, avec des analyses avancées et des alertes intelligentes.

### 🎯 Pourquoi Morpheus ?

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

## 🚀 Démarrage Rapide

### Prérequis

- Python 3.8+
- Gestionnaire de paquets pip

### Installation

1. Clonez le dépôt :
```bash
cd Morpheus
```

2. Installez les dépendances :
```bash
pip install -r requirements.txt
```

3. Lancez l'application :
```bash
cd site
python app.py
```

4. Ouvrez votre navigateur à : `http://localhost:5000`

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
Morpheus/
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
DATABASE = 'data/morpheus.db'

# Fonctionnalités
ENABLE_CACHING = True
CACHE_TIMEOUT = 600  # secondes
```

## 🧪 Tests

Exécutez la suite de tests :

```bash
# Tests API
python test_api_endpoints.py

# Tests capteurs
python test_sensor_api.py

# Fonctionnalités avancées
python test_advanced_endpoints.py
```

## 🤝 Contribuer

1. Forkez le dépôt
2. Créez votre branche de fonctionnalité : `git checkout -b feature/fonctionnalite-incroyable`
3. Committez vos changements : `git commit -m 'Ajout fonctionnalité incroyable'`
4. Poussez vers la branche : `git push origin feature/fonctionnalite-incroyable`
5. Ouvrez une Pull Request

Consultez le [Guide Développeur](docs/DEVELOPER-GUIDE.md) pour des directives de contribution détaillées.

## 📄 Licence

Ce projet est sous licence MIT.
📊 Captures d'Écran

### Tableau de Bord Principal
*Interface de surveillance en temps réel avec graphiques et indicateurs de statut*

### Gestion des Capteurs
*Configuration et gestion de plusieurs capteurs avec seuils personnalisés*

### Analyses & Rapports
*Visualisation des tendances historiques et statistiques avancées*

> 💡 **Note** : Ajoutez vos propres captures d'écran dans ce dossier : `docs/images/`

---

## ❓ FAQ

<details>
<summary><b>Quels capteurs CO₂ sont compatibles ?</b></summary>

Morpheus supporte :
- Capteurs USB série (MH-Z19, SCD30, etc.)
- Capteurs réseau (HTTP/MQTT)
- Intégration via API REST
- Saisie manuelle pour tests

Consultez la [documentation des capteurs](docs/GUIDE-UTILISATEUR.md#gestion-des-capteurs) pour plus de détails.
</details>

<details>
<summary><b>Puis-je utiliser Morpheus sur un Raspberry Pi ?</b></summary>

Oui ! Morpheus fonctionne parfaitement sur Raspberry Pi 3/4 avec Python 3.8+. Recommandé pour :
- Installations permanentes
- Déploiement multi-sites
- Intégration IoT
</details>

<details>
<summary><b>Comment sécuriser l'installation en production ?</b></summary>

Pour la production :
1. Utilisez HTTPS avec un certificat SSL
2. Configurez un SECRET_KEY fort
3. Mettez en place un proxy inverse (Nginx)
4. Activez les sauvegardes automatiques
5. Consultez le [Guide de Déploiement](docs/GUIDE-DEVELOPPEUR.md#déploiement)
</details>

<details>
<summary><b>Les données sont-elles stockées localement ?</b></summary>

Oui, toutes les données sont stockées dans une base SQLite locale. Aucune donnée n'est envoyée vers des serveurs externes sauf si vous configurez des intégrations cloud optionnelles.
</details>

---

## 🆘 Support & Communauté

### Obtenir de l'Aide

- 📖 **Documentation** : [docs/INDEX.md](docs/INDEX.md)
- 🐛 **Bugs** : [Ouvrir un ticket](https://github.com/votre-repo/issues)
- 💬 **Discussions** : [Forum communautaire](https://github.com/votre-repo/discussions)
- 🔧 **Dépannage** : [Guide de Dépannage](docs/DEPANNAGE.md)

### Ressources Utiles

- [Référence API complète](docs/REFERENCE-API.md)
- [Exemples de code](docs/GUIDE-DEVELOPPEUR.md#exemples)
- [Changelog](CHANGELOG.md)

---

## 🎯 Feuille de Route

### ✅ Version 2.0 (Actuelle)
- Support multi-capteurs
- Analyses ML avancées
- API REST et WebSocket
- Optimisations de performance

### 🚧 Prochaines Versions

**v2.1** (Q1 2026)
- [ ] Application mobile (iOS/Android)
- [ ] Support multi-sites
- [ ] Alertes SMS

**v2.2** (Q2 2026)
- [ ] Dashboard personnalisable
- [ ] Intégration Home Assistant
- [ ] Export automatique cloud

**v3.0** (Q3 2026)
- [ ] Prédictions ML temps réel
- [ ] Clustering multi-bâtiments
- [ ] API publique étendue

[Voir la feuille de route complète](docs/ROADMAP.md)

---

## 🏆 Contributeurs

Merci à tous ceux qui ont contribué au projet !

<!-- Ajoutez vos contributeurs ici -->

---

## 📜 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- Flask et la communauté Python
- Chart.js pour les visualisations
- Socket.IO pour le temps réel
- Tous les contributeurs et utilisateurs

---

<div align="center">

**Version** : 2.0  
**Dernière Mise à Jour** : Janvier 2026

Made with ❤️ pour un air plus sain

[⬆ Retour en haut](#morpheus---système-de-surveillance-de-la-qualité-de-lair-co₂)

</div>
**Dernière Mise à Jour** : Janvier 2026
