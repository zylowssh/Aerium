# Référence API

Documentation complète de l'API REST et WebSocket.

## 🌐 URL de Base
```
http://localhost:5000
```

## 🔐 Authentification

Tous les endpoints protégés nécessitent :
```
Cookie de Session : session=<session_id>
OU
En-tête : Authorization: Bearer <token>
```

## 📡 Endpoints API REST

### Authentification

#### POST /login
Connexion avec nom d'utilisateur et mot de passe

**Requête** :
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=jean&password=secret123"
```

**Corps** :
```
username: string (requis)
password: string (requis)
```

**Réponse** :
```json
{
  "status": "success",
  "message": "Connecté avec succès",
  "redirect": "/dashboard"
}
```

**Codes d'État** :
- 302 : Redirection vers le tableau de bord
- 200 : Réafficher le formulaire de connexion (identifiants invalides)
- 400 : Champs manquants

---

#### POST /register
Créer un nouveau compte utilisateur

**Requête** :
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=jean&email=jean@exemple.com&password=secret123"
```

**Corps** :
```
username: string (requis, 3-50 caractères)
email: string (requis, email valide)
password: string (requis, 6+ caractères)
```

**Codes d'État** :
- 302 : Redirection vers vérification en attente
- 400 : Erreur de validation
- 409 : Nom d'utilisateur/email déjà existant

---

#### GET /logout
Déconnecter l'utilisateur actuel

**Requête** :
```bash
curl -X GET http://localhost:5000/logout
```

**Réponse** : Redirection vers page d'accueil

---

### Gestion des Capteurs

#### GET /api/sensors
Obtenir tous les capteurs de l'utilisateur

**Requête** :
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/sensors
```

**Réponse** :
```json
{
  "status": "success",
  "sensors": [
    {
      "id": 1,
      "name": "Capteur Bureau",
      "location": "Bureau Principal",
      "active": true,
      "last_reading": "2026-01-05 14:30:00"
    }
  ]
}
```

---

#### POST /api/sensors
Créer un nouveau capteur

**Requête** :
```bash
curl -X POST http://localhost:5000/api/sensors \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Capteur Salle Réunion",
    "location": "Salle Réunion A",
    "type": "MH-Z19B"
  }'
```

**Corps** :
```json
{
  "name": "string (requis)",
  "location": "string (optionnel)",
  "type": "string (optionnel)",
  "description": "string (optionnel)"
}
```

---

#### PUT /api/sensors/<id>
Mettre à jour un capteur

**Requête** :
```bash
curl -X PUT http://localhost:5000/api/sensors/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nouveau Nom"}'
```

---

#### DELETE /api/sensors/<id>
Supprimer un capteur

**Requête** :
```bash
curl -X DELETE http://localhost:5000/api/sensors/1 \
  -H "Authorization: Bearer TOKEN"
```

---

### Lectures de Capteurs

#### GET /api/readings
Obtenir les lectures de CO₂ pour l'utilisateur actuel

**Requête** :
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/readings?days=7&sensor_id=1&limit=100"
```

**Paramètres de Requête** :
```
days: int (optionnel, défaut=7) - Nombre de jours
sensor_id: int (optionnel) - ID capteur spécifique
limit: int (optionnel, défaut=1000) - Nombre max de résultats
```

**Réponse** :
```json
{
  "status": "success",
  "data": [
    {
      "id": 123,
      "sensor_id": 1,
      "sensor_name": "Capteur Bureau",
      "co2_ppm": 450,
      "temperature": 22.5,
      "humidity": 45.0,
      "timestamp": "2026-01-05 14:30:00"
    }
  ],
  "count": 100
}
```

---

#### POST /api/readings
Insérer une nouvelle lecture de CO₂

**Requête** :
```bash
curl -X POST http://localhost:5000/api/readings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "co2_ppm": 450,
    "temperature": 22.5,
    "humidity": 45.0
  }'
```

**Corps** :
```json
{
  "sensor_id": "int (requis)",
  "co2_ppm": "int (requis, 0-5000)",
  "temperature": "float (optionnel)",
  "humidity": "float (optionnel)"
}
```

**Réponse** :
```json
{
  "status": "success",
  "message": "Lecture enregistrée",
  "reading_id": 123
}
```

---

### Seuils

#### GET /api/sensors/<id>/thresholds
Obtenir les seuils d'un capteur

**Réponse** :
```json
{
  "sensor_id": 1,
  "thresholds": {
    "good_max": 800,
    "warning_max": 1200,
    "alert_enabled": true
  }
}
```

---

#### PUT /api/sensors/<id>/thresholds
Mettre à jour les seuils du capteur

**Requête** :
```bash
curl -X PUT http://localhost:5000/api/sensors/1/thresholds \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "good_max": 800,
    "warning_max": 1200,
    "alert_enabled": true
  }'
```

---

### Export de Données

#### GET /api/export
Exporter les données au format CSV ou Excel

**Requête** :
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/export?format=csv&days=30&sensor_id=1"
```

**Paramètres** :
```
format: string (requis) - 'csv', 'excel', ou 'json'
days: int (optionnel, défaut=7)
sensor_id: int (optionnel) - Capteur spécifique
start_date: string (optionnel) - Format YYYY-MM-DD
end_date: string (optionnel) - Format YYYY-MM-DD
```

**Réponse** : Fichier téléchargeable

---

### Statistiques

#### GET /api/stats
Obtenir les statistiques pour une période

**Requête** :
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/stats?days=7&sensor_id=1"
```

**Réponse** :
```json
{
  "sensor_id": 1,
  "period": "7 days",
  "statistics": {
    "average": 520,
    "min": 380,
    "max": 890,
    "readings_count": 2016,
    "time_in_good": 85.5,
    "time_in_warning": 12.3,
    "time_in_critical": 2.2,
    "alerts_triggered": 5
  }
}
```

---

## 🔌 API WebSocket

### Connexion

```javascript
// Se connecter au serveur
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connecté au serveur');
});

socket.on('disconnect', () => {
  console.log('Déconnecté du serveur');
});
```

### Surveillance CO₂

#### start_monitoring
Demander les mises à jour de CO₂

**Émettre** :
```javascript
socket.emit('start_monitoring', {
  sensor_id: 1,      // optionnel
  interval: 5        // secondes
});
```

**Recevoir - co2_update** :
```javascript
socket.on('co2_update', (data) => {
  console.log('Mise à jour CO₂:', data);
  // {
  //   sensor_id: 1,
  //   co2: 450,
  //   temperature: 22.5,
  //   timestamp: '2026-01-05 14:30:00',
  //   status: 'good'
  // }
});
```

---

#### stop_monitoring
Arrêter les mises à jour de CO₂

**Émettre** :
```javascript
socket.emit('stop_monitoring');
```

---

### Alertes

#### Recevoir - alert
Notification d'alerte

```javascript
socket.on('alert', (data) => {
  console.log('Alerte reçue:', data);
  // {
  //   type: 'threshold',
  //   sensor_id: 1,
  //   sensor_name: 'Capteur Bureau',
  //   co2_value: 1250,
  //   threshold: 1200,
  //   severity: 'critical',
  //   message: 'Niveau de CO₂ critique dépassé'
  // }
});
```

---

### Salles

#### join_room
Rejoindre une salle pour les mises à jour ciblées

**Émettre** :
```javascript
socket.emit('join_room', {
  room: 'sensor_1'
});
```

---

#### leave_room
Quitter une salle

**Émettre** :
```javascript
socket.emit('leave_room', {
  room: 'sensor_1'
});
```

---

## 🔒 Authentification API

### Obtenir un Token

**Requête** :
```bash
curl -X POST http://localhost:5000/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jean",
    "password": "secret123"
  }'
```

**Réponse** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### Utiliser le Token

Incluez le token dans l'en-tête Authorization :

```bash
curl -H "Authorization: Bearer votre-token-ici" \
  http://localhost:5000/api/readings
```

---

## 📊 Codes d'État HTTP

- **200 OK** : Requête réussie
- **201 Created** : Ressource créée avec succès
- **400 Bad Request** : Données de requête invalides
- **401 Unauthorized** : Authentification requise
- **403 Forbidden** : Accès refusé
- **404 Not Found** : Ressource non trouvée
- **409 Conflict** : Conflit de ressource (ex : doublon)
- **422 Unprocessable Entity** : Erreur de validation
- **429 Too Many Requests** : Limite de débit dépassée
- **500 Internal Server Error** : Erreur serveur

---

## 📝 Exemples Complets

### Exemple Python

```python
import requests

BASE_URL = 'http://localhost:5000'

# Connexion et obtention du token
response = requests.post(f'{BASE_URL}/api/token', json={
    'username': 'jean',
    'password': 'secret123'
})
token = response.json()['token']

# En-têtes avec authentification
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Obtenir les capteurs
sensors = requests.get(f'{BASE_URL}/api/sensors', headers=headers)
print(sensors.json())

# Soumettre une lecture
reading = {
    'sensor_id': 1,
    'co2_ppm': 450,
    'temperature': 22.5
}
response = requests.post(
    f'{BASE_URL}/api/readings',
    json=reading,
    headers=headers
)
print(response.json())
```

### Exemple JavaScript

```javascript
// Utilisation de fetch API
const BASE_URL = 'http://localhost:5000';
let token;

// Obtenir le token
async function login() {
  const response = await fetch(`${BASE_URL}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'jean',
      password: 'secret123'
    })
  });
  const data = await response.json();
  token = data.token;
}

// Obtenir les lectures
async function getReadings() {
  const response = await fetch(
    `${BASE_URL}/api/readings?days=7`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  console.log(data);
}

// Soumettre une lecture
async function submitReading(sensorId, co2) {
  const response = await fetch(`${BASE_URL}/api/readings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sensor_id: sensorId,
      co2_ppm: co2
    })
  });
  return response.json();
}

// Utilisation
await login();
await getReadings();
await submitReading(1, 450);
```

### Exemple WebSocket Complet

```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connecté!');
  
  // Démarrer la surveillance
  socket.emit('start_monitoring', {
    interval: 5
  });
  
  // Rejoindre la salle du capteur
  socket.emit('join_room', {
    room: 'sensor_1'
  });
});

socket.on('co2_update', (data) => {
  // Mettre à jour l'interface utilisateur
  updateDisplay(data.co2, data.timestamp);
  
  // Vérifier les seuils
  if (data.status === 'critical') {
    showAlert('Niveau de CO₂ critique!');
  }
});

socket.on('alert', (data) => {
  // Afficher la notification
  showNotification(data.message, data.severity);
});

socket.on('disconnect', () => {
  console.log('Déconnecté');
  showOfflineMessage();
});

// Fonctions utilitaires
function updateDisplay(co2, timestamp) {
  document.getElementById('co2-value').textContent = co2;
  document.getElementById('timestamp').textContent = timestamp;
}

function showAlert(message) {
  alert(message);
}

function showNotification(message, severity) {
  // Afficher la notification toast
  console.log(`[${severity}] ${message}`);
}

function showOfflineMessage() {
  document.getElementById('status').textContent = 'Hors ligne';
}
```

---

## 🛡️ Meilleures Pratiques

1. **Toujours utiliser HTTPS en production**
2. **Stocker les tokens en toute sécurité** (pas dans localStorage pour les données sensibles)
3. **Implémenter une gestion des erreurs appropriée**
4. **Respecter les limites de débit**
5. **Utiliser WebSocket pour les mises à jour en temps réel**
6. **Fermer les connexions WebSocket quand elles ne sont pas utilisées**
7. **Valider toutes les entrées côté client et serveur**

---

## 📚 Ressources Supplémentaires

- [Guide Utilisateur](GUIDE-UTILISATEUR.md) - Utilisation des fonctionnalités
- [Guide Développeur](GUIDE-DEVELOPPEUR.md) - Développement et contribution
- [Dépannage](DEPANNAGE.md) - Résolution de problèmes

---

**Questions ?** Consultez le [Guide de Dépannage](DEPANNAGE.md) ou ouvrez un ticket.
