# Aerium Web (site)

Ce dossier contient l'application web complete : frontend React + backend Flask.

## Structure

- `src` : interface React/TypeScript.
- `backend` : API Flask, websocket, base SQLite.
- `start.bat` / `start.sh` : scripts de demarrage local.

## Demarrage rapide

### Windows

```powershell
cd site
start.bat
```

### Linux/macOS

```bash
cd site
bash start.sh
```

## Demarrage manuel

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

## URLs locales

- Frontend : `http://localhost:5173`
- API : `http://localhost:5000/api/health`
- Docs API : `http://localhost:5000/api/docs`

## Documentation

- Racine projet : [../README.md](../README.md)
- Index docs : [../docs/INDEX.md](../docs/INDEX.md)
- API : [../docs/REFERENCE-API.md](../docs/REFERENCE-API.md)
- Backend detail : [backend/README_FR.md](backend/README_FR.md)
