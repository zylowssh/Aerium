# Aerium

Plateforme de supervision de la qualite de l'air (CO2, temperature, humidite) avec backend Flask, frontend React et application mobile Kivy.

## Vision

Aerium permet de surveiller des capteurs environnementaux en temps reel, d'analyser les tendances, de recevoir des alertes et d'exporter des rapports exploitables pour la maintenance et la qualite de l'air interieur.

## Composants du projet

- `site/backend` : API Flask + WebSocket + base SQLite + planificateur de simulation.
- `site/src` : interface web React/TypeScript (Vite, React Query, Tailwind).
- `app` : application mobile Kivy/KivyMD (ecran CO2, alarmes, authentification).
- `tests` : scripts de validation API/analytics/performance.
- `docs` : documentation fonctionnelle et technique en francais.

## Fonctionnalites principales

- Authentification JWT avec roles `user` et `admin`.
- Gestion complete des capteurs (CRUD + seuils personnalises).
- Ingestion de mesures via API interne ou endpoint externe pour IoT.
- Mises a jour temps reel via Socket.IO.
- Alertes et historique (reconnaissance, resolution, statistiques).
- Rapports CSV/PDF et indicateurs agreges.
- Maintenance planifiee des capteurs.
- Assistant IA (chat SSE, recommandations, predictions avec fallback).

## Prerequis

- Python 3.11
- Node.js 18+
- npm 9+

## Demarrage rapide (web)

### Option A - scripts de lancement automatiques

Depuis `site` :

- Windows : `start.bat`
- Linux/macOS : `bash start.sh`

Ces scripts installent les dependances, initialisent la base si necessaire, alimentent les comptes de demonstration et lancent backend + frontend.

### Option B - lancement manuel

1. Backend Flask

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

2. Frontend React (nouveau terminal)

```powershell
cd site
copy .env.example .env
npm install
npm run dev
```

3. Verifier les services

- Frontend : http://localhost:5173
- API : http://localhost:5000/api/health
- WebSocket : ws://localhost:5000

## Comptes de demonstration

Apres `python seed_database.py` :

- Utilisateur : `demo@aerium.app` / `demo123`
- Administrateur : `admin@aerium.app` / `admin123`

## Demarrage application mobile (Kivy)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app/main.py
```

## Qualite et tests

- Tests frontend : `cd site ; npm test`
- Validation backend (scripts) : voir le dossier `tests`
- Verification manuelle API : `GET /api/docs` et `GET /api/health`

## Documentation complete

- Index : [docs/INDEX.md](docs/INDEX.md)
- Demarrage : [docs/GUIDE-DEMARRAGE.md](docs/GUIDE-DEMARRAGE.md)
- Guide utilisateur : [docs/GUIDE-UTILISATEUR.md](docs/GUIDE-UTILISATEUR.md)
- Guide developpeur : [docs/GUIDE-DEVELOPPEUR.md](docs/GUIDE-DEVELOPPEUR.md)
- Reference API : [docs/REFERENCE-API.md](docs/REFERENCE-API.md)
- Depannage : [docs/DEPANNAGE.md](docs/DEPANNAGE.md)

## Licence

Projet distribue sous licence MIT. Voir [LICENSE](LICENSE).
