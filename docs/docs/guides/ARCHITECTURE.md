# Architecture

Vue architecturelle de la plateforme Aerium.

## Couches

1. Frontend React (`site/src`)
2. API Flask (`site/backend/app.py`)
3. Domain routes (`site/backend/routes`)
4. Persistence SQLAlchemy + SQLite (`site/backend/database.py`)
5. Realtime Socket.IO + scheduler simulation (`site/backend/scheduler.py`)

## Principes

- Separation front/back claire.
- API REST pour lecture/ecriture.
- WebSocket pour diffusion live.
- Roles et securisation JWT.
- Seed + fallback simulation pour environnement de dev.

## Complements

- Structure detaillee : [../../PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md)
- Reference endpoints : [../../REFERENCE-API.md](../../REFERENCE-API.md)
