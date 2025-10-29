# 🚀 Guida Deploy Produzione - CIRY

## 📋 Prerequisiti Server

- **Server**: Hetzner VPS (157.180.21.147)
- **Path**: `/var/www/ciry-app`
- **Process Manager**: PM2
- **Web Server**: Nginx + Cloudflare SSL
- **Database**: Neon PostgreSQL

## 🔧 Setup Iniziale (Solo Prima Volta)

### 1. Installare PM2 Globalmente
```bash
npm install -g pm2
```

### 2. Configurare Nginx
```bash
# File: /etc/nginx/sites-available/ciry-app
server {
    listen 80;
    listen 443 ssl http2;
    server_name ciry.app www.ciry.app;

    # SSL tramite Cloudflare
    ssl_certificate /path/to/cloudflare/cert.pem;
    ssl_certificate_key /path/to/cloudflare/key.pem;

    # Static assets (immagini, etc)
    location /images/ {
        alias /var/www/ciry-app/public/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy verso Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Creare File `.env` in Produzione
```bash
# Copiare .env.example in .env e configurare:
DATABASE_URL=postgresql://...
SESSION_SECRET=...
OPENAI_API_KEY=...
GOOGLE_AI_API_KEY=...
STRIPE_SECRET_KEY=...
VITE_STRIPE_PUBLIC_KEY=...  # NECESSARIO per build frontend!
BREVO_API_KEY=...
# ... altre variabili
```

**⚠️ IMPORTANTE**: `VITE_STRIPE_PUBLIC_KEY` deve essere presente durante `npm run build`!

## 🚢 Deployment Standard

### 1. Connessione SSH
```bash
ssh root@157.180.21.147
cd /var/www/ciry-app
```

### 2. Aggiornare Codice
```bash
git pull
```

### 3. Installare Dipendenze (se package.json è cambiato)
```bash
npm install
```

### 4. Build Applicazione
```bash
npm run build
```

Questo comando esegue:
- `vite build` → Compila frontend in `dist/public`
- `esbuild server/index.ts` → Compila backend in `dist/index.js`

### 5. Riavviare PM2
```bash
# Prima volta (setup)
pm2 start ecosystem.config.cjs

# Aggiornamenti successivi
pm2 restart ciry-app

# Verificare logs
pm2 logs ciry-app --lines 30

# Verificare status
pm2 status
```

### 6. Salvare Configurazione PM2 (Solo prima volta)
```bash
pm2 save
pm2 startup
# Seguire le istruzioni output
```

## 🔍 Troubleshooting

### Errore: "Cannot find module dist/index.js"
```bash
# Verificare che build sia completato
ls -la dist/
# Deve contenere: index.js, public/

# Se manca, rifare build
npm run build
pm2 restart ciry-app
```

### Errore: "VITE_STRIPE_PUBLIC_KEY is not set"
```bash
# Aggiungere in /var/www/ciry-app/.env
echo "VITE_STRIPE_PUBLIC_KEY=pk_live_..." >> .env

# Rifare build
npm run build
pm2 restart ciry-app
```

### Server non risponde
```bash
# Verificare PM2
pm2 status
pm2 logs ciry-app --lines 50

# Verificare Nginx
sudo nginx -t
sudo systemctl restart nginx

# Verificare porta
netstat -tulpn | grep :5000
```

### Database non connesso
```bash
# Testare connessione
psql "$DATABASE_URL"

# Aggiornare schema database
npm run db:push
```

## 📊 Comandi Utili PM2

```bash
# Vedere tutti i processi
pm2 list

# Logs real-time
pm2 logs ciry-app

# Logs ultimi N righe
pm2 logs ciry-app --lines 100

# Monitorare risorse
pm2 monit

# Riavvio automatico dopo crash
pm2 restart ciry-app --watch

# Fermare processo
pm2 stop ciry-app

# Rimuovere processo
pm2 delete ciry-app
```

## 🔐 Sicurezza

1. **Non committare `.env`** (verificato in `.gitignore`)
2. **Variabili ambiente sensibili** solo in `.env` server
3. **HTTPS obbligatorio** tramite Cloudflare
4. **Firewall**: Aprire solo porte 80, 443, 22

## 📝 Checklist Pre-Deploy

- [ ] Pull ultima versione da GitHub
- [ ] Verificare `.env` completo con tutte le variabili
- [ ] Verificare `VITE_STRIPE_PUBLIC_KEY` presente
- [ ] Eseguire `npm install` se package.json cambiato
- [ ] Eseguire `npm run build`
- [ ] Riavviare PM2: `pm2 restart ciry-app`
- [ ] Verificare logs: `pm2 logs ciry-app --lines 30`
- [ ] Testare sito: https://ciry.app

## 🆘 Rollback Veloce

Se il deploy rompe qualcosa:

```bash
# 1. Tornare a commit precedente
git log --oneline -5
git reset --hard <commit-hash>

# 2. Rebuild
npm run build

# 3. Restart
pm2 restart ciry-app
```

## 📱 Notifiche Push (Temporaneamente Disabilitate)

Per riattivare, aggiungere in `.env`:
```bash
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

**Ultimo aggiornamento**: 29 Ottobre 2025
**Manutentore**: CIRY DevOps Team
