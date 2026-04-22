# Backend Aerium (Flask)

API de supervision de la qualite de l'air pour la plateforme Aerium.

## Stack

- Flask + Flask-CORS
- Flask-JWT-Extended
- Flask-SocketIO
- SQLAlchemy (SQLite)
- APScheduler

## Demarrage local

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

Backend disponible sur `http://localhost:5000`.

## Variables d'environnement

Fichier : `site/backend/.env`

```env
SECRET_KEY=change-this-to-a-random-64-character-secret-key-for-production
JWT_SECRET_KEY=change-this-to-a-random-64-character-jwt-signing-secret-key
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-small-latest
MISTRAL_MAX_TOKENS=700
ENABLE_PROPHET=False
```

Variables frequentes additionnelles :

- `ENABLE_RATE_LIMITING`
- `RATELIMIT_DEFAULT`
- `ALERT_CO2_THRESHOLD`
- `ALERT_TEMP_MIN`
- `ALERT_TEMP_MAX`
- `ALERT_HUMIDITY_THRESHOLD`
- `FRONTEND_URL`
- `IOT_INGEST_API_KEY`

## Comptes de demonstration

Apres `python seed_database.py` :

- `demo@aerium.app` / `demo123`
- `admin@aerium.app` / `admin123`

## Endpoints principaux

- Auth : `/api/auth/*`
- Capteurs : `/api/sensors/*`
- Lectures : `/api/readings/*`
- Alertes : `/api/alerts/*`
- Rapports : `/api/reports/*`
- Maintenance : `/api/maintenance/*`
- IA : `/api/ai/*`
- Admin : `/api/admin/*`

Healthchecks :

- `/api/health`
- `/health`

Reference complete : [../../docs/REFERENCE-API.md](../../docs/REFERENCE-API.md)

## WebSocket

- URL : `ws://localhost:5000`
- JWT requis au `connect`.
- Rooms serveur : `user_<id>` et `admin`.

## Scripts utiles

- Seed donnees : `python seed_database.py`
- Promouvoir admin : `python make_user_admin.py <email>`
- Migration seuils legacy : `python migrate_add_thresholds.py`

## Conseils developpement

1. Lancer backend avec environnement virtuel actif.
2. Verifier `GET /api/health` apres chaque changement sensible.
3. Maintenir la documentation API a jour avec les routes.
