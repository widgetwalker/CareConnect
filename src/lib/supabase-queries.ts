import { supabase } from "./supabaseclient";

// Doctor queries
export async function getDoctors(filters?: {
  specialty?: string;
  search?: string;
  minRating?: number;
  availableToday?: boolean;
}) {
  // First get approved doctors
  const { data: doctorsData, error: doctorsError } = await supabase
    .from("doctors")
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        email,
        avatar_url,
        city,
        state
      )
    `)
    .eq("license_verification_status", "approved")
    .eq("is_available", true);

  if (doctorsError) throw doctorsError;

  // Get specialties for each doctor
  const doctorIds = (doctorsData || []).map((d) => d.id);
  const { data: specialtiesData } = await supabase
    .from("doctor_specialties")
    .select("*")
    .in("doctor_id", doctorIds);

  // Combine data
  let doctors = (doctorsData || [])
    .map((doctor) => {
      const profile = Array.isArray(doctor.user_profiles)
        ? doctor.user_profiles[0]
        : doctor.user_profiles;

      const specialties = (specialtiesData || []).filter(
        (s) => s.doctor_id === doctor.id
      );

      return {
        id: doctor.id,
        name: profile?.full_name || profile?.email || "Unknown",
        email: profile?.email,
        avatar: profile?.avatar_url,
        bio: doctor.bio,
        experience: doctor.experience_years || 0,
        rating: Number(doctor.rating_avg) || 0,
        ratingCount: doctor.rating_count || 0,
        specialties: specialties,
        fee: Number(doctor.consultation_fee_base) || 0,
        available: doctor.is_available || false,
        city: profile?.city,
        state: profile?.state,
      };
    });

  // Apply filters
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    doctors = doctors.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.specialties.some((s) =>
          s.specialty.toLowerCase().includes(query)
        ) ||
        doc.bio?.toLowerCase().includes(query)
    );
  }

  if (filters?.specialty && filters.specialty !== "all") {
    doctors = doctors.filter((doc) =>
      doc.specialties.some(
        (s) => s.specialty.toLowerCase() === filters.specialty?.toLowerCase()
      )
    );
  }

  if (filters?.minRating) {
    doctors = doctors.filter((doc) => doc.rating >= filters.minRating!);
  }

  return doctors;
}

// Appointment queries
export async function getUserAppointments(userId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors (
        id,
        user_profiles (
          full_name,
          avatar_url
        )
      ),
      patients (
        id
      ),
      prescriptions (
        id,
        diagnosis,
        medications
      )
    `)
    .eq("patient_id", userId)
    .order("slot_start", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAppointment(appointmentData: {
  patient_id: string;
  doctor_id: string;
  slot_start: string;
  slot_end: string;
  specialty?: string;
  symptoms?: string;
  consultation_type?: string;
}) {
  const { data, error } = await supabase
    .from("appointments")
    .insert([appointmentData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Patient queries
export async function getPatientProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(`
      *,
      patients (
        *
      )
    `)
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

// Prescription queries
export async function getPatientPrescriptions(patientId: string) {
  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      *,
      appointments (
        slot_start,
        slot_end,
        doctors (
          user_profiles (
            full_name
          )
        )
      )
    `)
    .eq("patient_id", patientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Medical records queries
export async function getMedicalRecords(patientId: string) {
  const { data, error } = await supabase
    .from("medical_records")
    .select(`
      *,
      doctors (
        user_profiles (
          full_name
        )
      )
    `)
    .eq("patient_id", patientId)
    .order("recorded_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Check doctor availability
export async function getAvailableSlots(doctorId: string, date: string) {
  // Call the database function
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_doctor_id: doctorId,
    p_date: date,
    p_duration_minutes: 30,
  });

  if (error) throw error;
  return data || [];
}

