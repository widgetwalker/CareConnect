# 🔧 Fix: Appointment Booking Failed

## Problem
When trying to book an appointment, you get this error:

**"Booking Failed - Could not find the 'consultation_type' column of 'appointments' in the schema cache"**

![Error Screenshot](booking-failed-error.png)

## Root Cause
The `appointments` table is missing several columns that the booking system needs:
- ❌ `consultation_type` - Type of consultation (video, audio, chat)
- ❌ `symptoms` - Patient's symptoms
- ❌ `specialty` - Doctor's specialty for this appointment
- ❌ `doctor_name` - Doctor's name (from previous fix)
- ❌ `slot_start` - Appointment start time
- ❌ `slot_end` - Appointment end time

The original database schema was very basic and only had:
- ✅ `id`, `user_id`, `doctor_id`, `date`, `status`, `createdAt`

## Quick Fix (2 Steps)

### Step 1: Run the Migration

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Copy** the content of `supabase/migrations/add_appointment_columns.sql`
3. **Paste and Run** in SQL Editor
4. You should see: "Appointments table updated successfully!"

### Step 2: Try Booking Again

1. Refresh your browser (`Ctrl+Shift+R`)
2. Go back to the Consultation page
3. Fill in the form and book an appointment
4. It should work now! ✅

## What the Migration Does

### Adds Missing Columns:
```sql
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'video';

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS symptoms TEXT;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS specialty TEXT;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS slot_start TIMESTAMPTZ;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS slot_end TIMESTAMPTZ;
```

### Updates Existing Appointments:
For any existing appointments, it sets:
- `slot_start` = original `date`
- `slot_end` = 30 minutes after `date`
- `consultation_type` = 'video' (default)

### Adds Performance Indexes:
Creates indexes on commonly queried columns for better performance.

## All Migrations You Need to Run

If you're setting up a fresh database or haven't run previous migrations, run these in order:

1. **`doctor_portal_clean.sql`** - Sets up doctor portal tables and RLS
2. **`add_appointment_columns.sql`** - Adds missing appointment columns (THIS ONE)
3. **`fix_doctor_medical_records_access.sql`** - Fixes doctor access to medical records
4. **`add_doctor_name_to_appointments.sql`** - Ensures doctor names are stored (included in #2)

## Troubleshooting

### Issue: Migration says "column already exists"
**Solution**: This is fine! It means the column was already added. Just continue.

### Issue: Still getting the same error after migration
**Solutions**:
1. Hard refresh browser (`Ctrl+Shift+R`)
2. Check Supabase SQL Editor for any error messages
3. Verify the migration ran successfully
4. Clear browser cache and cookies for localhost

### Issue: Different column name error
**Solution**: The migration adds all required columns. If you see a different column missing, add it to the migration file:
```sql
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS your_column_name TEXT;
```

### Issue: Foreign key constraint error
**Solution**: This is a different issue - make sure the `doctor_id` you're using exists in the `doctors` or `doctor_profiles` table.

## Complete Appointments Table Schema (After Migration)

After running the migration, your `appointments` table will have:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `user_id` | TEXT | Patient ID (FK to user table) |
| `doctor_id` | TEXT | Doctor ID (FK to doctors table) |
| `date` | TIMESTAMPTZ | Appointment date/time |
| `status` | TEXT | pending, scheduled, completed, cancelled |
| `createdAt` | TIMESTAMPTZ | When appointment was created |
| `consultation_type` | TEXT | video, audio, chat |
| `symptoms` | TEXT | Patient's symptoms description |
| `specialty` | TEXT | Doctor's specialty for this visit |
| `doctor_name` | TEXT | Doctor's name at time of booking |
| `slot_start` | TIMESTAMPTZ | Appointment start time |
| `slot_end` | TIMESTAMPTZ | Appointment end time |

## Testing After Fix

1. **Book a New Appointment**:
   - Go to Consultation page
   - Select doctor: Dheeraj
   - Enter symptoms: "headache since last week"
   - Select date and time
   - Choose consultation type: Video
   - Click "Schedule Consultation"

2. **Verify Success**:
   - You should see "Consultation Scheduled!" message
   - Redirected to dashboard
   - Appointment appears with correct doctor name
   - All details are preserved

3. **Check Doctor Portal**:
   - Login as doctor
   - Appointment appears in doctor's list
   - Patient symptoms are visible
   - Consultation type is shown

## Summary

This migration:
- ✅ Adds 6 missing columns to appointments table
- ✅ Updates existing appointments with default values
- ✅ Creates performance indexes
- ✅ Fixes the booking error completely

Run the migration and appointment booking will work perfectly! 🎉
