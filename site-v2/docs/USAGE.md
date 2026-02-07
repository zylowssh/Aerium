# 📖 Guide d'Utilisation

Un guide complet pour utiliser toutes les fonctionnalités d'Aerium.

## 🔐 Authentification

### Connexion

1. Accédez à http://localhost:8080/auth
2. Entrez vos identifiants:
   - Email: `demo@aerium.app`
   - Mot de passe: `demo123`
3. Cochez **"Se souvenir de moi"** pour sauvegarder votre email
4. Cliquez sur **"Se connecter"**

Vous serez redirigé vers le dashboard.

### Inscription

Pour créer un compte:

1. Cliquez sur l'onglet **"Inscription"**
2. Remplissez vos données:
   - Nom complet
   - Email
   - Mot de passe (minimum 6 caractères)
3. Cliquez sur **"Créer un compte"**
4. Vous serez automatiquement connecté

### Déconnexion

Dans le dashboard, cliquez sur votre avatar en haut à droite → **"Déconnexion"**

---

## 📊 Dashboard Principal

Le tableau de bord affiche un aperçu de votre surveillance.

### Sections Principales

#### 🎯 Cartes KPI (Haut)
Affichent les métriques principales:
- **CO₂ Moyen**: Niveau moyen en ppm
- **Température**: Température moyenne
- **Humidité**: Niveau moyen d'humidité
- **Score de Santé**: Score global (0-100)

Cliquez sur une carte pour voir les tendances.

#### 📈 Aperçu Qualité de l'Air
- Graphique interactif CO2 24h
- Seuils visuels (bon/avertissement/critique)
- Nombre de capteurs en ligne
- Pic de CO2

Survolez le graphique pour voir les détails.

#### 🚨 Alertes Récentes
Affiche vos 3 dernières alertes:
- Type (info/avertissement/critique)
- Message détaillé
- Capteur concerné
- Horodatage

Cliquez sur une alerte pour la marquer comme reconnue.

#### 💡 Insights Rapides
Conseils et statistiques:
- Capteurs actifs
- Lectures du jour
- Pic CO2
- Meilleure heure pour la qualité de l'air

#### 🔌 Capteurs Actifs
Affiche tous vos capteurs avec:
- Nom et localisation
- Niveau CO2 actuel (couleur codée)
- Micro-graphique CO2 (dernières 20 heures)
- État en ligne/hors ligne
- Indicateur live

Cliquez sur un capteur pour voir les détails complets.

---

## 🔍 Gestion des Capteurs

### Ajouter un Capteur

1. Allez à **Capteurs** dans la barre latérale
2. Cliquez sur **"Ajouter un Capteur"**
3. Remplissez le formulaire:
   - **Nom**: Ex: "Bureau 1"
   - **Localisation**: Ex: "Étage 2"
   - **Type**: Simulation ou Réel
4. Cliquez sur **"Créer"**

### Voir Détails d'un Capteur

1. Cliquez sur un capteur depuis le dashboard ou la page Capteurs
2. Vous verrez:
   - Graphiques détaillés (24h, 7j, 30j)
   - Statistiques complètes
   - Historique des lectures
   - Seuils d'alerte

### Modifier un Capteur

1. Allez à **Capteurs**
2. Trouvez le capteur
3. Cliquez sur les 3 points (•••)
4. Sélectionnez **"Modifier"**
5. Mettez à jour les informations
6. Cliquez sur **"Enregistrer"**

### Supprimer un Capteur

1. Allez à **Capteurs**
2. Cliquez sur les 3 points (•••) du capteur
3. Sélectionnez **"Supprimer"**
4. Confirmez la suppression

---

## 🚨 Gestion des Alertes

### Voir les Alertes

**Dashboard**: Voir les 3 dernières alertes

**Page Alertes**: 
- Toutes les alertes actives
- Filtrer par status, type, capteur
- Vue détaillée de chaque alerte

### Types d'Alertes

| Type | Seuil | Description |
|------|-------|-------------|
| 🟢 Info | > 400 ppm | Information général |
| 🟡 Avertissement | > 1000 ppm | Attention requise |
| 🔴 Critique | > 1200 ppm | Action immédiate |

### Actions sur Alertes

1. **Reconnaître**: Marquer comme vue
   - Cliquez sur l'alerte
   - Cliquez sur **"Reconnaître"**

2. **Résoudre**: Marquer comme résolue
   - Cliquez sur l'alerte
   - Cliquez sur **"Résoudre"**

3. **Filtrer**:
   - Par statut (nouvelle/reconnue/résolue)
   - Par type (info/avertissement/critique)
   - Par période (7j/30j/90j)

### Historique des Alertes

Allez à **Historique des Alertes** pour voir:
- Toutes les alertes passées
- Statistiques détaillées
- Heures de déclenchement/résolution
- Tendances d'alertes

---

## 📊 Analyses et Rapports

### Analytics

Allez à **Analyses** pour voir:

**Graphiques Interactifs:**
- CO2, Température, Humidité
- Sélection période (24h, 7j, 30j)
- Zoom et pannage

**Statistiques:**
- Pourcentage en bonne qualité
- Pic de CO2
- Heure idéale
- Nombre de lectures

**Comparaison Hebdomadaire:**
- Moyennes vs pics par jour
- Tendances sur la semaine

### Rapports

Allez à **Rapports** pour voir:

**Cartes KPI:**
- Total des alertes
- Déclenchées / Reconnues / Résolues
- Nombre de lectures

**Distributions:**
- Alertes par type (pie chart)
- Alertes par métrique (pie chart)
- Alertes par statut (bar chart)

**Export:**
- Cliquez sur **"Exporter CSV"** pour un fichier Excel
- Cliquez sur **"Exporter PDF"** pour un rapport

---

## ⚙️ Paramètres

Allez à **Paramètres** pour configurer:

### Thème
- Mode clair/sombre
- Contraste

### Notifications
- Activer/désactiver les alertes par email
- Configurer les seuils

### Compte
- Modifier le profil
- Changer le mot de passe
- Gérer la sécurité

---

## 📍 Carte des Capteurs

Allez à **Carte Capteurs** pour voir:

- Tous les capteurs sur une carte interactive
- Localisation en temps réel
- Niveau CO2 par couleur
- Cliquez pour voir les détails

---

## 💡 Conseils et Bonnes Pratiques

### Pour une Meilleure Surveillance
- ✅ Placez les capteurs dans les zones clés
- ✅ Assurez que les capteurs sont en ligne
- ✅ Vérifiez les alertes régulièrement
- ✅ Exportez les rapports mensuels

### Pour Réduire la Pollution
- 🪟 Aérez régulièrement
- 🌿 Ajoutez des plantes
- 🔄 Utilisez un purificateur d'air
- 🚭 Arrêtez les sources de pollution

### Interprétation des Niveaux CO2

| Niveau | Qualité | Action |
|--------|---------|--------|
| < 800 ppm | Excellente | Rien à faire |
| 800-1000 ppm | Bonne | Aérer légèrement |
| 1000-1200 ppm | Modérée | Aérer davantage |
| > 1200 ppm | Mauvaise | Aérer immédiatement |

---

## 🎓 Tutoriels Vidéo

[À implémenter]

---

## 📞 Besoin d'Aide?

- 📖 [Installation](INSTALLATION.md)
- 🏗️ [Architecture](guides/ARCHITECTURE.md)
- 🔌 [API](guides/API_REFERENCE.md)
- 🐛 [Dépannage](guides/TROUBLESHOOTING.md)
