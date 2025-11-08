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

### Collegare un Dispositivo

1. Vai a **Impostazioni** → **Dispositivi Wearable**
2. Clicca **"Collega Nuovo Dispositivo"**
3. Inserisci:
   - Nome identificativo (es. "Apple Watch")
   - Tipo (Blood Pressure Monitor, Fitness Tracker, ecc.)
   - Numero seriale (opzionale)
4. Clicca **"Salva"**

> **Nota:** Alcuni dispositivi supportano connessione Bluetooth diretta dal browser.

### Visualizzare i Dati

1. Vai alla sezione **"Wearable"** dalla homepage
2. Visualizza:
   - Grafico pressione sanguigna (ultimi 7/30/90 giorni)
   - Grafico frequenza cardiaca
   - Tabella anomalie rilevate
   - Statistiche aggregate

### Alert Automatici

Se il sistema rileva valori anomali (es. pressione >140/90):
- Ricevi notifica **WhatsApp** (se abilitato)
- Ricevi notifica **push** nel browser
- L'AI può suggerire di contattare un medico

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

**Versione Guida:** 1.0.0  
**Ultimo Aggiornamento:** Novembre 2025  
**Copyright © 2025 CIRY Healthcare**
