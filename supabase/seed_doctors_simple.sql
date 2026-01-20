-- SIMPLIFIED Seed Script for CareConnect
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)

-- Step 1: Insert doctors directly
INSERT INTO doctors (id, user_id, bio, experience_years, consultation_fee_base, rating_avg, rating_count, is_available, license_verification_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', NULL, 'Excellence in cardiovascular health with over 15 years of experience in interventional cardiology.', 15, 1000, 4.9, 128, true, 'approved'),
  ('22222222-2222-2222-2222-222222222222', NULL, 'Specializing in medical and cosmetic dermatology with a focus on skin cancer prevention.', 10, 800, 4.8, 95, true, 'approved'),
  ('33333333-3333-3333-3333-333333333333', NULL, 'Dedicated pediatrician committed to providing compassionate care for children and adolescents.', 12, 700, 4.9, 210, true, 'approved'),
  ('44444444-4444-4444-4444-444444444444', NULL, 'Expert in mental health wellness, focusing on stress management and clinical psychiatry.', 18, 1200, 4.7, 84, true, 'approved'),
  ('55555555-5555-5555-5555-555555555555', NULL, 'Specialist in neurological disorders and stroke management with advanced research background.', 20, 1500, 5.0, 56, true, 'approved'),
  ('66666666-6666-6666-6666-666666666666', NULL, 'Focusing on sports medicine and joint replacement surgeries with a patient-first approach.', 8, 1100, 4.6, 112, true, 'approved'),
  ('77777777-7777-7777-7777-777777777777', NULL, 'Comprehensive primary care for families, focusing on preventative medicine and wellness.', 7, 500, 4.9, 300, true, 'approved'),
  ('88888888-8888-8888-8888-888888888888', NULL, 'Compassionate behavioral health specialist with expertise in adolescent psychiatry.', 14, 1300, 4.8, 150, true, 'approved')
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  experience_years = EXCLUDED.experience_years,
  consultation_fee_base = EXCLUDED.consultation_fee_base,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  is_available = EXCLUDED.is_available,
  license_verification_status = EXCLUDED.license_verification_status;

-- Step 2: Verify doctors were inserted
SELECT id, bio, is_available, license_verification_status FROM doctors;
