# Depannage

Guide de resolution des incidents les plus courants sur Aerium.

## 1. Le frontend ne joint pas l'API

Symptomes : echec login, ecran vide, erreurs CORS.

Verifications :

1. Backend actif sur `http://localhost:5000`.
2. `site/.env` contient `VITE_API_URL=http://localhost:5000/api`.
3. Redemarrer `npm run dev` apres modification de `.env`.

## 2. Erreur 401 JWT

Symptomes : deconnexion immediate, appels API refuses.

Actions :

1. Refaire une connexion pour renouveler le token.
2. Verifier l'entete `Authorization: Bearer <token>`.
3. Verifier `JWT_SECRET_KEY` stable dans `site/backend/.env`.

## 3. WebSocket inactif

Symptomes : donnees dashboard non mises a jour en direct.

Actions :

1. Verifier backend lance avec `python app.py`.
2. Verifier le token est transmis lors de la connexion Socket.IO.
3. Verifier qu'aucun proxy/reseau ne bloque `ws://localhost:5000`.

## 4. Base de donnees vide ou comptes demo absents

Actions :

```powershell
cd site/backend
python seed_database.py
```

Puis reconnectez-vous avec :

- `demo@aerium.app` / `demo123`
- `admin@aerium.app` / `admin123`

## 5. Erreurs dependances Python

Actions :

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

## 6. Erreurs dependances Node

Actions :

```powershell
cd site
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run dev
```

## 7. Port occupe (5000 ou 5173)

Actions :

1. Arreter les anciens processus.
2. Sur Windows : `netstat -ano | findstr :5000` puis tuer le PID.
3. Relancer backend/frontend.

## 8. Export PDF/CSV vide

Causes possibles :

- pas de lectures dans la periode,
- capteurs non initialises,
- mauvais filtre `days`.

Actions :

1. Verifier les lectures via API (`/api/readings/...`).
2. Generer des lectures (simulation ou POST `/api/readings`).

## 9. Limitation de debit (429)

Symptomes : erreurs 429 apres beaucoup d'appels.

Actions :

1. Attendre la fenetre suivante.
2. En dev uniquement, desactiver temporairement : `ENABLE_RATE_LIMITING=False`.

## 10. IA indisponible

Symptomes : reponses generiques ou status degrade.

Actions :

1. Verifier `MISTRAL_API_KEY` dans `site/backend/.env`.
2. Redemarrer le backend.
3. Verifier `/api/ai/status`.

## 11. Migration seuils capteurs legacy

Si schema ancien :

```powershell
cd site/backend
python migrate_add_thresholds.py
```

## 12. Toujours bloque ?

Collecter avant de demander de l'aide :

- logs backend (`site/backend/logs/aerium.log`),
- message d'erreur frontend (console navigateur),
- endpoint appele + payload + code HTTP.
