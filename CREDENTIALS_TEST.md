# 🔐 CREDENZIALI DI TEST - CIRY

## Password Universale
**Tutte le utenze di test usano la stessa password:** `test123`

---

## 👨‍💼 1. ADMIN PURO
**Email:** `admin@test.it`  
**Password:** `test123`

### Cosa deve vedere:
- ✅ Pannello Admin completo con sidebar verticale
- ✅ Dashboard Analytics
- ✅ Gestione Utenti
- ✅ Webinar
- ✅ Sistemi RAG (Knowledge Base)
- ✅ Mail Templates
- ✅ Marketing Campaigns
- ✅ Alert Management
- ✅ Feedback System
- ✅ Push Notifications

### Cosa NON deve vedere:
- ❌ Menu quiz/corsi (riservato ai pazienti)
- ❌ Menu dottore

---

## 👨‍⚕️ 2. DOTTORE PURO
**Email:** `dottore@test.it`  
**Password:** `test123`

### Cosa deve vedere:
- ✅ **I Miei Pazienti** (va alla home con DoctorDashboard)
- ✅ **Refertazione** (va alla home con DoctorDashboard)
- ✅ **AI Prevenzione** (accesso a strumenti AI medici)
- ✅ Homepage mostra solo il DoctorDashboard (niente quiz)

### Cosa NON deve vedere:
- ❌ Pannello Admin
- ❌ Quiz e corsi
- ❌ Statistiche quiz
- ❌ Abbonamenti premium

---

## 👤 3. PAZIENTE NORMALE
**Email:** `paziente@test.it`  
**Password:** `test123`

### Cosa deve vedere:
- ✅ Dashboard con statistiche quiz
- ✅ Abbonamento (piani premium)
- ✅ Webinar Health
- ✅ Centrale Prohmed (contatto medico)
- ✅ Categorie e quiz disponibili
- ✅ Percorsi di formazione
- ✅ Badge e classifica

### Cosa NON deve vedere:
- ❌ Pannello Admin
- ❌ Funzioni dottore
- ❌ DoctorDashboard

---

## 🤖 4. AI-ONLY ACCESS
**Email:** `ai@test.it`  
**Password:** `test123`

### Cosa deve vedere:
- ✅ **Solo** AI Prevenzione
- ✅ Chat AI medico
- ✅ Upload documenti medici
- ✅ Storico conversazioni AI

### Cosa NON deve vedere:
- ❌ Pannello Admin
- ❌ Quiz e corsi
- ❌ Funzioni dottore
- ❌ Qualsiasi altra sezione della piattaforma

---

## 🧪 Come Testare

### 1. Test Separazione Ruoli
1. Fai logout se sei loggato
2. Accedi con `admin@test.it` / `test123`
3. Verifica che vedi SOLO il pannello admin
4. Logout e accedi con `dottore@test.it` / `test123`
5. Verifica che vedi SOLO il menu dottore (no admin, no quiz)
6. Logout e accedi con `paziente@test.it` / `test123`
7. Verifica che vedi SOLO il menu paziente (no admin, no dottore)

### 2. Test Admin RAG
1. Accedi come `admin@test.it`
2. Vai su `/admin/rag` dalla sidebar admin
3. Verifica caricamento documenti scientifici
4. Verifica lista documenti con chunk count
5. Verifica cancellazione documenti

### 3. Test Dottore
1. Accedi come `dottore@test.it`
2. Verifica che la homepage mostri **solo** DoctorDashboard
3. Clicca su "I Miei Pazienti" → deve portarti alla home con dashboard dottore
4. Clicca su "AI Prevenzione" → accesso strumenti AI medici
5. Verifica che NON ci siano quiz, statistiche quiz, premium, ecc.

### 4. Test AI-Only
1. Accedi come `ai@test.it`
2. Verifica che vedi SOLO "AI Prevenzione" nel menu
3. Verifica accesso limitato solo a funzioni AI

---

## ⚠️ Note Importanti

### Homepage Intelligente
La homepage `/` mostra contenuti diversi in base al ruolo:
- **Dottore** → Solo `DoctorDashboard` con lista pazienti
- **Paziente** → Quiz, statistiche, premium, percorsi formativi
- **Admin** → Dovrebbe usare `/admin` invece

### Menu Navigation
Il menu orizzontale in alto cambia dinamicamente:
- **Solo Admin** → mostra tutte le voci admin
- **Solo Dottore** → mostra solo 3 voci dottore
- **Solo Paziente** → mostra Dashboard, Abbonamento, Webinar, Centrale Prohmed
- **Solo AI** → mostra solo AI Prevenzione

### Utenza Principale Admin
Oltre alle utenze di test, esiste già:
- **Email:** `v.pepoli@prohmed.ai` (is_admin=true)

---

## 🐛 Se Trovi Problemi

1. **"Accesso Negato" su pagina admin**: Verifica di essere loggato con `admin@test.it`
2. **Dottore vede quiz**: Verifica che l'account dottore NON abbia anche is_admin=true
3. **Menu sbagliato**: Fai logout completo e riaccedi
4. **Confusione ruoli**: Usa le utenze di test, NON utenze casuali del database

---

*Documento creato: 15 Ottobre 2025*
*Ultimo aggiornamento: 15 Ottobre 2025*
