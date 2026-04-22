# README Developpement

Point d'acces rapide pour les contributeurs techniques.

## Liens prioritaires

- Setup local : [GUIDE-DEMARRAGE.md](GUIDE-DEMARRAGE.md)
- Architecture dev : [GUIDE-DEVELOPPEUR.md](GUIDE-DEVELOPPEUR.md)
- Reference API : [REFERENCE-API.md](REFERENCE-API.md)
- Structure code : [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Depannage : [DEPANNAGE.md](DEPANNAGE.md)

## Commandes utiles

### Backend

```powershell
cd site/backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_database.py
python app.py
```

### Frontend

```powershell
cd site
npm install
npm run dev
npm test
```

### Mobile

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app/main.py
```

## Pratiques recommandees

1. Ecrire/mettre a jour la documentation avec chaque changement API.
2. Verifier les endpoints modifies avant merge.
3. Conserver les messages de commit explicites (impact + contexte).
