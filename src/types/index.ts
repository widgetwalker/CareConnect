export interface DoctorSpecialty {
  specialty: string;
  doctor_id?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  experience: number;
  rating: number;
  ratingCount: number;
  specialties: DoctorSpecialty[];
  fee: number;
  available: boolean;
  city?: string;
  state?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  date: string;
  status: string;
  slot_start?: string;
  slot_end?: string;
  specialty?: string;
  symptoms?: string;
  consultation_type?: string;
  doctor_name?: string; // Added to display actual doctor name
  doctors?: {
    id: string;
    bio?: string;
    experience_years?: number;
    consultation_fee_base?: number;
    user_profiles?: {
      full_name: string;
      avatar_url?: string;
    } | null;
  } | null;
}

export interface TimeSlot {
  slot_start: string;
  slot_end: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Prescription {
  id: string;
  created_at: string;
  is_active: boolean;
  diagnosis?: string;
  medications?: Medication[];
  appointments?: {
    doctors?: {
      user_profiles?: {
        full_name?: string;
      } | null;
    } | null;
  } | null;
}

export interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  recorded_date: string;
  description?: string;
  vital_signs?: Record<string, unknown>;
}

export interface PatientProfile {
  full_name: string;
  phone?: string;
}
