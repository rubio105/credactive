-- Fix script per database produzione
-- Aggiungi la colonna mancante is_prohmed_doctor

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_prohmed_doctor BOOLEAN DEFAULT false;

-- Verifica che la colonna sia stata creata
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_prohmed_doctor';
