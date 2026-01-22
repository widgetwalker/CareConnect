-- Fix for Doctors Unable to View Patient Medical Records
-- This migration updates RLS policies to properly allow doctor access

-- 1. First, ensure the role column exists in the user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient';

-- 2. Update the role for all users who have doctor profiles
UPDATE "user" u
SET role = 'doctor'
FROM doctor_profiles dp
WHERE u.id = dp.user_id
AND u.role != 'doctor';

-- 3. Drop and recreate RLS policies for medical_records

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can manage their own medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can view all medical records" ON medical_records;
DROP POLICY IF EXISTS "Patients can insert medical records" ON medical_records;
DROP POLICY IF EXISTS "Patients can update medical records" ON medical_records;
DROP POLICY IF EXISTS "Patients can delete medical records" ON medical_records;

-- Policy: Patients can insert their own medical records
CREATE POLICY "Patients can insert medical records"
  ON medical_records FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if the patient_id matches a user record with the same email as the authenticated user
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = patient_id
      AND (
        id::text = auth.uid()::text  -- Same user ID
        OR
        email = (SELECT email FROM auth.users WHERE id = auth.uid())  -- Same email
      )
    )
  );

-- Policy: Patients can view their own medical records
CREATE POLICY "Patients can view their own medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (
    -- Allow if patient_id matches auth user or has same email
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = patient_id
      AND (
        id::text = auth.uid()::text
        OR
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Policy: Patients can update their own medical records  
CREATE POLICY "Patients can update medical records"
  ON medical_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = patient_id
      AND (
        id::text = auth.uid()::text
        OR
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Policy: Patients can delete their own medical records
CREATE POLICY "Patients can delete medical records"
  ON medical_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id = patient_id
      AND (
        id::text = auth.uid()::text
        OR
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Policy: Doctors can view all medical records
CREATE POLICY "Doctors can view all medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (
    -- Allow if user has role='doctor' in user table
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id::text = auth.uid()::text
      AND role = 'doctor'
    )
    OR
    -- OR if user has a doctor_profiles entry
    EXISTS (
      SELECT 1 FROM doctor_profiles
      WHERE user_id::text = auth.uid()::text
    )
  );

-- 4. Also update storage policies to allow doctors to view medical record files
DROP POLICY IF EXISTS "Doctors can view all medical records" ON storage.objects;

CREATE POLICY "Doctors can view all medical records"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-records'
  AND (
    -- Allow if user has role='doctor' in user table
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id::text = auth.uid()::text
      AND role = 'doctor'
    )
    OR
    -- OR if user has a doctor_profiles entry
    EXISTS (
      SELECT 1 FROM doctor_profiles
      WHERE user_id::text = auth.uid()::text
    )
  )
);

-- 5. Create a function to automatically set role when doctor_profile is created
CREATE OR REPLACE FUNCTION set_doctor_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's role to 'doctor' when a doctor_profile is created
  UPDATE "user"
  SET role = 'doctor'
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to auto-set role on doctor_profile insert
DROP TRIGGER IF EXISTS auto_set_doctor_role ON doctor_profiles;

CREATE TRIGGER auto_set_doctor_role
AFTER INSERT ON doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION set_doctor_role();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Medical Records Access Fix Applied Successfully!';
  RAISE NOTICE 'Doctors can now view patient medical records';
END $$;
