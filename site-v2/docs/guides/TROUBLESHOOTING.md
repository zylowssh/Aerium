# 🛠️ Guide de Dépannage

**Date:** février 2026

## 🔍 Problèmes Courants

---

## Backend

### 1. "ModuleNotFoundError: No module named 'flask'"

**Cause:** Dépendances Python non installées

**Solution:**

```bash
cd backend
pip install -r requirements.txt
```

### 2. "Address already in use" sur le port 5000

**Cause:** Processus Flask déjà en cours d'exécution

**Solution:**

```bash
# Trouver le processus
lsof -i :5000
# OU
netstat -tlnp | grep 5000

# Terminer le processus
kill -9 <PID>

# Ou utiliser un autre port
FLASK_PORT=5001 python app.py
```

### 3. "No such table: users"

**Cause:** Base de données non initialisée

**Solution:**

```bash
# Réinitialiser la base de données
rm backend/instance/aerium.db  # Si existe

# Ou seed
python backend/seed_database.py

# Vérifier les tables
sqlite3 backend/instance/aerium.db ".tables"
```

### 4. Email ne s'envoie pas

**Vérifications:**

```bash
# 1. Vérifier configuration .env
grep MAIL_ backend/.env

# 2. Vérifier SMTP credentials
# - Pour Gmail: utiliser "Mot de passe d'app" pas le mot de passe régulier
# - Activer "Accès applications moins sécurisées" si besoin

# 3. Vérifier logs
tail -f backend/logs/aerium.log | grep -i email

# 4. Tester manuellement
python -c "
from backend.email_service import send_alert_email
send_alert_email('test@example.com', 'Test', 'Message test')
"
```

### 5. Erreur JWT: "Invalid token"

**Causes possibles:**

```bash
# 1. Token expiré
# → Utiliser /api/auth/refresh pour obtenir nouveau token

# 2. Mauvaise clé secrète
# → Vérifier JWT_SECRET_KEY dans .env

# 3. Format header invalide
# → Doit être "Authorization: Bearer <token>"
# → Pas "Authorization: <token>"

# 4. Token modifié
# → Régénérer en se reconnectant
```

### 6. Rate limiting trop strict / trop permissif

**Ajuster dans .env:**

```env
# Strict (test/sécurité)
RATELIMIT_DEFAULT=100 per day;25 per hour;5 per minute

# Modéré (défaut)
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute

# Permissif (bêta)
RATELIMIT_DEFAULT=500 per day;100 per hour;30 per minute

# Désactiver complètement
ENABLE_RATE_LIMITING=False
```

Redémarrer le serveur après modifications.

### 7. WebSocket ne se connecte pas

**Backend - Vérifier Flask-SocketIO:**

```bash
# 1. Vérifier installation
pip show flask-socketio

# 2. Vérifier que le serveur écoute WebSocket
# Dans app.py, vérifier:
from flask_socketio import SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# 3. Logs
tail -f backend/logs/aerium.log | grep -i socket
```

**Frontend - Vérifier client:**

```bash
# 1. Vérifier URL WebSocket dans browser console
# Devrait être: ws://localhost:5000 ou ws://domaine:port

# 2. Vérifier logs dans developer tools
# F12 → Console → chercher "socket"

# 3. Vérifier CORS
# Headers Response doivent avoir: Access-Control-Allow-Origin
```

---

## Frontend

### 1. "Cannot find module '@/<path>'"

**Cause:** Alias de chemin mal configuré

**Vérification:**

```bash
# Vérifier vite.config.ts
cat vite.config.ts | grep resolve

# Doit contenir:
# resolve: {
#   alias: {
#     '@': fileURLToPath(new URL('./src', import.meta.url))
#   }
# }
```

### 2. Styles Tailwind ne s'appliquent pas

**Solution:**

```bash
# 1. Vérifier tailwind.config.ts
cat tailwind.config.ts

# 2. Doit contenir content:
# content: ["./src/**/*.{js,ts,jsx,tsx}"]

# 3. Nettoyer et rebuilder
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 3. "React Router: Failed to fetch component chunk"

**Cause:** Code splitting / module chargement échoué

**Solution:**

```bash
# 1. Vérifier imports dynamiques
# Utiliser React.lazy() correctement

# 2. Nettoyer build
rm -rf dist/
npm run build

# 3. Vérifier console navigateur
# F12 → Network → voir les erreurs de chargement
```

### 4. API retourne 404 mais l'endpoint existe

**Vérifications:**

```bash
# 1. Backend en cours d'exécution?
curl http://localhost:5000/api/health

# 2. URL complète correcte?
# Vérifier dans src/lib/apiClient.ts:
# const BASE_URL = "http://localhost:5000"

# 3. CORS activé?
# Backend doit avoir Flask-CORS activé
# app = Flask(__name__)
# CORS(app)

# 4. Headers Authorization?
# Vérifier que token est envoyé si endpoint nécessite auth
```

### 5. Images ne s'affichent pas

**Solution:**

```bash
# 1. Vérifier chemin
# Images doivent être dans src/assets/

# 2. Import correct
import logo from '@/assets/logo.png'

# 3. En développement
npm run dev

# 4. Build
npm run build
# Vérifier dist/assets/
```

### 6. Composants shadcn/ui manquants

**Installation:**

```bash
# 1. Installer composant manquant
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog

# 2. Vérifier liste installée
ls src/components/ui/
```

### 7. Infinite loop / page se recharge constamment

**Causes:**

```bash
# 1. Dépendances useEffect infinies
# Vérifier tous les useEffect([])

# 2. Appels API infinies
# Vérifier TanStack Query config

# 3. Redirection en boucle
# Vérifier React Router redirects
```

**Debug:**

```bash
# 1. Ouvrir DevTools F12
# 2. Network tab → voir les requêtes répétées
# 3. Console → voir les erreurs

# 4. Ajouter logs
console.log("Component mounted");
useEffect(() => {
  console.log("Effect running");
}, []);
```

---

## Problèmes Network

### 1. "Failed to fetch" / connexion refusée

**Vérifications:**

```bash
# 1. Backend tourne?
curl http://localhost:5000/api/health

# 2. Port correct?
netstat -tlnp | grep 5000

# 3. Firewall?
sudo ufw status
# Si bloqué:
sudo ufw allow 5000

# 4. Proxy d'entreprise?
# Configurer npm/git pour proxy
npm config set proxy http://proxy:port
```

### 2. CORS error: "Access-Control-Allow-Origin"

**Cause:** Frontend et Backend sur origines différentes

**Backend (.env):**

```env
# Développement
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production
CORS_ORIGINS=https://votre-domaine.com

# Tous (déconseillé sauf dev)
CORS_ORIGINS=*
```

**Redémarrer backend après modification.**

### 3. Timeout "The server does not respond"

**Causes & Solutions:**

```bash
# 1. Serveur surchargé
ps aux | grep python

# 2. Requête trop longue
# Augmenter timeout dans axios
// src/lib/apiClient.ts
const axiosInstance = axios.create({
  timeout: 30000  // 30 secondes
})

# 3. Serveur down
curl -v http://localhost:5000/api/health
```

---

## Base de Données

### 1. Base de données corrompue

**Réparation:**

```bash
# 1. Vérifier intégrité
sqlite3 backend/instance/aerium.db "PRAGMA integrity_check;"

# 2. Backup d'abord
cp backend/instance/aerium.db backend/instance/aerium.db.backup

# 3. Reconstruire
sqlite3 backend/instance/aerium.db "VACUUM;"

# 4. Réinitialiser si nécessaire
rm backend/instance/aerium.db
python backend/seed_database.py
```

### 2. "Database is locked"

**Cause:** Transaction en cours ou connexion abandonnée

**Solution:**

```bash
# 1. Attendre quelques secondes

# 2. Redémarrer backend
pkill -f "python app.py"
sleep 2
python app.py

# 3. Ou nettoyer fichier lock
rm backend/instance/aerium.db-shm
rm backend/instance/aerium.db-wal
```

### 3. Erreur migration base de données

**Dans nouveaux champs:**

```bash
# 1. Backup
cp backend/instance/aerium.db backend/instance/aerium.db.backup

# 2. Supprimer et recréer
rm backend/instance/aerium.db
python backend/seed_database.py

# 3. Ou ALTER TABLE si données importantes
```

---

## Production

### 1. "Internal Server Error" (500)

**Debug:**

```bash
# 1. Vérifier logs
tail -100 /var/log/aerium/error.log

# 2. Vérifier systemd
sudo journalctl -u aerium-backend -n 50 -e

# 3. Logs applicatif
tail -f backend/logs/aerium.log

# 4. Redémarrer service
sudo systemctl restart aerium-backend
```

### 2. "Bad Gateway" (502) sur Nginx

**Vérifications:**

```bash
# 1. Backend tourne?
sudo systemctl status aerium-backend

# 2. Écoute le bon port?
sudo ss -tlnp | grep 5000

# 3. Config Nginx correcte?
sudo nginx -t

# 4. Redémarrer Nginx
sudo systemctl restart nginx
```

### 3. Certificat SSL expiré

```bash
# 1. Vérifier expiration
sudo certbot certificates

# 2. Renouveler
sudo certbot renew --force-renewal

# 3. Tester renouvellement auto
sudo systemctl status certbot.timer
```

### 4. Espace disque plein

```bash
# 1. Vérifier usage
df -h
du -sh /home/aerium/air-sense-dashboard

# 2. Nettoyer logs
sudo find /var/log/aerium -mtime +30 -delete
sudo find backend/logs -mtime +30 -delete

# 3. Nettoyer build
rm -rf dist/
rm -rf node_modules/

# 4. Vérifier base de données
sqlite3 backend/instance/aerium_prod.db "SELECT COUNT(*) FROM sensor_readings;"
```

---

## Vérification Santé Système

### Script de Diagnostic

```bash
#!/bin/bash
echo "=== Aerium Health Check ==="
echo

echo "1. Backend Service"
sudo systemctl status aerium-backend | grep "Active"

echo "2. Backend Port"
sudo ss -tlnp | grep 5000 || echo "NOT LISTENING"

echo "3. Frontend Build"
ls -lah dist/index.html || echo "Build not found"

echo "4. Nginx"
sudo systemctl status nginx | grep "Active"

echo "5. Database"
sqlite3 backend/instance/aerium_prod.db ".tables" || echo "DB not found"

echo "6. Disk Space"
df -h / | tail -1

echo "7. Memory"
free -h | grep Mem

echo "8. API Health"
curl -s http://localhost:5000/api/health || echo "API not responding"

echo "9. Recent Errors"
sudo tail -5 /var/log/aerium/error.log || echo "No errors"
```

---

## 📚 Ressources Utiles

### Commandes Debugging

```bash
# Logs en temps réel
tail -f backend/logs/aerium.log
tail -f /var/log/aerium/error.log

# Monitoring processus
top
watch -n 1 'ps aux | grep python'

# Network
netstat -tlnp
ss -tlnp

# Database
sqlite3 backend/instance/aerium.db ".schema"
sqlite3 backend/instance/aerium.db "SELECT COUNT(*) FROM users;"

# Filesystem
du -sh *
find . -name "*.log" -mtime +30

# Restart services
sudo systemctl restart aerium-backend
sudo systemctl restart nginx
```

### Variables d'Environnement Debug

```bash
# Backend
DEBUG=True
LOG_LEVEL=DEBUG
FLASK_ENV=development

# Frontend (vite)
VITE_DEBUG=true
```

---

## ✅ Checklist Diagnostic

- [ ] Backend tourne sur port 5000
- [ ] Frontend build exist et est accessible
- [ ] Base de données initialisée et accessible
- [ ] Emails configurés et testés
- [ ] WebSocket connecte correctement
- [ ] JWT tokens générés et validés
- [ ] Rate limiting fonctionne
- [ ] Logs en cours d'écriture
- [ ] Certificats SSL valides (production)
- [ ] CORS headers présents
- [ ] Espace disque suffisant
- [ ] Mémoire RAM suffisant

---

## 🆘 Besoin de Plus d'Aide?

1. Consulter [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre le système
2. Consulter [DEPLOYMENT.md](DEPLOYMENT.md) pour configuration production
3. Vérifier logs détaillés
4. Créer issue GitHub avec diagnostics

---

**Dernière mise à jour:** février 2026
