# Guide de Démarrage avec Morpheus

Guide complet pour installer, configurer et utiliser le système de surveillance CO₂ Morpheus.

## 📋 Table des Matières

- [Configuration Système](#configuration-système)
- [Installation](#installation)
- [Premier Lancement](#premier-lancement)
- [Inscription Utilisateur](#inscription-utilisateur)
- [Vue d'Ensemble du Tableau de Bord](#vue-densemble-du-tableau-de-bord)
- [Configuration des Capteurs](#configuration-des-capteurs)
- [Prochaines Étapes](#prochaines-étapes)

## 🖥️ Configuration Système

### Configuration Minimale
- **OS** : Windows 10/11, macOS 10.14+, Linux (Ubuntu 20.04+)
- **Python** : 3.8 ou supérieur
- **RAM** : 2 Go minimum, 4 Go recommandé
- **Stockage** : 500 Mo pour l'application + espace pour le stockage des données
- **Navigateur** : Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

### Configuration Réseau
- Port 5000 disponible pour le serveur web
- Pour l'intégration des capteurs : Accès réseau aux appareils de capteurs

## 📥 Installation

### Étape 1 : Télécharger/Cloner le Projet

```bash
# Naviguez vers le répertoire du projet
cd Morpheus
```

### Étape 2 : Configurer l'Environnement Python (Recommandé)

Créez un environnement virtuel pour isoler les dépendances :

```bash
# Créer l'environnement virtuel
python -m venv venv

# L'activer
# Sur Windows :
venv\Scripts\activate
# Sur macOS/Linux :
source venv/bin/activate
```

### Étape 3 : Installer les Dépendances

```bash
pip install -r requirements.txt
```

**Dépendances clés installées :**
- Flask (framework web)
- Flask-SocketIO (communication en temps réel)
- pandas & numpy (analyse de données)
- scikit-learn (analyses ML)
- openpyxl (export Excel)

### Étape 4 : Initialiser la Base de Données

La base de données est automatiquement créée au premier lancement, mais vous pouvez vérifier :

```bash
cd site
python -c "from database import init_db; init_db()"
```

## 🎬 Premier Lancement

### Démarrer le Serveur

```bash
cd site
python app.py
```

Vous devriez voir :
```
* Running on http://127.0.0.1:5000
* Running on http://192.168.1.X:5000
```

### Accéder à l'Application

Ouvrez votre navigateur à : **http://localhost:5000**

## 👤 Inscription Utilisateur

### Créer Votre Compte

1. Cliquez sur **S'inscrire** sur la page d'accueil
2. Remplissez le formulaire :
   - **Nom d'utilisateur** : 3-50 caractères, alphanumériques
   - **Email** : Adresse email valide (pour réinitialiser le mot de passe)
   - **Mot de passe** : Minimum 6 caractères
3. Cliquez sur **S'inscrire**
4. Vous serez redirigé vers la page de connexion

### Première Connexion

1. Entrez votre nom d'utilisateur et mot de passe
2. Cliquez sur **Se connecter**
3. Vous verrez le guide d'intégration (première fois seulement)

### Vérification Email (Optionnel)

Si la vérification email est activée :
1. Vérifiez votre email pour le lien de vérification
2. Cliquez sur le lien pour vérifier
3. Retournez à la page de connexion

## 🎛️ Vue d'Ensemble du Tableau de Bord

Après la connexion, vous verrez le tableau de bord principal avec :

### Menu de Navigation
- **Tableau de Bord** : Vue de surveillance principale
- **Capteurs** : Gérer vos capteurs
- **Analyses** : Voir les tendances et rapports
- **Paramètres** : Configurer les préférences
- **Admin** (si admin) : Gestion système

### Widgets du Tableau de Bord Principal

1. **Moniteur CO₂ en Temps Réel**
   - Niveau de CO₂ actuel (PPM)
   - Indicateur d'état (Bon/Avertissement/Critique)
   - Graphique de mise à jour en direct
   - Flèche de tendance (augmentation/diminution/stable)

2. **État des Capteurs**
   - Nombre de capteurs actifs
   - Horodatage de la dernière lecture
   - Basculement rapide des capteurs

3. **Alertes**
   - Violations de seuil récentes
   - Notifications système
   - Historique des alertes

4. **Actions Rapides**
   - Exporter les données
   - Voir l'historique
   - Configurer les seuils

## 🔧 Configuration des Capteurs

### Ajouter Votre Premier Capteur

1. Cliquez sur **Capteurs** dans la navigation
2. Cliquez sur **Ajouter Nouveau Capteur**
3. Remplissez les détails du capteur :
   ```
   Nom : Capteur CO2 Bureau
   Emplacement : Bureau Principal
   Type : MH-Z19B
   ```
4. Cliquez sur **Enregistrer**

### Configurer les Seuils du Capteur

1. Sélectionnez votre capteur
2. Cliquez sur **Configurer les Seuils**
3. Définissez les niveaux de seuil :
   - **Bon** : < 800 PPM (vert)
   - **Avertissement** : 800-1200 PPM (jaune)
   - **Critique** : > 1200 PPM (rouge)
4. Activez les alertes si désiré

### Connecter un Capteur Physique

Pour l'intégration matérielle, consultez les guides spécifiques aux capteurs :

- **Capteurs USB** : `docs/sensors/CAPTEURS-USB.md`
- **Capteurs Réseau** : `docs/sensors/CAPTEURS-RESEAU.md`
- **Intégration API** : `docs/REFERENCE-API.md`

### Saisie Manuelle de Données (Test)

Vous pouvez ajouter manuellement des lectures pour les tests :

1. Allez à **Capteurs** → Sélectionnez le capteur
2. Cliquez sur **Ajouter Lecture**
3. Entrez la valeur CO₂ (PPM)
4. Cliquez sur **Soumettre**

## 📊 Utilisation de Base

### Voir les Données Historiques

1. Cliquez sur **Analyses** dans la navigation
2. Sélectionnez la plage de dates
3. Choisissez les capteurs à afficher
4. Consultez les graphiques et statistiques

### Exporter les Données

1. Cliquez sur le bouton **Exporter**
2. Choisissez le format (CSV ou Excel)
3. Sélectionnez la plage de dates
4. Cliquez sur **Télécharger**

### Configurer les Alertes

1. Allez à **Paramètres** → **Alertes**
2. Configurez les préférences de notification :
   - Notifications email
   - Notifications navigateur
   - Niveaux de seuil
3. Enregistrez les paramètres

## 🎯 Prochaines Étapes

Maintenant que vous êtes configuré, explorez ces guides :

1. **[Guide Utilisateur](GUIDE-UTILISATEUR.md)** - Présentation complète des fonctionnalités
2. **[Référence API](REFERENCE-API.md)** - Intégrer avec d'autres systèmes
3. **[Guide Développeur](GUIDE-DEVELOPPEUR.md)** - Personnaliser et étendre

### Configuration Recommandée

1. **Configurer les sauvegardes automatiques** : Voir [Guide Utilisateur - Sauvegardes](GUIDE-UTILISATEUR.md#sauvegardes)
2. **Configurer les exports programmés** : [Guide Utilisateur - Exports Programmés](GUIDE-UTILISATEUR.md#exports-programmes)
3. **Optimiser les performances** : [Guide Utilisateur - Performance](GUIDE-UTILISATEUR.md#performance)

## ❓ Questions Fréquentes

**Q : Puis-je exécuter ceci sur un Raspberry Pi ?**  
R : Oui ! Python 3.8+ est requis. Les performances peuvent varier avec de nombreux utilisateurs simultanés.

**Q : Comment le rendre accessible depuis d'autres appareils ?**  
R : Le serveur se lie à toutes les interfaces par défaut. Accédez via `http://[VOTRE-IP]:5000`

**Q : Puis-je changer le port ?**  
R : Oui, éditez la variable `PORT` dans `site/app.py`

**Q : Les données sont-elles stockées de manière sécurisée ?**  
R : Oui, les mots de passe sont hachés avec bcrypt. Utilisez HTTPS en production.

## 🆘 Dépannage

Si vous rencontrez des problèmes :

1. Consultez le [Guide de Dépannage](DEPANNAGE.md)
2. Vérifiez que toutes les dépendances sont installées : `pip list`
3. Consultez les journaux du serveur pour les erreurs
4. Assurez-vous que le port 5000 est disponible

---

**Prêt à explorer ?** Continuez avec le [Guide Utilisateur](GUIDE-UTILISATEUR.md) pour une documentation détaillée des fonctionnalités.
