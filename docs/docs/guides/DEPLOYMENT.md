# Deploiement

Guide de deploiement cible pour Aerium.

## Pre-requis production

- Python 3.11
- Node.js 18+
- reverse proxy (Nginx ou equivalent)
- stockage persistant pour la base

## Checklist minimale

1. Secrets robustes (`SECRET_KEY`, `JWT_SECRET_KEY`).
2. Variables backend/front configurees.
3. Build frontend : `npm run build`.
4. Serveur backend derriere un process manager.
5. Supervision healthcheck (`/api/health`).
6. Strategie de sauvegarde DB.

## Recommandations

- Migrer vers PostgreSQL pour charge multi-utilisateurs.
- Externaliser websocket/realtime si volumetrie forte.
- Centraliser logs et metriques.

## Note

Ce projet est optimise en priorite pour le developpement local. Le durcissement production depend du contexte de deploiement retenu.
