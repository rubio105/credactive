-- Migration: Add patient_context and patient_session_id to appointments table
-- Date: 2025-11-15
-- Description: Adds patient context (demographics, onboarding, AI motivation) 
--              and session tracking to appointments

-- Add patient_context column (JSONB for structured patient data)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS patient_context JSONB;

-- Add patient_session_id column (UUID to link to triage session)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS patient_session_id UUID;

-- Add comment to document the column purpose
COMMENT ON COLUMN appointments.patient_context IS 'Structured JSON with patient demographics, onboarding data, and AI conversation motivation';
COMMENT ON COLUMN appointments.patient_session_id IS 'Links to the triage session that triggered this appointment booking';
