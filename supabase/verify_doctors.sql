# Quick Fix SQL - Run in Supabase

-- 1. Verify all newly created doctor profiles
-- This will make them visible in the Doctors page
UPDATE doctor_profiles 
SET is_verified = true 
WHERE is_verified = false;

-- 2. Verify the fix - check doctor profiles
SELECT 
  dp.id,
  dp.speciality,
  dp.location,
  dp.fee,
  dp.is_verified,
  u.name as doctor_name,
  u.email
FROM doctor_profiles dp
JOIN "user" u ON dp.user_id = u.id;
