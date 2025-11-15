# Migration: Fix "patient_context does not exist" Error

## Problema
Il database di produzione non ha la colonna `patient_context` nella tabella `appointments`, causando errori 500 quando i pazienti:
- Visualizzano i loro appuntamenti (`GET /api/appointments`)
- Prenotano una teleconsulto (`POST /api/appointments/book-teleconsult`)

## Soluzione
Applicare la migration SQL per aggiungere le colonne mancanti.

## Come Applicare la Migration in Produzione

### Opzione 1: Via psql (Consigliato)
```bash
# Connetti al database Neon di produzione
psql "postgresql://neondb_owner:xxxxx@ep-xxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Copia e incolla il contenuto del file migrations/add_patient_context_to_appointments.sql
# Oppure esegui direttamente:
\i migrations/add_patient_context_to_appointments.sql
```

### Opzione 2: Via Neon Dashboard
1. Vai su https://console.neon.tech
2. Seleziona il tuo progetto
3. Vai su SQL Editor
4. Copia e incolla questo SQL:

```sql
-- Add patient_context column (JSONB for structured patient data)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS patient_context JSONB;

-- Add patient_session_id column (UUID to link to triage session)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS patient_session_id UUID;

-- Add comments
COMMENT ON COLUMN appointments.patient_context IS 'Structured JSON with patient demographics, onboarding data, and AI conversation motivation';
COMMENT ON COLUMN appointments.patient_session_id IS 'Links to the triage session that triggered this appointment booking';
```

5. Clicca "Run"

### Opzione 3: Via Drizzle Kit Push (Più Sicuro)
```bash
# In locale, genera la migration
npm run db:push

# Questo comando:
# 1. Confronta lo schema locale con il DB di produzione
# 2. Mostra le differenze
# 3. Chiede conferma prima di applicare
```

## Verifica Post-Migration
Dopo aver applicato la migration, verifica che funzioni:

```sql
-- Verifica che le colonne esistano
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('patient_context', 'patient_session_id');

-- Dovrebbe restituire:
-- patient_context    | jsonb
-- patient_session_id | uuid
```

## Rollback (Se Necessario)
Se qualcosa va storto, puoi rimuovere le colonne:

```sql
ALTER TABLE appointments DROP COLUMN IF EXISTS patient_context;
ALTER TABLE appointments DROP COLUMN IF EXISTS patient_session_id;
```

## Note
- Le colonne sono `NULLABLE` per default, quindi gli appuntamenti esistenti non sono influenzati
- Solo i nuovi appuntamenti prenotati avranno `patient_context` popolato
- Non serve restart di PM2 dopo la migration, il codice funzionerà immediatamente
