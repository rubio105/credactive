# 🏥 ProhMed App Integration Guide - CIRY Triage API

**Versione**: 1.0  
**Ultimo aggiornamento**: 2 Novembre 2025

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura Dati](#architettura-dati)
3. [Autenticazione](#autenticazione)
4. [Endpoint API](#endpoint-api)
5. [Flusso Integrazione](#flusso-integrazione)
6. [Esempi Pratici](#esempi-pratici)
7. [Testing & Debug](#testing-debug)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## 📖 Panoramica

L'API Triage di CIRY permette all'app **ProhMed** (Android/iOS) di integrare funzionalità di triage medico AI-powered, mantenendo la propria anagrafica e cartella clinica sul proprio server.

### Cosa fa CIRY?
- ✅ Analisi AI dei sintomi del paziente
- ✅ Valutazione urgenza (LOW/MEDIUM/HIGH/EMERGENCY)
- ✅ Raccomandazione contatto medico quando necessario
- ✅ Storico conversazioni triage

### Cosa rimane su ProhMed?
- 🏠 Anagrafica pazienti (master data)
- 🏠 Cartella clinica completa
- 🏠 File referti medici (PDF, immagini)
- 🏠 Sistema prenotazioni/appuntamenti
- 🏠 Dati di fatturazione

---

## 🗂️ Architettura Dati

```
┌──────────────────────────────┐
│   SERVER PROHMED             │
├──────────────────────────────┤
│ ✅ Database Pazienti         │ ← MASTER
│ ✅ Cartella Clinica          │ ← MASTER
│ ✅ File Referti (PDF/IMG)    │ ← MASTER
│ ✅ Prenotazioni              │ ← MASTER
└────────┬─────────────────────┘
         │
         │ API Call: userId + dati anamnesi
         │
         ↓
┌──────────────────────────────┐
│   SERVER CIRY (ciry.app)     │
├──────────────────────────────┤
│ 💾 Sessioni Triage           │ ← Associati a userId ProhMed
│ 💾 Messaggi Chat AI          │
│ 💾 Snapshot Anamnesi*        │ ← Copia puntuale per contesto AI
│ 💾 Score Urgenza             │
└──────────────────────────────┘

* Snapshot anamnesi = copia dei dati al momento del triage,
  NON sincronizzata con modifiche successive su ProhMed
```

**IMPORTANTE**: CIRY non riceve né archivia file referti. Solo dati testuali (età, allergie, patologie) per migliorare risposte AI.

---

## 🔐 Autenticazione

### Ottenere API Key

**1. Richiedere chiave all'amministratore CIRY**

Contattare l'admin CIRY che genererà una chiave con:
- Nome identificativo (es: "ProhMed Production")
- Scopes: `triage:read`, `triage:write`
- Rate limit: 120 richieste/minuto (configurabile)

**2. Ricevere API Key**

```
ciry_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5
```

⚠️ **IMPORTANTE**: La chiave completa viene mostrata **UNA SOLA VOLTA**. Salvarla in modo sicuro.

### Uso della Chiave

Includere in ogni richiesta HTTP:

```http
X-API-Key: ciry_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5
```

### Rate Limiting

Ogni risposta include headers:

```http
X-RateLimit-Limit: 120           # Max richieste/minuto
X-RateLimit-Remaining: 115        # Richieste rimanenti
X-RateLimit-Reset: 2025-11-02T21:45:00Z  # Reset timestamp
```

Se limite superato:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42                   # Secondi da attendere
```

---

## 🌐 Endpoint API

### Base URL

- **Produzione**: `https://ciry.app`
- **Staging**: *(se disponibile, contattare admin)*

### 1. Creare Sessione Triage

**POST** `/api/v1/triage/sessions`

Avvia una nuova sessione di triage per un paziente ProhMed.

**Headers:**
```http
X-API-Key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "prohmed_patient_789",
  "initialSymptoms": "Febbre alta da 2 giorni con mal di testa",
  "medicalHistory": {
    "age": 45,
    "gender": "male",
    "allergies": ["Penicillina", "Arachidi"],
    "chronicConditions": ["Diabete tipo 2", "Ipertensione"],
    "currentMedications": [
      "Metformina 500mg 2x/die",
      "Ramipril 5mg 1x/die"
    ],
    "previousSurgeries": [
      "Appendicectomia 2018",
      "Colecistectomia 2020"
    ]
  }
}
```

**Parametri:**

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `userId` | string | ✅ Sì | ID paziente dal database ProhMed |
| `initialSymptoms` | string | ❌ No | Sintomi iniziali (se forniti, risposta AI immediata) |
| `medicalHistory` | object | ❌ No | Anamnesi paziente (migliora accuratezza AI) |
| `medicalHistory.age` | number | ❌ No | Età paziente (0-150) |
| `medicalHistory.gender` | string | ❌ No | Sesso: `male`, `female`, `other`, `prefer_not_to_say` |
| `medicalHistory.allergies` | array | ❌ No | Lista allergie note |
| `medicalHistory.chronicConditions` | array | ❌ No | Patologie croniche |
| `medicalHistory.currentMedications` | array | ❌ No | Farmaci in corso |
| `medicalHistory.previousSurgeries` | array | ❌ No | Storia chirurgica |

**Response 201 Created:**
```json
{
  "sessionId": "abc-123-def-456",
  "userId": "prohmed_patient_789",
  "status": "active",
  "createdAt": "2025-11-02T21:30:00Z",
  "firstResponse": {
    "role": "assistant",
    "content": "Capisco che hai febbre alta e mal di testa da 2 giorni...",
    "urgency": "MEDIUM",
    "requiresDoctorContact": false
  }
}
```

**Campi Response:**

| Campo | Descrizione |
|-------|-------------|
| `sessionId` | ID univoco sessione (usare per chiamate successive) |
| `userId` | ID paziente ProhMed |
| `status` | Stato sessione: `active`, `closed` |
| `createdAt` | Timestamp creazione (ISO 8601) |
| `firstResponse` | Risposta AI iniziale (se `initialSymptoms` forniti) |
| `firstResponse.requiresDoctorContact` | **⚠️ IMPORTANTE**: `true` = aprire schermata prenotazioni |

---

### 2. Inviare Messaggio Chat

**POST** `/api/v1/triage/sessions/:sessionId/messages`

Continua la conversazione con l'AI dopo aver creato la sessione.

**Headers:**
```http
X-API-Key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Ora ho anche nausea e vertigini"
}
```

**Response 200 OK:**
```json
{
  "sessionId": "abc-123-def-456",
  "userMessage": {
    "id": "msg-001",
    "role": "user",
    "content": "Ora ho anche nausea e vertigini",
    "timestamp": "2025-11-02T21:32:15Z"
  },
  "aiResponse": {
    "id": "msg-002",
    "role": "assistant",
    "content": "I nuovi sintomi (nausea e vertigini) combinati con la febbre persistente richiedono attenzione medica urgente...",
    "urgency": "HIGH",
    "requiresDoctorContact": true
  },
  "metadata": {
    "urgencyLevel": "HIGH",
    "requiresDoctorContact": true,
    "disclaimer": "Questo servizio non sostituisce un consulto medico professionale."
  }
}
```

**🚨 GESTIONE FLAG `requiresDoctorContact`:**

```javascript
if (response.aiResponse.requiresDoctorContact) {
  // ✅ APRIRE SCHERMATA PRENOTAZIONI IN PROHMED
  navigation.navigate('BookingScreen', {
    urgencyLevel: response.aiResponse.urgency,
    symptoms: userMessage,
    source: 'ai_triage',
    sessionId: sessionId
  });
}
```

---

### 3. Recuperare Storico Messaggi

**GET** `/api/v1/triage/sessions/:sessionId/messages`

Ottiene tutti i messaggi di una sessione triage.

**Query Parameters:**
- `limit` (default: 50): Numero max messaggi
- `offset` (default: 0): Offset paginazione

**Response 200 OK:**
```json
{
  "sessionId": "abc-123-def-456",
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "Febbre alta da 2 giorni",
      "timestamp": "2025-11-02T21:30:00Z"
    },
    {
      "id": "msg-002",
      "role": "assistant",
      "content": "Capisco che hai febbre...",
      "timestamp": "2025-11-02T21:30:05Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 4. Lista Sessioni Paziente

**GET** `/api/v1/triage/sessions?userId=PATIENT_ID`

Recupera tutte le sessioni triage di un paziente ProhMed.

**Response 200 OK:**
```json
{
  "sessions": [
    {
      "sessionId": "abc-123",
      "userId": "prohmed_patient_789",
      "status": "active",
      "createdAt": "2025-11-02T21:30:00Z"
    },
    {
      "sessionId": "def-456",
      "userId": "prohmed_patient_789",
      "status": "closed",
      "createdAt": "2025-10-15T14:20:00Z"
    }
  ]
}
```

---

### 5. Dettagli Sessione

**GET** `/api/v1/triage/sessions/:sessionId`

Ottiene dettagli di una specifica sessione.

**Response 200 OK:**
```json
{
  "sessionId": "abc-123-def-456",
  "userId": "prohmed_patient_789",
  "status": "active",
  "createdAt": "2025-11-02T21:30:00Z"
}
```

---

### 6. Chiudere Sessione

**DELETE** `/api/v1/triage/sessions/:sessionId`

Chiude una sessione triage (lo stato diventa `closed`).

**Response 200 OK:**
```json
{
  "success": true,
  "sessionId": "abc-123-def-456",
  "status": "closed"
}
```

---

## 🔄 Flusso Integrazione

### Scenario Completo: Paziente con Sintomi

```
1. PAZIENTE apre app ProhMed
   ↓
2. PAZIENTE seleziona "Consulto AI Sintomi"
   ↓
3. APP PROHMED:
   - Recupera dati anamnesi da DB locale
   - Chiama POST /api/v1/triage/sessions
   - Include: userId + initialSymptoms + medicalHistory
   ↓
4. CIRY API:
   - Salva sessione con medicalHistory snapshot
   - AI analizza sintomi + anamnesi
   - Restituisce risposta + urgenza
   ↓
5. APP PROHMED riceve risposta:
   
   if (firstResponse.requiresDoctorContact) {
     // ✅ Mostra alert + apri prenotazioni
     Alert.alert(
       'Consulto Medico Consigliato',
       'L\'AI consiglia di contattare un medico',
       [
         { text: 'Prenota Visita', onPress: () => goToBooking() },
         { text: 'Continua Chat', style: 'cancel' }
       ]
     );
   } else {
     // Mostra chat AI normale
     displayChatInterface(sessionId);
   }
   ↓
6. PAZIENTE continua chat (opzionale):
   - Invia messaggi via POST /messages
   - AI risponde usando medicalHistory salvato
   - Se AI raccomanda medico → apri prenotazioni
   ↓
7. FINE SESSIONE:
   - DELETE /sessions/:id (opzionale)
   - Salva sessionId in DB ProhMed per storico
```

---

## 💻 Esempi Pratici

### React Native / Expo

```javascript
// 1. Configurazione
const CIRY_API_KEY = 'ciry_abc123...'; // Salvare in secure storage
const CIRY_BASE_URL = 'https://ciry.app';

// 2. Helper function
async function ciryRequest(endpoint, options = {}) {
  const response = await fetch(`${CIRY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': CIRY_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// 3. Avviare triage
async function startTriageForPatient(patientId) {
  try {
    // Recupera dati paziente da DB locale ProhMed
    const patient = await getPatientFromLocalDB(patientId);
    
    const session = await ciryRequest('/api/v1/triage/sessions', {
      method: 'POST',
      body: JSON.stringify({
        userId: patient.id,
        initialSymptoms: 'Febbre e mal di testa da 2 giorni',
        medicalHistory: {
          age: patient.age,
          gender: patient.gender,
          allergies: patient.allergies,
          chronicConditions: patient.chronicConditions,
          currentMedications: patient.currentMedications,
          previousSurgeries: patient.previousSurgeries,
        },
      }),
    });
    
    // Verifica se serve contatto medico
    if (session.firstResponse?.requiresDoctorContact) {
      Alert.alert(
        'Consulto Medico Consigliato',
        `Urgenza: ${session.firstResponse.urgency}`,
        [
          {
            text: 'Prenota Visita',
            onPress: () => navigation.navigate('Booking', {
              patientId,
              urgency: session.firstResponse.urgency,
            }),
          },
          { text: 'Continua Chat', style: 'cancel' },
        ]
      );
    }
    
    return session;
  } catch (error) {
    console.error('Triage error:', error);
    Alert.alert('Errore', 'Impossibile avviare consulto AI');
  }
}

// 4. Inviare messaggio
async function sendTriageMessage(sessionId, message) {
  const response = await ciryRequest(
    `/api/v1/triage/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    }
  );
  
  // Intercetta raccomandazione medico
  if (response.aiResponse.requiresDoctorContact) {
    showBookingAlert(response.aiResponse.urgency);
  }
  
  return response;
}
```

---

### Flutter / Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class CiryTriageService {
  static const String baseUrl = 'https://ciry.app';
  static const String apiKey = 'ciry_abc123...'; // Store securely
  
  // Avvia sessione triage
  Future<Map<String, dynamic>> startTriage({
    required String userId,
    String? initialSymptoms,
    Map<String, dynamic>? medicalHistory,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/triage/sessions'),
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'userId': userId,
        if (initialSymptoms != null) 'initialSymptoms': initialSymptoms,
        if (medicalHistory != null) 'medicalHistory': medicalHistory,
      }),
    );
    
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      
      // Verifica flag medico
      if (data['firstResponse']?['requiresDoctorContact'] == true) {
        _showDoctorRecommendation(data['firstResponse']['urgency']);
      }
      
      return data;
    } else {
      throw Exception('Failed to start triage: ${response.body}');
    }
  }
  
  // Invia messaggio
  Future<Map<String, dynamic>> sendMessage(
    String sessionId,
    String message,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/triage/sessions/$sessionId/messages'),
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'message': message}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      
      // Intercetta raccomandazione medico
      if (data['aiResponse']['requiresDoctorContact'] == true) {
        _showDoctorRecommendation(data['aiResponse']['urgency']);
      }
      
      return data;
    } else {
      throw Exception('Failed to send message: ${response.body}');
    }
  }
  
  void _showDoctorRecommendation(String urgency) {
    // Mostra dialog + naviga a prenotazioni
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Consulto Medico Consigliato'),
        content: Text('Urgenza: $urgency'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pushNamed(context, '/booking'),
            child: Text('Prenota Visita'),
          ),
        ],
      ),
    );
  }
}
```

---

## 🧪 Testing & Debug

### 1. Verificare Connettività

```bash
# Test endpoint documentazione
curl https://ciry.app/api/v1/docs

# Dovrebbe restituire JSON con lista endpoint
```

### 2. Test Sessione Completa

```bash
# Step 1: Creare sessione
curl -X POST 'https://ciry.app/api/v1/triage/sessions' \
  -H 'X-API-Key: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test_patient_001",
    "initialSymptoms": "Febbre da 3 giorni",
    "medicalHistory": {
      "age": 35,
      "gender": "male",
      "allergies": ["Penicillina"],
      "chronicConditions": ["Ipertensione"],
      "currentMedications": ["Ramipril 5mg"],
      "previousSurgeries": []
    }
  }'

# Salva sessionId dalla risposta
# Es: abc-123-def-456

# Step 2: Inviare messaggio
curl -X POST 'https://ciry.app/api/v1/triage/sessions/abc-123-def-456/messages' \
  -H 'X-API-Key: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Ho anche mal di testa forte"}'

# Step 3: Recuperare storico
curl 'https://ciry.app/api/v1/triage/sessions/abc-123-def-456/messages' \
  -H 'X-API-Key: YOUR_API_KEY'

# Step 4: Chiudere sessione
curl -X DELETE 'https://ciry.app/api/v1/triage/sessions/abc-123-def-456' \
  -H 'X-API-Key: YOUR_API_KEY'
```

### 3. Test Flag requiresDoctorContact

```bash
# Simulare sintomi che richiedono medico
curl -X POST 'https://ciry.app/api/v1/triage/sessions' \
  -H 'X-API-Key: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test_patient_002",
    "initialSymptoms": "Dolore toracico acuto con difficoltà respiratorie",
    "medicalHistory": {
      "age": 60,
      "chronicConditions": ["Cardiopatia ischemica"]
    }
  }'

# Verificare nella risposta:
# "requiresDoctorContact": true
# "urgency": "EMERGENCY" o "HIGH"
```

### 4. Monitorare Rate Limit

```bash
# Controllare headers risposta
curl -i 'https://ciry.app/api/v1/triage/sessions?userId=test' \
  -H 'X-API-Key: YOUR_API_KEY'

# Cercare:
# X-RateLimit-Limit: 120
# X-RateLimit-Remaining: 119
# X-RateLimit-Reset: 2025-11-02T22:00:00Z
```

---

## ⚠️ Error Handling

### Codici di Stato HTTP

| Codice | Significato | Azione |
|--------|-------------|--------|
| 200 | OK | Successo |
| 201 | Created | Risorsa creata con successo |
| 400 | Bad Request | Verificare parametri richiesta |
| 401 | Unauthorized | API key mancante o invalida |
| 403 | Forbidden | API key non ha permessi sufficienti |
| 404 | Not Found | Risorsa non trovata (sessionId errato) |
| 429 | Too Many Requests | Rate limit superato, attendere |
| 500 | Internal Server Error | Errore server, riprovare più tardi |

### Esempi Errori

**400 - Parametri Mancanti:**
```json
{
  "error": "Bad Request",
  "message": "userId is required"
}
```

**400 - medicalHistory Invalido:**
```json
{
  "error": "Bad Request",
  "message": "Invalid medicalHistory format",
  "details": [
    {
      "path": ["age"],
      "message": "Expected number, received string"
    }
  ]
}
```

**401 - API Key Invalida:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired API key"
}
```

**429 - Rate Limit:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 42 seconds.",
  "retryAfter": 42
}
```

### Gestione Errori Consigliata

```javascript
async function handleCiryRequest(requestFn) {
  try {
    return await requestFn();
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // API key invalida - contattare admin
          Alert.alert('Errore Autenticazione', 'Contattare supporto tecnico');
          break;
        
        case 429:
          // Rate limit - mostrare countdown
          const retryAfter = error.response.headers['retry-after'];
          Alert.alert('Limite Richieste', `Riprova tra ${retryAfter}s`);
          break;
        
        case 500:
          // Errore server - riprovare
          Alert.alert('Errore Temporaneo', 'Riprovare tra qualche minuto');
          break;
        
        default:
          Alert.alert('Errore', error.message);
      }
    } else {
      // Errore network
      Alert.alert('Connessione', 'Verificare connessione internet');
    }
  }
}
```

---

## ✅ Best Practices

### 1. Sicurezza API Key

```javascript
// ✅ CORRETTO: Store in secure storage
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('ciry_api_key', 'ciry_abc123...');

// ❌ ERRATO: Hardcoded in codice
const API_KEY = 'ciry_abc123...'; // MAI FARE!
```

### 2. Gestione medicalHistory

```javascript
// ✅ CORRETTO: Validare prima di inviare
function prepareMedicalHistory(patient) {
  return {
    age: typeof patient.age === 'number' ? patient.age : null,
    gender: ['male', 'female', 'other'].includes(patient.gender) 
      ? patient.gender 
      : 'prefer_not_to_say',
    allergies: Array.isArray(patient.allergies) 
      ? patient.allergies.filter(a => typeof a === 'string') 
      : [],
    chronicConditions: Array.isArray(patient.conditions) 
      ? patient.conditions 
      : [],
    currentMedications: Array.isArray(patient.meds) 
      ? patient.meds 
      : [],
    previousSurgeries: Array.isArray(patient.surgeries) 
      ? patient.surgeries 
      : [],
  };
}

// ❌ ERRATO: Inviare dati senza validazione
medicalHistory: patient.rawData // Può causare errori 400
```

### 3. Salvare sessionId in DB ProhMed

```sql
-- Tabella consigliata per storico triage
CREATE TABLE triage_sessions_history (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  ciry_session_id VARCHAR(255) NOT NULL,
  initial_symptoms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  final_urgency VARCHAR(20),
  doctor_contacted BOOLEAN DEFAULT FALSE
);
```

### 4. Timeout Requests

```javascript
// ✅ CORRETTO: Impostare timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

try {
  const response = await fetch(url, {
    signal: controller.signal,
    ...options
  });
} catch (error) {
  if (error.name === 'AbortError') {
    Alert.alert('Timeout', 'Richiesta troppo lenta, riprovare');
  }
} finally {
  clearTimeout(timeoutId);
}
```

### 5. Retry Logic per 500 Errors

```javascript
async function fetchWithRetry(requestFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status === 500 && i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}
```

### 6. Monitorare requiresDoctorContact

```javascript
// ✅ Tracciare quando AI raccomanda medico
function logDoctorRecommendation(sessionId, urgency) {
  analytics.track('ai_doctor_recommendation', {
    session_id: sessionId,
    urgency_level: urgency,
    timestamp: new Date().toISOString(),
  });
  
  // Salvare in DB ProhMed per follow-up
  saveDoctorRecommendation(sessionId, urgency);
}
```

---

## 📞 Supporto

### Contatti Tecnici

- **Email Supporto**: *(fornire email tecnica CIRY)*
- **Documentazione API**: `https://ciry.app/api/v1/docs`

### Richieste Comuni

1. **Generare nuova API key**: Contattare admin CIRY
2. **Aumentare rate limit**: Richiedere modifica limite (default 120 req/min)
3. **Segnalare bug**: Includere `sessionId` e timestamp errore
4. **Proporre miglioramenti**: Feedback sempre ben accetti

---

## 📝 Changelog

### v1.0 (2 Novembre 2025)
- ✅ Endpoint triage sessioni (POST/GET/DELETE)
- ✅ Supporto medicalHistory (anamnesi paziente)
- ✅ Flag requiresDoctorContact per apertura prenotazioni
- ✅ Rate limiting 60-120 req/min configurabile
- ✅ Autenticazione SHA-256 API key

---

**Fine Documentazione**  
Per domande: Contattare team tecnico CIRY
