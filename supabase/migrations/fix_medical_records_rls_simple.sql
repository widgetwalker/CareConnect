-- Quick Fix: Update Medical Records RLS Policies
-- Run this to fix the upload issue

-- 1. Drop ALL existing policies on medical_records
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'medical_records') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON medical_records', r.policyname);
    END LOOP;
END $$;

-- 2. Ensure role column exists
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient';

-- 3. Create new comprehensive policies

-- Policy: Patients can insert their own medical records
CREATE POLICY "Patients can insert medical records"
  ON medical_records FOR INSERT
  TO authenticated
  WITH CHECK (
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

-- Policy: Patients can view their own medical records
CREATE POLICY "Patients can view their own medical records"
  ON medical_records FOR SELECT
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

-- Policy: Patients can update their own medical records  
CREATE POLICY "Patients can update their own medical records"
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
CREATE POLICY "Patients can delete their own medical records"
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
    EXISTS (
      SELECT 1 FROM "user"
      WHERE id::text = auth.uid()::text
      AND role = 'doctor'
    )
    OR
    EXISTS (
      SELECT 1 FROM doctor_profiles
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Log completion
SELECT 'Medical Records RLS Policies Updated Successfully!' as message;
