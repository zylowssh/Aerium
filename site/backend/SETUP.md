# Setup backend

Procedure de mise en route du backend Flask Aerium.

## 1. Environnement Python

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 2. Configuration

```powershell
copy .env.example .env
```

Verifier au minimum :

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `MISTRAL_API_KEY` (optionnel mais recommande)

## 3. Initialisation des donnees

```powershell
python seed_database.py
```

## 4. Lancement

```powershell
python app.py
```

## 5. Validation

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/docs`

## 6. Outils maintenance

- Promouvoir admin : `python make_user_admin.py <email>`
- Migrer seuils legacy : `python migrate_add_thresholds.py`
