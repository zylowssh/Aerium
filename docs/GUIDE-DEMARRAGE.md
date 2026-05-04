# Guide de demarrage

Ce guide couvre un lancement propre de la plateforme web Aerium (backend Flask + frontend React), puis l'application mobile Kivy.

## 1. Prerequis

- Python 3.11
- Node.js 18+
- npm 9+
- Git (recommande)

## 2. Cloner et se placer a la racine

```bash
git clone <url-du-repo>
cd Morpheus
```

## 3. Lancer l'application web

### Methode rapide

Depuis `site` :

- Windows : `start.bat`
- Linux/macOS : `bash start.sh`

### Methode manuelle (recommandee pour developper)

#### 3.1 Backend

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed_database.py
python app.py
```

Points de controle backend :

- Sante API : `http://localhost:5000/api/health`
- Docs API : `http://localhost:5000/api/docs`

#### 3.2 Frontend

Dans un deuxieme terminal :

```powershell
cd site
copy .env.example .env
npm install
npm run dev
```

Point de controle frontend :

- Interface : `http://localhost:5173`

## 4. Variables d'environnement minimales

### `site/backend/.env`

```env
SECRET_KEY=change-this-to-a-random-64-character-secret-key-for-production
JWT_SECRET_KEY=change-this-to-a-random-64-character-jwt-signing-secret-key
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-small-latest
MISTRAL_MAX_TOKENS=700
ENABLE_PROPHET=False
```

### `site/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_FLASK_ENABLED=true
```

## 5. Comptes de demonstration

Apres `python seed_database.py` :

- `demo@aerium.app` / `demo123`
- `admin@aerium.app` / `admin123`

## 6. Lancer l'application mobile (optionnel)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app/main.py
```

## 7. Verifications fonctionnelles rapides

1. Auth : connexion avec compte demo.
2. Capteurs : la page capteurs affiche une liste et permet creation/modification.
3. Temps reel : les valeurs changent en live sur dashboard.
4. Alertes : historique disponible dans `Alertes`.
5. Rapports : export CSV/PDF fonctionnel.

## 8. Arret des services

- Terminal backend : `Ctrl+C`
- Terminal frontend : `Ctrl+C`
- En script Windows : menu du script puis option d'arret.

## 9. Etape suivante

- Utilisateur final : [GUIDE-UTILISATEUR.md](GUIDE-UTILISATEUR.md)
- Developpeur : [GUIDE-DEVELOPPEUR.md](GUIDE-DEVELOPPEUR.md)
