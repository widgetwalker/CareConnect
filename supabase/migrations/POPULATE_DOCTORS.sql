-- POPULATE DOCTORS SCRIPT
-- Run this to add 10+ dummy doctors across various specialties

-- helper function to generate random string for IDs
-- (We'll just use static UUIDs for consistency in this script)

DO $$
DECLARE
    -- IDs for our new doctors
    doc1_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    doc2_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    doc3_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    doc4_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
    doc5_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
    doc6_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';
    doc7_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17';
    doc8_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18';
    doc9_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19';
    doc10_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20';
BEGIN
    -- 1. Insert Users (Role: Doctor)
    INSERT INTO public."user" (id, email, name, role) VALUES 
    (doc1_id, 'dr.sarah@careconnect.com', 'Dr. Sarah Wilson', 'doctor'),
    (doc2_id, 'dr.raj@careconnect.com', 'Dr. Raj Malhotra', 'doctor'),
    (doc3_id, 'dr.emily@careconnect.com', 'Dr. Emily Chen', 'doctor'),
    (doc4_id, 'dr.michael@careconnect.com', 'Dr. Michael Ross', 'doctor'),
    (doc5_id, 'dr.anita@careconnect.com', 'Dr. Anita Desai', 'doctor'),
    (doc6_id, 'dr.james@careconnect.com', 'Dr. James Carter', 'doctor'),
    (doc7_id, 'dr.priya@careconnect.com', 'Dr. Priya Kapoor', 'doctor'),
    (doc8_id, 'dr.david@careconnect.com', 'Dr. David Kim', 'doctor'),
    (doc9_id, 'dr.lisa@careconnect.com', 'Dr. Lisa Patel', 'doctor'),
    (doc10_id, 'dr.robert@careconnect.com', 'Dr. Robert Brown', 'doctor')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Doctor Profiles with Specialties
    -- Note: Ensure is_verified = true so they show up
    INSERT INTO public.doctor_profiles 
    (user_id, speciality, experience, rating, patients_count, location, fee, is_verified, description) 
    VALUES 
    -- ENT
    (doc1_id, 'ENT Specialist', '12 years', '4.8', 500, 'Mumbai, Maharashtra', 800, true, 'Expert in Ear, Nose, and Throat conditions. Specializes in sinus surgeries and hearing disorders.'),
    
    -- Cardiologist
    (doc2_id, 'Cardiologist', '15 years', '4.9', 1200, 'Delhi, NCR', 1500, true, 'Senior Interventional Cardiologist. Expert in heart health, managing hypertension, and cardiac rehabilitation.'),

    -- Dermatologist
    (doc3_id, 'Dermatologist', '8 years', '4.7', 850, 'Bangalore, Karnataka', 700, true, 'Cosmetic and Clinical Dermatologist. Specializes in acne treatment, anti-aging, and hair restoration.'),

    -- General Physician
    (doc4_id, 'General Physician', '20 years', '4.6', 5000, 'Hyderabad, Telangana', 500, true, 'Family physician with two decades of experience in treating common illnesses and chronic disease management.'),

    -- Pediatrician
    (doc5_id, 'Pediatrician', '10 years', '4.9', 900, 'Pune, Maharashtra', 600, true, 'Compassionate pediatrician dedicated to child health, vaccinations, and developmental milestones.'),

    -- Orthopedic
    (doc6_id, 'Orthopedist', '14 years', '4.8', 750, 'Chennai, Tamil Nadu', 1000, true, 'Orthopedic surgeon specializing in joint replacement, sports injuries, and fracture management.'),

    -- Neurologist
    (doc7_id, 'Neurologist', '18 years', '4.9', 600, 'Kolkata, West Bengal', 1200, true, 'Expert in treating migraines, epilepsy, stroke recovery, and other neurological disorders.'),

    -- Psychiatrist
    (doc8_id, 'Psychiatrist', '9 years', '4.7', 400, 'Mumbai, Maharashtra', 1000, true, 'Mental health specialist focusing on anxiety, depression, and stress management counselling.'),

    -- Dentist
    (doc9_id, 'Dentist', '6 years', '4.8', 1100, 'Bangalore, Karnataka', 400, true, 'Dental surgeon offering root canals, implants, and cosmetic smile makeovers.'),

    -- Gynecologist
    (doc10_id, 'Gynecologist', '13 years', '4.8', 950, 'Delhi, NCR', 900, true, 'Specialist in womens health, pregnancy care, and reproductive medicine.')

    ON CONFLICT (user_id) DO UPDATE SET 
    speciality = EXCLUDED.speciality,
    description = EXCLUDED.description,
    is_verified = true;

    RAISE NOTICE 'Doctors populated successfully!';
END $$;
