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
  patient_id: string;
  doctor_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  doctors?: {
    id: string;
    user_profiles: {
      full_name: string;
      avatar_url?: string;
    } | null;
  } | null;
}

export interface TimeSlot {
  slot_start: string;
  slot_end: string;
}
