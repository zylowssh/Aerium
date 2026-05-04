# Troubleshooting (FR)

Version courte du depannage. Version detaillee : [../../DEPANNAGE.md](../../DEPANNAGE.md)

## Cas frequents

- API inaccessible -> verifier backend + `VITE_API_URL`.
- 401 JWT -> reconnecter, verifier header Authorization.
- WebSocket inactif -> verifier token de connexion socket.
- Donnees vides -> lancer `python seed_database.py`.
- Erreur 429 -> ralentir les appels ou ajuster rate limiting en dev.
