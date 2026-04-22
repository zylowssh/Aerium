# Guide developpeur

Ce document cible les contributeurs backend, frontend et mobile.

## 1. Architecture technique

- Backend : Flask, SQLAlchemy, JWT, Socket.IO, APScheduler.
- Frontend : React + TypeScript, Vite, React Query, Tailwind.
- Mobile : Kivy/KivyMD.
- Stockage principal web : SQLite (`site/backend/instance/aerium.db`).

## 2. Arborescence utile

- `site/backend/app.py` : creation de l'app Flask, CORS, JWT, sockets, blueprints.
- `site/backend/routes` : logique metier par domaine (auth, sensors, readings, alerts...).
- `site/backend/database.py` : modeles SQLAlchemy.
- `site/src` : application React.
- `app` : application mobile Python.
- `tests` : scripts de validation API/analytics/performance.

Vue detaillee : [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## 3. Setup environnement local

### Backend

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

### Frontend

```powershell
cd site
copy .env.example .env
npm install
npm run dev
```

## 4. Variables d'environnement

### Backend (`site/backend/.env`)

- `SECRET_KEY`, `JWT_SECRET_KEY`
- `MISTRAL_API_KEY`, `MISTRAL_MODEL`, `MISTRAL_MAX_TOKENS`
- `ENABLE_PROPHET`
- optionnel : `ENABLE_RATE_LIMITING`, seuils alertes, `FRONTEND_URL`

### Frontend (`site/.env`)

- `VITE_API_URL`
- `VITE_FLASK_ENABLED`

## 5. Conventions de developpement

- API REST sous prefixe `/api/*`.
- Auth par header `Authorization: Bearer <token>`.
- JSON en snake_case/camelCase selon domaine existant (respecter les schemas actuels).
- Messages d'erreur explicites et codes HTTP coherents.

## 6. Endpoints et realtime

- Toutes les routes sont dans [REFERENCE-API.md](REFERENCE-API.md).
- WebSocket exige un JWT au `connect` (`auth.token` ou query `token`).
- Emissions capteurs vers rooms `user_<id>` et `admin`.

## 7. Donnees et migrations

- Initialisation auto de la base au demarrage backend.
- Script de seed : `python seed_database.py`.
- Migration seuils legacy : `python migrate_add_thresholds.py`.

## 8. Tests et verification

- Frontend : `cd site ; npm test`
- Validation Python : scripts du dossier `tests`
- Healthcheck API : `GET /api/health`
- Smoke test manuel : login -> capteurs -> alertes -> export rapport

## 9. Contribution

1. Creer une branche de travail.
2. Modifier code + docs associees.
3. Verifier tests et endpoints touches.
4. Ouvrir une PR avec description claire, impacts et plan de verification.

Guide detaille contribution : [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)
