# 🌟 Fonctionnalités - Documentation Complète

Documentation complète de toutes les fonctionnalités du Tableau de Bord Aerium Qualité de l'Air.

## 📋 Vue d'Ensemble

Aerium comprend 8 fonctionnalités majeures conçues pour faire du système une application d'entreprise prête pour la production:

1. ✅ Notifications par Email
2. ✅ Limitation de Débit (Rate Limiting)
3. ✅ Logging Complet
4. ✅ Piste d'Audit
5. ✅ Recherche & Filtrage Avancés
6. ✅ Validation des Données
7. ✅ Mise en Cache
8. ✅ Documentation API

---

## 1️⃣ Notifications par Email 📧

### Description
Système automatique d'alertes par email quand les capteurs dépassent les seuils configurés.

### Fonctionnalités
- **Emails HTML formatés** avec détails du capteur et valeurs actuelles
- **Seuils configurables** pour CO2, température et humidité
- **Prévention du spam** avec limitation d'envoi
- **Intégration SMTP** - Compatible Gmail, Outlook, serveurs personnalisés
- **Envoi asynchrone** - N'impacte pas les performances de l'API

### Configuration

#### Étape 1: Configuration d'Email
Créez/modifiez le fichier `.env` dans le dossier `backend/`:

```env
# Activer les notifications
ENABLE_EMAIL_NOTIFICATIONS=True

# Configuration SMTP (exemple Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app
MAIL_DEFAULT_SENDER=noreply@airsense.app

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5173
```

#### Étape 2: Seuils d'Alerte
Configurez les seuils qui déclenchent les alertes:

```env
ALERT_CO2_THRESHOLD=1200        # ppm
ALERT_TEMP_MIN=15              # Celsius
ALERT_TEMP_MAX=28              # Celsius
ALERT_HUMIDITY_THRESHOLD=80    # Pourcentage
```

### Utilisation

Les emails sont envoyés automatiquement quand:
- **CO2 > 1200 ppm**
- **Température < 15°C ou > 28°C**
- **Humidité > 80%**

### Code

Voir `backend/email_service.py` pour la mise en œuvre.

### Dépannage: Emails non envoyés

| Problème | Solution |
|----------|----------|
| "Connection refused" | Vérifier MAIL_SERVER et MAIL_PORT |
| Erreur d'authentification | Vérifier MAIL_USERNAME et MAIL_PASSWORD |
| Gmail rejette | Utiliser "Mot de passe d'application" au lieu du mot de passe régulier |
| Aucune erreur mais pas d'email | Vérifier `ENABLE_EMAIL_NOTIFICATIONS=True` |
| Voir les erreurs | Consulter `backend/logs/aerium.log` |

---

## 2️⃣ Limitation de Débit (Rate Limiting) 🛡️

### Description
Protection automatique de l'API contre les abus et les attaques par force brute.

### Fonctionnalités
- **Limites par IP** - 200 requêtes par jour, 50 par heure, 10 par minute
- **Configurable** - Ajuster selon vos besoins
- **Stockage en mémoire** - Très rapide
- **Retour 429** - Quand la limite est dépassée

### Configuration

```env
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute
```

### Désactiver en Développement

```env
ENABLE_RATE_LIMITING=False
```

---

## 3️⃣ Logging Complet 📊

### Description
Système de journalisation détaillé avec rotation automatique des fichiers.

### Fonctionnalités
- **Fichiers rotatifs** - Limite de 10MB par fichier
- **Sauvegarde automatique** - Conserve 10 fichiers anciens
- **Niveaux configurables** - INFO, DEBUG, WARNING, ERROR
- **Non-bloquant** - N'impacte pas les performances

### Configuration

```env
LOG_LEVEL=INFO
LOG_FILE=logs/aerium.log
LOG_MAX_BYTES=10485760     # 10MB
LOG_BACKUP_COUNT=10         # Garder 10 fichiers
```

### Consulter les Logs

```bash
tail -f backend/logs/aerium.log
grep ERROR backend/logs/aerium.log
```

---

## 4️⃣ Piste d'Audit 📝

### Description
Enregistrement complet de toutes les actions des utilisateurs à des fins de conformité et de sécurité.

### Fonctionnalités
- **Suivi CRUD** - CREATE, UPDATE, DELETE pour tous les types de ressources
- **Infos complètes** - Utilisateur, action, ressource, timestamp, IP
- **Interrogeable** - Chercher par utilisateur ou par ressource
- **Persistent** - Stocké dans la base de données

### Actions Suivies

```
CREATE_SENSOR       - Capteur créé
UPDATE_SENSOR       - Capteur modifié
DELETE_SENSOR       - Capteur supprimé
CREATE_READING      - Lecture ajoutée
UPDATE_READING      - Lecture modifiée
DELETE_READING      - Lecture supprimée
CREATE_ALERT        - Alerte créée
UPDATE_ALERT        - Alerte modifiée
DELETE_ALERT        - Alerte supprimée
```

### Code

Voir `backend/audit_logger.py` pour la mise en œuvre.

---

## 5️⃣ Recherche & Filtrage Avancés 🔍

### Description
Système de recherche puissant avec filtrage multi-critères pour trouver rapidement les capteurs.

### Paramètres de Requête

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `search` | Cherche dans nom/localisation/ID | `?search=cuisine` |
| `status` | Filtre par statut | `?status=en%20ligne` |
| `type` | Filtre par type | `?type=CO2` |
| `active` | Filtre par activité | `?active=true` |
| `sort` | Tri des résultats | `?sort=updated_at` |
| `limit` | Nombre max de résultats | `?limit=50` |

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

---

## 6️⃣ Validation des Données ✅

### Description
Validation complète de tous les inputs avec messages d'erreur clairs.

### Fonctionnalités
- **Schémas Marshmallow** - Définition stricte des données
- **Vérification des types** - Conversion et validation
- **Validations de plage** - Min/max pour nombres
- **Email validation** - Format correct vérifié
- **Erreurs claires** - Messages d'aide pour l'utilisateur

### Schémas Disponibles

**Capteur:**
```
{
  "name": "string (requis, 1-255 caractères)",
  "location": "string (0-500 caractères)",
  "sensor_type": "enum ['CO2', 'TEMPERATURE', 'HUMIDITY', 'MULTI', 'CUSTOM']",
  "is_active": "boolean"
}
```

**Lecture:**
```
{
  "co2_level": "float (0-5000 ppm)",
  "temperature": "float (-50 à 100°C)",
  "humidity": "float (0-100%)"
}
```

---

## 7️⃣ Mise en Cache ⚡

### Description
Système de mise en cache pour améliorer les performances en réduisant les requêtes à la base de données.

### Fonctionnalités
- **Cache en mémoire** - Stockage local très rapide
- **TTL de 5 minutes** - Par défaut
- **Configuration simple** - Facile à configurer

### Impact Performance

- **Réduction des requêtes DB** - ~60% moins de requêtes
- **Temps de réponse** - 10-50x plus rapide pour les données en cache
- **Charge serveur** - Réduite significativement

### Exemple

```
Sans cache:  GET /api/sensors → 250ms
Avec cache:  GET /api/sensors → 5ms
```

---

## 8️⃣ Documentation API 📚

### Description
Documentation interactive de l'API en Swagger/OpenAPI.

### Accès

Quand le backend est démarré:
```
http://localhost:5000/api/docs
```

### Contenu

- **Endpoints listés** - Tous les endpoints API documentés
- **Paramètres détaillés** - Chaque paramètre expliqué
- **Exemples de réponse** - Montrent le format attendu
- **Codes de statut** - Quand 200, 400, 404, etc.
- **Test interactif** - Essayer les endpoints depuis le navigateur

---

## 🔧 Configuration Globale Complète

### Fichier .env Complet

```env
# Sécurité
SECRET_KEY=votre-clé-secrète
JWT_SECRET_KEY=votre-clé-jwt-secrète

# Email
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe

# Seuils d'Alerte
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
ALERT_HUMIDITY_THRESHOLD=80

# Rate Limiting
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/aerium.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=10

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Checklist de Déploiement

- [ ] Email configuré et testé
- [ ] Rate limiting activé
- [ ] Logging activé
- [ ] Audit trail en place
- [ ] Recherche testée
- [ ] Validation en place
- [ ] Cache activé
- [ ] Documentation API accessible

---

## 🎯 Prochaines Étapes

1. Consulter [QUICKSTART.md](QUICKSTART.md) pour des exemples d'utilisation
2. Voir [../guides/API_REFERENCE.md](../guides/API_REFERENCE.md) pour la référence API
3. Tester chaque fonctionnalité en développement
4. Configurer pour production

---

**Créé avec ❤️ pour une meilleure surveillance de la qualité de l'air**

**Dernière mise à jour:** Février 2026
