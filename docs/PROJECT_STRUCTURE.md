# Structure du projet

Vue simplifiee de l'arborescence et du role de chaque zone.

## Racine

- `README.md` : vue d'ensemble.
- `OVERVIEW.md` : analyse globale historique.
- `requirements.txt` : dependances Python globales (incluant mobile).
- `pyproject.toml` : metadata Python.
- `docs` : documentation projet.
- `site` : application web (frontend + backend).
- `app` : application mobile Kivy.
- `tests` : validations API/analytics/performance.

## Dossier `site`

- `package.json` : scripts frontend (`dev`, `build`, `test`).
- `start.bat` / `start.sh` : orchestration locale backend + frontend.
- `src` : code React/TypeScript.
- `backend` : API Flask.

### `site/src`

- `App.tsx` : routes principales.
- `pages` : ecrans fonctionnels (Dashboard, Analytics, Sensors, Alerts, Reports, Admin, etc.).
- `components` : composants d'UI reutilisables.
- `lib` : utilitaires (URL API, config backend).
- `hooks`, `contexts` : logique transversale.

### `site/backend`

- `app.py` : bootstrap Flask, JWT, CORS, Socket.IO, blueprints.
- `database.py` : modeles SQLAlchemy.
- `routes` : endpoints par domaine.
- `scheduler.py` : simulation periodique + maintenance overdue.
- `seed_database.py` : donnees demo.
- `migrate_add_thresholds.py` : migration schema legacy.
- `requirements.txt` : dependances backend.

## Dossier `app` (mobile)

- `main.py` : point d'entree application Kivy.
- `co2page.py`, `alarm_screen.py`, `login_user.py` : ecrans principaux.
- `dbdata.py` : acces SQLite mobile.
- `sensors` : connecteurs capteurs Python.

## Dossier `docs`

- Guides principaux : demarrage, utilisateur, developpeur, API, depannage.
- Sous-espace `docs/docs` : organisation secondaire (guides thematiques).
- `random` : archives documentaires historiques.

## Dossier `tests`

Scripts Python de verification :

- endpoints API,
- analytics,
- performance,
- integrations de visualisation.

## Principes de navigation

1. Fonctionnel utilisateur : `README.md` -> `docs/INDEX.md` -> `GUIDE-UTILISATEUR.md`
2. Integration API : `docs/REFERENCE-API.md` + `site/backend/routes`
3. Developpement : `docs/GUIDE-DEVELOPPEUR.md` + `site/src` + `site/backend`
