# Installation

Procedure d'installation locale d'Aerium.

## Prerequis

- Python 3.11
- Node.js 18+
- npm 9+

## Backend Flask

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

## Frontend React

```powershell
cd site
copy .env.example .env
npm install
npm run dev
```

## Verification

- Frontend : `http://localhost:5173`
- API health : `http://localhost:5000/api/health`

## Option scripts

- Windows : `cd site ; start.bat`
- Linux/macOS : `cd site ; bash start.sh`
