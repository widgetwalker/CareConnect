-- Migration: Add missing columns to appointments table
-- This fixes the "consultation_type column not found" error when booking appointments

-- Add consultation_type column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'video';

-- Add symptoms column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS symptoms TEXT;

-- Add specialty column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Add doctor_name column (from previous fix)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Add slot_start column (start time of appointment)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS slot_start TIMESTAMPTZ;

-- Add slot_end column (end time of appointment)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS slot_end TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_slot_start ON appointments(slot_start);
CREATE INDEX IF NOT EXISTS idx_appointments_consultation_type ON appointments(consultation_type);
CREATE INDEX IF NOT EXISTS idx_appointments_specialty ON appointments(specialty);

-- Update existing appointments to have slot times based on their date
UPDATE appointments
SET 
  slot_start = date,
  slot_end = date + INTERVAL '30 minutes',
  consultation_type = COALESCE(consultation_type, 'video')
WHERE slot_start IS NULL;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Appointments table updated successfully!';
  RAISE NOTICE 'Added columns: consultation_type, symptoms, specialty, doctor_name, slot_start, slot_end';
END $$;
