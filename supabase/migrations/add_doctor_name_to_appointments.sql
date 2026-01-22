-- Migration: Add doctor_name column to appointments table
-- This ensures doctor names are preserved after booking

-- Add doctor_name column to appointments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'doctor_name'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN doctor_name TEXT;
    
    RAISE NOTICE 'Added doctor_name column to appointments table';
  ELSE
    RAISE NOTICE 'doctor_name column already exists in appointments table';
  END IF;
END $$;

-- Update existing appointments with doctor names from doctor_profiles and doctors tables
-- This will fix any appointments that were created before this migration
UPDATE appointments a
SET doctor_name = COALESCE(
  -- Try to get name from doctor_profiles first
  (SELECT u.name 
   FROM doctor_profiles dp 
   JOIN "user" u ON u.id = dp.user_id 
   WHERE dp.id = a.doctor_id OR dp.doctor_id = a.doctor_id 
   LIMIT 1),
  -- Fallback to doctors table with user_profiles
  (SELECT up.full_name 
   FROM doctors d 
   LEFT JOIN user_profiles up ON up.id = d.id 
   WHERE d.id = a.doctor_id 
   LIMIT 1),
  -- Last fallback: truncated doctor ID
  'Doctor ' || SUBSTRING(a.doctor_id, 1, 8)
)
WHERE doctor_name IS NULL;

RAISE NOTICE 'Migration completed: doctor_name column added and existing appointments updated';
