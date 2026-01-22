import { supabase } from "./supabaseclient";

// Doctor queries
export async function getDoctors(filters?: {
  specialty?: string;
  search?: string;
  minRating?: number;
  availableToday?: boolean;
}) {
  try {
    // Join with user_profiles to get doctor names and other profile info
    const { data: doctorsData, error: doctorsError } = await supabase
      .from("doctors")
      .select(`
        *,
        user_profiles (
          full_name,
          email,
          avatar_url,
          city,
          state
        )
      `)
      .eq("license_verification_status", "approved")
      .eq("is_available", true);

    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
    }

    // Also fetch from doctor_profiles (for doctors who signed up through doctor portal)
    const { data: doctorProfiles, error: profilesError } = await supabase
      .from("doctor_profiles")
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          image
        )
      `)
      .eq("is_verified", true);

    if (profilesError) {
      console.error("Error loading doctor profiles:", profilesError);
    }

    // Transform doctor profiles to match Doctor interface
    const profileDoctors = (doctorProfiles || []).map((profile: any) => ({
      id: profile.doctor_id || profile.id,
      name: profile.user?.name || "Doctor",
      email: profile.user?.email || "",
      avatar: profile.user?.image || `https://i.pravatar.cc/150?u=${profile.user_id}`,
      bio: profile.description || `${profile.experience} of experience in ${profile.speciality}`,
      experience: parseInt(profile.experience) || 5,
      rating: parseFloat(profile.rating) || 4.5,
      ratingCount: 0,
      specialties: [{ specialty: profile.speciality }],
      fee: profile.fee,
      available: true,
      city: profile.location?.split(",")[0] || "India",
      state: profile.location?.split(",")[1] || "",
    }));

    // Get specialties for each doctor from doctors table (optional - may not exist)
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

    // Map doctors from doctors table to expected format
    const tableDoctors = (doctorsData || []).map((doctor: any) => {
      const specialties = specialtiesData.filter(
        (s) => s.doctor_id === doctor.id
      );

      return {
        id: doctor.id,
        name: doctor.user_profiles?.full_name || `Doctor ${doctor.id.substring(0, 8)}`,
        email: doctor.user_profiles?.email || "",
        avatar: doctor.user_profiles?.avatar_url || "",
        bio: doctor.bio || "",
        experience: doctor.experience_years || 0,
        rating: Number(doctor.rating_avg) || 0,
        ratingCount: doctor.rating_count || 0,
        specialties: specialties.length > 0 ? specialties : [{ specialty: "General" }],
        fee: Number(doctor.consultation_fee_base) || 0,
        available: doctor.is_available || false,
        city: doctor.user_profiles?.city || "",
        state: doctor.user_profiles?.state || "",
      };
    });

    // Combine both sources, prioritizing profile doctors
    let doctors = [...profileDoctors];

    // Add doctors from doctors table that don't exist in profiles
    tableDoctors.forEach((doc: any) => {
      if (!doctors.find(d => d.id === doc.id)) {
        doctors.push(doc);
      }
    });

    console.log("Total doctors loaded:", doctors.length);

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
    return []; // Return empty array
  }
}

// Appointment queries
export async function getUserAppointments(userId: string) {
  console.log("Fetching appointments for user:", userId);

  try {
    // First, fetch appointments without joins to ensure we get all appointments
    const { data: appointmentsData, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }

    if (!appointmentsData || appointmentsData.length === 0) {
      console.log("No appointments found for user");
      return [];
    }

    console.log("Raw appointments data:", appointmentsData);

    // Get unique doctor IDs
    const doctorIds = [...new Set(appointmentsData.map((apt: any) => apt.doctor_id))];
    console.log("Doctor IDs from appointments:", doctorIds);

    // Fetch doctor names from both doctors table and doctor_profiles table
    const doctorNamesMap: Record<string, string> = {};

    // Try to get from doctors table
    const { data: doctorsData } = await supabase
      .from("doctors")
      .select(`
        id,
        user_profiles (
          full_name
        )
      `)
      .in("id", doctorIds);

    console.log("Doctors from doctors table:", doctorsData);

    if (doctorsData) {
      doctorsData.forEach((doc: any) => {
        if (doc.user_profiles?.full_name) {
          doctorNamesMap[doc.id] = doc.user_profiles.full_name;
        }
      });
    }

    // Also try to get from doctor_profiles table
    // Check both doctor_id and id fields since doctors from portal might use either
    const { data: profilesData } = await supabase
      .from("doctor_profiles")
      .select(`
        id,
        doctor_id,
        user:user_id (
          name
        )
      `)
      .or(`doctor_id.in.(${doctorIds.join(',')}),id.in.(${doctorIds.join(',')})`);

    console.log("Doctors from doctor_profiles table:", profilesData);

    if (profilesData) {
      profilesData.forEach((profile: any) => {
        if (profile.user?.name) {
          // Use whichever ID matches (doctor_id or id)
          const matchingId = profile.doctor_id || profile.id;
          if (matchingId && doctorIds.includes(matchingId)) {
            doctorNamesMap[matchingId] = profile.user.name;
          }
        }
      });
    }

    console.log("Final doctor names map:", doctorNamesMap);

    // Map appointments with doctor names
    const appointments = appointmentsData.map((apt: any) => ({
      ...apt,
      doctor_name: doctorNamesMap[apt.doctor_id] || `Doctor ${apt.doctor_id.substring(0, 8)}`,
    }));

    console.log("Appointments fetched with doctor names:", appointments);
    return appointments;
  } catch (error) {
    console.error("Error in getUserAppointments:", error);
    return [];
  }
}

export async function createAppointment(appointmentData: {
  patient_id: string;
  doctor_id: string;
  doctor_name?: string; // Added doctor_name parameter
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
      doctor_name: appointmentData.doctor_name, // Store doctor name directly
      date: appointmentDate,
      status: "pending",
      symptoms: appointmentData.symptoms,
      specialty: appointmentData.specialty,
      consultation_type: appointmentData.consultation_type,
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

  // Transform simple time strings (e.g. "09:00") into full TimeSlot objects
  // The database returns an array of objects like { slot_time: "09:00" }
  if (data && Array.isArray(data)) {
    return data.map((slot: any) => {
      // Ensure we have a valid time string
      if (!slot.slot_time) return null;

      const timeString = slot.slot_time; // "09:00"
      const [hours, minutes] = timeString.split(':').map(Number);

      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Add 30 minutes

      return {
        slot_start: startDate.toISOString(),
        slot_end: endDate.toISOString()
      };
    }).filter(Boolean); // Remove any nulls
  }

  return [];
}

