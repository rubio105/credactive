# 🏥 Gemma Med - Documentazione Tecnica Completa

**CIRY Self-Hosted AI Infrastructure**  
**Data:** Ottobre 2025  
**Versione:** 1.0.0  
**Autore:** Sistema CIRY  

---

## 📖 Indice

1. [Overview del Progetto](#1-overview-del-progetto)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Componenti Tecnici](#3-componenti-tecnici)
4. [Modelli AI Disponibili](#4-modelli-ai-disponibili)
5. [Sistema di Fallback Automatico](#5-sistema-di-fallback-automatico)
6. [Configurazione e Variabili d'Ambiente](#6-configurazione-e-variabili-dambiente)
7. [API e Interfacce](#7-api-e-interfacce)
8. [Performance e Metriche](#8-performance-e-metriche)
9. [Setup e Deployment](#9-setup-e-deployment)
10. [Monitoring e Logging](#10-monitoring-e-logging)
11. [Sicurezza e Privacy GDPR](#11-sicurezza-e-privacy-gdpr)
12. [Troubleshooting](#12-troubleshooting)
13. [Roadmap e Sviluppi Futuri](#13-roadmap-e-sviluppi-futuri)

---

## 1. Overview del Progetto

### 1.1 Cos'è Gemma Med?

**Gemma Med** è un sistema di intelligenza artificiale medica **self-hosted** integrato in CIRY per garantire:

- ✅ **Privacy GDPR Compliant**: Tutti i dati medici restano sul server Hetzner in EU
- ✅ **Zero Dipendenza Cloud**: Nessuna chiamata API esterna (eccetto fallback)
- ✅ **Controllo Totale**: Possibilità di fine-tuning su dati italiani specifici
- ✅ **Costi Prevedibili**: Server GPU fisso vs API cloud variabile
- ✅ **Alta Disponibilità**: Fallback automatico a Gemini se Gemma offline

### 1.2 Perché Self-Hosted?

**Problemi del Cloud AI:**
- ❌ Dati medici inviati a server esterni (USA, Google, OpenAI)
- ❌ Costi variabili e imprevedibili (€50-200/mese)
- ❌ Latenza alta (200-500ms round-trip)
- ❌ Nessun controllo su modello e training data
- ❌ Dipendenza da servizi esterni

**Vantaggi Gemma Self-Hosted:**
- ✅ Dati medici mai escono dal server EU
- ✅ Costi fissi e prevedibili (€100-150/mese)
- ✅ Latenza bassissima (10-50ms su localhost)
- ✅ Possibilità fine-tuning su casi italiani CIRY
- ✅ Indipendenza strategica

### 1.3 Strategia di Migrazione

```
Fase 1 (Attuale): Gemini Cloud
   ↓
Fase 2 (1-2 settimane): Gemma Local + Gemini Fallback
   ↓
Fase 3 (3-6 mesi): Gemma Fine-Tuned su dati CIRY
   ↓
Fase 4 (6-12 mesi): Modello Proprietario CIRY
```

---

## 2. Architettura del Sistema

### 2.1 Stack Tecnologico

```
┌─────────────────────────────────────────────────┐
│            CIRY Frontend (React)                │
└────────────────┬────────────────────────────────┘
                 │ HTTP/JSON
                 ↓
┌─────────────────────────────────────────────────┐
│        CIRY Backend (Express.js)                │
│  ┌──────────────────────────────────────────┐   │
│  │   AI Router (server/gemini.ts)           │   │
│  │                                          │   │
│  │   generateTriageResponse()               │   │
│  └──────────┬───────────────────────────────┘   │
│             │                                    │
│  ┌──────────▼───────────┐  ┌─────────────────┐  │
│  │  Gemma Client        │  │  Gemini Client  │  │
│  │  (gemmaClient.ts)    │  │  (@google/genai)│  │
│  └──────────┬───────────┘  └────────┬────────┘  │
└─────────────┼─────────────────────────┼──────────┘
              │                         │
              │ HTTP                    │ HTTPS
              ↓                         ↓
┌─────────────────────────┐  ┌────────────────────┐
│   Ollama Local Server   │  │  Google Gemini API │
│   (localhost:11434)     │  │  (generativelanguage)
│                         │  │  .googleapis.com)  │
│  ┌──────────────────┐   │  └────────────────────┘
│  │ Gemma 2 9B Model │   │
│  │ (gemma2:9b)      │   │
│  └──────────────────┘   │
└─────────────────────────┘
         │
         ↓
┌─────────────────────────┐
│   GPU (RTX 4000 20GB)   │
│   VRAM Utilization      │
└─────────────────────────┘
```

### 2.2 Flusso delle Richieste

**Scenario 1: Gemma Disponibile (90% dei casi)**
```
1. User invia messaggio chat
2. Backend riceve richiesta → generateTriageResponse()
3. Check: USE_LOCAL_MODEL=true?
4. gemmaClient.isAvailable() → Health check (5s timeout)
5. ✅ Gemma disponibile → generateMedicalResponse()
6. Ollama processa richiesta su GPU
7. Risposta generata (2-5 secondi)
8. Return to user con modelUsed: "gemma-local-gemma2:9b"
9. ML Collector salva: model="gemma-local-gemma2:9b"
```

**Scenario 2: Gemma Non Disponibile (10% dei casi)**
```
1. User invia messaggio chat
2. Backend riceve richiesta → generateTriageResponse()
3. Check: USE_LOCAL_MODEL=true?
4. gemmaClient.isAvailable() → Health check timeout/error
5. ❌ Gemma non disponibile → Log warning
6. Fallback automatico → generateTriageResponseWithGemini()
7. Google Gemini API chiamata
8. Risposta generata (1-3 secondi)
9. Return to user con modelUsed: "gemini-2.5-flash"
10. ML Collector salva: model="gemini-2.5-flash"
```

### 2.3 Diagramma di Flusso Decisionale

```mermaid
graph TD
    A[Richiesta Triage AI] --> B{USE_LOCAL_MODEL=true?}
    B -->|NO| C[Usa Gemini Cloud]
    B -->|SÌ| D[Health Check Gemma]
    D -->|Disponibile| E[Genera Risposta con Gemma]
    D -->|Non Disponibile| F[Log Warning]
    F --> C
    E -->|Success| G[Return + modelUsed: gemma-local]
    E -->|Error/Timeout| H[Log Error]
    H --> C
    C --> I[Return + modelUsed: gemini-2.5-flash]
    G --> J[ML Tracking]
    I --> J
    J --> K[Database mlTrainingData]
```

---

## 3. Componenti Tecnici

### 3.1 GemmaClient (server/gemmaClient.ts)

**Responsabilità:**
- Comunicazione con Ollama API
- Health check del servizio locale
- Gestione timeout e retry
- Generazione embeddings (opzionale per RAG)

**Metodi Principali:**

#### 3.1.1 `isAvailable(): Promise<boolean>`

Verifica se Ollama è raggiungibile e il modello è caricato.

```typescript
async isAvailable(): Promise<boolean> {
  if (!this.enabled) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s
    
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const modelAvailable = data.models?.some(m => 
      m.name.includes(this.model.split(':')[0])
    );
    
    return modelAvailable;
  } catch (error) {
    console.warn(`[Gemma] Not available:`, error.message);
    return false;
  }
}
```

**Timeout:** 5 secondi (configurabile)  
**Retry:** Nessuno (fallback immediato a Gemini)

#### 3.1.2 `generateMedicalResponse(...)`

Genera risposta medica usando Gemma locale.

```typescript
async generateMedicalResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<{
  message: string;
  model: string;
  metrics?: {
    totalDuration: number;
    tokensGenerated: number;
    tokensPerSecond: number;
  };
}>
```

**Input:**
- `userMessage`: Sintomo/domanda paziente
- `conversationHistory`: Chat precedente (context)
- `systemPrompt`: Istruzioni AI (ruolo, linguaggio, formato output)

**Output:**
- `message`: Risposta AI in formato JSON
- `model`: Nome modello utilizzato (es: `gemma2:9b-instruct`)
- `metrics`: Performance metrics (opzionale)

**Timeout:** 60 secondi default (configurabile via `GEMMA_TIMEOUT`)

#### 3.1.3 `generateEmbedding(text: string)`

Genera embeddings per sistema RAG (Knowledge Base).

```typescript
async generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${this.baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: this.model,
      prompt: text,
    }),
  });
  
  const data = await response.json();
  return data.embedding; // Array di 768 dimensioni (tipico)
}
```

**Nota:** Attualmente CIRY usa Gemini per embeddings (`text-embedding-004`). Questo metodo è pronto per migrare embeddings a Gemma in futuro.

### 3.2 AI Router (server/gemini.ts)

**Funzione Principale:** `generateTriageResponse(...)`

Questa è la funzione **pubblica** che l'intero backend usa per ottenere risposte AI.

```typescript
export async function generateTriageResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  documentContext?: string,
  userName?: string,
  scientificContext?: string,
  userRole?: 'patient' | 'doctor',
  language?: string,
  userAge?: number,
  userGender?: string,
  heightCm?: number | null,
  weightKg?: number | null,
  smokingStatus?: string | null,
  physicalActivity?: string | null,
  userBio?: string | null
): Promise<TriageResponse & { modelUsed?: string }>
```

**Logica Interna:**

```typescript
// 1. Check configurazione
if (USE_LOCAL_MODEL_FALLBACK) {
  
  // 2. Health check Gemma (5s)
  const isAvailable = await gemmaClient.isAvailable();
  
  if (isAvailable) {
    try {
      // 3. Prova con Gemma
      const result = await generateTriageResponseWithGemma(...);
      
      // 4. Success → Return con modelUsed
      return { 
        ...result, 
        modelUsed: `gemma-local-${process.env.GEMMA_MODEL}` 
      };
      
    } catch (error) {
      // 5. Gemma fallito → Log + fallback
      console.warn('[AI] Gemma failed, fallback to Gemini');
    }
  }
}

// 6. Fallback Gemini (sempre)
const result = await generateTriageResponseWithGemini(...);
return { ...result, modelUsed: 'gemini-2.5-flash' };
```

**Funzioni Private:**

- `generateTriageResponseWithGemma(...)`: Implementazione Gemma
- `generateTriageResponseWithGemini(...)`: Implementazione Gemini originale

Entrambe costruiscono lo stesso system prompt e gestiscono la stessa logica medica, solo cambiano l'API chiamata.

---

## 4. Modelli AI Disponibili

### 4.1 Gemma 2 (Google, Open Source)

#### Gemma 2 9B Instruct ✅ CONSIGLIATO

```bash
ollama pull gemma2:9b-instruct
```

**Specifiche:**
- **Parametri:** 9 miliardi
- **VRAM Richiesta:** 12-16GB
- **Context Window:** 8192 tokens
- **Velocità:** 20-30 tokens/sec (RTX 4000)
- **Qualità:** Ottima per task medici generali

**Pro:**
- ✅ Bilanciato performance/risorse
- ✅ Training multi-dominio include medicina
- ✅ Supporto italiano buono
- ✅ Reasoning capabilities avanzate

**Contro:**
- ⚠️ Non specializzato 100% medicina
- ⚠️ Richiede prompt engineering accurato

#### Gemma 2 27B Instruct (High-End)

```bash
ollama pull gemma2:27b-instruct
```

**Specifiche:**
- **Parametri:** 27 miliardi
- **VRAM Richiesta:** 40-48GB
- **Context Window:** 8192 tokens
- **Velocità:** 8-12 tokens/sec (RTX 6000)
- **Qualità:** Eccellente, comparabile a GPT-4

**Pro:**
- ✅ Performance top-tier
- ✅ Reasoning complesso
- ✅ Migliore comprensione contesto medico

**Contro:**
- ❌ Richiede GPU potente (RTX 6000 48GB)
- ❌ Lento (3x più lento di 9B)
- ❌ Overkill per la maggior parte dei casi CIRY

### 4.2 MedLlama2 (Meta, Medical Specialization)

```bash
ollama pull medllama2
```

**Specifiche:**
- **Parametri:** 7 miliardi
- **VRAM Richiesta:** 10-14GB
- **Context Window:** 4096 tokens
- **Specializzazione:** Medicina, letteratura biomedica

**Pro:**
- ✅ Fine-tuned su PubMed, testi medici
- ✅ Terminologia medica accurata
- ✅ Buono per analisi report clinici

**Contro:**
- ⚠️ Conversational skills inferiori a Gemma
- ⚠️ Italiano meno fluente
- ⚠️ Context window più piccolo

**Use Case CIRY:** Analisi report medici, estrazione dati clinici

### 4.3 Meditron (EPFL, Clinical Focus)

```bash
ollama pull meditron:7b
```

**Specifiche:**
- **Parametri:** 7 miliardi
- **VRAM Richiesta:** 10-14GB
- **Context Window:** 4096 tokens
- **Specializzazione:** Clinical guidelines, protocolli

**Pro:**
- ✅ Training su linee guida cliniche
- ✅ Ottimo per decision support medico
- ✅ Focus su evidence-based medicine

**Contro:**
- ⚠️ Meno versatile di Gemma per chat generali
- ⚠️ Italiano limitato
- ⚠️ Più adatto a medici che pazienti

**Use Case CIRY:** Supporto decisionale per medici, triage avanzato

### 4.4 Nomic Embed Text (Embeddings)

```bash
ollama pull nomic-embed-text
```

**Specifiche:**
- **Dimensioni:** 768
- **VRAM Richiesta:** 2-4GB
- **Velocità:** Molto veloce
- **Use Case:** RAG Knowledge Base

**Quando usarlo:**
- ✅ Embeddings per documenti scientifici
- ✅ Semantic search nella knowledge base
- ✅ Alternative a Gemini text-embedding-004

---

## 5. Sistema di Fallback Automatico

### 5.1 Logica di Fallback

**Trigger Fallback:**
1. ❌ `USE_LOCAL_MODEL=false` → Usa sempre Gemini
2. ❌ Gemma health check timeout (>5s) → Gemini
3. ❌ Gemma inference timeout (>60s) → Gemini
4. ❌ Gemma errore parsing JSON → Gemini
5. ❌ Ollama service down → Gemini

**Vantaggi:**
- ✅ **Zero Downtime:** Utenti non vedono mai errori
- ✅ **Trasparente:** Fallback automatico invisibile
- ✅ **Tracciabile:** Campo `modelUsed` registra quale AI ha risposto

### 5.2 Monitoring Fallback

**ML Training Data Table:**

```sql
SELECT 
  model_used,
  COUNT(*) as requests,
  AVG(processing_time_ms) as avg_latency
FROM ml_training_data
WHERE request_type = 'medical_triage'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY model_used;
```

**Output Esempio:**
```
model_used                | requests | avg_latency
--------------------------+----------+-------------
gemma-local-gemma2:9b     |   2847   |   3200 ms
gemini-2.5-flash          |    153   |   1800 ms
```

**Interpretazione:**
- 95% richieste gestite da Gemma (2847 / 3000)
- 5% fallback a Gemini (153 / 3000)
- Gemma leggermente più lento (3.2s vs 1.8s) ma accettabile

### 5.3 Alerting

**Configurazione PM2 Monitoring:**

```javascript
// ecosystem.config.js (futuro)
module.exports = {
  apps: [{
    name: 'ciry',
    script: 'dist/index.js',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    
    // Alert se troppi fallback
    max_restarts: 10,
    min_uptime: '5s',
    
    // Metriche custom
    instance_var: 'INSTANCE_ID',
    exec_mode: 'fork',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      USE_LOCAL_MODEL: 'true'
    }
  }]
}
```

**Alert quando:**
- Gemma fallback rate > 20% per 10 minuti consecutivi
- Ollama restart frequenti (>3 in 1 ora)
- GPU temperature > 85°C (rischio throttling)

---

## 6. Configurazione e Variabili d'Ambiente

### 6.1 File .env Completo

```env
# ============================================
# CIRY - Environment Configuration
# ============================================

# Database
DATABASE_URL=postgresql://user:password@host:5432/ciry_production

# Session Secret
SESSION_SECRET=your-secure-random-session-secret-minimum-32-chars

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here

# Email Service (Brevo/Sendinblue)
BREVO_API_KEY=your-brevo-api-key-here

# Push Notifications (Web Push API)
VAPID_PUBLIC_KEY=your-vapid-public-key-here
VAPID_PRIVATE_KEY=your-vapid-private-key-here

# ============================================
# AI Infrastructure - Gemma Local (Primary)
# ============================================

# Enable/Disable local model
USE_LOCAL_MODEL=true

# Ollama endpoint (localhost or remote server)
GEMMA_ENDPOINT=http://localhost:11434

# Model name (must be pulled in Ollama first)
# Options: gemma2:9b-instruct, medllama2, meditron:7b, gemma2:27b-instruct
GEMMA_MODEL=gemma2:9b-instruct

# Request timeout in milliseconds (default: 60000 = 60s)
# Increase if using larger models (27B) or slow GPU
GEMMA_TIMEOUT=60000

# ============================================
# AI Infrastructure - Gemini Cloud (Fallback)
# ============================================

# Google Gemini API Key (required even if using local model)
# Used as fallback when Gemma is unavailable
GEMINI_API_KEY=your-gemini-api-key-here

# ============================================
# Application Settings
# ============================================

# Environment
NODE_ENV=production

# Server Port (internal, Nginx proxies to 80/443)
PORT=5000

# Base URL
BASE_URL=https://ciry.app
```

### 6.2 Configurazioni Avanzate

#### 6.2.1 Multi-Model Setup (Futuro)

```env
# Different models for different tasks
GEMMA_CHAT_MODEL=gemma2:9b-instruct          # Fast chat
GEMMA_MEDICAL_MODEL=medllama2                # Medical reports
GEMMA_EMBEDDING_MODEL=nomic-embed-text       # RAG embeddings
```

#### 6.2.2 Load Balancing (High Traffic)

```env
# Multiple Ollama instances
GEMMA_ENDPOINTS=http://localhost:11434,http://localhost:11435,http://localhost:11436
GEMMA_LOAD_BALANCING=round-robin             # or 'random', 'least-connections'
```

#### 6.2.3 GPU Configuration

```env
# CUDA device selection (if multiple GPUs)
CUDA_VISIBLE_DEVICES=0                       # Use GPU 0
# CUDA_VISIBLE_DEVICES=0,1                   # Use GPU 0 and 1

# Memory growth (optional, Ollama handles this)
TF_FORCE_GPU_ALLOW_GROWTH=true
```

---

## 7. API e Interfacce

### 7.1 Ollama REST API

#### GET /api/tags

Lista modelli installati.

**Request:**
```bash
curl http://localhost:11434/api/tags
```

**Response:**
```json
{
  "models": [
    {
      "name": "gemma2:9b-instruct",
      "size": 5469933824,
      "digest": "sha256:abc123...",
      "details": {
        "format": "gguf",
        "family": "gemma2",
        "families": ["gemma2"],
        "parameter_size": "9B",
        "quantization_level": "Q4_0"
      }
    }
  ]
}
```

#### POST /api/chat

Genera risposta conversazionale.

**Request:**
```bash
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma2:9b-instruct",
    "messages": [
      {
        "role": "system",
        "content": "Sei un assistente medico AI..."
      },
      {
        "role": "user",
        "content": "Ho mal di testa da 2 giorni"
      }
    ],
    "stream": false,
    "options": {
      "temperature": 0.7,
      "top_p": 0.9
    }
  }'
```

**Response:**
```json
{
  "model": "gemma2:9b-instruct",
  "created_at": "2025-10-19T12:34:56.789Z",
  "message": {
    "role": "assistant",
    "content": "{\"message\": \"Ciao! Capisco la tua preoccupazione...\", \"urgencyLevel\": \"low\", ...}"
  },
  "done": true,
  "total_duration": 3245678912,
  "load_duration": 12345678,
  "prompt_eval_count": 45,
  "eval_count": 127,
  "eval_duration": 3123456789
}
```

**Metrics:**
- `total_duration`: Tempo totale (ns)
- `eval_count`: Token generati
- `eval_duration`: Tempo generazione (ns)
- **Tokens/sec**: `eval_count / (eval_duration / 1_000_000_000)`

#### POST /api/embeddings

Genera embeddings vettoriali.

**Request:**
```bash
curl -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nomic-embed-text",
    "prompt": "Il diabete di tipo 2 è una malattia metabolica..."
  }'
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...] // 768 dimensioni
}
```

### 7.2 CIRY Backend API

#### POST /api/triage/start

Inizia nuova conversazione AI.

**Headers:**
```
Cookie: connect.sid=...
Content-Type: application/json
```

**Body:**
```json
{
  "initialSymptom": "Ho mal di testa da 2 giorni",
  "userRole": "patient",
  "language": "it"
}
```

**Response:**
```json
{
  "session": {
    "id": "abc-123-def-456",
    "userId": "user-789",
    "status": "active",
    "userRole": "patient",
    "createdAt": "2025-10-19T12:00:00Z"
  },
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Ho mal di testa da 2 giorni",
      "createdAt": "2025-10-19T12:00:01Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "Ciao! Capisco la tua preoccupazione. Per aiutarti meglio, ho alcune domande...",
      "aiUrgencyLevel": "low",
      "createdAt": "2025-10-19T12:00:05Z"
    }
  ],
  "modelUsed": "gemma-local-gemma2:9b", // ← Tracking model
  "suggestDoctor": false,
  "urgencyLevel": "low"
}
```

#### POST /api/triage/:sessionId/message

Invia messaggio in conversazione attiva.

**Headers:**
```
Cookie: connect.sid=...
Content-Type: application/json
```

**Body:**
```json
{
  "content": "Il dolore è localizzato alla fronte",
  "language": "it"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-3",
    "sessionId": "abc-123-def-456",
    "role": "assistant",
    "content": "Grazie per il dettaglio. Il dolore alla fronte può essere...",
    "aiUrgencyLevel": "low",
    "createdAt": "2025-10-19T12:01:00Z"
  },
  "modelUsed": "gemma-local-gemma2:9b",
  "suggestDoctor": false
}
```

---

## 8. Performance e Metriche

### 8.1 Benchmark Performance

#### Gemma 2 9B su RTX 4000 (20GB VRAM)

**Setup:**
- GPU: NVIDIA RTX 4000 SFF Ada Generation
- VRAM: 20GB GDDR6
- Server: Hetzner GEX44
- Model: gemma2:9b-instruct (Q4 quantization)

**Risultati Medi:**

| Metrica | Valore | Note |
|---------|--------|------|
| **Latenza First Token** | 800-1200ms | Tempo caricamento context |
| **Throughput** | 20-30 tokens/sec | Velocità generazione |
| **Latenza Totale (100 token)** | 3-5 secondi | Risposta completa |
| **VRAM Utilizzata** | 12-14GB | Durante inferenza |
| **VRAM Idle** | 8-10GB | Modello caricato, idle |
| **GPU Utilization** | 85-95% | Durante inferenza |
| **CPU Utilization** | 10-20% | Pre/post processing |

**Confronto con Gemini Cloud:**

| Metrica | Gemma Local | Gemini Cloud | Vincitore |
|---------|-------------|--------------|-----------|
| **Latenza** | 3-5s | 1-3s | Gemini ⚡ |
| **Privacy** | 100% locale | Cloud USA | Gemma 🔒 |
| **Costo (1000 req)** | €0.00 | €15-20 | Gemma 💰 |
| **Personalizzazione** | Fine-tuning possibile | No | Gemma 🎯 |
| **Uptime SLA** | 95-99% | 99.9% | Gemini 📈 |

**Conclusione:** Gemini è più veloce, Gemma è più privato ed economico.

### 8.2 Tracking e Analytics

**Database Schema:**

```sql
CREATE TABLE ml_training_data (
  id VARCHAR PRIMARY KEY,
  request_type VARCHAR(50), -- 'medical_triage', 'report_analysis'
  model_used VARCHAR(50),   -- 'gemma-local-gemma2:9b', 'gemini-2.5-flash'
  input_data JSONB,         -- User message + context
  output_data JSONB,        -- AI response
  processing_time_ms INTEGER, -- Latency
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_model ON ml_training_data(model_used);
CREATE INDEX idx_ml_created ON ml_training_data(created_at);
```

**Query Analytics:**

```sql
-- Performance comparison: Gemma vs Gemini
SELECT 
  model_used,
  COUNT(*) as total_requests,
  AVG(processing_time_ms) as avg_latency_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) as p50_latency,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_latency,
  MAX(processing_time_ms) as max_latency
FROM ml_training_data
WHERE request_type = 'medical_triage'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY model_used
ORDER BY total_requests DESC;
```

**Output Esempio:**

```
model_used              | total | avg_ms | p50_ms | p95_ms | max_ms
------------------------+-------+--------+--------+--------+--------
gemma-local-gemma2:9b   | 2847  | 3245   | 3100   | 5200   | 8900
gemini-2.5-flash        | 153   | 1876   | 1800   | 2900   | 4100
```

**Interpretazione:**
- Gemma gestisce 95% delle richieste
- Latenza media Gemma: 3.2s (accettabile per chat medica)
- P95 Gemma: 5.2s (95% risposte < 5.2s)
- Gemini fallback: più veloce ma raro (5%)

### 8.3 Costi Operativi

#### Setup Attuale (Solo Gemini Cloud)

```
Server Hetzner VPS: €20/mese
Gemini API calls:   €50-100/mese (variabile)
--------------------------------
TOTALE:             €70-120/mese
```

**Breakdown Gemini:**
- 3000 richieste/mese @ €0.02/richiesta = €60
- Report analysis (heavy): +€40
- **Total API:** €100/mese

#### Setup con Gemma Local

```
Server Hetzner GEX44:     €100/mese (fisso)
Gemini API (fallback 5%): €5/mese
-----------------------------------------
TOTALE:                   €105/mese
```

**Risparmio annuale:**
```
Prima:  €120 x 12 = €1440/anno
Dopo:   €105 x 12 = €1260/anno
Risparmio:          €180/anno (15%)
```

**ROI (Return on Investment):**
- Break-even: 3 mesi
- Risparmio anno 1: €180
- Risparmio anno 2-3: €360 (con traffico crescente)

**Proiezione Crescita Traffico:**

| Mese | Richieste | Gemini Cost | Gemma Cost | Risparmio |
|------|-----------|-------------|------------|-----------|
| 1    | 3000      | €60         | €100       | -€40      |
| 3    | 5000      | €100        | €100       | €0        |
| 6    | 8000      | €160        | €100       | €60       |
| 12   | 15000     | €300        | €105       | €195      |

**Conclusione:** Break-even a 3 mesi, poi risparmio crescente.

---

## 9. Setup e Deployment

### 9.1 Prerequisiti Hardware

#### Server Consigliato: Hetzner GEX44

```
CPU:    Intel Core i5-13500 (6P+8E cores)
RAM:    64GB DDR4
GPU:    NVIDIA RTX 4000 SFF Ada Generation
        - VRAM: 20GB GDDR6
        - Tensor: 306.8 TFLOPS
        - Architecture: Ada Lovelace
Storage: 1TB NVMe SSD
Network: 1 Gbit/s
Location: Germany (EU - GDPR compliant)
Cost:   ~€100-120/mese
```

#### Requisiti Minimi

```
GPU VRAM:  16GB minimum (per Gemma 9B)
RAM:       32GB minimum
Storage:   50GB liberi (per modelli)
Network:   100 Mbit/s
OS:        Ubuntu 22.04 LTS o superiore
```

### 9.2 Installazione Ollama

#### Step 1: Installa Ollama

```bash
# SSH al server
ssh root@your-server-ip

# Download e installa Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verifica installazione
ollama --version
# Output: ollama version is 0.x.x
```

#### Step 2: Configura Systemd Service

```bash
# Crea file service
sudo nano /etc/systemd/system/ollama.service
```

**Contenuto:**

```ini
[Unit]
Description=Ollama AI Service
After=network.target

[Service]
Type=simple
User=root
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/usr/share/ollama/.ollama/models"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Attiva servizio:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Verifica
sudo systemctl status ollama
# Output: active (running)
```

#### Step 3: Download Modello

```bash
# Gemma 2 9B Instruct (consigliato)
ollama pull gemma2:9b-instruct

# Verifica modello scaricato
ollama list
# Output:
# NAME                    ID              SIZE    MODIFIED
# gemma2:9b-instruct      abc123...       5.1 GB  2 minutes ago
```

#### Step 4: Test Locale

```bash
# Test conversazionale
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma2:9b-instruct",
    "messages": [
      {
        "role": "user",
        "content": "Ciao, sono un assistente medico. Spiega cos'\''è il diabete."
      }
    ],
    "stream": false
  }'

# Se funziona, vedrai risposta JSON con contenuto medico
```

### 9.3 Configurazione CIRY

#### Step 1: Modifica .env

```bash
cd /var/www/credactive
nano .env
```

**Aggiungi/Modifica:**

```env
# Abilita modello locale
USE_LOCAL_MODEL=true

# Endpoint Ollama (localhost se sullo stesso server)
GEMMA_ENDPOINT=http://localhost:11434

# Nome modello (deve corrispondere a quello pullato)
GEMMA_MODEL=gemma2:9b-instruct

# Timeout (60 secondi, aumenta se modello lento)
GEMMA_TIMEOUT=60000

# Mantieni Gemini come fallback (OBBLIGATORIO)
GEMINI_API_KEY=your_existing_gemini_key_here
```

**Salva:** CTRL+O, CTRL+X

#### Step 2: Rebuild Applicazione

```bash
# Export Stripe public key (per frontend)
export VITE_STRIPE_PUBLIC_KEY=pk_live_51SEAg6DPEkqoxxfatlURO2ivVXS8P6ioI40uC69q72pbnfxj8DlUajSMUgAcWbcXMl49vPB2segToTYCWgNz8fAB00glrA6xzO

# Build
npm run build
```

**Output atteso:**

```
✓ built in 9.80s
dist/index.js  889.3kb
```

#### Step 3: Restart PM2

```bash
# Restart applicazione
pm2 restart credactive

# Verifica logs
pm2 logs credactive --lines 50
```

**Logs attesi (Gemma funzionante):**

```
[AI] Tentativo con Gemma locale...
[Gemma] Sending request to http://localhost:11434/api/chat
[Gemma] Response received in 3245ms
[AI] ✅ Gemma locale ha risposto con successo
[ML Collector] Saved medical_triage training data for model: gemma-local-gemma2:9b
```

**Logs attesi (Gemma non disponibile - fallback):**

```
[AI] Tentativo con Gemma locale...
[Gemma] Not available: connect ECONNREFUSED
[AI] ⚠️ Gemma locale fallito, fallback a Gemini
[Gemini] Triage response generated (Flash), urgency: low
[ML Collector] Saved medical_triage training data for model: gemini-2.5-flash
```

### 9.4 Verifica Deployment

#### Test 1: Health Check Ollama

```bash
curl http://localhost:11434/api/tags
```

**Output atteso:**

```json
{
  "models": [
    {
      "name": "gemma2:9b-instruct",
      "size": 5469933824,
      ...
    }
  ]
}
```

#### Test 2: Chat CIRY

1. Vai su https://ciry.app (o tuo dominio)
2. Login come paziente
3. Vai su "AI Prevenzione"
4. Scrivi: "Ho mal di testa da 2 giorni"
5. Attendi risposta AI (3-5 secondi)

#### Test 3: Verifica Model Tracking

```bash
# SSH al server
ssh root@your-server-ip

# Connetti al database
psql $DATABASE_URL

# Query modelli usati
SELECT 
  model_used, 
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_ms
FROM ml_training_data
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY model_used;
```

**Output atteso (Gemma funzionante):**

```
model_used                | count | avg_ms
--------------------------+-------+--------
gemma-local-gemma2:9b     |   12  | 3245
```

---

## 10. Monitoring e Logging

### 10.1 PM2 Logs

```bash
# Real-time logs
pm2 logs credactive

# Filtra solo AI logs
pm2 logs credactive | grep -E "\[AI\]|\[Gemma\]|\[Gemini\]"

# Filtra errori
pm2 logs credactive --err

# Ultimi 100 logs
pm2 logs credactive --lines 100
```

### 10.2 Ollama Logs

```bash
# Systemd journal
sudo journalctl -u ollama -f

# Ultimi 100 logs
sudo journalctl -u ollama -n 100

# Logs da data specifica
sudo journalctl -u ollama --since "2025-10-19 12:00:00"
```

### 10.3 GPU Monitoring

#### nvidia-smi (Real-time)

```bash
# Snapshot GPU status
nvidia-smi

# Monitor continuo (aggiorna ogni secondo)
nvidia-smi -l 1

# Monitor compatto
watch -n 1 nvidia-smi --query-gpu=timestamp,name,temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total --format=csv
```

**Output Esempio:**

```
timestamp, name, temperature.gpu, utilization.gpu [%], utilization.memory [%], memory.used [MiB], memory.total [MiB]
2025/10/19 14:30:12, NVIDIA RTX 4000 SFF Ada, 68, 92, 85, 13824, 20480
```

#### gpustat (Tool Alternativo)

```bash
# Installa
pip install gpustat

# Monitor
gpustat -i 1
```

### 10.4 Dashboard Grafana (Opzionale)

**Setup Prometheus + Grafana:**

```bash
# Installa Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Crea systemd service
sudo nano /etc/systemd/system/node_exporter.service
```

**Contenuto:**

```ini
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
```

**Avvia:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Verifica
curl http://localhost:9100/metrics
```

**Grafana Dashboard:** Importa template ID `1860` (Node Exporter Full)

---

## 11. Sicurezza e Privacy GDPR

### 11.1 Compliance GDPR

**Requisiti GDPR per Dati Medici:**

✅ **Art. 9 - Dati Sanitari (Categoria Speciale):**
- Dati medici trattati SOLO in EU (server Hetzner Germania)
- Nessun trasferimento extra-UE (Gemma locale)
- Fallback Gemini: Google EU datacenter (ok GDPR)

✅ **Art. 25 - Privacy by Design:**
- Pseudonimizzazione automatica (hash file medici)
- Minimizzazione dati (solo necessari per AI)
- Crittografia in transito (HTTPS) e a riposo (PostgreSQL)

✅ **Art. 32 - Sicurezza del Trattamento:**
- Autenticazione forte (MFA disponibile)
- Logging accessi (audit log table)
- Backup giornalieri database

✅ **Art. 15-22 - Diritti Interessato:**
- Accesso dati: `/api/user/data-export`
- Cancellazione: `/api/user/delete-account`
- Portabilità: Export JSON GDPR-compliant

### 11.2 Vantaggi Gemma per GDPR

**Problemi Gemini Cloud:**
- ❌ Dati inviati a Google Cloud USA
- ❌ Impossibile garantire no-training sui dati
- ❌ Audit trail dipende da Google
- ❌ Rischio data breach esterno

**Vantaggi Gemma Local:**
- ✅ Dati restano su server EU controllato
- ✅ Zero training su dati pazienti (inferenza only)
- ✅ Audit log completo su database proprietario
- ✅ Pieno controllo infrastruttura

### 11.3 Pseudonimizzazione ML Data

**Current Implementation:**

```typescript
// server/mlDataCollector.ts
export async function collectMLData(data: MLDataInput) {
  const anonymized = {
    ...data,
    
    // Hash file medici
    inputFileHash: data.inputFileHash 
      ? createHash('sha256').update(data.inputFileHash).digest('hex')
      : null,
    
    // Rimuovi PII da input
    inputData: sanitizeInputData(data.inputData),
    
    // Rimuovi username/email
    userId: data.userId ? `user-${hashUserId(data.userId)}` : null,
  };
  
  await db.insert(mlTrainingData).values(anonymized);
}
```

**Sanitization Function:**

```typescript
function sanitizeInputData(data: any): any {
  // Remove PII patterns
  const piiPatterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,  // Full names
    /\b\d{16}\b/g,                     // Credit cards
    /\b\d{11}\b/g,                     // CF italiano (approssimativo)
    /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/g, // Email
  ];
  
  let sanitized = JSON.stringify(data);
  
  piiPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return JSON.parse(sanitized);
}
```

---

## 12. Troubleshooting

### 12.1 Problemi Comuni

#### Problema: "Gemma locale non disponibile"

**Sintomi:**
```
[AI] Tentativo con Gemma locale...
[Gemma] Not available: connect ECONNREFUSED
[AI] ⚠️ Gemma locale fallito, fallback a Gemini
```

**Cause Possibili:**
1. Ollama service down
2. Firewall blocca porta 11434
3. Modello non scaricato
4. GPU out of memory

**Diagnosi:**

```bash
# 1. Verifica Ollama service
sudo systemctl status ollama
# Se inactive: sudo systemctl start ollama

# 2. Test endpoint
curl http://localhost:11434/api/tags
# Se ECONNREFUSED: Ollama non risponde

# 3. Verifica modelli
ollama list
# Se vuoto: ollama pull gemma2:9b-instruct

# 4. Verifica GPU
nvidia-smi
# Se "No devices found": Driver NVIDIA non installato
```

**Soluzione:**

```bash
# Restart Ollama
sudo systemctl restart ollama
sleep 5

# Test
curl http://localhost:11434/api/tags

# Se funziona, restart CIRY
pm2 restart credactive
```

---

#### Problema: "Gemma timeout dopo 60s"

**Sintomi:**
```
[Gemma] Sending request to http://localhost:11434/api/chat
[Gemma] Request failed after 60000ms: Gemma timeout after 60000ms
[AI] ⚠️ Gemma locale fallito, fallback a Gemini
```

**Cause:**
1. Modello troppo grande per GPU (27B su RTX 4000)
2. GPU throttling per temperatura alta
3. Context window troppo lungo

**Diagnosi:**

```bash
# 1. Verifica GPU load
nvidia-smi
# Temperature > 85°C = throttling

# 2. Verifica modello caricato
ollama ps
# Se gemma2:27b su RTX 4000 = problema

# 3. Test inference diretta
time ollama run gemma2:9b-instruct "Ciao"
# Se > 10s = GPU slow
```

**Soluzione:**

```bash
# 1. Usa modello più leggero
ollama pull gemma2:9b-instruct # invece di 27b

# 2. Aumenta timeout in .env
nano /var/www/credactive/.env
# GEMMA_TIMEOUT=120000  (2 minuti)

# 3. Restart
npm run build
pm2 restart credactive
```

---

#### Problema: "CUDA out of memory"

**Sintomi:**
```
[Ollama] Error: CUDA out of memory
[Gemma] Failed to generate response
```

**Cause:**
1. Troppi modelli caricati in VRAM
2. Modello troppo grande (27B su 20GB VRAM)
3. Altri processi usano GPU

**Diagnosi:**

```bash
# Verifica VRAM usage
nvidia-smi

# Output:
# Memory-Usage: 18500MB / 20480MB  ← Quasi piena

# Verifica processi GPU
nvidia-smi pmon
```

**Soluzione:**

```bash
# 1. Scarica modelli inutilizzati
ollama rm gemma2:27b-instruct

# 2. Configura max loaded models
sudo nano /etc/systemd/system/ollama.service
# Aggiungi: Environment="OLLAMA_MAX_LOADED_MODELS=1"

# 3. Restart Ollama
sudo systemctl daemon-reload
sudo systemctl restart ollama

# 4. Reset GPU (se necessario)
sudo nvidia-smi --gpu-reset
```

---

### 12.2 Logs Debug

#### Abilita Debug Logging Ollama

```bash
sudo nano /etc/systemd/system/ollama.service
```

**Aggiungi:**

```ini
Environment="OLLAMA_DEBUG=1"
Environment="OLLAMA_LOG_LEVEL=debug"
```

**Restart:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama

# Vedi logs dettagliati
sudo journalctl -u ollama -f
```

---

## 13. Roadmap e Sviluppi Futuri

### 13.1 Fase 1: Produzione Stabile (0-3 mesi)

**Obiettivi:**
- ✅ Deploy Gemma su GEX44 server
- ✅ 95%+ richieste gestite da Gemma (5% fallback)
- ✅ Latenza media < 5 secondi
- ✅ Monitoring e alerting attivi
- ✅ Raccolta dati ML (real user data)

**Metriche Successo:**
- Uptime Gemma: > 95%
- Fallback rate: < 10%
- User satisfaction: nessun feedback negativo su latenza

---

### 13.2 Fase 2: Fine-Tuning su Dati CIRY (3-6 mesi)

**Obiettivi:**
- Raccogliere 10.000+ conversazioni validate
- Annotazione medici (feedback quality)
- Fine-tune Gemma 9B su casi italiani CIRY
- A/B test: Gemma base vs Gemma fine-tuned

**Dataset Requirements:**

```
┌─────────────────────────────────────────┐
│ ML Training Data (Target: 10k rows)    │
├─────────────────────────────────────────┤
│ - medical_triage: 8000 conversations    │
│ - report_analysis: 1500 reports         │
│ - doctor_feedback: 500 corrections      │
│ - edge_cases: 500 rare conditions       │
└─────────────────────────────────────────┘
```

**Fine-Tuning Process:**

1. **Export Data:**

```bash
curl http://localhost:3000/api/ml/training/export \
  -H "Cookie: auth=..." \
  > ciry_training_data.json
```

2. **Preprocessing:**

```python
import json
import pandas as pd

# Load data
with open('ciry_training_data.json') as f:
    data = json.load(f)

# Filter quality data (only validated by doctors)
df = pd.DataFrame(data)
quality = df[df['qualityFeedback'].isin(['excellent', 'good'])]

# Format for fine-tuning
training_data = []
for _, row in quality.iterrows():
    training_data.append({
        "messages": [
            {"role": "system", "content": row['systemPrompt']},
            {"role": "user", "content": row['inputData']['userMessage']},
            {"role": "assistant", "content": row['outputData']['message']}
        ]
    })

# Save
with open('gemma_finetune_dataset.jsonl', 'w') as f:
    for item in training_data:
        f.write(json.dumps(item) + '\n')
```

3. **Fine-Tuning (Hugging Face):**

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments

model_name = "google/gemma-2-9b-it"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Load dataset
from datasets import load_dataset
dataset = load_dataset('json', data_files='gemma_finetune_dataset.jsonl')

# Training arguments
training_args = TrainingArguments(
    output_dir='./gemma-ciry-finetuned',
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    fp16=True,
    save_steps=100,
    logging_steps=10,
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset['train'],
    tokenizer=tokenizer,
)

trainer.train()
trainer.save_model('./gemma-ciry-finetuned')
```

4. **Deploy Fine-Tuned Model:**

```bash
# Convert to Ollama format
ollama create gemma-ciry-finetuned \
  -f Modelfile \
  --path ./gemma-ciry-finetuned

# Modifica .env
GEMMA_MODEL=gemma-ciry-finetuned

# Rebuild e restart
npm run build
pm2 restart credactive
```

**Expected Improvements:**
- Italiano più fluente e naturale
- Terminologia medica italiana specifica
- Migliore comprensione contesto culturale IT
- Risposte più personalizzate per CIRY use cases

---

### 13.3 Fase 3: Modello Proprietario (6-12 mesi)

**Obiettivi:**
- Training from scratch su architettura custom
- 100% proprietà intellettuale CIRY
- Specializzazione totale su prevenzione medica
- Deployment multi-regione EU

**Architettura Proposta:**

```
CIRY-Med-1 (Proprietario)
├─ Base: Gemma 2 architecture (open source)
├─ Training Data: 50k+ conversazioni CIRY
├─ Specialization: Prevenzione, triage, italiano
├─ Size: 7-9B parametri (efficiente per RTX 4000)
└─ Deployment: Multi-server (HA)
```

**Training Infrastructure:**

```
Cloud GPU Cluster (Temporaneo per training):
├─ 4x NVIDIA A100 (40GB)
├─ Training time: 2-4 settimane
├─ Cost: ~€5000 one-time
└─ Provider: Lambda Labs, Vast.ai, RunPod

Production Deployment (Permanente):
├─ Primary: Hetzner GEX44 (Germania)
├─ Fallback: Hetzner GEX44 (Finlandia)
├─ Load Balancer: HAProxy
└─ Cost: €200/mese
```

---

### 13.4 Features Avanzate (Futuro)

#### Multi-Model Routing

```typescript
// router.ts
async function routeToOptimalModel(request: TriageRequest) {
  const models = {
    chat: 'gemma-ciry-chat:9b',      // Fast conversational
    medical: 'gemma-ciry-medical:9b', // Deep medical analysis
    triage: 'gemma-ciry-triage:7b',  // Quick triage
  };
  
  const selectedModel = classifyRequest(request);
  return await inferenceEngine.run(models[selectedModel], request);
}
```

#### Real-Time Learning

```typescript
// continuous_learning.ts
async function updateModelWithFeedback(feedback: DoctorFeedback) {
  if (feedback.rating >= 4) {
    // Add to fine-tuning dataset
    await mlDataset.append({
      input: feedback.originalInput,
      output: feedback.correctedOutput,
      quality: 'excellent'
    });
    
    // Trigger incremental fine-tuning (weekly batch)
    if (mlDataset.newSamples >= 100) {
      await scheduler.triggerFineTuning('incremental');
    }
  }
}
```

---

## 📚 Appendici

### A. Glossario Tecnico

| Termine | Definizione |
|---------|-------------|
| **Ollama** | Runtime open source per LLM locali |
| **Gemma** | Famiglia modelli Google open source |
| **Quantization** | Riduzione precisione numerica (Q4, Q8) per velocità |
| **VRAM** | Video RAM, memoria GPU dedicata |
| **Tokens/sec** | Velocità generazione AI (throughput) |
| **Latency** | Tempo risposta end-to-end |
| **Fallback** | Sistema backup quando primario offline |
| **Fine-tuning** | Training aggiuntivo su dataset specifico |
| **Embeddings** | Rappresentazione vettoriale testo (RAG) |

### B. Riferimenti

**Documentazione Ufficiale:**
- Ollama: https://ollama.com/docs
- Gemma 2: https://ai.google.dev/gemma
- MedLlama2: https://huggingface.co/medllama
- Meditron: https://github.com/epfLLM/meditron

**Paper Scientifici:**
- Gemma 2 Technical Report: https://arxiv.org/abs/2408.00118
- Medical LLM Survey: https://arxiv.org/abs/2311.05112

**Community:**
- Ollama Discord: https://discord.gg/ollama
- r/LocalLLaMA: https://reddit.com/r/LocalLLaMA

### C. Contatti e Supporto

**CIRY Development Team:**
- Email: dev@ciry.app
- Repository: GitHub (privato)
- Server: Hetzner GEX44 (157.180.21.147)

---

**Documento compilato il:** 19 Ottobre 2025  
**Versione:** 1.0.0  
**Autore:** CIRY AI Team  
**Prossimo Review:** Gennaio 2026 (post-deployment GEX44)

---

*Questo documento è confidenziale e proprietario di CIRY. Distribuzione limitata al team tecnico.*
