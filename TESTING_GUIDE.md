# 🧪 Guida Testing - API Triage ProhMed

## 📋 Prerequisiti

1. ✅ Server CIRY in esecuzione (porta 5000)
2. ✅ Database configurato con tabella `api_keys`
3. ✅ File `PROHMED_INTEGRATION.md` disponibile
4. ✅ Script `test-prohmed-api.sh` eseguibile

---

## 🔑 STEP 1: Generare API Key di Test

### Opzione A: Via Admin UI (Consigliato quando disponibile)

1. Login su `http://localhost:5000` come admin
2. Vai su `/admin` → Tab "API Keys" (se implementato)
3. Click "Crea Nuova API Key"
4. Compila:
   - Nome: `Test ProhMed Development`
   - Scopes: `triage:read`, `triage:write`
   - Rate Limit: `120` req/min
5. **SALVA LA CHIAVE** mostrata (visibile solo 1 volta!)

### Opzione B: Via API Diretta (Terminal)

**1. Login e ottieni session cookie:**

```bash
# Apri browser e login su http://localhost:5000
# Apri DevTools → Network → Cerca cookie "connect.sid"
# Copia il valore del cookie
```

**2. Genera API key via curl:**

```bash
curl -X POST 'http://localhost:5000/api/admin/api-keys' \
  -H 'Cookie: connect.sid=YOUR_SESSION_COOKIE_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test ProhMed Development",
    "scopes": ["triage:read", "triage:write"],
    "rateLimitPerMinute": 120
  }'
```

**Output atteso:**
```json
{
  "success": true,
  "apiKey": "ciry_abc123def456ghi789...",
  "id": "key-001",
  "message": "API key created successfully. Save this key securely - it cannot be retrieved again."
}
```

**3. Salva la chiave:**

```bash
export CIRY_API_KEY='ciry_abc123def456ghi789...'
```

### Opzione C: Via Database Diretto (Solo Development)

```bash
# Genera key temporanea direttamente nel database
tsx scripts/create-test-api-key.ts
```

*(Questo script genera automaticamente una chiave di test valida)*

---

## ✅ STEP 2: Eseguire Test Suite Automatico

Una volta ottenuta la API key:

```bash
# Imposta variabile ambiente
export CIRY_API_KEY='ciry_your_actual_key_here'

# Esegui test suite
./test-prohmed-api.sh
```

**Output atteso:**

```
========================================
🧪 TEST SUITE CIRY TRIAGE API - INTEGRAZIONE PROHMED
========================================

========================================
STEP 0: Verifica Configurazione
========================================

✅ API Key configurata
ℹ️  Base URL: http://localhost:5000

========================================
STEP 1: Test Endpoint Documentazione
========================================

✅ Documentazione API disponibile

========================================
STEP 2: Creare Sessione Base (senza anamnesi)
========================================

✅ Sessione creata: abc-123-def-456

========================================
STEP 3: Creare Sessione Completa (con anamnesi + sintomi)
========================================

✅ Sessione creata con anamnesi: ghi-789-jkl-012
✅ AI ha risposto ai sintomi iniziali
ℹ️  Urgenza: MEDIUM
ℹ️  Richiede medico: false

========================================
STEP 4: Inviare Messaggio in Chat
========================================

✅ AI ha risposto al messaggio
ℹ️  Urgenza: HIGH
ℹ️  Richiede medico: true
✅ ✨ FLAG requiresDoctorContact FUNZIONA!
ℹ️  → App ProhMed dovrebbe aprire prenotazioni

... (altri test)

========================================
🎉 TUTTI I TEST SUPERATI!
========================================

✅ L'API è pronta per l'integrazione ProhMed

ℹ️  Prossimi step:
  1. Fornire API key allo sviluppatore ProhMed
  2. Condividere PROHMED_INTEGRATION.md
  3. Assistere nell'integrazione nell'app mobile
```

---

## 🔍 STEP 3: Test Manuali Specifici

### Test 1: Verifica Medical History nel Prompt AI

```bash
# Crea sessione con allergie specifiche
curl -X POST 'http://localhost:5000/api/v1/triage/sessions' \
  -H "X-API-Key: $CIRY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "manual_test_001",
    "initialSymptoms": "Mal di gola e febbre",
    "medicalHistory": {
      "age": 30,
      "gender": "female",
      "allergies": ["Penicillina", "Amoxicillina"]
    }
  }' | jq '.'
```

**Verifica:** La risposta AI dovrebbe evitare di suggerire antibiotici a base di penicillina.

---

### Test 2: Simulare Caso Urgente

```bash
# Sintomi che dovrebbero triggerare requiresDoctorContact
curl -X POST 'http://localhost:5000/api/v1/triage/sessions' \
  -H "X-API-Key: $CIRY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "manual_test_002",
    "initialSymptoms": "Dolore toracico acuto con difficoltà respiratorie da 20 minuti",
    "medicalHistory": {
      "age": 65,
      "chronicConditions": ["Cardiopatia ischemica", "Ipertensione"],
      "currentMedications": ["Aspirina 100mg", "Atorvastatina 20mg"]
    }
  }' | jq '.firstResponse.requiresDoctorContact'
```

**Verifica:** Output dovrebbe essere `true`

---

### Test 3: Recupero Storico con Medical History

```bash
# Crea sessione e salva sessionId
SESSION_ID=$(curl -s -X POST 'http://localhost:5000/api/v1/triage/sessions' \
  -H "X-API-Key: $CIRY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "manual_test_003",
    "medicalHistory": {
      "age": 50,
      "chronicConditions": ["Diabete tipo 2"]
    }
  }' | jq -r '.sessionId')

# Invia messaggio
curl -X POST "http://localhost:5000/api/v1/triage/sessions/$SESSION_ID/messages" \
  -H "X-API-Key: $CIRY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"message": "Ho sete eccessiva e minzione frequente"}' | jq '.'
```

**Verifica:** L'AI dovrebbe collegare i sintomi al diabete noto.

---

### Test 4: Validazione Errori

```bash
# Test 4a: userId mancante
curl -X POST 'http://localhost:5000/api/v1/triage/sessions' \
  -H "X-API-Key: $CIRY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "initialSymptoms": "Test"
  }' | jq '.'

# Atteso: HTTP 400 + "userId is required"

# Test 4b: medicalHistory con tipo errato
curl -X POST 'http://localhost:5000/api/v1/triage/sessions' \
  -H "X-API-Key: $CIRY_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test",
    "medicalHistory": {
      "age": "quarantacinque"
    }
  }' | jq '.'

# Atteso: HTTP 400 + validation error details

# Test 4c: API key mancante
curl -X POST 'http://localhost:5000/api/v1/triage/sessions' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "test"}' | jq '.'

# Atteso: HTTP 401 + "Invalid or expired API key"
```

---

## 📊 STEP 4: Verificare Database

### Controllo Sessioni Salvate

```bash
# Accedi al database e verifica dati salvati
```

**Query SQL:**

```sql
-- Verifica sessioni con medicalHistory
SELECT 
  id,
  user_id,
  title,
  medical_history,
  created_at
FROM triage_sessions
WHERE medical_history IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Output atteso:**

```
id                  | user_id              | medical_history                          | created_at
--------------------+----------------------+-----------------------------------------+------------------------
ghi-789-jkl-012     | test_prohmed_pat... | {"age": 45, "gender": "male", ...}      | 2025-11-02 21:45:00
```

---

### Controllo API Keys

```sql
-- Verifica API keys generate
SELECT 
  id,
  name,
  key_prefix,
  scopes,
  active,
  rate_limit_per_minute,
  request_count,
  last_used_at
FROM api_keys
ORDER BY created_at DESC;
```

---

## 🐛 STEP 5: Debug Problemi Comuni

### Problema 1: "API key not found"

**Causa:** API key non salvata correttamente

**Soluzione:**
```bash
# Verifica esistenza in database
tsx scripts/list-api-keys.ts

# Se manca, ricrea key
tsx scripts/create-test-api-key.ts
```

---

### Problema 2: "medicalHistory undefined nell'AI"

**Causa:** Campo non passato correttamente

**Debug:**
```bash
# Aggiungi log temporaneo in routes.ts
console.log('Medical History ricevuto:', medicalHistory);
console.log('Session salvato:', session);
```

**Verifica nel log del server:**
```
Medical History ricevuto: { age: 45, gender: 'male', ... }
Session salvato: { id: 'abc-123', medicalHistory: { age: 45, ... } }
```

---

### Problema 3: requiresDoctorContact sempre false

**Causa:** AI non riconosce urgenza

**Soluzione:** Usa sintomi più espliciti:

```bash
# Sintomi che dovrebbero sempre triggerare flag
SYMPTOMS=(
  "Dolore toracico acuto con difficoltà respiratorie"
  "Perdita improvvisa di coscienza"
  "Sanguinamento abbondante che non si ferma"
  "Dolore addominale acuto persistente"
)

for symptom in "${SYMPTOMS[@]}"; do
  curl -X POST 'http://localhost:5000/api/v1/triage/sessions' \
    -H "X-API-Key: $CIRY_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "{
      \"userId\": \"urgent_test\",
      \"initialSymptoms\": \"$symptom\"
    }" | jq '.firstResponse.requiresDoctorContact'
done
```

---

## ✅ Checklist Finale

Prima di considerare l'integrazione pronta:

- [ ] ✅ Test suite automatico passa al 100%
- [ ] ✅ medicalHistory salvato correttamente nel database
- [ ] ✅ AI utilizza medical history nelle risposte
- [ ] ✅ Flag requiresDoctorContact funziona per casi urgenti
- [ ] ✅ Rate limiting headers presenti in tutte le risposte
- [ ] ✅ Validazione errori restituisce HTTP 400
- [ ] ✅ API key mancante restituisce HTTP 401
- [ ] ✅ Documentazione PROHMED_INTEGRATION.md completa
- [ ] ✅ Storico messaggi recuperabile
- [ ] ✅ Sessioni chiudibili correttamente

---

## 📝 Prossimi Step Produzione

Quando tutti i test passano in development:

1. **Deploy su server produzione** (ciry.app):
   ```bash
   ssh root@157.180.21.147
   cd /var/www/credactive
   git pull
   rm -rf dist/
   export VITE_STRIPE_PUBLIC_KEY="pk_live_..."
   npm run build
   tsx scripts/create-api-keys-table.ts  # Se non esiste
   pm2 restart credactive
   ```

2. **Purge Cloudflare cache**:
   - Dashboard Cloudflare → ciry.app → Caching → Purge Everything

3. **Generare API key produzione**:
   ```bash
   # Login su https://ciry.app come admin
   # Genera key con nome "ProhMed Production"
   # Fornire chiave allo sviluppatore ProhMed
   ```

4. **Test su produzione**:
   ```bash
   export API_URL='https://ciry.app'
   export CIRY_API_KEY='production_key_here'
   ./test-prohmed-api.sh
   ```

5. **Fornire documentazione**:
   - Inviare `PROHMED_INTEGRATION.md` a team ProhMed
   - Fornire API key production
   - Organizzare call di onboarding per Q&A

---

**Fine Guida Testing**
