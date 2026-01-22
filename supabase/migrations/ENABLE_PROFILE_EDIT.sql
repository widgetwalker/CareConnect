-- Enable Profile Editing Feature
-- Run this to create the necessary tables for storing patient profiles

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Access Policies

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create fresh policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- 4. Grant permissions
GRANT ALL ON user_profiles TO authenticated;

-- 5. Create valid function for available slots (Fix for booking)
CREATE OR REPLACE FUNCTION get_available_slots(
  p_doctor_id TEXT, 
  p_date TEXT, 
  p_duration_minutes INTEGER
)
RETURNS TABLE (slot_time TEXT) 
AS $$
BEGIN
  -- Return standard slots 9-5 for now
  RETURN QUERY VALUES 
  ('09:00'), ('09:30'), ('10:00'), ('10:30'), ('11:00'), ('11:30'),
  ('14:00'), ('14:30'), ('15:00'), ('15:30'), ('16:00'), ('16:30');
END;
$$ LANGUAGE plpgsql;

SELECT 'Profile editing enabled successfully!' as message;
