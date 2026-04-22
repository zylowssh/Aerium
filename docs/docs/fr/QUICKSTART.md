# Quickstart FR

## 1. Backend

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

## 2. Frontend

```powershell
cd site
copy .env.example .env
npm install
npm run dev
```

## 3. Ouvrir

- `http://localhost:5173`

## 4. Comptes demo

- `demo@aerium.app` / `demo123`
- `admin@aerium.app` / `admin123`
