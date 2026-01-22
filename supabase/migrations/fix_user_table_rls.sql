-- Fix RLS for "user" table to allow Upload/Read

-- 1. Enable RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

-- 2. Allow SELECT for authenticated users (to check if they exist)
DROP POLICY IF EXISTS "Allow select for authenticated" ON "user";
CREATE POLICY "Allow select for authenticated"
ON "user" FOR SELECT
TO authenticated
USING (true); -- Allow reading all users (simpler for now, needed for doctor views too)

-- 3. Allow INSERT for authenticated users (to create their own profile)
DROP POLICY IF EXISTS "Allow insert for authenticated" ON "user";
CREATE POLICY "Allow insert for authenticated"
ON "user" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Allow UPDATE for authenticated users (own profile)
DROP POLICY IF EXISTS "Allow update for own profile" ON "user";
CREATE POLICY "Allow update for own profile"
ON "user" FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. Fix permissions for 'medical_records' just in case
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own medical records" ON medical_records;
CREATE POLICY "Users can insert their own medical records"
ON medical_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can view their own medical records" ON medical_records;
CREATE POLICY "Users can view their own medical records"
ON medical_records FOR SELECT
TO authenticated
USING (auth.uid() = patient_id OR EXISTS (
    SELECT 1 FROM doctor_profiles dp WHERE dp.user_id = auth.uid()
));

-- 6. Grant usage to authenticated role
GRANT ALL ON TABLE "user" TO authenticated;
GRANT ALL ON TABLE medical_records TO authenticated;

SELECT '✅ User RLS policies fixed' as message;
