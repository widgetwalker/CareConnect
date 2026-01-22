# 🔧 Quick Fix Guide: Doctor Name Issue

## ✅ What Was Fixed

The issue where doctor names were changing after booking appointments (e.g., booking "Dheeraj" but seeing "Dr. James Wilson" or "Doctor f9275/ff") has been **fixed**!

## 📋 What You Need to Do

### Option 1: Manual SQL Execution (Recommended)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your CareConnect project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire content of `supabase/migrations/add_doctor_name_to_appointments.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see a message confirming the migration completed
   - The `appointments` table now has a `doctor_name` column
   - Existing appointments have been backfilled with correct names

### Option 2: Using the Migration Script

Run this command in your terminal:

```bash
npm run migrate:doctor-name
```

This will:
- ✅ Check if the `doctor_name` column exists
- ✅ Show you sample appointments
- ✅ Display the migration SQL with instructions

**Note**: You'll still need to copy the SQL and run it manually in Supabase SQL Editor, as the Supabase client cannot execute DDL statements directly.

## 🧪 Testing the Fix

After running the migration:

1. **Start your development server**:
   ```bash
   npm run dev:all
   ```

2. **Book a new appointment**:
   - Navigate to the Doctors page
   - Find and select "Dheeraj" (or any doctor)
   - Complete the booking process
   - Go to your Dashboard

3. **Verify the fix**:
   - The doctor's name should now be "Dheeraj" (or whoever you booked)
   - The name should NOT change to anything else
   - Refresh the page - the name should remain consistent

4. **Check existing appointments**:
   - Your old appointments should now show the correct doctor names
   - This is thanks to the migration backfill that looked up and stored the correct names

## 🎯 What Changed

### Code Changes
- ✅ **`src/lib/supabase-queries.ts`**: Now accepts and stores `doctor_name` when creating appointments
- ✅ **`src/pages/Consultation.tsx`**: Passes the doctor's name when booking
- ✅ **`package.json`**: Added `migrate:doctor-name` script for easy migration

### Database Changes
- ✅ **New column**: `appointments.doctor_name` (TEXT)
- ✅ **Backfill**: Existing appointments updated with correct doctor names from related tables

## ❓ Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: This is fine! It means the column was already added. Just skip the migration.

### Issue: Still seeing wrong doctor names
**Solution**: 
1. Make sure you ran the migration SQL in Supabase
2. Hard refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
3. Try booking a NEW appointment and check if that one has the correct name

### Issue: Old appointments still show wrong names
**Solution**: The migration should have backfilled the names. If not:
1. Check if the migration ran successfully in Supabase SQL Editor
2. Look for any error messages in the SQL output
3. The backfill query tries to find names from `doctor_profiles` and `doctors` tables

## 📚 Technical Details

For a detailed explanation of the problem, solution, and implementation, see:
- **`DOCTOR_NAME_FIX.md`** - Complete technical documentation

## 🎉 That's It!

After running the migration, all new appointments will automatically save and display the correct doctor name. The issue is completely resolved!

If you have any questions or encounter issues, please refer to `DOCTOR_NAME_FIX.md` for more details.
