# 🚀 CareConnect Database Fixes - Master Guide

This guide covers ALL the database issues and their fixes in one place.

## Issues Fixed

1. ✅ **Appointment Booking Fails** - Missing columns in appointments table
2. ✅ **Doctors Can't View Medical Records** - RLS permission issues
3. ✅ **Doctor Names Change After Booking** - Doctor name not stored in appointments

## Quick Start: Run All Migrations

To fix everything at once, run these 3 migrations in Supabase SQL Editor **in this order**:

### 1. Fix Appointments Table
**File**: `supabase/migrations/add_appointment_columns.sql`
**Fixes**: Appointment booking errors
**What it does**: Adds missing columns (consultation_type, symptoms, specialty, etc.)

### 2. Fix Medical Records Access
**File**: `supabase/migrations/fix_doctor_medical_records_access.sql`
**Fixes**: Doctors unable to view patient medical records
**What it does**: Sets up doctor roles and RLS policies

### 3. Verify All Migrations
**Command**: `npm run verify:doctor-roles`
**What it does**: Checks if all fixes were applied correctly

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your CareConnect project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Migration #1 (Appointments)

1. Open file: `supabase/migrations/add_appointment_columns.sql`
2. Copy the entire content
3. Paste in SQL Editor
4. Click **Run** (or `Ctrl+Enter`)
5. ✅ Should see: "Appointments table updated successfully!"

### Step 3: Run Migration #2 (Medical Records)

1. Open file: `supabase/migrations/fix_doctor_medical_records_access.sql`
2. Copy the entire content
3. Paste in SQL Editor
4. Click **Run**
5. ✅ Should see: "Medical Records Access Fix Applied Successfully!"

### Step 4: Verify Everything Works

Run the verification script:
```bash
npm run verify:doctor-roles
```

This will show you:
- ✅ All doctors and their roles
- ✅ Any remaining issues
- ✅ Confirmation that fixes are applied

### Step 5: Test Your Application

1. **Test Appointment Booking**:
   - Go to Consultation page
   - Select doctor "Dheeraj"
   - Fill in symptoms, date, time
   - Click "Schedule Consultation"
   - ✅ Should succeed and redirect to dashboard

2. **Test Doctor Portal**:
   - Login as a doctor
   - View appointments list
   - Click "View Records" on any patient
   - ✅ Should see patient medical records

3. **Test Doctor Names**:
   - Check that appointment shows "Dheeraj" (not "Dr. James Wilson" or "Doctor f9275/ff")
   - ✅ Should show the correct booked doctor name

## What Each Migration Does

### Migration 1: Add Appointment Columns
```sql
-- Adds these columns:
- consultation_type (video, audio, chat)
- symptoms (patient's description)
- specialty (doctor's specialty)
- doctor_name (preserves doctor name)
- slot_start (appointment start time)
- slot_end (appointment end time)
```

### Migration 2: Fix Medical Records Access
```sql
-- Sets up:
- role column in user table
- Sets role='doctor' for all doctors
- Updates RLS policies
- Creates auto-role-assignment trigger
```

## Complete Database Schema

### Appointments Table (After Fixes)
```sql
appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  doctor_id TEXT,
  doctor_name TEXT,                  -- ✅ NEW
  date TIMESTAMPTZ,
  slot_start TIMESTAMPTZ,            -- ✅ NEW
  slot_end TIMESTAMPTZ,              -- ✅ NEW
  status TEXT,
  consultation_type TEXT,            -- ✅ NEW
  symptoms TEXT,                     -- ✅ NEW
  specialty TEXT,                    -- ✅ NEW
  createdAt TIMESTAMPTZ
)
```

### User Table (After Fixes)
```sql
user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT,                         -- ✅ NEW
  email_verified BOOLEAN,
  image TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Troubleshooting

### Issue: "column already exists" error
**Solution**: Fine! The column was added previously. Continue.

### Issue: Appointment booking still fails
**Checklist**:
- [x] Ran migration #1?
- [x] Hard refreshed browser? (`Ctrl+Shift+R`)
- [x] Check console for different error?
- [x] Verified migration succeeded in Supabase?

### Issue: Doctors still can't view medical records
**Checklist**:
- [x] Ran migration #2?
- [x] Ran `npm run verify:doctor-roles`?
- [x] Doctor has `role='doctor'` in user table?
- [x] Hard refreshed browser?
- [x] Patient actually has medical records?

### Issue: Doctor names still changing
**Checklist**:
- [x] Ran migration #1 (includes doctor_name column)?
- [x] Booking NEW appointments (old ones won't update)?
- [x] Using latest code in Consultation.tsx?
- [x] Hard refreshed browser?

## Files Modified

### Code Files:
- ✅ `src/lib/supabase-queries.ts` - Added doctor_name parameter
- ✅ `src/pages/Consultation.tsx` - Passes doctor_name when booking
- ✅ `src/pages/DoctorDashboard.tsx` - Added error logging

### Migration Files:
- ✅ `supabase/migrations/add_appointment_columns.sql`
- ✅ `supabase/migrations/fix_doctor_medical_records_access.sql`

### Scripts:
- ✅ `server/migrations/verify-doctor-roles.ts`
- ✅ `package.json` - Added `verify:doctor-roles` command

### Documentation:
- ✅ `APPOINTMENT_BOOKING_FIX.md` - Appointment booking fix
- ✅ `DOCTOR_MEDICAL_RECORDS_FIX.md` - Medical records access fix
- ✅ `DOCTOR_NAME_FIX.md` - Doctor name preservation fix
- ✅ `MASTER_FIX_GUIDE.md` - This file!

## Verification Checklist

After running all migrations, verify:

- ✅ Can book appointments without errors
- ✅ Appointments show in patient dashboard
- ✅ Appointments show in doctor portal
- ✅ Doctor names are preserved correctly
- ✅ Doctors can view patient medical records
- ✅ Doctors can send prescriptions
- ✅ Doctors can reschedule/cancel appointments
- ✅ All appointment details are preserved

## Need More Help?

### Check Console Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share error messages

### Run Verification Script
```bash
npm run verify:doctor-roles
```

### Check Database Directly
In Supabase SQL Editor:
```sql
-- Check appointments table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments';

-- Check if doctors have correct roles
SELECT u.id, u.name, u.email, u.role 
FROM "user" u
JOIN doctor_profiles dp ON dp.user_id = u.id;

-- Check medical records RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'medical_records';
```

## Summary

1. **Run Migration #1** - Fixes appointment booking
2. **Run Migration #2** - Fixes medical records access  
3. **Verify with script** - `npm run verify:doctor-roles`
4. **Test everything** - Book, view, manage appointments

All issues should be resolved! 🎉

---

**Quick Reference:**
- 📁 Migrations: `supabase/migrations/`
- 📚 Detailed guides: `APPOINTMENT_BOOKING_FIX.md`, `DOCTOR_MEDICAL_RECORDS_FIX.md`
- 🔍 Verify: `npm run verify:doctor-roles`
- 💬 Help: Check browser console for errors
