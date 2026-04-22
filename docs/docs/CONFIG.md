# Configuration

Configuration minimale backend + frontend.

## Backend (`site/backend/.env`)

Variables principales :

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `MISTRAL_API_KEY`
- `MISTRAL_MODEL`
- `MISTRAL_MAX_TOKENS`
- `ENABLE_PROPHET`

Variables operationnelles utiles :

- `ENABLE_RATE_LIMITING`
- `RATELIMIT_DEFAULT`
- `ALERT_CO2_THRESHOLD`
- `ALERT_TEMP_MIN`
- `ALERT_TEMP_MAX`
- `ALERT_HUMIDITY_THRESHOLD`
- `FRONTEND_URL`
- `IOT_INGEST_API_KEY`

## Frontend (`site/.env`)

- `VITE_API_URL=http://localhost:5000/api`
- `VITE_FLASK_ENABLED=true`

## Conseil securite

- Ne jamais exposer de secret dans `site/.env` (variables `VITE_*` visibles cote navigateur).
