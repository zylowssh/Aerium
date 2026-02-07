# 🚀 Guide de Déploiement en Production

**Date:** février 2026

## 🎯 Vue d'Ensemble

Ce guide couvre le déploiement complet d'Aerium sur un serveur de production.

---

## 📋 Prérequis

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Python 3.9+
- Node.js 18+
- Nginx (serveur web)
- Certificat SSL/TLS
- Domaine enregistré

---

## 🔧 Configuration du Serveur

### 1. Mise à Jour du Système

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y \
  python3-pip \
  python3-venv \
  nodejs \
  npm \
  nginx \
  certbot \
  python3-certbot-nginx \
  supervisor \
  git \
  curl
```

### 2. Créer Utilisateur de Service

```bash
sudo useradd -m -s /bin/bash aerium
sudo usermod -aG sudo aerium
sudo su - aerium
```

### 3. Cloner le Repository

```bash
git clone <repository-url> air-sense-dashboard
cd air-sense-dashboard
```

---

## 💻 Configuration Backend (Flask)

### 1. Environnement Virtual Python

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

### 2. Fichier .env Production

```bash
cp .env.example .env
# Éditer avec vos valeurs
nano .env
```

Contenu `.env` pour production:

```env
# Sécurité
FLASK_ENV=production
DEBUG=False
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
JWT_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# Base de Données
DATABASE_URL=sqlite:////home/aerium/air-sense-dashboard/backend/instance/aerium_prod.db

# Email
ENABLE_EMAIL_NOTIFICATIONS=True
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app
MAIL_DEFAULT_SENDER=noreply@aerium-app.com

# Seuils Alertes
ALERT_CO2_THRESHOLD=1200
ALERT_TEMP_MIN=15
ALERT_TEMP_MAX=28
ALERT_HUMIDITY_THRESHOLD=80

# Rate Limiting
ENABLE_RATE_LIMITING=True
RATELIMIT_DEFAULT=200 per day;50 per hour;10 per minute

# Logging
LOG_LEVEL=INFO
LOG_FILE=/home/aerium/air-sense-dashboard/backend/logs/aerium.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=10

# Frontend URL
FRONTEND_URL=https://votre-domaine.com

# CORS
CORS_ORIGINS=https://votre-domaine.com
```

### 3. Initialiser Base de Données

```bash
python seed_database.py
```

### 4. Service Systemd pour Backend

Créer `/etc/systemd/system/aerium-backend.service`:

```ini
[Unit]
Description=Aerium Flask Backend
After=network.target

[Service]
User=aerium
WorkingDirectory=/home/aerium/air-sense-dashboard/backend
Environment="PATH=/home/aerium/air-sense-dashboard/backend/venv/bin"
ExecStart=/home/aerium/air-sense-dashboard/backend/venv/bin/gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile /var/log/aerium/access.log \
    --error-logfile /var/log/aerium/error.log \
    app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activer le service:

```bash
sudo mkdir -p /var/log/aerium
sudo chown aerium:aerium /var/log/aerium
sudo systemctl daemon-reload
sudo systemctl enable aerium-backend
sudo systemctl start aerium-backend
sudo systemctl status aerium-backend
```

---

## 🎨 Configuration Frontend (React)

### 1. Build l'Application

```bash
cd /home/aerium/air-sense-dashboard
npm install
npm run build
```

Produit: `dist/` (fichiers statiques)

### 2. Configuration Nginx

Créer `/etc/nginx/sites-available/aerium`:

```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # Certificat SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;

    # Frontend statique
    root /home/aerium/air-sense-dashboard/dist;
    index index.html;

    # Frontend SPA - rediriger vers index.html
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Assets avec caching long
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API - proxy vers Flask
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Activer le site:

```bash
sudo ln -s /etc/nginx/sites-available/aerium /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Certificat SSL

```bash
sudo certbot certonly --nginx -d votre-domaine.com -d www.votre-domaine.com
```

Renouvellement automatique:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 📊 Monitoring & Logging

### 1. Fichiers Logs

Backend:
- `/var/log/aerium/access.log` - Accès HTTP
- `/var/log/aerium/error.log` - Erreurs
- Backend custom: `/home/aerium/air-sense-dashboard/backend/logs/aerium.log`

Consulter les logs:

```bash
# Temps réel backend
tail -f /var/log/aerium/error.log

# Temps réel Nginx
tail -f /var/log/nginx/access.log

# Rechercher erreurs
grep ERROR /home/aerium/air-sense-dashboard/backend/logs/aerium.log
```

### 2. Monitoring de l'Espace Disque

```bash
df -h
du -sh /home/aerium/air-sense-dashboard

# Nettoyer anciens logs
find /var/log/aerium -name "*.log.*" -mtime +30 -delete
```

### 3. Monitoring de la Mémoire

```bash
free -h
top -b -n 1 | grep aerium
```

---

## 🔄 Mises à Jour & Maintenance

### Mise à Jour de l'Application

```bash
cd /home/aerium/air-sense-dashboard
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ..
npm install
npm run build

# Redémarrer services
sudo systemctl restart aerium-backend
sudo systemctl restart nginx
```

### Backup de Base de Données

```bash
# Script de backup
#!/bin/bash
BACKUP_DIR="/home/aerium/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp /home/aerium/air-sense-dashboard/backend/instance/aerium_prod.db \
   $BACKUP_DIR/aerium_prod_$TIMESTAMP.db
# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
```

Ajouter à crontab (backup quotidien):

```bash
crontab -e
# Ajouter:
0 2 * * * /home/aerium/backups/backup.sh
```

---

## 🔐 Sécurité en Production

### 1. Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### 2. Fail2Ban (protection brute force)

```bash
sudo apt install -y fail2ban

# Créer config
sudo nano /etc/fail2ban/jail.local
```

Contenu:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true
```

Redémarrer:

```bash
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
```

### 3. Permissions Fichiers

```bash
sudo chown -R aerium:aerium /home/aerium/air-sense-dashboard
chmod 750 /home/aerium/air-sense-dashboard
chmod 640 /home/aerium/air-sense-dashboard/backend/.env
```

---

## 📈 Performance en Production

### 1. Configuration Gunicorn

```bash
# Pour serveur avec 4 CPUs:
# workers = (2 × CPU_COUNT) + 1 = 9
# Actuellement: 4 workers (conservateur)
```

Augmenter si nécessaire:

```bash
# /etc/systemd/system/aerium-backend.service
ExecStart=... --workers 8 ...
```

### 2. Configuration Nginx

```nginx
# Maximum connections
worker_processes auto;
worker_connections 1024;
```

### 3. Database Optimization

```bash
# Vérifier intégrité DB
cd /home/aerium/air-sense-dashboard/backend
sqlite3 instance/aerium_prod.db "PRAGMA integrity_check;"

# Optimiser
sqlite3 instance/aerium_prod.db "VACUUM;"
```

---

## ✅ Checklist Déploiement

- [ ] Certificat SSL installé et renouvelable
- [ ] Backend service active et autostart OK
- [ ] Frontend build et servie par Nginx
- [ ] Emails configurés et testés
- [ ] Logging actif et logs rotatifs OK
- [ ] Backup base de données configuré
- [ ] Firewall activé
- [ ] Fail2Ban activé
- [ ] Monitoring mis en place
- [ ] Health check accessible
- [ ] Domaine DNS pointant vers serveur
- [ ] Rate limiting activé
- [ ] CORS configuré correctement
- [ ] Variables d'environnement production
- [ ] Tests fonctionnels post-déploiement

---

## 🆘 Troubleshooting Déploiement

### Backend refuse de démarrer

```bash
# Vérifier logs
sudo journalctl -u aerium-backend -n 50

# Tester syntaxe Python
cd backend && python app.py

# Vérifier permissions
ls -la venv/bin/activate
```

### Nginx 502 Bad Gateway

```bash
# Vérifier backend tourne
sudo systemctl status aerium-backend

# Vérifier port 5000
sudo ss -tlnp | grep 5000

# Vérifier Nginx config
sudo nginx -t
```

### Certificat SSL expire

```bash
# Renouveler manuellement
sudo certbot renew --force-renewal

# Vérifier date expiration
sudo certbot certificates
```

---

## 📞 Support

Pour des questions: consulter [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Dernière mise à jour:** février 2026
