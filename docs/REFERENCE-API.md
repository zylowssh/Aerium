# Reference API Aerium

Reference des endpoints exposes par le backend Flask (`site/backend`).

## Base URL

- Local : `http://localhost:5000`
- Prefixe API : `/api`

## Authentification

- Type : JWT Bearer
- Header : `Authorization: Bearer <token>`
- Roles : `user`, `admin`

## Endpoints publics

- `GET /`
- `GET /health`
- `GET /api/health`
- `GET /api/docs`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/readings/external/<sensor_api_key>` (ingestion IoT externe)

## Auth (`/api/auth`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Non | Creation de compte |
| POST | `/api/auth/login` | Non | Connexion + tokens |
| POST | `/api/auth/refresh` | Oui | Renouvellement access token |
| GET | `/api/auth/me` | Oui | Profil de l'utilisateur courant |
| POST | `/api/auth/logout` | Oui | Deconnexion logique |

Payload principal :

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nom Utilisateur"
}
```

## Sensors (`/api/sensors`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/sensors` | Oui | Liste capteurs (scope user/admin) |
| GET | `/api/sensors/<id>` | Oui | Detail capteur |
| POST | `/api/sensors` | Oui | Creation capteur |
| PUT | `/api/sensors/<id>` | Oui | Mise a jour capteur |
| PUT | `/api/sensors/<id>/thresholds` | Oui | Seuils personnalises |
| DELETE | `/api/sensors/<id>` | Oui | Suppression capteur |

Query params (liste) :

- `search`, `status`, `type`, `active`, `sort`, `limit`

Payload creation (exemple) :

```json
{
  "name": "Bureau principal",
  "location": "Batiment A",
  "sensor_type": "simulation"
}
```

## Readings (`/api/readings`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/readings/sensor/<id>` | Oui | Historique d'un capteur |
| POST | `/api/readings` | Oui | Ajout lecture |
| GET | `/api/readings/aggregate` | Oui | Agregats multi-capteurs |
| POST | `/api/readings/external/<sensor_api_key>` | Non | Ingestion IoT externe |
| GET | `/api/readings/latest/<id>` | Oui | Derniere lecture |

Comportements notables :

- Pour les capteurs `simulation`, le backend peut generer une lecture a la demande si les donnees recentes sont absentes.
- Les alertes sont evaluees lors de l'ajout d'une lecture.

## Alerts (`/api/alerts`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/alerts` | Oui | Alertes courantes |
| PUT | `/api/alerts/<id>` | Oui | Mise a jour statut |
| DELETE | `/api/alerts/<id>` | Oui | Suppression |
| GET | `/api/alerts/history/list` | Oui | Historique |
| PUT | `/api/alerts/history/acknowledge/<id>` | Oui | Reconnaissance |
| PUT | `/api/alerts/history/resolve/<id>` | Oui | Resolution |
| GET | `/api/alerts/history/stats` | Oui | Statistiques |
| GET | `/api/alerts/predictions` | Oui | Projection alertes |

Query params utiles :

- `days`, `status`, `type`, `sensor_id`, `limit`

## Reports (`/api/reports`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/reports/export/csv` | Oui | Export CSV |
| GET | `/api/reports/export/pdf` | Oui | Export PDF |
| GET | `/api/reports/stats` | Oui | Stats de reporting |

Parametre principal : `days`.

## Users (`/api/users`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Oui | Profil courant |
| PUT | `/api/users/profile` | Oui | Mise a jour profil |
| POST | `/api/users/change-password` | Oui | Changement mot de passe |
| GET | `/api/users` | Oui (admin) | Liste utilisateurs |

## Maintenance (`/api/maintenance`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/maintenance` | Oui | Liste des taches |
| POST | `/api/maintenance` | Oui | Creation tache |
| GET | `/api/maintenance/<id>` | Oui | Detail |
| PUT | `/api/maintenance/<id>` | Oui | Mise a jour |
| DELETE | `/api/maintenance/<id>` | Oui | Suppression |

Parametres de filtrage : `status`, `sensor_id`, `limit`.

## Admin (`/api/admin`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/simulation/speed` | Oui (admin) | Lire vitesse simulation |
| POST | `/api/admin/simulation/speed` | Oui (admin) | Modifier vitesse simulation |

## IA (`/api/ai`)

| Methode | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/chat` | Oui | Chat SSE |
| POST | `/api/ai/recommendations` | Oui | Recommandations |
| GET | `/api/ai/predictions` | Oui | Predictions |
| GET | `/api/ai/status` | Oui | Etat fournisseur IA |

## WebSocket

- URL : `ws://localhost:5000`
- Protocole : Socket.IO
- JWT requis au `connect` (`auth.token` ou query `token`)
- Rooms cote serveur : `user_<id>` et `admin`

## Erreurs frequentes

- `401` : token absent, invalide ou expire.
- `403` : role insuffisant.
- `404` : ressource inexistante.
- `429` : limite de debit depassee.
- `500` : erreur interne.
