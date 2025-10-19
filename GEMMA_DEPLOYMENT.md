# 🏥 Guida Deployment Gemma Med - Self-Hosted AI per CIRY

Questa guida ti aiuta a configurare **Gemma Med** sul tuo server Hetzner per avere l'AI medica completamente in-house, garantendo **privacy GDPR** e controllo totale sui dati.

## 📋 Prerequisiti

### Hardware Minimo
- **Server**: Hetzner GPU Server EX101 o superiore
- **GPU**: NVIDIA RTX 4000 (16GB VRAM) minimo
- **RAM**: 64GB
- **Storage**: 100GB SSD liberi

### Hardware Consigliato (Performance Migliori)
- **Server**: Hetzner GPU Server EX102
- **GPU**: NVIDIA RTX A5000 (24GB VRAM)
- **RAM**: 128GB
- **Storage**: 200GB NVMe

### Software
- Ubuntu 22.04 LTS o superiore
- NVIDIA Driver installato
- Docker (opzionale, ma consigliato)

---

## 🚀 Setup Rapido con Ollama

### Step 1: Installazione Ollama sul Server Hetzner

```bash
# Connettiti al server
ssh root@157.180.21.147

# Installa Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verifica installazione
ollama --version
```

### Step 2: Download Modello Medico

Ollama supporta diversi modelli medici. Scegli uno di questi:

#### Opzione A: Gemma 2 9B Instruct (Consigliato per inizio)
```bash
ollama pull gemma2:9b-instruct
```

#### Opzione B: MedLlama2 (Specializzato in medicina)
```bash
ollama pull medllama2
```

#### Opzione C: Meditron (Ottimizzato per task clinici)
```bash
ollama pull meditron:7b
```

#### Opzione D: Gemma 2 27B (Richiede GPU più potente)
```bash
ollama pull gemma2:27b-instruct
```

### Step 3: Avvia Ollama come Servizio

```bash
# Crea file systemd service
sudo nano /etc/systemd/system/ollama.service
```

Incolla questo contenuto:

```ini
[Unit]
Description=Ollama AI Service
After=network.target

[Service]
Type=simple
User=root
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/usr/share/ollama/.ollama/models"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Salva e abilita il servizio:

```bash
# Ricarica systemd
sudo systemctl daemon-reload

# Abilita e avvia Ollama
sudo systemctl enable ollama
sudo systemctl start ollama

# Verifica che funzioni
sudo systemctl status ollama

# Test API
curl http://localhost:11434/api/tags
```

Dovresti vedere la lista dei modelli installati.

### Step 4: Test del Modello

```bash
# Test conversazionale
ollama run gemma2:9b-instruct

# Nel prompt che appare, scrivi:
# "Sei un assistente medico. Spiega cosa sono i trigliceridi."

# Per uscire, digita: /bye
```

---

## 🔧 Configurazione CIRY per Usare Gemma

### Step 5: Variabili d'Ambiente

Aggiungi queste variabili al file `.env` del progetto CIRY sul server:

```bash
# Sul server Hetzner, modifica .env nella cartella del progetto
cd /path/to/ciry
nano .env
```

Aggiungi (o modifica) queste righe:

```env
# Configurazione Gemma Self-Hosted
USE_LOCAL_MODEL=true
GEMMA_ENDPOINT=http://localhost:11434
GEMMA_MODEL=gemma2:9b-instruct
GEMMA_TIMEOUT=60000

# Mantieni Gemini come fallback (già presente)
GEMINI_API_KEY=your_existing_key_here
```

**Note:**
- `USE_LOCAL_MODEL=true` attiva il modello locale
- `GEMMA_ENDPOINT` punta a Ollama locale
- `GEMMA_MODEL` specifica quale modello usare
- `GEMMA_TIMEOUT` timeout in millisecondi (60s)

### Step 6: Rebuild e Restart Applicazione

```bash
# Export variabili ambiente necessarie per build
export VITE_STRIPE_PUBLIC_KEY=pk_live_51SEAg6DPEkqoxxfatlURO2ivVXS8P6ioI40uC69q72pbnfxj8DlUajSMUgAcWbcXMl49vPB2segToTYCWgNz8fAB00glrA6xzO

# Build applicazione
npm run build

# Restart PM2
pm2 restart ciry

# Verifica logs
pm2 logs ciry --lines 50
```

Dovresti vedere nei logs:
```
[AI] Tentativo con Gemma locale...
[Gemma] Health check: ✅ Available
[AI] ✅ Gemma locale ha risposto con successo
```

---

## 🧪 Test Funzionamento

### Test 1: Health Check API

```bash
# Verifica che Ollama risponda
curl http://localhost:11434/api/tags

# Output atteso:
# {"models":[{"name":"gemma2:9b-instruct",...}]}
```

### Test 2: Chat Test

Vai su https://ciry.app e:
1. Accedi come paziente
2. Vai su "Prevenzione AI"
3. Scrivi: "Ho mal di testa da 2 giorni"
4. Controlla i logs PM2:

```bash
pm2 logs ciry | grep -E "\[AI\]|\[Gemma\]|\[Gemini\]"
```

Se vedi `[AI] ✅ Gemma locale ha risposto` → Funziona! ✅

Se vedi `[AI] Gemma locale non disponibile, fallback a Gemini` → Controlla Ollama

### Test 3: Performance Metrics

```bash
# Durante una chat, monitora GPU
nvidia-smi -l 1

# Dovresti vedere:
# - GPU Util: 80-95% durante inferenza
# - Memory: ~8-12GB usati (per Gemma 9B)
```

---

## 📊 Monitoring e Manutenzione

### Logs Ollama

```bash
# Logs servizio
sudo journalctl -u ollama -f

# Logs applicazione CIRY (filtro AI)
pm2 logs ciry | grep "\[AI\]"
```

### Performance Monitoring

```bash
# GPU monitoring
nvidia-smi dmon

# Disk usage modelli
du -sh /usr/share/ollama/.ollama/models/

# Memory usage Ollama
ps aux | grep ollama
```

### Restart Servizi

```bash
# Restart Ollama
sudo systemctl restart ollama

# Restart CIRY
pm2 restart ciry
```

---

## 🔄 Sistema di Fallback

Il codice CIRY è già configurato per il fallback automatico:

**Flow:**
1. **Prova Gemma locale** → Se disponibile, usa quello
2. **Health check fallisce?** → Usa Gemini cloud
3. **Gemma timeout?** → Usa Gemini cloud
4. **Gemma errore?** → Usa Gemini cloud

Questo garantisce **zero downtime** anche se Ollama ha problemi.

**Tracking:**
- Ogni risposta include `modelUsed` per ML metrics
- Puoi vedere quale AI ha risposto nei logs

---

## 🎯 Modelli Consigliati per Task

| Task | Modello Consigliato | VRAM Richiesta |
|------|---------------------|----------------|
| Chat Triage | `gemma2:9b-instruct` | 12GB |
| Analisi Report Medici | `medllama2` | 14GB |
| Task Complessi | `gemma2:27b-instruct` | 40GB |
| Embeddings RAG | `nomic-embed-text` | 4GB |

### Cambio Modello

```bash
# Scarica nuovo modello
ollama pull medllama2

# Modifica .env
nano .env
# Cambia: GEMMA_MODEL=medllama2

# Rebuild e restart
npm run build
pm2 restart ciry
```

---

## 🐛 Troubleshooting

### Problema: "Gemma locale non disponibile"

**Causa:** Ollama non risponde

**Soluzione:**
```bash
# Verifica stato servizio
sudo systemctl status ollama

# Se non attivo, riavvia
sudo systemctl restart ollama

# Test manuale
curl http://localhost:11434/api/tags
```

### Problema: "Gemma timeout dopo 60s"

**Causa:** Modello troppo grande per GPU

**Soluzione:**
```bash
# Usa modello più piccolo
ollama pull gemma2:9b-instruct

# Oppure aumenta timeout in .env
GEMMA_TIMEOUT=120000  # 2 minuti
```

### Problema: "CUDA out of memory"

**Causa:** GPU con poca VRAM

**Soluzione:**
```bash
# Usa modello quantizzato (più leggero)
ollama pull gemma2:7b-instruct-q4_K_M

# Oppure scarica VRAM
nvidia-smi --gpu-reset
```

### Problema: "Model not found"

**Causa:** Modello non scaricato

**Soluzione:**
```bash
# Lista modelli installati
ollama list

# Scarica quello mancante
ollama pull gemma2:9b-instruct
```

---

## 💰 Costi Mensili Stimati

### Setup Attuale (Senza Gemma)
- Server Hetzner VPS: ~€20/mese
- Gemini API calls: ~€50-100/mese (variabile)
- **Totale: €70-120/mese**

### Setup con Gemma Locale
- Server Hetzner GPU EX101: ~€100/mese
- Gemini API (solo fallback): ~€5-10/mese
- **Totale: €105-110/mese**

**Risparmio previsto dopo 3 mesi:** ~€100-200

---

## 🎓 Prossimi Step (Opzionale)

### 1. Fine-Tuning con Dati CIRY (3-6 mesi)

Quando hai abbastanza dati ML raccolti:

```bash
# Esporta training data
curl http://localhost:3000/api/ml/training/export > training_data.json

# Fine-tune Gemma (richiede setup separato)
# Usa Hugging Face Transformers + GPU training
```

### 2. Multi-Model Setup

Usa modelli diversi per task diversi:

```env
# Chat: modello veloce
GEMMA_CHAT_MODEL=gemma2:9b-instruct

# Analisi medica: modello specializzato
GEMMA_MEDICAL_MODEL=medllama2

# Embeddings: modello dedicato
GEMMA_EMBEDDING_MODEL=nomic-embed-text
```

### 3. Load Balancing

Se traffico alto, distribuisci carico:

```bash
# Avvia più istanze Ollama su porte diverse
ollama serve --port 11434 &
ollama serve --port 11435 &

# Configura round-robin in CIRY
```

---

## 📞 Support

Se hai problemi con il deployment:

1. **Controlla logs**: `pm2 logs ciry` e `journalctl -u ollama`
2. **Verifica GPU**: `nvidia-smi`
3. **Test Ollama**: `curl http://localhost:11434/api/tags`
4. **Fallback attivo**: Il sistema userà Gemini automaticamente

---

## ✅ Checklist Deployment

- [ ] Server GPU Hetzner attivo
- [ ] NVIDIA Driver installato
- [ ] Ollama installato e configurato come servizio
- [ ] Modello Gemma scaricato (es: `gemma2:9b-instruct`)
- [ ] Variabili `.env` aggiornate (`USE_LOCAL_MODEL=true`)
- [ ] Applicazione CIRY rebuildata
- [ ] PM2 restart eseguito
- [ ] Test chat funzionante con Gemma locale
- [ ] Monitoring attivo (GPU + logs)
- [ ] Fallback a Gemini verificato (disabilita Ollama temporaneamente)

---

**🎉 Complimenti! Ora CIRY usa AI self-hosted con privacy GDPR completa!**

Tutti i dati medici restano sul tuo server Hetzner 🇮🇹
