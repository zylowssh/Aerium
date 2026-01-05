# Guide Utilisateur

Guide complet pour utiliser toutes les fonctionnalités du système de surveillance CO₂ Morpheus.

## 📋 Table des Matières

1. [Gestion du Compte Utilisateur](#gestion-du-compte-utilisateur)
2. [Gestion des Capteurs](#gestion-des-capteurs)
3. [Surveillance en Temps Réel](#surveillance-en-temps-réel)
4. [Analyses de Données](#analyses-de-données)
5. [Export de Données](#export-de-données)
6. [Alertes & Notifications](#alertes--notifications)
7. [Paramètres Utilisateur](#paramètres-utilisateur)
8. [Fonctionnalités Admin](#fonctionnalités-admin)
9. [Fonctionnalités Avancées](#fonctionnalités-avancées)

---

## 👤 Gestion du Compte Utilisateur

### Paramètres du Profil

Accès : **Paramètres** → **Profil**

- **Changer le Nom d'utilisateur** : Mettre à jour votre nom d'affichage
- **Mettre à Jour l'Email** : Changer l'email pour les notifications
- **Changer le Mot de Passe** : Mettre à jour votre mot de passe
- **Avatar** : Télécharger une photo de profil (si activé)

### Réinitialisation du Mot de Passe

Si vous oubliez votre mot de passe :

1. Cliquez sur **Mot de passe oublié ?** sur la page de connexion
2. Entrez votre adresse email
3. Vérifiez l'email pour le lien de réinitialisation (valide 1 heure)
4. Cliquez sur le lien et entrez un nouveau mot de passe
5. Connectez-vous avec le nouveau mot de passe

### Sécurité

- **Authentification à Deux Facteurs** : Activer dans Paramètres → Sécurité (si disponible)
- **Gestion de Session** : Voir les sessions actives, déconnexion de tous les appareils
- **Historique de Connexion** : Voir votre activité de connexion récente

---

## 🔧 Gestion des Capteurs

### Ajouter des Capteurs

1. Naviguez vers la page **Capteurs**
2. Cliquez sur **Ajouter Nouveau Capteur**
3. Remplissez les détails :
   - **Nom** : Nom descriptif (ex : \"Bureau Principal\")
   - **Emplacement** : Emplacement physique
   - **Type** : Modèle de capteur (optionnel)
   - **Description** : Notes supplémentaires
4. Cliquez sur **Créer Capteur**

### Modifier les Capteurs

1. Allez à **Capteurs** → Cliquez sur la carte du capteur
2. Cliquez sur le bouton **Modifier**
3. Mettez à jour les champs nécessaires
4. Cliquez sur **Enregistrer les Modifications**

### Configuration du Capteur

**Seuils** :
```
Bon :      < 800 PPM    (Vert)
Avertissement : 800-1200 PPM (Jaune)
Critique : > 1200 PPM   (Rouge)
```

**Personnaliser les seuils** :
1. Sélectionnez le capteur
2. Cliquez sur l'onglet **Seuils**
3. Ajustez les valeurs
4. Activer/désactiver les alertes
5. Enregistrer

**Disponibilité** :
- Basculer le capteur actif/inactif
- Les capteurs inactifs ne reçoivent pas de données ni ne déclenchent d'alertes
- À utiliser pour la maintenance ou la mise hors service

### Supprimer des Capteurs

1. Sélectionnez le capteur à supprimer
2. Cliquez sur le bouton **Supprimer**
3. Confirmez la suppression
4. ⚠️ **Attention** : Toutes les données historiques de ce capteur seront archivées

---

## 📊 Surveillance en Temps Réel

### Vue du Tableau de Bord

Le tableau de bord affiche :

**Lectures Actuelles** :
- Dernière valeur de CO₂ (PPM)
- Horodatage de la dernière lecture
- Indicateur d'état (codé par couleur)
- Flèche de tendance (augmentation/diminution/stable)

**Graphique en Direct** :
- Graphique linéaire en temps réel
- Dernières 24 heures par défaut
- Auto-échelle à la plage de données
- Survolez pour les valeurs exactes

### Vue Multi-Capteurs

**Disposition en Grille** :
- Tous les capteurs actifs affichés
- Cartes d'état individuelles
- Comparaison rapide

**Vue Liste** :
- Informations détaillées sur les capteurs
- Triable par nom, valeur, état
- Options de filtre

### Rafraîchissement Automatique

Le tableau de bord se met à jour automatiquement via WebSocket :
- Défaut : Toutes les 5 secondes
- Ajustable dans les paramètres (1-60 secondes)
- Mettre en pause les mises à jour avec le bouton **Pause**

---

## 📈 Analyses de Données

### Vue des Données Historiques

Accès : Page **Analyses**

**Sélection de Plage de Dates** :
- Dernières 24 heures
- 7 derniers jours
- 30 derniers jours
- Plage personnalisée (sélecteur de dates)

**Sélection de Capteur** :
- Sélectionner un ou plusieurs capteurs
- Comparer les capteurs sur le même graphique
- Vue individuelle ou combinée

### Statistiques

**Statistiques Récapitulatives** (par période sélectionnée) :
- Niveau moyen de CO₂
- Valeur minimale (et quand)
- Valeur maximale (et quand)
- Temps dans chaque zone de seuil
- Nombre d'alertes déclenchées

**Graphiques Disponibles** :
1. **Graphique Linéaire** : Tendance dans le temps
2. **Graphique à Barres** : Moyennes quotidiennes/horaires
3. **Carte Thermique** : Motifs heure du jour
4. **Distribution** : Histogramme de fréquence des valeurs

### Tendances & Insights

**Analyse Automatique** :
- Identification des heures de pointe
- Motifs hebdomadaires
- Détection d'anomalies
- Tendances d'amélioration/dégradation

**Recommandations ML** (si activé) :
- Valeurs futures prédites
- Ajustements de seuils suggérés
- Recommandations de maintenance
- Conseils d'optimisation

### Fonction de Comparaison

Comparer plusieurs capteurs ou périodes :

1. Cliquez sur le bouton **Comparer**
2. Sélectionnez le type de comparaison :
   - Capteur à capteur
   - Période à période
   - Analyse avant/après
3. Voir la comparaison côte à côte

---

## 💾 Export de Données

### Export Manuel

**Export Rapide** :
1. Cliquez sur le bouton **Exporter** (en haut à droite)
2. Sélectionnez le format :
   - **CSV** : Valeurs séparées par des virgules
   - **Excel** : .xlsx avec formatage
   - **JSON** : Format de données brutes
3. Choisissez la plage de dates
4. Sélectionnez les capteurs
5. Cliquez sur **Télécharger**

**Contenu de l'Export** :
- Horodatage
- ID/Nom du capteur
- Lecture de CO₂ (PPM)
- Statut
- Emplacement
- Notes (le cas échéant)

### Exports Programmés

Configurer des exports automatiques :

1. Allez à **Paramètres** → **Exports**
2. Cliquez sur **Nouveau Planning**
3. Configurer :
   ```
   Fréquence : Quotidien/Hebdomadaire/Mensuel
   Heure : 02:00
   Format : Excel
   Capteurs : Tous actifs
   Email à : votre@email.com
   ```
4. Cliquez sur **Créer Planning**

**Fonctionnalités d'Export Programmé** :
- Génération automatique
- Livraison par email
- Téléversement stockage cloud (si configuré)
- Politique de rétention

### Export en Masse

Exporter toutes les données historiques :

1. **Admin** → **Gestion des Données** → **Export en Masse**
2. Sélectionner :
   - Tous les capteurs ou capteurs spécifiques
   - Plage de dates complète
   - Inclure les données archivées (optionnel)
3. Cliquez sur **Générer** (peut prendre plusieurs minutes)
4. Lien de téléchargement envoyé par email

---

## 🔔 Alertes & Notifications

### Types d'Alertes

1. **Alertes de Seuil** : Le CO₂ dépasse le niveau configuré
2. **Capteur Hors Ligne** : Le capteur n'a pas signalé en X minutes
3. **Alertes Système** : Problèmes serveur, maintenance
4. **Alertes Utilisateur** : Activité du compte, changements de mot de passe

### Canaux de Notification

**Notifications Navigateur** :
- Activer dans Paramètres → Notifications
- Nécessite la permission du navigateur
- Notifications bureau quand le navigateur est ouvert

**Notifications Email** :
- Alertes immédiates
- Option de résumé quotidien
- Configurable par type d'alerte

**Notifications In-App** :
- Icône cloche dans l'en-tête
- Historique des alertes
- Marquer comme lu/non lu

### Configuration des Alertes

1. Allez à **Paramètres** → **Alertes**
2. Pour chaque capteur :
   - Activer/désactiver les alertes
   - Définir les valeurs de seuil
   - Choisir les méthodes de notification
   - Définir les heures silencieuses (optionnel)
3. **Paramètres Globaux** :
   - Limite de fréquence de notification
   - Période de refroidissement des alertes
   - Regrouper les alertes similaires

### Historique des Alertes

Voir les alertes passées :

1. Cliquez sur l'icône cloche → **Tout Voir**
2. Filtrer par :
   - Plage de dates
   - Capteur
   - Type d'alerte
   - Gravité
3. Exporter le journal des alertes

---

## ⚙️ Paramètres Utilisateur

### Préférences d'Affichage

**Thème** :
- Mode clair
- Mode sombre
- Auto (suivre le système)

**Langue** :
- Français
- Anglais
- Plus à venir

**Unités** :
- PPM (parties par million)
- Pourcentage (le cas échéant)

**Format de l'Heure** :
- 12 heures (AM/PM)
- 24 heures

### Personnalisation du Tableau de Bord

**Disposition des Widgets** :
- Glisser-déposer les widgets
- Afficher/masquer les widgets
- Redimensionner les graphiques

**Vues Par Défaut** :
- Page d'accueil du tableau de bord
- Plage de temps par défaut
- Sélection de capteur par défaut
- Préférence de type de graphique

### Préférences de Données

**Rafraîchissement Automatique** :
- Activer/désactiver
- Intervalle (secondes)

**Rétention des Données** :
- Durée de conservation des données détaillées
- Quand agréger en horaire/quotidien

**Confidentialité** :
- Partager les données avec les analyses
- Autoriser les statistiques d'utilisation

---

## 👨‍💼 Fonctionnalités Admin

Accès : Menu **Admin** (rôle admin requis)

### Gestion des Utilisateurs

**Voir les Utilisateurs** :
- Liste de tous les utilisateurs inscrits
- Voir les détails utilisateur
- Historique de connexion
- Statistiques d'utilisation des données

**Gérer les Utilisateurs** :
- Créer de nouveaux utilisateurs
- Modifier les informations utilisateur
- Réinitialiser les mots de passe
- Changer les rôles utilisateur (utilisateur/admin)
- Désactiver/réactiver les comptes
- Supprimer les utilisateurs (avec options de rétention de données)

**Opérations en Masse** :
- Exporter la liste des utilisateurs
- Importer des utilisateurs depuis CSV
- Attributions de rôles en masse

### Analyses Système

**Vue d'Ensemble du Tableau de Bord** :
- Total des utilisateurs (actifs/inactifs)
- Total des capteurs
- Total des lectures
- Disponibilité du système
- Taille de la base de données

**Métriques de Performance** :
- Temps de réponse
- Connexions WebSocket actives
- Taux de succès du cache
- Utilisation mémoire
- Utilisation CPU

**Journaux d'Activité** :
- Connexions utilisateur récentes
- Motifs d'accès aux données
- Fréquence des erreurs
- Statistiques d'utilisation API

### Maintenance Système

**Gestion de la Base de Données** :
- Voir les statistiques de base de données
- Exécuter les vérifications d'intégrité
- Optimiser les tables
- Créer une sauvegarde manuelle
- Restaurer depuis une sauvegarde
- Archiver les anciennes données

**Gestion du Cache** :
- Voir les statistiques du cache
- Vider le cache
- Ajuster les paramètres du cache

**Journaux d'Audit** :
- Voir toutes les actions système
- Filtrer par utilisateur/action/date
- Exporter la piste d'audit
- Rapports de conformité

### Configuration Système

**Paramètres Généraux** :
- Nom du site et branding
- Inscription : Ouverte/Fermée/Sur invitation
- Paramètres email (SMTP)
- Fuseau horaire

**Paramètres de Sécurité** :
- Exigences de mot de passe
- Délai d'expiration de session
- Limitation de débit
- Liste blanche/noire IP

**Bascules de Fonctionnalités** :
- Activer/désactiver les analyses ML
- Activer/désactiver les exports programmés
- Activer/désactiver les fonctionnalités de collaboration

---

## 🚀 Fonctionnalités Avancées

### Intégration API

Utilisez l'API REST pour intégrer avec d'autres systèmes :

```bash
# Obtenir les lectures
curl -H \"Authorization: Bearer VOTRE_TOKEN\" \\
  http://localhost:5000/api/readings?days=7

# Soumettre une lecture
curl -X POST http://localhost:5000/api/readings \\
  -H \"Authorization: Bearer VOTRE_TOKEN\" \\
  -d '{\"sensor_id\": 1, \"co2_ppm\": 450}'
```

Voir [Référence API](REFERENCE-API.md) pour la documentation complète.

### Intégration WebSocket

Streaming de données en temps réel :

```javascript
const socket = io('http://localhost:5000');

socket.emit('start_monitoring', { interval: 5 });

socket.on('co2_update', (data) => {
  console.log('CO2:', data.co2);
});
```

### Import CSV

Importer des données historiques :

1. **Admin** → **Gestion des Données** → **Importer**
2. Télécharger le modèle CSV
3. Remplir avec vos données :
   ```csv
   timestamp,sensor_id,co2_ppm,location
   2026-01-05 10:00:00,1,420,Bureau
   ```
4. Téléverser le fichier CSV
5. Réviser et confirmer

### Fonctionnalités de Collaboration

**Partager des Tableaux de Bord** :
- Créer des liens partageables
- Définir les permissions (voir/modifier)
- Dates d'expiration

**Espaces d'Équipe** (si activé) :
- Créer des équipes
- Accès capteur partagé
- Analyses collaboratives

### Analyses ML

**Analyse Prédictive** :
- Prédiction heure suivante
- Prévisions quotidiennes
- Motifs saisonniers

**Détection d'Anomalies** :
- Identification automatique des valeurs aberrantes
- Alertes de motifs inhabituels
- Avertissements de déviation de tendance

**Recommandations** :
- Suggestions de ventilation
- Optimisation d'occupation
- Conseils d'efficacité énergétique

### Archivage de Données

Archiver automatiquement les anciennes données :

1. **Admin** → **Paramètres** → **Rétention des Données**
2. Définir la politique d'archivage :
   ```
   Données détaillées : Conserver 90 jours
   Agrégats horaires : Conserver 1 an
   Agrégats quotidiens : Conserver indéfiniment
   ```
3. Activer l'archivage automatique
4. Données archivées disponibles pour export

---

## 💡 Trucs & Astuces

**Performance** :
- Utiliser les filtres de plage de dates pour un chargement plus rapide
- Désactiver le rafraîchissement automatique lors de la consultation de l'historique
- Archiver régulièrement les anciennes données

**Qualité des Données** :
- Calibrer les capteurs mensuellement
- Vérifier quotidiennement les capteurs hors ligne
- Réviser les anomalies hebdomadairement

**Alertes** :
- Définir des heures silencieuses pour les périodes non critiques
- Utiliser le refroidissement des alertes pour éviter le spam
- Configurer le résumé quotidien pour les alertes non urgentes

**Flux de Travail** :
- Mettre en favoris les vues fréquemment utilisées
- Créer des groupes de capteurs pour une gestion plus facile
- Utiliser les exports programmés pour les rapports réguliers

---

## 🆘 Besoin d'Aide ?

- **Dépannage** : Voir [DEPANNAGE.md](DEPANNAGE.md)
- **Questions API** : Voir [REFERENCE-API.md](REFERENCE-API.md)
- **Développement** : Voir [GUIDE-DEVELOPPEUR.md](GUIDE-DEVELOPPEUR.md)

---

**Bonne Surveillance !** 🌱
