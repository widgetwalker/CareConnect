-- CareConnect Doctor Portal Database Migration - CLEAN VERSION
-- This version handles existing objects gracefully

-- 1. Add role column to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient';

-- 2. Create doctor_profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  speciality TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  experience TEXT NOT NULL,
  fee INTEGER NOT NULL,
  qualifications TEXT,
  available_from TEXT,
  available_to TEXT,
  rating TEXT DEFAULT '4.5',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  diagnosis TEXT,
  medicines TEXT NOT NULL,
  instructions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_doctor_id ON doctor_profiles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 7. Enable Row Level Security
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies and recreate for doctor_profiles
DROP POLICY IF EXISTS "Users can view their own doctor profile" ON doctor_profiles;
DROP POLICY IF EXISTS "Users can insert their own doctor profile" ON doctor_profiles;
DROP POLICY IF EXISTS "Users can update their own doctor profile" ON doctor_profiles;
DROP POLICY IF EXISTS "Anyone can view verified doctor profiles" ON doctor_profiles;

CREATE POLICY "Users can view their own doctor profile"
  ON doctor_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own doctor profile"
  ON doctor_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own doctor profile"
  ON doctor_profiles FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can view verified doctor profiles"
  ON doctor_profiles FOR SELECT
  USING (is_verified = true);

-- 9. Drop existing policies and recreate for prescriptions
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can view their own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Patients can view their own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can update their own prescriptions" ON prescriptions;

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (auth.uid()::text = doctor_id);

CREATE POLICY "Doctors can view their own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid()::text = doctor_id);

CREATE POLICY "Patients can view their own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid()::text = patient_id);

CREATE POLICY "Doctors can update their own prescriptions"
  ON prescriptions FOR UPDATE
  USING (auth.uid()::text = doctor_id);

-- 10. Drop existing policies and recreate for medical_records
DROP POLICY IF EXISTS "Patients can manage their own medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can view all medical records" ON medical_records;

CREATE POLICY "Patients can manage their own medical records"
  ON medical_records FOR ALL
  USING (auth.uid()::text = patient_id);

CREATE POLICY "Doctors can view all medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "user"
    WHERE id::text = auth.uid()::text
    AND role = 'doctor'
  ));

-- 11. Drop existing policies and recreate for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications for users" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "System can create notifications for users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 12. Create storage bucket for medical records (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Drop and recreate storage policies for medical records
DROP POLICY IF EXISTS "Users can upload their own medical records" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own medical records" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view all medical records" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own medical records" ON storage.objects;

CREATE POLICY "Users can upload their own medical records"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-records' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own medical records"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-records' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can view all medical records"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-records'
  AND EXISTS (
    SELECT 1 FROM "user"
    WHERE id::text = auth.uid()::text
    AND role = 'doctor'
  )
);

CREATE POLICY "Users can delete their own medical records"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-records' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 14. Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 15. Drop and recreate triggers for updated_at
DROP TRIGGER IF EXISTS update_doctor_profiles_updated_at ON doctor_profiles;
CREATE TRIGGER update_doctor_profiles_updated_at
    BEFORE UPDATE ON doctor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration completed successfully!
-- Tables, policies, and storage bucket are ready
