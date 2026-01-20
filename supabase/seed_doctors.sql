-- Seed doctors for CareConnect Application
-- Run this SQL in your Supabase SQL Editor

-- First, insert user profiles for the doctors
INSERT INTO user_profiles (id, full_name, email, avatar_url, city, state, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Dr. Sarah Chen', 'sarah.chen@careconnect.com', 'https://i.pravatar.cc/150?u=sarahchen', 'Mumbai', 'Maharashtra', 'doctor'),
  ('22222222-2222-2222-2222-222222222222', 'Dr. James Wilson', 'james.wilson@careconnect.com', 'https://i.pravatar.cc/150?u=jameswilson', 'Delhi', 'Delhi', 'doctor'),
  ('33333333-3333-3333-3333-333333333333', 'Dr. Priya Sharma', 'priya.sharma@careconnect.com', 'https://i.pravatar.cc/150?u=priyasharma', 'Bangalore', 'Karnataka', 'doctor'),
  ('44444444-4444-4444-4444-444444444444', 'Dr. Robert Miller', 'robert.miller@careconnect.com', 'https://i.pravatar.cc/150?u=robertmiller', 'Chennai', 'Tamil Nadu', 'doctor'),
  ('55555555-5555-5555-5555-555555555555', 'Dr. Anita Desai', 'anita.desai@careconnect.com', 'https://i.pravatar.cc/150?u=anitadesai', 'Hyderabad', 'Telangana', 'doctor'),
  ('66666666-6666-6666-6666-666666666666', 'Dr. Michael Ross', 'michael.ross@careconnect.com', 'https://i.pravatar.cc/150?u=michaelross', 'Pune', 'Maharashtra', 'doctor'),
  ('77777777-7777-7777-7777-777777777777', 'Dr. Elena Gilbert', 'elena.gilbert@careconnect.com', 'https://i.pravatar.cc/150?u=elenagilbert', 'Kolkata', 'West Bengal', 'doctor'),
  ('88888888-8888-8888-8888-888888888888', 'Dr. David Tennant', 'david.tennant@careconnect.com', 'https://i.pravatar.cc/150?u=davidtennant', 'Ahmedabad', 'Gujarat', 'doctor')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  role = EXCLUDED.role;

-- Now insert doctors with the same UUIDs
INSERT INTO doctors (id, user_id, bio, experience_years, consultation_fee_base, rating_avg, rating_count, is_available, license_verification_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Excellence in cardiovascular health with over 15 years of experience in interventional cardiology. Board certified with multiple research publications.', 15, 1000, 4.9, 128, true, 'approved'),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Specializing in medical and cosmetic dermatology with a focus on skin cancer prevention and treatment.', 10, 800, 4.8, 95, true, 'approved'),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Dedicated pediatrician committed to providing compassionate care for children and adolescents.', 12, 700, 4.9, 210, true, 'approved'),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Expert in mental health wellness, focusing on stress management, anxiety, and clinical psychiatry.', 18, 1200, 4.7, 84, true, 'approved'),
  ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Specialist in neurological disorders and stroke management with advanced research background.', 20, 1500, 5.0, 56, true, 'approved'),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'Focusing on sports medicine and joint replacement surgeries with a patient-first approach.', 8, 1100, 4.6, 112, true, 'approved'),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'Comprehensive primary care for families, focusing on preventative medicine and wellness.', 7, 500, 4.9, 300, true, 'approved'),
  ('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'Compassionate behavioral health specialist with expertise in adolescent and adult psychiatry.', 14, 1300, 4.8, 150, true, 'approved')
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  experience_years = EXCLUDED.experience_years,
  consultation_fee_base = EXCLUDED.consultation_fee_base,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  is_available = EXCLUDED.is_available,
  license_verification_status = EXCLUDED.license_verification_status;

-- Insert specialties for each doctor
INSERT INTO doctor_specialties (doctor_id, specialty)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Cardiology'),
  ('22222222-2222-2222-2222-222222222222', 'Dermatology'),
  ('33333333-3333-3333-3333-333333333333', 'Pediatrics'),
  ('44444444-4444-4444-4444-444444444444', 'Psychiatry'),
  ('55555555-5555-5555-5555-555555555555', 'Neurology'),
  ('66666666-6666-6666-6666-666666666666', 'Orthopedics'),
  ('77777777-7777-7777-7777-777777777777', 'General Medicine'),
  ('88888888-8888-8888-8888-888888888888', 'Psychiatry')
ON CONFLICT DO NOTHING;

-- Also insert into specialties table if it exists
INSERT INTO specialties (name, description)
VALUES 
  ('Cardiology', 'Heart and cardiovascular system specialist'),
  ('Dermatology', 'Skin, hair, and nail specialist'),
  ('Pediatrics', 'Child and adolescent healthcare'),
  ('Psychiatry', 'Mental health and behavioral disorders'),
  ('Neurology', 'Brain and nervous system specialist'),
  ('Orthopedics', 'Bone, joint, and muscle specialist'),
  ('General Medicine', 'Primary care and general health')
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT d.id, p.full_name, d.bio, d.is_available, d.license_verification_status
FROM doctors d
JOIN user_profiles p ON d.user_id = p.id
WHERE d.license_verification_status = 'approved';
