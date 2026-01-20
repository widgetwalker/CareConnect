import { supabase } from "./supabaseclient";

// Doctor queries
export async function getDoctors(filters?: {
  specialty?: string;
  search?: string;
  minRating?: number;
  availableToday?: boolean;
}) {
  try {
    // Simple query without user_profiles join (relationship doesn't exist)
    const { data: doctorsData, error: doctorsError } = await supabase
      .from("doctors")
      .select("*")
      .eq("license_verification_status", "approved")
      .eq("is_available", true);

    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
      return []; // Return empty to use fallback dummy data
    }

    // Get specialties for each doctor (optional - may not exist)
    const doctorIds = (doctorsData || []).map((d) => d.id);
    let specialtiesData: any[] = [];

    if (doctorIds.length > 0) {
      try {
        const { data: specs } = await supabase
          .from("doctor_specialties")
          .select("*")
          .in("doctor_id", doctorIds);
        specialtiesData = specs || [];
      } catch (e) {
        console.log("No doctor_specialties table, using empty array");
      }
    }

    // Map doctors to expected format
    let doctors = (doctorsData || []).map((doctor) => {
      const specialties = specialtiesData.filter(
        (s) => s.doctor_id === doctor.id
      );

      return {
        id: doctor.id,
        name: `Doctor ${doctor.id.substring(0, 8)}`, // Use ID if no name
        email: "",
        avatar: "",
        bio: doctor.bio || "",
        experience: doctor.experience_years || 0,
        rating: Number(doctor.rating_avg) || 0,
        ratingCount: doctor.rating_count || 0,
        specialties: specialties.length > 0 ? specialties : [{ specialty: "General" }],
        fee: Number(doctor.consultation_fee_base) || 0,
        available: doctor.is_available || false,
        city: "",
        state: "",
      };
    });

    // Apply filters
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      doctors = doctors.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.specialties.some((s: any) =>
            s.specialty.toLowerCase().includes(query)
          ) ||
          doc.bio?.toLowerCase().includes(query)
      );
    }

    if (filters?.specialty && filters.specialty !== "all") {
      doctors = doctors.filter((doc) =>
        doc.specialties.some(
          (s: any) => s.specialty.toLowerCase() === filters.specialty?.toLowerCase()
        )
      );
    }

    if (filters?.minRating) {
      doctors = doctors.filter((doc) => doc.rating >= filters.minRating!);
    }

    return doctors;
  } catch (error) {
    console.error("Error in getDoctors:", error);
    return []; // Return empty array so app uses fallback dummy data
  }
}

// Appointment queries
export async function getUserAppointments(userId: string) {
  console.log("Fetching appointments for user:", userId);

  try {
    // Simple query without joins first
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }

    console.log("Appointments fetched:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getUserAppointments:", error);
    return [];
  }
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
  console.log("Creating appointment with data:", appointmentData);

  // Extract date from slot_start for the 'date' column
  const appointmentDate = new Date(appointmentData.slot_start).toISOString().split('T')[0];

  // Generate a UUID for the appointment id
  const uuid = crypto.randomUUID();

  const { data, error } = await supabase
    .from("appointments")
    .insert([{
      id: uuid,
      user_id: appointmentData.patient_id,
      doctor_id: appointmentData.doctor_id,
      date: appointmentDate,
      status: "pending",
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }

  console.log("Appointment created successfully:", data);
  return data;
}

// Patient queries
export async function getPatientProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("No user profile found, returning null");
      return null;
    }
    return data;
  } catch (error) {
    console.log("Error fetching patient profile:", error);
    return null;
  }
}

// Prescription queries
export async function getPatientPrescriptions(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("No prescriptions table or data:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.log("Error fetching prescriptions:", error);
    return [];
  }
}

// Medical records queries
export async function getMedicalRecords(patientId: string) {
  try {
    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_date", { ascending: false });

    if (error) {
      console.log("No medical records table or data:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.log("Error fetching medical records:", error);
    return [];
  }
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

