# 🚀 Deployment in Produzione - CIRY

**Data:** 19 Ottobre 2025  
**Server:** 157.180.21.147  
**Obiettivo:** Deploy codice con supporto Gemma (configurato per usare Gemini finché non hai GPU server)

---

## ✅ Pre-Deployment Checklist

- [x] Codice testato in locale (nessun errore LSP)
- [x] Fallback Gemini → Gemma implementato
- [x] Documentazione creata (GEMMA_DEPLOYMENT.md)
- [x] File .env.example aggiornato
- [ ] Push su GitHub
- [ ] Deploy su server
- [ ] Purge Cloudflare cache

---

## 📋 Comandi da Eseguire

### 1. Push Codice su GitHub (Dal tuo computer locale)

```bash
# Aggiungi tutti i file
git add .

# Commit
git commit -m "feat: Add Gemma self-hosted AI support with automatic Gemini fallback

- Created server/gemmaClient.ts for Ollama/Gemma communication
- Modified server/gemini.ts with automatic fallback logic (Gemma → Gemini)
- Added GEMMA_DEPLOYMENT.md with complete setup guide
- Updated replit.md with AI infrastructure documentation
- Added .env.example with Gemma configuration variables
- System ready for GPU server, currently using Gemini cloud"

# Push
git push origin main
```

---

### 2. SSH al Server di Produzione

```bash
ssh root@157.180.21.147
```

---

### 3. Naviga alla Directory del Progetto

```bash
cd /root/ciry
# O la directory dove hai installato CIRY
```

---

### 4. Pull Ultime Modifiche

```bash
git pull origin main
```

**Output atteso:**
```
remote: Counting objects: ...
Updating abc1234..def5678
Fast-forward
 server/gemmaClient.ts         | 245 +++++++++++++++++++
 server/gemini.ts              | 180 +++++++++++---
 GEMMA_DEPLOYMENT.md           | 450 +++++++++++++++++++++++++++++++++
 replit.md                     |  15 +-
 .env.example                  |  30 +++
 DEPLOY_PRODUCTION.sh          |  65 +++++
 DEPLOYMENT_INSTRUCTIONS.md    |  95 +++++++
 7 files changed, 1080 insertions(+)
```

---

### 5. Verifica Variabili d'Ambiente

```bash
# Controlla .env
cat .env | grep -E "GEMINI_API_KEY|USE_LOCAL_MODEL"
```

**Assicurati che:**
- ✅ `GEMINI_API_KEY` sia presente (già configurato)
- ✅ `USE_LOCAL_MODEL=false` oppure non presente (userà Gemini)

**Se `USE_LOCAL_MODEL=true` è presente, disabilitalo:**
```bash
nano .env
# Cambia: USE_LOCAL_MODEL=true
# In:     USE_LOCAL_MODEL=false
# Oppure commenta la riga: # USE_LOCAL_MODEL=true
# Salva: CTRL+O, CTRL+X
```

---

### 6. Installa Dipendenze (se necessario)

```bash
npm install
```

---

### 7. Build Applicazione

```bash
# Export variabile Stripe per frontend
export VITE_STRIPE_PUBLIC_KEY=pk_live_51SEAg6DPEkqoxxfatlURO2ivVXS8P6ioI40uC69q72pbnfxj8DlUajSMUgAcWbcXMl49vPB2segToTYCWgNz8fAB00glrA6xzO

# Build
npm run build
```

**Output atteso:**
```
> rest-express@1.0.0 build
> npm run build:backend && npm run build:frontend

✓ built in XXXms
✓ XXX modules transformed.
dist/public/index.html  X.XX kB
...
```

---

### 8. Restart PM2

```bash
# Restart applicazione
pm2 restart ciry

# Verifica che sia attivo
pm2 status
```

**Output atteso:**
```
┌─────┬──────┬─────────┬──────┬─────┬──────────┐
│ id  │ name │ status  │ cpu  │ mem │ watching │
├─────┼──────┼─────────┼──────┼─────┼──────────┤
│ 0   │ ciry │ online  │ 0%   │ XXM │ disabled │
└─────┴──────┴─────────┴──────┴─────┴──────────┘
```

---

### 9. Controlla Logs

```bash
# Ultimi 50 logs
pm2 logs ciry --lines 50
```

**Verifica che NON ci siano errori come:**
- ❌ `Error: GEMINI_API_KEY environment variable is required`
- ❌ `TypeError:` o `ReferenceError:`
- ❌ Crash continui

**Logs attesi (OK):**
```
[express] serving on port 3000
[JobWorker] Started - polling for pending jobs every 3s
[Job Worker] Background processing started
```

---

### 10. Test Rapido (Opzionale)

```bash
# Test endpoint health
curl http://localhost:3000/api/health

# Output atteso:
# {"status":"ok"}
```

---

### 11. Purge Cloudflare Cache

**Dal browser:**

1. Vai su **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Seleziona dominio: **ciry.app**
3. Vai su **Caching** → **Configuration**
4. Click **Purge Everything**
5. Conferma
6. **Aspetta 30 secondi** ⏰

---

### 12. Test Finale

**Dopo 30 secondi dal purge:**

1. Vai su: https://ciry.app
2. Apri DevTools (F12) → Tab **Network**
3. Ricarica pagina (CTRL+SHIFT+R)
4. Verifica che:
   - ✅ Pagina carica senza errori
   - ✅ Login funziona
   - ✅ Chat AI funziona (usa Gemini, non Gemma)

**Test Chat AI:**
```
1. Login come paziente
2. Vai su "Prevenzione AI"
3. Scrivi: "Ho mal di testa"
4. Verifica risposta AI arrivi
```

---

## 📊 Monitoring Post-Deploy

### Verifica Logs Server

```bash
# Monitor in real-time
pm2 logs ciry

# Filtra solo AI logs
pm2 logs ciry | grep -E "\[AI\]|\[Gemini\]"
```

**Output atteso (Gemini cloud):**
```
[Gemini] Triage response generated (Flash), urgency: low
```

**Output NON atteso (per ora):**
```
[AI] Tentativo con Gemma locale...  ← Non dovrebbe apparire
[Gemma] Health check: ✅ Available  ← Non dovrebbe apparire
```

---

## 🐛 Troubleshooting

### Problema: Build fallisce

**Errore:**
```
Error: Cannot find module '@google/genai'
```

**Soluzione:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Problema: PM2 non si riavvia

**Errore:**
```
[PM2] Process not found
```

**Soluzione:**
```bash
# Verifica processi attivi
pm2 list

# Se "ciry" non esiste, avvialo
pm2 start ecosystem.config.js

# Oppure start manuale
pm2 start npm --name ciry -- run start
pm2 save
```

---

### Problema: Sito ancora vecchio dopo purge

**Causa:** Cache Cloudflare non purged correttamente

**Soluzione:**
```bash
# Test diretto al server (bypass Cloudflare)
curl -I http://157.180.21.147

# Se funziona, ri-purge Cloudflare
# Aspetta 60 secondi questa volta
```

---

### Problema: Errore "GEMINI_API_KEY not found"

**Causa:** Variabile .env non caricata

**Soluzione:**
```bash
# Verifica .env
cat .env | grep GEMINI_API_KEY

# Se manca, aggiungila
nano .env
# Aggiungi: GEMINI_API_KEY=your_key_here
# Salva e restart
pm2 restart ciry
```

---

## ✅ Deployment Completato!

Quando vedi:
- ✅ `pm2 status` mostra `online`
- ✅ Logs senza errori
- ✅ https://ciry.app carica correttamente
- ✅ Chat AI funziona

**Sei in produzione!** 🎉

---

## 📝 Note Importanti

### Configurazione Attuale
```
USE_LOCAL_MODEL=false  (o non presente)
→ Usa Gemini cloud
→ Gemma code presente ma non attivo
→ Pronto per switch quando hai GPU server
```

### Quando Arriva GEX44 (Domani)
```bash
# Sul nuovo server GEX44
1. Setup Ollama (vedi GEMMA_DEPLOYMENT.md)
2. Modifica .env: USE_LOCAL_MODEL=true
3. Rebuild: npm run build
4. Restart: pm2 restart ciry
5. Monitor: pm2 logs ciry | grep "\[AI\]"
   → Dovrai vedere: "[AI] ✅ Gemma locale ha risposto"
```

---

## 🆘 Support

Se qualcosa va storto:

1. **Check logs:** `pm2 logs ciry --lines 100`
2. **Restart:** `pm2 restart ciry`
3. **Rollback:** `git reset --hard HEAD~1 && npm run build && pm2 restart ciry`

---

**Deployment script pronto!** 🚀
