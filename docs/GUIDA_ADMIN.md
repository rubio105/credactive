# ⚙️ CIRY - Guida Amministratore

Benvenuto nella guida amministrativa completa di CIRY. Questa guida copre tutte le funzionalità di gestione della piattaforma, inclusa l'integrazione avanzata dei dispositivi wearable.

## 📋 Indice

1. [Accesso Dashboard Admin](#accesso-dashboard-admin)
2. [Gestione Utenti](#gestione-utenti)
3. [Gestione Abbonamenti](#gestione-abbonamenti)
4. [Alert Medici](#alert-medici)
5. [**Sistema Wearable Devices**](#sistema-wearable-devices)
6. [Audit & Sicurezza](#audit--sicurezza)
7. [Notifiche di Sistema](#notifiche-di-sistema)
8. [API Keys & Integrazioni](#api-keys--integrazioni)
9. [Backup & Manutenzione](#backup--manutenzione)

---

## 🔐 Accesso Dashboard Admin

### Requisiti

- Account con ruolo `admin` o `super_admin`
- MFA abilitato (obbligatorio per admin)
- IP whitelisting (opzionale, configurabile)

### Accesso

1. Login normale con credenziali admin
2. Inserisci codice MFA
3. Accedi alla dashboard principale
4. Clicca su **"Admin"** nel menu di navigazione

---

## 👥 Gestione Utenti

### Dashboard Utenti

**Statistiche Overview:**
- Totale utenti
- Nuovi utenti (7 giorni)
- Nuovi utenti (30 giorni)
- Breakdown per tipo accesso (Professional, Personal, AI Only)
- Breakdown per tier abbonamento

### Creare Nuovo Utente

1. **Admin** → **Gestione Utenti** → **Crea Utente**
2. Compila il form:
   - **Ruolo**: patient, doctor, admin
   - **Dati Anagrafici**: nome, cognome, email, telefono
   - **Credenziali**: password temporanea
   - **Abbonamento**: tier (Free, Personal, Professional, AI Premium)
   - **Tipo Accesso**: Professional, Personal, AI Only
3. Salva

> L'utente riceve email automatica con credenziali e link di reset password.

### Modificare Utente

1. Cerca l'utente (nome/email)
2. Clicca **"Modifica"**
3. Aggiorna campi necessari:
   - Dati personali
   - Ruolo
   - Abbonamento
   - Stato account (attivo/sospeso)
4. Salva

### Eliminare Utente (GDPR)

⚠️ **Azione Irreversibile**

1. Cerca l'utente
2. Clicca **"Elimina"**
3. Conferma eliminazione
4. Tutti i dati vengono cancellati:
   - Profilo utente
   - Referti medici
   - Note mediche
   - Alert
   - Dati wearable
   - Audit log (anonimizzati)

> **GDPR Compliance:** L'utente può richiedere cancellazione via email. Completa entro 30 giorni.

### Gestione Medici

**Approvazione Registrazioni:**
1. **Admin** → **Richieste Medici**
2. Visualizza richieste in attesa
3. Verifica:
   - Numero ordine medici
   - Specializzazione
   - Documenti caricati
4. **Approva** o **Rifiuta**

**Assegnare Pazienti a Medico:**
1. Profilo paziente → **"Collega Medico"**
2. Seleziona medico dal menu
3. Salva

---

## 💳 Gestione Abbonamenti

### Tier Disponibili

| Tier | Prezzo/Mese | Funzionalità |
|------|-------------|--------------|
| **Free** | €0 | Chat AI base, 5 referti/mese |
| **Personal** | €9.99 | Referti illimitati, Priority support |
| **Professional** | €29.99 | + Wearable, Teleconsulti, Report avanzati |
| **AI Premium** | €49.99 | + ML personalizzato, Analytics avanzati |

### Modificare Abbonamento Utente

1. Profilo utente → **"Abbonamento"**
2. Seleziona nuovo tier
3. Scegli modalità billing:
   - **Immediato**: addebito subito
   - **Fine ciclo**: al prossimo rinnovo
4. Salva

> Il sistema Stripe gestisce automaticamente addebiti e refund parziali.

### Report Ricavi

**Dashboard Ricavi:**
- Ricavi annuali stimati
- Ricavi mensili stimati
- Breakdown per tier
- Tasso conversione Free → Paid

**Export Dati:**
1. **Admin** → **Ricavi** → **Export CSV**
2. Seleziona periodo
3. Scarica report Stripe

---

## 🚨 Alert Medici

### Dashboard Alert

**Accesso:**
**Admin** → **Alert Medici**

**Filtri Default:**
- Urgenza: EMERGENZA + ALTA
- Ordinamento: più recenti

**Funzionalità:**
- Filtra per urgenza (EMERGENCY, HIGH, MEDIUM, LOW)
- Cerca per nome/email paziente
- Reset filtri
- Visualizza dettagli referto

### Gestire Alert Critici

**Alert EMERGENZA (Rosso):**
1. Identifica paziente
2. Verifica referto collegato
3. Contatta medico assegnato (se presente)
4. Se nessun medico: contatta paziente direttamente
5. Escalation: chiamata 118 se necessario

**Workflow Raccomandato:**
- EMERGENZA → Azione entro 1 ora
- ALTA → Azione entro 24 ore
- MEDIA → Monitoraggio settimanale
- BASSA → Revisione mensile

### Notifiche Alert

**Configurazione Admin:**
1. **Impostazioni** → **Notifiche Alert**
2. Abilita canali:
   - Push browser
   - WhatsApp
   - Email
3. Imposta soglie:
   - Solo EMERGENZA
   - EMERGENZA + ALTA
   - Tutti

---

## ⌚ Sistema Wearable Devices

### 📊 Panoramica Sistema

CIRY offre un'integrazione completa con dispositivi wearable per il monitoraggio continuo dei parametri vitali dei pazienti.

**Dispositivi Supportati:**
- Blood Pressure Monitors (Bluetooth)
- Fitness Trackers (Fitbit, Garmin, Apple Watch via API)
- Smart Scales
- ECG Monitors
- Continuous Glucose Monitors (CGM)

**Protocolli:**
- Web Bluetooth API (connessione diretta browser)
- REST API (sincronizzazione cloud)
- WebSocket (real-time streaming)

---

### 🔧 Configurazione Iniziale

#### 1. Abilitare Wearable per Tier

**Solo per tier Professional e AI Premium:**

1. **Admin** → **Impostazioni** → **Feature Flags**
2. Verifica configurazione:
```json
{
  "wearable_enabled_tiers": ["professional", "ai_premium"],
  "max_devices_per_user": 5
}
```

#### 2. Configurare Servizi Cloud (Opzionale)

**Per sincronizzazione con servizi esterni:**

1. **Admin** → **API Keys** → **Wearable Integrations**
2. Aggiungi API keys:
   - **Fitbit**: Client ID + Secret
   - **Garmin**: Consumer Key + Secret
   - **Apple Health**: App ID
3. Salva e testa connessione

---

### 📱 Gestione Dispositivi Pazienti

#### Visualizzare Dispositivi Collegati

1. **Admin** → **Wearable Devices**
2. Visualizza lista completa:
   - Nome dispositivo
   - Tipo
   - Paziente proprietario
   - Stato (attivo/inattivo)
   - Data ultima sincronizzazione
   - Batteria (se disponibile)

#### Collegare Manualmente un Dispositivo

**Per pazienti che hanno difficoltà:**

1. **Admin** → **Wearable Devices** → **Aggiungi Dispositivo**
2. Compila:
   - **Paziente**: seleziona utente
   - **Tipo**: Blood Pressure Monitor, Fitness Tracker, ecc.
   - **Nome**: es. "Fitbit Versa di Mario"
   - **Serial Number**: (se disponibile)
   - **Cloud ID**: (se sincronizzato con servizio cloud)
3. Salva

#### Rimuovere Dispositivo

1. Trova dispositivo nella lista
2. Clicca **"Elimina"**
3. Conferma

> **Nota:** Rimuovere un dispositivo NON cancella i dati storici. Solo impedisce nuove sincronizzazioni.

---

### 📈 Dashboard Dati Wearable

#### Visualizzare Dati Paziente

1. **Admin** → **Utenti** → Seleziona paziente → **Tab "Wearable"**
2. Visualizza:
   - **Grafico Pressione Sanguigna**: trend ultimi 7/30/90 giorni
   - **Grafico Frequenza Cardiaca**: trend con soglie anomalia
   - **Tabella Anomalie**: liste rilevamenti fuori norma
   - **Statistiche**: media, min, max, deviazione standard

#### Filtri e Export

**Filtri Temporali:**
- Ultimi 7 giorni
- Ultimi 30 giorni
- Ultimi 90 giorni
- Personalizzato (data inizio/fine)

**Export Dati:**
1. Clicca **"Export CSV"**
2. Seleziona periodo
3. Scarica file con tutti i dati grezzi:
   - Timestamp
   - Sistolica, Diastolica, Frequenza Cardiaca
   - Anomalie rilevate
   - Note

---

### 🔔 Sistema Anomalie e Alert

#### Logica Rilevamento Anomalie

Il sistema rileva automaticamente valori fuori norma:

**Pressione Sanguigna:**
| Condizione | Sistolica | Diastolica | Azione |
|------------|-----------|------------|--------|
| Normale | 90-120 | 60-80 | Nessuna |
| Pre-Ipertensione | 121-139 | 81-89 | Monitoraggio |
| **Ipertensione** | ≥140 | ≥90 | **Alert ALTA** |
| **Ipotensione** | <90 | <60 | **Alert MEDIA** |

**Frequenza Cardiaca:**
| Condizione | BPM (a riposo) | Azione |
|------------|----------------|--------|
| Normale | 50-100 | Nessuna |
| **Tachicardia** | >100 | **Alert MEDIA** |
| **Bradicardia** | <50 | **Alert MEDIA** |

**Soglie Attività-Consapevoli:**
- Durante attività fisica: +20 bpm tollerati
- Durante sonno: -10 bpm tollerati
- Il sistema distingue automaticamente stato (se fornito dal device)

#### Configurare Soglie Personalizzate (Per Paziente)

**Per pazienti con condizioni specifiche:**

1. **Admin** → **Wearable** → **Soglie Personalizzate**
2. Seleziona paziente
3. Imposta soglie custom:
   - Sistolica max: 150 (invece di 140)
   - Diastolica max: 95
   - HR max a riposo: 110
4. Salva

> Esempio: Paziente con ipertensione controllata farmacologicamente.

---

### 🤖 Trigger Proattivi (Advanced)

I trigger proattivi permettono di automatizzare azioni basate su pattern rilevati nei dati wearable.

#### Accedere alla Dashboard Trigger

**Admin** → **Trigger Proattivi Wearable**

#### Creare un Nuovo Trigger

1. Clicca **"Nuovo Trigger"**
2. Configura:

**Nome:** "Alert 3+ Letture Elevate Consecutive"

**Condizioni (JSON):**
```json
{
  "type": "consecutive_high_readings",
  "metric": "blood_pressure",
  "threshold": {
    "systolic": 140,
    "diastolic": 90
  },
  "count": 3,
  "timeframe_hours": 24
}
```

**Azioni (JSON):**
```json
{
  "notifications": [
    {
      "channel": "whatsapp",
      "target": "patient",
      "message": "Rilevate 3 letture pressione elevata consecutive. Consulta il tuo medico."
    },
    {
      "channel": "email",
      "target": "doctor",
      "message": "Paziente {{patient_name}} ha 3+ letture BP elevate."
    }
  ],
  "create_alert": {
    "urgency": "HIGH",
    "type": "WEARABLE_ANOMALY"
  }
}
```

**Target Audience:**
- Tutti i pazienti Professional/AI Premium
- Oppure: Pazienti specifici (seleziona IDs)

**Frequenza:**
- Una volta per evento
- Max 1 al giorno
- Max 1 alla settimana

3. Salva e attiva

#### Esempi Trigger Comuni

**Trigger 1: Trend Pressione in Peggioramento**
```json
{
  "type": "trend_analysis",
  "metric": "blood_pressure_avg",
  "comparison": "7_days_vs_previous_7_days",
  "threshold_increase": 10,
  "action": "notify_doctor"
}
```

**Trigger 2: Frequenza Cardiaca Anomala Notturna**
```json
{
  "type": "nighttime_anomaly",
  "metric": "heart_rate",
  "time_range": "22:00-06:00",
  "threshold": {
    "min": 40,
    "max": 80
  },
  "action": "create_high_alert"
}
```

**Trigger 3: Mancata Sincronizzazione Dispositivo**
```json
{
  "type": "device_inactivity",
  "no_data_for_hours": 48,
  "action": "remind_patient"
}
```

#### Monitorare Esecuzione Trigger

1. **Admin** → **Trigger Log**
2. Visualizza:
   - Trigger attivati (data/ora)
   - Paziente interessato
   - Condizione soddisfatta
   - Azioni eseguite
   - Successo/Fallimento notifiche

---

### 📊 Report Automatici Wearable

#### Sistema Report Giornalieri

**Scheduler Automatico:**
Ogni 24 ore, il sistema:
1. Analizza ultimi 7 giorni di dati per ogni paziente
2. Calcola statistiche aggregate:
   - Media sistolica/diastolica/HR
   - Numero anomalie
   - Trend (in miglioramento/peggioramento/stabile)
3. Genera report AI-powered con raccomandazioni
4. Salva in database
5. Integra nel contesto AI delle conversazioni triage

**Visualizzare Report:**
1. **Admin** → **Wearable Reports**
2. Filtra per paziente/data
3. Scarica PDF o visualizza online

#### Contenuto Report AI

**Sezione 1: Statistiche**
- Media settimanale BP: 125/82 mmHg
- Media HR: 72 bpm
- Anomalie rilevate: 3 (2 ipertensione, 1 tachicardia)

**Sezione 2: Trend**
- Confronto con settimana precedente
- Grafico evoluzione parametri
- Pattern temporali (orari critici)

**Sezione 3: Raccomandazioni AI**
- Consigli lifestyle (dieta, esercizio)
- Suggerimenti medicali (se applicabile)
- Alert per medico (se necessario)

---

### 🔗 Integrazioni Avanzate

#### Web Bluetooth API (Browser)

**Dispositivi Supportati Nativamente:**
- Omron Blood Pressure Monitors (HEM-7155T, HEM-9200T)
- Withings BPM Connect
- Altri dispositivi BLE con GATT Service 0x1810

**Flusso Connessione:**
1. Paziente clicca "Collega Dispositivo Bluetooth"
2. Browser richiede permesso Bluetooth
3. Paziente seleziona device dalla lista scansionata
4. Connessione GATT stabilita
5. Lettura caratteristica 0x2A35 (Blood Pressure Measurement)
6. Dati inviati al backend via POST `/api/wearable/readings`

**Requisiti Tecnici:**
- HTTPS obbligatorio
- Browser supportato: Chrome 56+, Edge 79+, Opera 43+
- Bluetooth 4.0+ sul dispositivo

#### API REST (Cloud Sync)

**Per servizi come Fitbit, Garmin:**

**Setup Webhook:**
1. **Admin** → **API Keys** → **Webhook Wearable**
2. Endpoint: `https://your-domain.com/api/wearable/webhook`
3. Copia URL e configuralo nel pannello sviluppatore Fitbit/Garmin
4. Verifica firma HMAC per sicurezza

**Gestione Token:**
- OAuth 2.0 per autenticazione
- Refresh token automatico
- Storage sicuro in database (encrypted)

---

### 🛠️ Troubleshooting Wearable

#### Problema: Dispositivo Non Sincronizza

**Checklist:**
1. ✅ Dispositivo acceso e connesso
2. ✅ Bluetooth attivo (per connessione diretta)
3. ✅ Batteria sufficiente (>20%)
4. ✅ App/servizio cloud autenticato
5. ✅ Token OAuth non scaduto

**Azioni:**
1. **Admin** → **Wearable Devices** → Device problematico
2. Clicca **"Test Connessione"**
3. Visualizza log errori
4. Se token scaduto: **"Riautorizza"**
5. Se problema hardware: contatta supporto dispositivo

#### Problema: Dati Mancanti o Incompleti

**Cause Comuni:**
- Letture sotto soglia qualità (device scartato)
- Errore trasmissione BLE
- API rate limit raggiunto

**Risoluzione:**
1. Verifica log backend: `/tmp/logs/wearable_sync.log`
2. Cerca errori specifici
3. Ritenta sincronizzazione manuale:
   - **Admin** → Device → **"Forza Sincronizzazione"**

#### Problema: Anomalie False Positive

**Se troppe anomalie rilevate:**
1. Verifica soglie personalizzate paziente
2. Controlla se device calibrato correttamente
3. Rivedi trigger proattivi (troppo sensibili?)
4. Consulta medico paziente per soglie cliniche corrette

---

### 📊 Analytics Wearable (Dashboard Admin)

**Metriche Globali:**
1. **Admin** → **Analytics** → **Tab Wearable**
2. Visualizza:
   - Totale dispositivi collegati
   - Dispositivi attivi (ultimi 7 giorni)
   - Media letture giornaliere
   - Anomalie rilevate (totale/per tipo)
   - Trigger attivati (totale/successo)
   - Distribuzione tipi dispositivi

**Export Report:**
- CSV con tutti i dati aggregati
- Utile per audit e compliance

---

### 🔒 Sicurezza e Privacy Wearable

#### Crittografia Dati

- **In transit**: TLS 1.3
- **At rest**: AES-256
- **Backup**: encrypted con chiavi ruotate mensilmente

#### GDPR Compliance

**Diritti Paziente:**
- **Accesso**: scarica tutti i suoi dati wearable
- **Cancellazione**: elimina dispositivo + dati storici
- **Portabilità**: export JSON/CSV standard

**Audit Trail:**
- Ogni accesso ai dati wearable loggato
- Visibile in **Admin** → **Audit Log**
- Filtro per tipo risorsa: `wearable_reading`

#### Consensi

**Paziente deve acconsentire a:**
1. Raccolta dati biometrici
2. Analisi AI dei dati
3. Condivisione con medici collegati
4. Notifiche anomalie

Consensi tracciati in `user_consents` table.

---

### 🚀 Best Practices Amministrazione Wearable

#### Onboarding Pazienti

**Workflow Raccomandato:**
1. ✅ Verifica tier abbonamento (Professional/AI Premium)
2. ✅ Invia guida configurazione dispositivo
3. ✅ Aiuta nella prima connessione (supporto live)
4. ✅ Verifica prima sincronizzazione riuscita
5. ✅ Imposta trigger proattivi appropriati
6. ✅ Comunica al medico collegato

#### Monitoraggio Proattivo

**Weekly Admin Checklist:**
- [ ] Rivedi anomalie settimana precedente
- [ ] Verifica dispositivi inattivi (>7 giorni)
- [ ] Controlla trigger falliti (log errori)
- [ ] Aggiorna soglie se nuove evidenze cliniche
- [ ] Verifica integrazioni cloud attive

#### Comunicazione con Pazienti

**Template Email Promemoria:**
```
Oggetto: [CIRY] Dispositivo Wearable Non Sincronizzato

Ciao [Nome],

Abbiamo notato che il tuo dispositivo wearable non sincronizza da [X] giorni.

Per continuare a monitorare la tua salute:
1. Verifica che il dispositivo sia acceso
2. Controlla la connessione Bluetooth/WiFi
3. Sincronizza manualmente dall'app

Hai bisogno di aiuto? Rispondi a questa email.

Team CIRY
```

---

## 🔍 Audit & Sicurezza

### Log di Audit (GDPR)

**Cosa Viene Registrato:**
- Ogni accesso a referti medici
- Download documenti
- Modifica dati paziente
- Creazione/eliminazione utenti
- Accesso dati wearable
- Export dati

**Visualizzare Log:**
1. **Admin** → **Audit Log**
2. Filtra per:
   - Utente (chi ha fatto l'azione)
   - Tipo risorsa (referto, wearable, user)
   - Data
   - Proprietario risorsa (paziente)
3. Export CSV per compliance

### Log Accessi Sistema

**Nuovo Sistema Tracking Login:**
1. **Admin** → **Log Accessi Sistema**
2. Visualizza:
   - Tutti i tentativi di login (successi e fallimenti)
   - Timestamp, email, nome, ruolo
   - IP address e User Agent
   - Motivo fallimento (password errata, MFA fallito, ecc.)

**Retention Policy:**
- Log mantenuti per **10 giorni**
- Cleanup automatico giornaliero
- Export CSV prima della cancellazione (consigliato)

**Filtri:**
- Stato: Tutti / Solo Successi / Solo Fallimenti
- Email utente
- Intervallo date

**Use Cases:**
- Rilevare tentativi accesso sospetti
- Audit sicurezza mensile
- Verifica conformità policy aziendali

### Sicurezza Account

**Impostazioni Globali:**
1. **Admin** → **Sicurezza**
2. Configura:
   - Password policy (lunghezza min, complessità)
   - MFA obbligatorio per ruoli (admin, doctor)
   - Session timeout (default: 24h)
   - Max login attempts (default: 5)
   - IP whitelist (opzionale)

**Bloccare Account Compromesso:**
1. Identifica utente
2. Clicca **"Sospendi Account"**
3. L'utente non può più fare login
4. Investigare logs per accessi anomali
5. Riabilita dopo reset password forzato

---

## 📧 Notifiche di Sistema

### Tipi di Notifiche

**Push Browser:**
- Configurate in `server/pushNotifications.ts`
- Supporto VAPID keys
- Auto-cleanup subscription stale

**WhatsApp (Twilio):**
- Configurazione in **Admin** → **API Keys** → **Twilio**
- Template messaggi in `server/whatsappNotifications.ts`
- Rate limit: 100 msg/giorno per utente

**Email (Brevo):**
- Template in **Admin** → **Email Templates**
- Coda invii intelligente
- Retry automatico su fallimento

### Gestire Template Email

1. **Admin** → **Email Templates**
2. Seleziona template (es. "Appointment Reminder")
3. Modifica:
   - Soggetto
   - Corpo HTML
   - Variabili dinamiche: `{{patient_name}}`, `{{date}}`, ecc.
4. Preview e salva

---

## 🔑 API Keys & Integrazioni

### Gestire API Keys

**Admin** → **API Keys Management**

**Servizi Configurabili:**
- **OpenAI** (Voice STT/TTS)
- **Google Gemini** (AI conversazionale)
- **Stripe** (Pagamenti)
- **Twilio** (WhatsApp)
- **Brevo** (Email)
- **Fitbit, Garmin** (Wearable sync)

**Aggiungere/Aggiornare Key:**
1. Seleziona servizio
2. Inserisci API key
3. Test connessione
4. Salva

> **Sicurezza:** Le keys sono encrypted at rest con AES-256.

### ProhMed Integration

**Configurazione API REST:**
1. **Admin** → **Integrazioni** → **ProhMed**
2. Genera API Token per l'app mobile
3. Configura endpoint:
   - POST `/api/prohmed/login`
   - POST `/api/prohmed/documents`
   - GET `/api/prohmed/history`
4. Testa con `test-prohmed-api.sh`

**Documentazione:** Vedi `docs/API_INTEGRATION_PROHMED.md`

---

## 💾 Backup & Manutenzione

### Backup Database

**Frequenza Automatica:**
- Daily: backup completo (3:00 AM UTC)
- Hourly: backup incrementale
- Retention: 30 giorni

**Backup Manuale:**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore:**
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Manutenzione Database

**Operazioni Periodiche (Mensili):**
1. Vacuum e analisi:
```sql
VACUUM ANALYZE;
```

2. Reindex tabelle grandi:
```sql
REINDEX TABLE medical_reports;
REINDEX TABLE blood_pressure_readings;
```

3. Cleanup dati vecchi:
   - Login logs: >10 giorni (automatico)
   - Audit logs: >90 giorni (configurabile)
   - Notifiche lette: >30 giorni

### Monitoraggio Performance

**Metriche da Monitorare:**
1. **Admin** → **System Health**
2. Visualizza:
   - Query lente (>1s)
   - Dimensione database
   - Connessioni attive
   - CPU/RAM backend
   - Latenza API (p50, p95, p99)

**Alert Configurabili:**
- Database >10GB: considera upgrade piano Neon
- Query lente >50/giorno: ottimizza indici
- Errori API >1%: investiga logs

---

## 🚀 Deployment & Updates

### Procedura Deployment Produzione

**Vedi:** `DEPLOY_PRODUCTION.sh`

**Steps:**
1. Commit modifiche su GitHub
2. SSH su server Hetzner
3. Pull da GitHub
4. `npm run build` (frontend + backend)
5. `pm2 restart credactive`
6. Purge Cloudflare cache
7. Smoke test endpoints critici

**Rollback:**
```bash
git checkout <previous-commit>
npm run build
pm2 restart credactive
```

### Aggiornare Integrazioni Wearable

**Quando Esce Nuovo Device:**
1. Aggiungi supporto in `server/wearableIntegrations.ts`
2. Definisci mapper dati in `server/wearableDataMapper.ts`
3. Test connessione su device reale
4. Deploy con smoke test
5. Aggiorna documentazione utente

---

## 🆘 Supporto & Escalation

### Livelli Supporto

**Tier 1 - Utenti Finali:**
- FAQ e documentazione
- Chatbot AI (future)
- Email: support@ciry.it

**Tier 2 - Admin:**
- Dashboard admin per troubleshooting
- Logs e audit trail
- Email: admin@ciry.it

**Tier 3 - Sviluppatori:**
- Accesso server
- Database diretto
- GitHub issues

### Contatti Emergenza

**Downtime Critico (>1h):**
- Telefono: +39 XXX XXXXXXX
- Status page: status.ciry.it
- Incident manager: [Nome Responsabile]

**Violazione Sicurezza:**
- Immediate: info-security@ciry.it
- Entro 72h: notifica GDPR authority

---

## 📚 Risorse Aggiuntive

### Documentazione Tecnica

- **API Integration:** `docs/API_INTEGRATION_PROHMED.md`
- **Deployment:** `DEPLOY.md`, `DEPLOYMENT_INSTRUCTIONS.md`
- **Testing:** `TESTING_GUIDE.md`
- **Design:** `design_guidelines.md`

### Repository GitHub

- **Main:** `github.com/your-org/ciry-platform`
- **Issues:** Per bug e feature request
- **Wiki:** Architettura e decision log

### Training

**Onboarding Nuovi Admin:**
1. Leggi questa guida completa
2. Shadowing admin senior (1 settimana)
3. Gestione utenti base
4. Gestione wearable avanzata
5. Incident response simulation
6. Certificazione finale

---

**Versione Guida:** 1.0.0  
**Ultimo Aggiornamento:** Novembre 2025  
**Copyright © 2025 CIRY Healthcare**

---

## 🎯 Quick Reference

### Comandi Rapidi

```bash
# Restart applicazione
pm2 restart credactive

# Visualizza logs real-time
pm2 logs credactive

# Database backup
npm run db:backup

# Cleanup login logs manuale
node scripts/cleanup-login-logs.js

# Test wearable integration
npm run test:wearable
```

### Shortcuts Dashboard

| Azione | Shortcut |
|--------|----------|
| Cerca utente | `Ctrl+K` |
| Nuovo utente | `Ctrl+N` |
| Export CSV | `Ctrl+E` |
| Audit logs | `Ctrl+L` |
| Refresh dashboard | `F5` |

---

**Fine Documentazione Admin**
