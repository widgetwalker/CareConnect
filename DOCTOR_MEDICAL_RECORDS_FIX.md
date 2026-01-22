# 🩺 Fix: Doctors Cannot View Patient Medical Records

## Problem
Doctors in the CareConnect system cannot view patient medical records from the Doctor Portal. The "Patient Medical Records" dialog shows "No medical records available" even when patients have uploaded records.

![Issue Screenshot](your-screenshot-shows-no-medical-records.png)

## Root Cause
The Row Level Security (RLS) policies in Supabase are blocking doctors from accessing the `medical_records` table. The RLS policy checks if the user has `role = 'doctor'` in the custom `user` table, but:

1. The `role` column may not exist in the `user` table
2. Even if it exists, doctor users may not have `role = 'doctor'` set
3. When doctors sign up, their role is stored in Supabase Auth's `user_metadata`, not in the custom `user` table

## Solution Overview
We need to:
1. ✅ Ensure the `role` column exists in the `user` table
2. ✅ Set `role = 'doctor'` for all users who have doctor profiles
3. ✅ Update RLS policies to check both the `user` table and `doctor_profiles` table
4. ✅ Add a trigger to automatically set role when new doctors sign up

## Step-by-Step Fix

### Option 1: Run SQL Migration (Recommended)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your CareConnect project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire content of `supabase/migrations/fix_doctor_medical_records_access.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see "Medical Records Access Fix Applied Successfully!" message
   - The migration will:
     - ✅ Add/ensure `role` column exists
     - ✅ Set `role='doctor'` for all users with doctor profiles
     - ✅ Update RLS policies to allow doctor access
     - ✅ Create triggers to auto-set role for future doctors

### Option 2: Verify and Fix Using Script

Run this command to check the current state and attempt fixes:

```bash
npm run verify:doctor-roles
```

This script will:
- Check if the `role` column exists
- List all doctors and their current roles
- Attempt to fix roles that aren't set to 'doctor'
- Provide instructions if manual SQL execution is needed

## Testing the Fix

After running the migration:

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to the Console tab
   - You should see logs like:
     ```
     Fetched 3 medical records for patient abc-123-def
     ```
   - If you see errors, they'll help diagnose the issue

2. **Test in Doctor Portal**
   - Log in as a doctor
   - Click on "View Records" for any patient
   - Medical records should now be visible!

3. **If Still Not Working**
   - Check the console for error messages
   - The error might say "permission denied" or "RLS policy violation"
   - This means the migration didn't apply correctly

## What the Migration Does

### 1. Adds/Ensures Role Column
```sql
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient';
```

### 2. Updates Existing Doctor Roles
```sql
UPDATE "user" u
SET role = 'doctor'
FROM doctor_profiles dp
WHERE u.id = dp.user_id;
```

### 3. Improves RLS Policy
```sql
CREATE POLICY "Doctors can view all medical records"
  ON medical_records FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM "user" WHERE id = auth.uid() AND role = 'doctor')
    OR
    EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid())
  );
```

This policy now checks BOTH:
- If the user has `role='doctor'` in the `user` table
- OR if the user has an entry in `doctor_profiles`

### 4. Auto-Set Role for New Doctors
Creates a trigger that automatically sets `role='doctor'` when a new doctor profile is created, so this issue won't happen again.

## Troubleshooting

### Issue: "column role does not exist"
**Solution**: Run the full migration SQL in Supabase SQL Editor

### Issue: Still seeing "No medical records available" after migration
**Solutions**:
1. Hard refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Check console for errors - there might be RLS errors
3. Verify the doctor user has `role='doctor'`:
   ```bash
   npm run verify:doctor-roles
   ```
4. Make sure the patient actually has uploaded medical records

### Issue: "permission denied for table medical_records"
**Solutions**:
1. The migration didn't apply correctly
2. Try running it again in Supabase SQL Editor
3. Check if RLS is enabled on the table:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'medical_records';
   ```

### Issue: Script fails with authentication error
**Solution**: The script uses the anon key which may not have permission to update the `user` table. You need to run the SQL migration manually in Supabase SQL Editor.

## Code Changes Made

### 1. Added Error Logging to DoctorDashboard.tsx
Added detailed console logging when fetching medical records to help diagnose RLS issues:

```typescript
const { data: records, error: recordsError } = await supabase
  .from("medical_records")
  .select("*")
  .eq("patient_id", apt.user_id);

if (recordsError) {
  console.error(`Error fetching medical records for patient ${apt.user_id}:`, recordsError);
}
```

### 2. Created Migration Files
- `supabase/migrations/fix_doctor_medical_records_access.sql` - Main fix
- `server/migrations/verify-doctor-roles.ts` - Verification script

### 3. Added npm Scripts
- `npm run verify:doctor-roles` - Check and fix doctor roles
- `npm run migrate:doctor-name` - (Previous migration for doctor names)

## Summary

This fix ensures that:
✅ All doctors have `role='doctor'` set in the user table  
✅ RLS policies properly allow doctors to view medical records  
✅ Future doctors will automatically get the correct role  
✅ Better error logging helps diagnose issues  

After applying the migration, doctors should be able to view patient medical records without any issues!

## Need Help?

If you're still experiencing issues:
1. Check the browser console for error messages
2. Run `npm run verify:doctor-roles` to check doctor role status
3. Ensure the patient has actually uploaded medical records
4. Verify you're logged in as a doctor (check `user.user_metadata.role === 'doctor'`)

