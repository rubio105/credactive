# 🚀 Guida Deploy Produzione CIRY

## 📋 Pre-Deploy Checklist

### ✅ Modifiche Implementate
- [x] Login logs retention automatica (10 giorni)
- [x] Endpoint `/api/health` per monitoring
- [x] Pulsante microfono vocale grande e separato
- [x] Conversazione vocale completa (OpenAI Voice + Gemini)
- [x] Documentazione completa (Utente/Medico/Admin)
- [x] Script deploy automatico (`deploy.sh`)
- [x] LoginLogsScheduler e WearableScheduler attivi

### 🔍 Verifiche Pre-Deploy
```bash
# 1. Verifica che il server funzioni localmente
curl http://localhost:5000/api/health

# 2. Verifica i log per errori
pm2 logs credactive --lines 50

# 3. Verifica che gli scheduler siano attivi
pm2 logs credactive | grep "LoginLogsScheduler\|WearableScheduler"
```

---

## 🚀 Metodo 1: Deploy Automatico (RACCOMANDATO)

### Su Server Hetzner

```bash
# 1. SSH su server
ssh root@your-hetzner-server-ip

# 2. Navigate to project directory
cd /path/to/credactive
# Esempio: cd /var/www/credactive

# 3. Pull latest code
git pull origin main

# 4. Run automated deploy script
./deploy.sh
```

Lo script automatico esegue:
1. ✅ Backup database PostgreSQL
2. ✅ Pull codice da GitHub
3. ✅ Install dependencies
4. ✅ Build frontend + backend
5. ✅ Database migration
6. ✅ Restart PM2
7. ✅ Health check automatico
8. ✅ Verifica scheduler logs

**Ultimo Step Manuale:**
- Vai su Cloudflare Dashboard
- Seleziona il dominio (ciry.app)
- **Caching → Configuration → Purge Everything**

---

## 🔧 Metodo 2: Deploy Manuale

Se preferisci eseguire i passaggi uno per uno:

### STEP 1: Commit su GitHub (locale)

```bash
git add .
git commit -m "feat: health endpoint + login retention + voice UI improvements

- Added /api/health endpoint for production monitoring
- Implemented LoginLogsScheduler with 10-day retention policy
- Enhanced voice input UI with large separate microphone button
- Created comprehensive documentation (GUIDA_UTENTE/MEDICO/ADMIN)
- Added automated deploy.sh script
- Fixed login logs filter bug"

git push origin main
```

### STEP 2: SSH su Server

```bash
ssh root@your-hetzner-server-ip
cd /var/www/credactive  # (o il tuo percorso)
```

### STEP 3: Backup Database

```bash
# Crea backup
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Verifica backup creato
ls -lh $BACKUP_FILE
```

### STEP 4: Pull & Install

```bash
git pull origin main
npm install
```

### STEP 5: Build

```bash
npm run build
```

### STEP 6: Database Migration

```bash
npm run db:push
```

### STEP 7: Restart PM2

```bash
# Restart applicazione
pm2 restart credactive

# Verifica status
pm2 status

# Controlla i log
pm2 logs credactive --lines 50
```

**Dovresti vedere nei log:**
```
[LoginLogsScheduler] Starting daily login logs cleanup (retention: 10 days)
[LoginLogsScheduler] Cleaning up login logs older than 10 days...
[LoginLogsScheduler] Cleanup completed: X old login logs deleted
[WearableScheduler] Starting daily report generation scheduler
9:41:47 PM [express] serving on port 5000
```

### STEP 8: Health Check

```bash
curl https://ciry.app/api/health
```

**Risposta attesa:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T21:42:05.110Z",
  "uptime": 21.45,
  "environment": "production"
}
```

### STEP 9: Purge Cloudflare Cache

1. Vai su **Cloudflare Dashboard**
2. Seleziona il dominio (`ciry.app`)
3. **Caching → Configuration**
4. Click **"Purge Everything"**
5. Conferma

---

## 🔍 Smoke Test Post-Deploy

### 1. Backend API
```bash
curl https://ciry.app/api/health
```

### 2. Frontend
- Apri browser: `https://ciry.app`
- Verifica che il sito carichi correttamente

### 3. Login System
- Fai login come **admin**
- Vai a **Admin → Log Accessi Sistema**
- Verifica che la pagina funzioni

### 4. Voice Input (Paziente)
- Logout e login come **paziente**
- Vai a **Prevenzione**
- Clicca sul **pulsante microfono blu/viola grande**
- Permetti accesso microfono
- Parla: _"Ciao, come stai?"_
- Verifica risposta vocale dell'AI

### 5. Schedulers
```bash
# Verifica nei log
pm2 logs credactive | grep "LoginLogsScheduler"

# Dovresti vedere:
# [LoginLogsScheduler] Starting daily login logs cleanup (retention: 10 days)
# [LoginLogsScheduler] Cleanup completed: X old login logs deleted
```

### 6. Documentation
- Vai a: `https://ciry.app/docs/GUIDA_UTENTE.md` (se servito staticamente)
- O verifica che i file siano presenti: `ls -l docs/`

---

## 📊 Monitoring Post-Deploy

### Primi 15 Minuti
```bash
# Tieni aperto il log
pm2 logs credactive --lines 200
```

**Controlla:**
- ✅ Nessun errore critico
- ✅ LoginLogsScheduler partito
- ✅ WearableScheduler partito
- ✅ Richieste API rispondono (200 OK)

### Dopo 24 Ore
```bash
# Verifica cleanup automatico login logs
pm2 logs credactive | grep "Cleanup completed"
```

---

## 🆘 Troubleshooting

### Problema: Health endpoint ritorna HTML invece di JSON

**Causa:** Il server non si è riavviato correttamente

**Soluzione:**
```bash
pm2 restart credactive
pm2 logs credactive --lines 50
```

### Problema: PM2 non riparte

**Soluzione:**
```bash
# Check PM2 status
pm2 status

# Se credactive non esiste, ricrealo
pm2 start dist/index.js --name credactive

# Salva configurazione
pm2 save
```

### Problema: Build fallisce

**Soluzione:**
```bash
# Pulisci build precedente
rm -rf dist/

# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install

# Retry build
npm run build
```

### Problema: Database migration errore

**Soluzione:**
```bash
# Forza push (attenzione: può causare data loss!)
npm run db:push --force
```

### Problema: Cloudflare cache non si purga

**Soluzione:**
- Vai su Cloudflare
- Prova **Purge by URL** invece di "Purge Everything"
- URL da purgare:
  - `https://ciry.app`
  - `https://ciry.app/api/health`
  - `https://ciry.app/assets/*`

---

## 🔙 Rollback (Emergenza)

Se qualcosa va storto e serve tornare indietro:

```bash
# 1. Trova commit precedente
git log --oneline -10

# 2. Checkout versione precedente
git checkout <commit-hash>

# 3. Rebuild
npm run build

# 4. Restart PM2
pm2 restart credactive

# 5. (Opzionale) Restore database
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 6. Purge Cloudflare cache
```

**Poi torna su main quando risolto:**
```bash
git checkout main
```

---

## 📈 Metriche di Successo

### Dopo il deploy, verifica:

1. **Health Endpoint** ✅
   - `GET /api/health` risponde con `{"status":"ok"}`

2. **Login Logs Retention** ✅
   - Scheduler attivo nei log
   - Cleanup eseguito ogni 24h

3. **Voice Input** ✅
   - Pulsante microfono visibile e separato
   - Recording funziona
   - TTS risposta automatica

4. **Documentazione** ✅
   - File presenti in `/docs`
   - Accessibili ai rispettivi ruoli

5. **Performance** ✅
   - Tempo di risposta `/api/health` < 100ms
   - Nessun errore nei log

---

## 🎯 Comandi Utili

```bash
# Monitor logs in real-time
pm2 logs credactive

# Check process status
pm2 status credactive

# Restart application
pm2 restart credactive

# Stop application
pm2 stop credactive

# View last 100 logs
pm2 logs credactive --lines 100

# Search in logs
pm2 logs credactive | grep "ERROR"

# Check disk space
df -h

# Check memory usage
free -h

# Check PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

---

## 📞 Support

Se hai problemi durante il deploy:
1. Controlla i log: `pm2 logs credactive --lines 200`
2. Verifica health: `curl https://ciry.app/api/health`
3. Controlla Nginx: `sudo nginx -t && sudo systemctl status nginx`
4. Verifica PostgreSQL: `psql $DATABASE_URL -c "SELECT 1"`

---

**Ultimo aggiornamento:** 8 Novembre 2025  
**Versione:** 1.0.0  
**Environment:** Production (Hetzner + Neon + Cloudflare)
