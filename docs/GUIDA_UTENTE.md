# 📘 CIRY - Guida Utente Paziente

Benvenuto in CIRY, la tua piattaforma di prevenzione sanitaria powered by AI.

## 📋 Indice

1. [Accesso alla Piattaforma](#accesso-alla-piattaforma)
2. [Homepage Paziente](#homepage-paziente)
3. [Prevenzione AI](#prevenzione-ai)
4. [I Tuoi Referti](#i-tuoi-referti)
5. [Appuntamenti](#appuntamenti)
6. [Dispositivi Wearable](#dispositivi-wearable)
7. [Impostazioni](#impostazioni)
8. [Notifiche](#notifiche)

---

## 🔐 Accesso alla Piattaforma

### Primo Accesso

1. Riceverai le credenziali via email dall'amministratore
2. Accedi a: `https://[your-domain].com`
3. Inserisci email e password
4. Se abilitata, inserisci il codice MFA ricevuto via app/SMS

### Password Dimenticata

1. Clicca su "Password dimenticata?" nella pagina di login
2. Inserisci la tua email
3. Controlla la tua casella email per il link di reset
4. Imposta una nuova password sicura

---

## 🏠 Homepage Paziente

La tua homepage presenta 3 tab principali:

### Tab "Prevenzione"
- Conversazione AI per analisi medica
- Upload referti e documenti medici
- Punteggio Indice Prevenzione
- Chat vocale con AI

### Tab "I Tuoi Referti"
- Elenco di tutti i tuoi documenti medici
- Note dei medici collegati
- Alert medici generati dall'AI

### Tab "Appuntamenti"
- Prossimi appuntamenti con i tuoi medici
- Storico appuntamenti completati
- Link per videochiamate (Jitsi)

---

## 🩺 Prevenzione AI

### Come Caricare un Referto

1. Vai alla tab **"Prevenzione"**
2. Clicca su **"Carica Documento"**
3. Seleziona il file (PDF, immagine JPG/PNG)
4. Attendi l'analisi AI (10-30 secondi)
5. Ricevi:
   - Sommario per te (linguaggio semplice)
   - Sommario per medici (tecnico)
   - Indice Prevenzione (punteggio 0-100)

### Chat con l'AI

**Testo:**
1. Scrivi la tua domanda nella chat
2. L'AI risponde con consigli personalizzati basati sui tuoi referti

**Voce:** 🎤
1. Clicca sul microfono
2. Parla la tua domanda
3. L'AI risponde vocalmente

> **Nota:** L'AI considera la tua età, sesso e referti precedenti per dare consigli mirati.

### Indice Prevenzione

Il punteggio (0-100) indica il tuo livello di rischio:
- **80-100**: Situazione ottimale
- **60-79**: Monitoraggio raccomandato
- **40-59**: Attenzione necessaria
- **0-39**: Consultare un medico

---

## 📄 I Tuoi Referti

### Visualizzazione Documenti

- **Tutti i referti caricati** con data e tipo
- **Note mediche** lasciate dai tuoi dottori
- **Alert medici** con livello di urgenza:
  - 🔴 **EMERGENZA** (rosso): consulta immediatamente
  - 🟡 **ALTA** (giallo): entro 24-48 ore
  - 🟠 **MEDIA** (arancione): entro una settimana
  - 🟢 **BASSA** (verde): monitoraggio

### Scaricare un Referto

1. Trova il referto nell'elenco
2. Clicca sull'icona download 📥
3. Il PDF si scarica automaticamente

---

## 📅 Appuntamenti

### Prenotare un Appuntamento

1. Vai alla tab **"Appuntamenti"**
2. Clicca su **"Prenota Appuntamento"**
3. Seleziona il medico dal menu a tendina
4. Scegli data e ora tra gli slot disponibili
5. Seleziona il tipo:
   - **Videoconsulto**: chiamata online via Jitsi
   - **In Studio**: visita fisica (indirizzo mostrato)
   - **Entrambe**: il medico deciderà
6. Aggiungi note (opzionale, anche vocali 🎤)
7. Carica documenti rilevanti (opzionale)
8. Conferma la prenotazione

### Durante l'Appuntamento (Videoconsulto)

1. 15 minuti prima: ricevi notifica WhatsApp/Email
2. All'orario: clicca **"Entra in Chiamata"**
3. Si apre Jitsi Meet (nessuna installazione richiesta)
4. Permetti accesso a microfono e webcam
5. Inizia la consultazione

### Dopo l'Appuntamento

Il tuo medico può:
- Lasciare note mediche
- Generare un **Report Prevenzione** personalizzato
- Prescrivere ulteriori analisi

---

## ⌚ Dispositivi Wearable

### 📱 Collegare un Dispositivo

#### Metodo 1: Connessione Bluetooth Web (Browser)

**Dispositivi supportati:**
- Misuratori di pressione Omron (HEM-7155T, HEM-9200T)
- Withings BPM Connect
- Altri monitor Bluetooth con supporto BLE

**Procedura:**

1. **Prepara il dispositivo**
   - Accendi il misuratore di pressione
   - Assicurati che il Bluetooth sia attivo
   - Tieni il dispositivo vicino al computer (max 5 metri)

2. **Connetti dal browser**
   - Vai a **Impostazioni** → **Dispositivi Wearable**
   - Clicca **"Collega Dispositivo Bluetooth"** 🔵
   - Il browser ti chiederà il permesso Bluetooth → clicca **"Consenti"**
   - Seleziona il tuo dispositivo dalla lista scansionata
   - Attendi la connessione (5-10 secondi)

3. **Prima misurazione**
   - Effettua una misurazione di prova con il dispositivo
   - I dati appariranno automaticamente nell'app CIRY
   - Riceverai conferma di connessione riuscita ✅

> **Nota:** La connessione Bluetooth funziona solo su browser Chrome, Edge, Opera (versioni recenti). Richiede HTTPS.

#### Metodo 2: Registrazione Manuale

**Per dispositivi senza Bluetooth o app cloud:**

**Passo 1: Registra il dispositivo**

1. Vai a **Impostazioni** → **Dispositivi Wearable**
2. Clicca **"Aggiungi Dispositivo Manuale"**
3. Compila il form:
   - **Nome**: es. "Misuratore Pressione Casa"
   - **Tipo**: Blood Pressure Monitor, Fitness Tracker, Smart Scale, ecc.
   - **Marca**: Omron, Beurer, Medisana, ecc.
   - **Modello**: (opzionale)
   - **Numero Seriale**: (opzionale, utile per garanzia)
4. Clicca **"Salva"**

**Passo 2: Inserire le misurazioni**

Dopo aver registrato il dispositivo, puoi inserire le misurazioni manualmente:

1. Vai alla sezione **"Wearable"** dalla homepage
2. Clicca **"Aggiungi Misurazione Manuale"** ➕
3. Compila il form con i dati del tuo dispositivo:
   - **Pressione Sistolica**: es. 120 mmHg
   - **Pressione Diastolica**: es. 80 mmHg
   - **Frequenza Cardiaca**: es. 72 bpm
   - **Data e Ora**: quando hai fatto la misurazione (default: adesso)
   - **Note**: (opzionale) es. "Dopo camminata", "A riposo"
4. Clicca **"Salva Misurazione"**

**I dati inseriti:**
- ✅ Appaiono immediatamente nei grafici
- ✅ Vengono inclusi nelle statistiche
- ✅ Generano alert se fuori norma
- ✅ Sono visibili al tuo medico
- ✅ Vengono integrati nell'analisi AI

> **Consiglio:** Inserisci le misurazioni subito dopo averle fatte per non dimenticare. Puoi anche impostare un promemoria giornaliero!

#### Metodo 3: Sincronizzazione Cloud (Fitbit, Garmin, Apple Health)

**Setup automatico:**

1. Vai a **Impostazioni** → **Dispositivi Wearable**
2. Clicca su **"Collega Servizio Cloud"**
3. Seleziona il tuo servizio:
   - 📱 Fitbit
   - ⌚ Garmin Connect
   - 🍎 Apple Health (via app mobile)
4. Accedi con le credenziali del servizio
5. **IMPORTANTE:** Nella schermata di autorizzazione:
   - ✅ **Abilita** accesso a "Pressione Sanguigna"
   - ✅ **Abilita** accesso a "Frequenza Cardiaca"
   - ❌ Puoi **disabilitare** tutto il resto (GPS, passi, sonno, ecc.)
6. Clicca **"Autorizza"** per confermare
7. Attendi conferma sincronizzazione automatica

**Dopo la connessione:**
- I dati vengono sincronizzati automaticamente ogni 15 minuti
- Non serve inserire nulla manualmente
- Riceverai notifica di prima sincronizzazione completata

> **Privacy:** CIRY sincronizza SOLO pressione sanguigna e frequenza cardiaca. Nessun dato GPS, passi, sonno o sociale viene raccolto.

---

### 📊 Visualizzare i Dati

1. Vai alla sezione **"Wearable"** dalla homepage
2. Visualizza:
   - **Grafico Pressione Sanguigna**: trend ultimi 7/30/90 giorni
   - **Grafico Frequenza Cardiaca**: con soglie normalità evidenziate
   - **Tabella Anomalie**: tutte le letture fuori norma
   - **Statistiche**: media, minimo, massimo settimanale

**Filtri Disponibili:**
- Ultimi 7 giorni
- Ultimi 30 giorni
- Ultimi 90 giorni
- Intervallo personalizzato

**Export Dati:**
- Clicca **"Export CSV"** per scaricare tutti i tuoi dati
- Utile per condividere con il medico esterno

---

### 🔔 Alert Automatici

Il sistema monitora continuamente i tuoi parametri e ti avvisa se rileva anomalie.

**Soglie Alert Pressione:**
| Valore | Sistolica | Diastolica | Alert |
|--------|-----------|------------|-------|
| Normale | 90-120 | 60-80 | Nessuno |
| Pre-Ipertensione | 121-139 | 81-89 | 🟡 Monitoraggio |
| **Ipertensione** | ≥140 | ≥90 | 🔴 **Alert ALTA** |
| **Ipotensione** | <90 | <60 | 🟠 **Alert MEDIA** |

**Soglie Alert Frequenza Cardiaca:**
| Valore | BPM (a riposo) | Alert |
|--------|----------------|-------|
| Normale | 50-100 | Nessuno |
| **Tachicardia** | >100 | 🟠 **Alert MEDIA** |
| **Bradicardia** | <50 | 🟠 **Alert MEDIA** |

**Notifiche Ricevute:**
- 📱 **WhatsApp**: "⚠️ Pressione elevata rilevata (145/95). Consulta il medico."
- 🔔 **Push Browser**: Notifica in tempo reale
- 📧 **Email**: Riepilogo anomalie settimanale
- 💬 **In-App**: Alert visibile nella campanella

**Azione Consigliata:**
- Alert ROSSO/ARANCIONE → Contatta il tuo medico entro 24-48 ore
- Alert GIALLO → Monitora nei prossimi giorni
- L'AI può suggerirti di prenotare un consulto medico

---

### 🔧 Gestire i Dispositivi

**Modificare un Dispositivo:**
1. Vai a **Impostazioni** → **Dispositivi Wearable**
2. Trova il dispositivo nell'elenco
3. Clicca **"Modifica"** ✏️
4. Aggiorna nome, tipo o note
5. Salva

**Rimuovere un Dispositivo:**
1. Trova il dispositivo nell'elenco
2. Clicca **"Elimina"** 🗑️
3. Conferma eliminazione

> **Nota:** Eliminare un dispositivo NON cancella i dati storici già raccolti. Solo impedisce nuove sincronizzazioni.

**Ricalibrare un Dispositivo:**
- Se noti letture imprecise, consulta il manuale del tuo dispositivo
- I misuratori di pressione vanno calibrati ogni 1-2 anni
- Controlla la batteria regolarmente

---

### ❓ Domande Frequenti (FAQ)

**Q: Il mio dispositivo non si connette via Bluetooth**  
A: Verifica che:
- Il Bluetooth del computer sia attivo
- Il dispositivo sia acceso e vicino (<5 metri)
- Stai usando Chrome, Edge o Opera (non Safari o Firefox)
- La batteria del dispositivo non sia scarica

**Q: Posso collegare più dispositivi?**  
A: Sì, fino a 5 dispositivi per account Professional/AI Premium.

**Q: I dati vengono sincronizzati automaticamente?**  
A: 
- Bluetooth Web: manuale (ogni volta che misuri e sei connesso)
- Cloud (Fitbit/Garmin): automatico ogni 15 minuti
- App mobile: automatico in background

**Q: I miei dati wearable sono sicuri?**  
A: Sì. Crittografia AES-256 a riposo, TLS 1.3 in transito. Conformità GDPR completa.

**Q: Posso condividere i dati con il mio medico?**  
A: Sì! Il tuo medico collegato su CIRY vede automaticamente i tuoi dati wearable e riceve alert se necessario.

---

## ⚙️ Impostazioni

### Profilo

- Aggiorna nome, email, telefono
- Cambia password
- Modifica avatar

### Abbonamento

- Visualizza piano corrente (Free, Personal, Professional, AI Premium)
- Upgrade/Downgrade piano
- Gestisci metodo di pagamento (Stripe)

### Notifiche WhatsApp

1. Abilita/Disabilita notifiche WhatsApp
2. Verifica il numero di telefono
3. Ricevi conferma via SMS

> Le notifiche WhatsApp includono:
> - Alert medici critici
> - Promemoria appuntamenti
> - Anomalie dispositivi wearable

### Autenticazione a Due Fattori (MFA)

1. Vai a **Impostazioni** → **Sicurezza**
2. Clicca **"Abilita MFA"**
3. Scansiona il QR code con Google Authenticator/Authy
4. Inserisci il codice di verifica
5. Salva i codici di backup in luogo sicuro

---

## 🔔 Notifiche

### Tipi di Notifiche

**In-App (Campanella):**
- Alert medici nuovi
- Risposte del medico
- Promemoria appuntamenti

**Push Browser:**
- Anomalie dispositivi wearable
- Alert urgenti
- Conferme prenotazioni

**WhatsApp:**
- Solo alert critici (configurabile)
- Promemoria 15 minuti prima dell'appuntamento

**Email:**
- Riepilogo settimanale
- Report generati
- Comunicazioni amministrative

### Gestire le Notifiche

1. Clicca sulla campanella (in alto a destra)
2. Vedi l'elenco delle notifiche non lette
3. Clicca su una notifica per aprirla
4. Segna come letta o elimina

---

## 🆘 Supporto

### Hai Bisogno di Aiuto?

**Per problemi tecnici:**
- Email: support@ciry.it
- Telefono: +39 XXX XXXXXXX

**Per emergenze mediche:**
- Chiama il 118
- Vai al pronto soccorso più vicino

### FAQ

**Q: L'AI può sostituire il mio medico?**  
A: No. CIRY è uno strumento di prevenzione e supporto decisionale. Consulta sempre un medico qualificato.

**Q: I miei dati sono sicuri?**  
A: Sì. CIRY è conforme GDPR, con crittografia end-to-end e audit log completi.

**Q: Posso cancellare i miei dati?**  
A: Sì. Contatta l'amministratore per richiedere la cancellazione completa (GDPR Right to Erasure).

---

## 📱 App Mobile (Prohmed)

CIRY si integra con l'app mobile **Prohmed**:
- Sincronizzazione automatica referti
- Notifiche push
- Chat AI da mobile
- Accesso ovunque

Scarica da:
- 📱 **iOS**: App Store
- 🤖 **Android**: Google Play

---

**Versione Guida:** 1.1.0  
**Ultimo Aggiornamento:** 9 Novembre 2025  
**Modifiche v1.1.0:**
- Sezione Dispositivi Wearable completamente rinnovata
- Aggiunti 3 metodi di configurazione (Bluetooth, Manuale, Cloud)
- Guida inserimento misurazioni manuali
- Tabelle soglie alert e FAQ

**Copyright © 2025 CIRY Healthcare**
