# 👨‍⚕️ CIRY - Guida Medico

Benvenuto nella piattaforma CIRY per professionisti sanitari. Questa guida ti aiuterà a sfruttare al massimo gli strumenti di prevenzione e monitoraggio pazienti.

## 📋 Indice

1. [Accesso e Registrazione](#accesso-e-registrazione)
2. [Dashboard Medico](#dashboard-medico)
3. [Gestione Pazienti](#gestione-pazienti)
4. [Teleconsultazioni](#teleconsultazioni)
5. [Report Pre-Visita](#report-pre-visita)
6. [Report Post-Visita Prevenzione](#report-post-visita-prevenzione)
7. [Alert Medici](#alert-medici)
8. [Note Mediche](#note-mediche)
9. [Disponibilità e Agenda](#disponibilità-e-agenda)
10. [Dati Wearable Pazienti](#dati-wearable-pazienti)
11. [Impostazioni](#impostazioni)

---

## 🔐 Accesso e Registrazione

### Registrazione Nuovo Medico

1. Compila il form di richiesta accesso medico
2. Attendi approvazione dall'amministratore (24-48h)
3. Ricevi email con credenziali di accesso
4. Primo login: imposta una password sicura
5. (Consigliato) Abilita MFA per maggiore sicurezza

### Accesso Esistente

1. Vai a `https://[your-domain].com`
2. Inserisci email e password
3. Se MFA attivo, inserisci il codice
4. Accedi alla dashboard medico

---

## 🏥 Dashboard Medico

La tua dashboard presenta 2 tab principali:

### Tab "I Tuoi Pazienti"

**Lista Pazienti Collegati:**
- Visualizza tutti i pazienti che ti hanno collegato
- Cerca per nome o email
- Vedi numero alert attivi per paziente
- Accesso rapido a referti e note

**Azioni Rapide:**
- Crea nota medica
- Visualizza referti paziente
- Genera report prevenzione

### Tab "Shortcuts Rapidi"

**Gestione Veloce:**
- Alert in attesa di revisione
- Prossimi appuntamenti (oggi e settimana)
- Pazienti con nuovi referti
- Statistiche personali

---

## 👥 Gestione Pazienti

### Collegare un Paziente

**Metodo 1: Codice di Collegamento**
1. Vai a **Impostazioni** → **Codice Medico**
2. Comunica il codice al paziente
3. Il paziente lo inserisce nella sua sezione "I Tuoi Referti"
4. Appari automaticamente come medico collegato

**Metodo 2: Invito Admin**
L'amministratore può collegare pazienti al tuo profilo direttamente.

### Visualizzare Dati Paziente

Clicca su un paziente per accedere a:

**Profilo Completo:**
- Dati anagrafici (nome, età, sesso, contatti)
- Referti caricati (con analisi AI)
- Alert medici generati
- Storico appuntamenti
- Note mediche precedenti
- Dati wearable (se disponibili)

**Filtri e Ricerca:**
- Per data referto
- Per tipo documento
- Per livello urgenza alert

---

## 📞 Teleconsultazioni

### Gestire la Disponibilità

1. Vai a **"I Tuoi Appuntamenti"** → **"Disponibilità"**
2. Clicca **"Aggiungi Disponibilità"**
3. Configura:
   - **Giorno della settimana** (ricorrente)
   - **Orario inizio e fine**
   - **Tipo appuntamento**:
     - Solo Videoconsulto
     - Solo In Studio (inserisci indirizzo)
     - Entrambe (paziente sceglie)
   - **Durata slot** (es. 30 min, 1 ora)
4. Salva

> Gli slot si ripetono automaticamente ogni settimana. Esempio: se imposti "Lunedì 9:00-12:00", tutti i lunedì avrai disponibilità in quella fascia.

### Accettare/Rifiutare Prenotazioni

1. Ricevi notifica quando un paziente prenota
2. Vai a **"I Tuoi Appuntamenti"**
3. Visualizza dettagli prenotazione:
   - Nome paziente
   - Data e ora
   - Tipo (video/studio)
   - Note del paziente
   - Documenti allegati
4. Clicca **"Conferma"** o **"Rifiuta"**

### Condurre una Videoconsulto

**15 minuti prima:**
- Ricevi promemoria WhatsApp/Email
- Prepara l'ambiente (luogo tranquillo, buona luce)

**All'orario:**
1. Vai a **"I Tuoi Appuntamenti"**
2. Trova l'appuntamento in corso
3. Clicca **"Entra in Chiamata"**
4. Si apre Jitsi Meet
5. Permetti accesso a microfono e webcam
6. Attendi il paziente

**Durante la chiamata:**
- Prendi appunti (usa carta o app esterna)
- Richiedi documenti se necessario
- Fornisci diagnosi preliminare

**Dopo la chiamata:**
- Segna appuntamento come "Completato"
- Genera Report Prevenzione (vedi sotto)
- Lascia note mediche per il paziente

---

## 📋 Report Pre-Visita

Prima di ogni appuntamento, genera un riepilogo automatico del paziente.

### Come Generare

1. Vai a **"I Tuoi Appuntamenti"**
2. Trova l'appuntamento imminente
3. Clicca **"Report Pre-Visita"** (icona documento)
4. Attendi 10-15 secondi
5. Visualizza il report

### Contenuto Report

Il report AI-generated include:

**Sezione 1: Dati Anagrafici**
- Nome, età, sesso
- Contatti e storico medico

**Sezione 2: Referti Medici**
- Ultimi referti caricati (max 10)
- Sommari tecnici AI
- Valori chiave evidenziati

**Sezione 3: Alert Triage**
- Alert attivi con livello urgenza
- Raccomandazioni AI
- Parametri vitali anomali

**Sezione 4: Documenti Allegati**
- File caricati dal paziente per questo appuntamento
- Note del paziente

**Sezione 5: Analisi AI**
- Sintesi clinica generata da Gemini
- Aree di attenzione
- Domande suggerite da fare al paziente

> **Vantaggi:** Arrivi preparato, riduci tempo visita, migliori outcome.

---

## 📝 Report Post-Visita Prevenzione

Dopo aver completato un appuntamento, genera raccomandazioni preventive personalizzate.

### Come Generare

1. Vai a **"I Tuoi Appuntamenti"**
2. Trova l'appuntamento completato
3. Clicca **"Report Prevenzione"** (icona stella)
4. Attendi 15-20 secondi
5. Il report si salva automaticamente come nota medica

### Contenuto Report

Il report AI-generated include:

**Raccomandazioni Personalizzate:**
- Dieta e stile di vita
- Esercizio fisico consigliato
- Screening preventivi da fare
- Follow-up necessari
- Farmaci/integratori (se applicabile)

**Basato su:**
- Dati demografici paziente
- Referti recenti
- Alert medici
- Evidenze scientifiche (RAG Knowledge Base)

### Modifica Report

1. Visualizza il report generato
2. Modifica il testo se necessario
3. Aggiungi note personali
4. Salva le modifiche

Il paziente riceve notifica e può accedere al report dalla sua sezione "I Tuoi Referti".

---

## 🚨 Alert Medici

Gli alert sono generati automaticamente dall'AI durante l'analisi dei referti.

### Livelli di Urgenza

| Colore | Livello | Quando Intervenire |
|--------|---------|-------------------|
| 🔴 Rosso | EMERGENZA | Immediato (entro ore) |
| 🟡 Giallo | ALTA | 24-48 ore |
| 🟠 Arancione | MEDIA | Entro 7 giorni |
| 🟢 Verde | BASSA | Monitoraggio routinario |

### Gestire gli Alert

**Dashboard Alert:**
1. Vai a **Admin** (se sei anche admin) o richiedi accesso
2. Filtra per:
   - Urgenza (default: EMERGENZA + ALTA)
   - Nome paziente
   - Email paziente
3. Ordina per data o urgenza

**Azioni su Alert:**
- **Visualizza referto** collegato
- **Contatta paziente** (email, telefono, WhatsApp)
- **Prenota visita urgente**
- **Crea nota medica** con raccomandazioni
- **Chiudi alert** se risolto

### Notifiche Alert

Ricevi notifica per alert EMERGENZA e ALTA:
- **Push browser** (immediato)
- **WhatsApp** (se configurato)
- **Email** (riepilogo giornaliero)

---

## 📄 Note Mediche

### Creare una Nota

1. Vai al profilo del paziente
2. Sezione **"Note Mediche"**
3. Clicca **"Nuova Nota"**
4. Compila:
   - **Categoria**: Visita, Prescrizione, Report Prevenzione, Diagnosi, Altro
   - **Contenuto**: testo libero (supporto Markdown)
   - **File allegati** (opzionale): PDF, immagini
5. Salva

### Categorizzazione Note

- **Visita**: note da consulto/visita
- **Prescrizione**: farmaci, terapie
- **Report Prevenzione**: raccomandazioni preventive (auto o manuale)
- **Diagnosi**: diagnosi formali
- **Altro**: comunicazioni generiche

### Visibilità Note

- Il paziente riceve notifica in-app
- Accede alle note da **"I Tuoi Referti"**
- Può scaricare allegati

---

## 📅 Disponibilità e Agenda

### Modificare Disponibilità

**Aggiungere Nuovi Slot:**
1. **"Disponibilità"** → **"Aggiungi"**
2. Configura giorno, orario, tipo
3. Salva

**Eliminare Slot:**
1. Trova lo slot nell'elenco
2. Clicca **"Elimina"**
3. Conferma

> Eliminare uno slot non cancella appuntamenti già prenotati in quella fascia.

### Bloccare Giorni Specifici

**Per ferie/assenze:**
1. Vai alla lista disponibilità
2. Disabilita temporaneamente gli slot
3. I pazienti non vedranno quelle date disponibili
4. Riabilita al rientro

### Gestire Appuntamenti

**Visualizza:**
- **Oggi**: appuntamenti di oggi
- **In Arrivo**: prossimi 7 giorni
- **Passati**: storico completo

**Azioni:**
- **Riprogramma**: cambia data/ora (notifica paziente)
- **Cancella**: libera lo slot (notifica paziente)
- **Completa**: segna come fatto

---

## ⌚ Dati Wearable Pazienti

Se il paziente ha dispositivi wearable collegati, puoi monitorare i dati in tempo reale.

### Accedere ai Dati

1. Apri profilo paziente
2. Vai alla tab **"Dati Wearable"**
3. Visualizza:
   - Grafico pressione sanguigna (7/30/90 giorni)
   - Grafico frequenza cardiaca
   - Anomalie rilevate
   - Statistiche aggregate

### Interpretare Anomalie

Il sistema rileva automaticamente:
- **Ipertensione**: Sistolica >140 o Diastolica >90
- **Ipotensione**: Sistolica <90 o Diastolica <60
- **Tachicardia**: Frequenza cardiaca >100 bpm (a riposo)
- **Bradicardia**: Frequenza cardiaca <50 bpm

**Soglie Attività-Consapevoli:**
- Durante attività fisica: soglie più alte tollerate
- A riposo: soglie standard applicate

### Report Automatici Wearable

Ogni 24 ore, l'AI genera report aggregati:
- Trend settimanali
- Pattern anomali
- Raccomandazioni

Questi dati vengono integrati automaticamente nelle conversazioni AI con il paziente.

### Trigger Proattivi (Admin)

L'admin può configurare trigger automatici:
- "Se 3+ letture elevate consecutive → Notifica medico"
- "Se BP media >135/85 per 7 giorni → Suggerisci consulto"

---

## ⚙️ Impostazioni

### Profilo Medico

- **Dati Personali**: nome, specializzazione, numero ordine
- **Contatti**: email, telefono
- **Indirizzo Studio**: per appuntamenti fisici
- **Biografia**: visibile ai pazienti

### Codice Medico

Il tuo codice univoco che i pazienti usano per collegarsi:
- Formato: `DOC-XXXX-XXXX`
- Condividilo via email/SMS
- Rigenera se compromesso

### Notifiche WhatsApp

1. Abilita notifiche WhatsApp
2. Verifica numero telefono
3. Scegli cosa ricevere:
   - Alert emergenza pazienti
   - Nuove prenotazioni
   - Promemoria appuntamenti (15 min prima)

### MFA (Consigliato)

1. **Impostazioni** → **Sicurezza** → **Abilita MFA**
2. Scansiona QR con Google Authenticator
3. Salva codici di backup

---

## 📊 Best Practices

### Workflow Consigliato

**Prima della Visita:**
1. ✅ Genera Report Pre-Visita
2. ✅ Rivedi referti recenti
3. ✅ Controlla alert attivi
4. ✅ Verifica dati wearable (se disponibili)

**Durante la Visita:**
1. ✅ Ascolta il paziente
2. ✅ Consulta il report AI come supporto (non sostituto)
3. ✅ Richiedi chiarimenti su valori anomali
4. ✅ Prendi appunti per report post-visita

**Dopo la Visita:**
1. ✅ Segna appuntamento come completato
2. ✅ Genera Report Prevenzione
3. ✅ Crea note mediche con raccomandazioni
4. ✅ Prescrivi follow-up se necessario

### Quando Usare l'AI

**L'AI è utile per:**
- Analisi rapida referti (OCR + interpretazione)
- Identificazione pattern anomali
- Generazione raccomandazioni preventive standard
- Riepilogo dati complessi

**L'AI NON sostituisce:**
- Diagnosi clinica finale (sempre tua responsabilità)
- Esame obiettivo
- Rapporto umano medico-paziente
- Decisioni terapeutiche complesse

---

## 🆘 Supporto

### Assistenza Tecnica

**Per problemi tecnici:**
- Email: support@ciry.it
- Telefono: +39 XXX XXXXXXX
- Ticket: dashboard admin

**Orari:**
- Lun-Ven: 9:00-18:00
- Sab: 9:00-13:00
- Emergenze H24: [numero dedicato]

### FAQ Medici

**Q: Posso modificare un Report Prevenzione AI?**  
A: Sì. I report sono modificabili prima di salvarli come note mediche.

**Q: I pazienti vedono le mie note private?**  
A: Dipende. Le note create come "Note Mediche" sono visibili al paziente. Usa campi interni per appunti privati.

**Q: Come funziona la fatturazione degli appuntamenti?**  
A: CIRY non gestisce pagamenti medico-paziente. Usalo solo per scheduling e telemedicina. Fattura separatamente.

**Q: I dati sono conformi GDPR?**  
A: Sì. CIRY è certificato GDPR con crittografia, audit log e diritto all'oblio.

**Q: Posso esportare i dati dei pazienti?**  
A: Sì. Richiedi export CSV/PDF all'amministratore.

---

## 🔒 Privacy e Responsabilità

### Responsabilità Professionale

- **Sei sempre responsabile** delle diagnosi e decisioni cliniche
- L'AI è uno **strumento di supporto**, non decisionale
- Verifica sempre le informazioni con fonti primarie
- Documentare ogni intervento clinico

### GDPR e Consenso

- I pazienti acconsentono al trattamento dati al signup
- Possono richiedere cancellazione dati in qualsiasi momento
- Audit log registra ogni accesso ai loro referti
- Non condividere credenziali o accessi

### Sicurezza

- Usa password forti e uniche
- Abilita MFA sempre
- Non lasciare sessioni aperte su PC condivisi
- Segnala immediatamente accessi sospetti

---

**Versione Guida:** 1.0.0  
**Ultimo Aggiornamento:** Novembre 2025  
**Copyright © 2025 CIRY Healthcare**
