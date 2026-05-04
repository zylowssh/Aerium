# Backend Aerium

Ce module est documente en francais.

## Documentation principale

- Guide backend complet : [README_FR.md](README_FR.md)
- Setup rapide : [SETUP.md](SETUP.md)
- Reference API globale projet : [../../docs/REFERENCE-API.md](../../docs/REFERENCE-API.md)

## Demarrage rapide

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

API locale : `http://localhost:5000`
