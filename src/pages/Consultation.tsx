import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Video, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseclient";
import { createAppointment, getAvailableSlots, getDoctors } from "@/lib/supabase-queries";
import { Doctor, TimeSlot } from "@/types";

const consultationSchema = z.object({
  doctorId: z.string().optional(),
  symptoms: z.string().min(10, "Please describe your symptoms in detail"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  consultation_type: z.string().default("video"),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

const DUMMY_DOCTORS: Doctor[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Dr. Sarah Chen",
    specialties: [{ specialty: "Cardiology" }],
    avatar: "https://i.pravatar.cc/150?u=sarahchen",
    rating: 4.9,
    ratingCount: 128,
    bio: "Excellence in cardiovascular health with over 15 years of experience in interventional cardiology.",
    experience: 15,
    city: "Mumbai",
    state: "Maharashtra",
    fee: 1000,
    available: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Dr. James Wilson",
    specialties: [{ specialty: "Dermatology" }],
    avatar: "https://i.pravatar.cc/150?u=jameswilson",
    rating: 4.8,
    ratingCount: 95,
    bio: "Specializing in medical and cosmetic dermatology with a focus on skin cancer prevention.",
    experience: 10,
    city: "Delhi",
    state: "Delhi",
    fee: 800,
    available: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Dr. Priya Sharma",
    specialties: [{ specialty: "Pediatrics" }],
    avatar: "https://i.pravatar.cc/150?u=priyasharma",
    rating: 4.9,
    ratingCount: 210,
    bio: "Dedicated pediatrician committed to providing compassionate care for children and adolescents.",
    experience: 12,
    city: "Bangalore",
    state: "Karnataka",
    fee: 700,
    available: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Dr. Robert Miller",
    specialties: [{ specialty: "Psychiatry" }],
    avatar: "https://i.pravatar.cc/150?u=robertmiller",
    rating: 4.7,
    ratingCount: 84,
    bio: "Expert in mental health wellness, focusing on stress management and clinical psychiatry.",
    experience: 18,
    city: "Chennai",
    state: "Tamil Nadu",
    fee: 1200,
    available: true,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Dr. Anita Desai",
    specialties: [{ specialty: "Neurology" }],
    avatar: "https://i.pravatar.cc/150?u=anitadesai",
    rating: 5.0,
    ratingCount: 56,
    bio: "Specialist in neurological disorders and stroke management with advanced research background.",
    experience: 20,
    city: "Hyderabad",
    state: "Telangana",
    fee: 1500,
    available: true,
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Dr. Michael Ross",
    specialties: [{ specialty: "Orthopedics" }],
    avatar: "https://i.pravatar.cc/150?u=michaelross",
    rating: 4.6,
    ratingCount: 112,
    bio: "Focusing on sports medicine and joint replacement surgeries with a patient-first approach.",
    experience: 8,
    city: "Pune",
    state: "Maharashtra",
    fee: 1100,
    available: true,
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    name: "Dr. Elena Gilbert",
    specialties: [{ specialty: "General Medicine" }],
    avatar: "https://i.pravatar.cc/150?u=elenagilbert",
    rating: 4.9,
    ratingCount: 300,
    bio: "Comprehensive primary care for families, focusing on preventative medicine and wellness.",
    experience: 7,
    city: "Kolkata",
    state: "West Bengal",
    fee: 500,
    available: true,
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    name: "Dr. David Tennant",
    specialties: [{ specialty: "Psychiatry" }],
    avatar: "https://i.pravatar.cc/150?u=davidtennant",
    rating: 4.8,
    ratingCount: 150,
    bio: "Compassionate behavioral health specialist with expertise in adolescent psychiatry.",
    experience: 14,
    city: "Ahmedabad",
    state: "Gujarat",
    fee: 1300,
    available: true,
  },
];


const Consultation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      consultation_type: "video",
    },
  });

  const selectedDate = watch("date");
  const selectedTime = watch("time");

  const loadDoctors = useCallback(async () => {
    try {
      const doctors = await getDoctors({ availableToday: true });
      if (doctors && doctors.length > 0) {
        setAvailableDoctors(doctors);
      } else {
        // Use dummy data as fallback
        setAvailableDoctors(DUMMY_DOCTORS.filter(d => d.available));
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      // Use dummy data as fallback when database fails
      setAvailableDoctors(DUMMY_DOCTORS.filter(d => d.available));
      toast({
        title: "Using Sample Data",
        description: "Showing sample doctors for demonstration",
      });
    }
  }, [toast]);

  const loadAvailableSlots = useCallback(async (doctorId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const slots = await getAvailableSlots(doctorId, date);
      setAvailableSlots(slots);

      if (slots.length === 0) {
        toast({
          title: "No slots available",
          description: "Please select a different date or doctor",
        });
      }
    } catch (error) {
      console.error("Error loading slots:", error);
      // Generate dummy time slots as fallback
      const selectedDate = new Date(date);
      const dummySlots = [];

      // Generate slots from 9 AM to 5 PM (every 30 minutes)
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(selectedDate);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

          dummySlots.push({
            slot_start: slotStart.toISOString(),
            slot_end: slotEnd.toISOString(),
          });
        }
      }

      setAvailableSlots(dummySlots);
      toast({
        title: "Using Sample Slots",
        description: "Showing sample time slots for demonstration",
      });
    } finally {
      setLoadingSlots(false);
    }
  }, [toast]);


  // Commenting out for demo purposes - allow booking without sign in
  // useEffect(() => {
  //   if (!session) {
  //     toast({
  //       title: "Authentication required",
  //       description: "Please sign in to book a consultation",
  //       variant: "destructive",
  //     });
  //     navigate("/signin");
  //   }
  // }, [session, navigate, toast]);

  useEffect(() => {
    loadDoctors();

    // Check if doctor was selected from Doctors page
    if (location.state?.selectedDoctor) {
      setSelectedDoctor(location.state.selectedDoctor);
      setValue("doctorId", location.state.selectedDoctor.id);
      toast({
        title: "Doctor Selected",
        description: `${location.state.selectedDoctor.name} - ${location.state.selectedDoctor.specialty}`,
      });
    }

    // Load saved form data from localStorage
    const savedData = localStorage.getItem("consultationForm");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          if (parsed[key] !== undefined) {
            setValue(key as keyof ConsultationFormData, parsed[key]);
          }
        });
      } catch (e) {
        console.error("Error loading saved form:", e);
      }
    }
  }, [location.state, setValue, toast, loadDoctors]);

  useEffect(() => {
    if (selectedDoctor?.id && selectedDate) {
      loadAvailableSlots(selectedDoctor.id, selectedDate);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, selectedDate, loadAvailableSlots]);

  // Save form data to localStorage
  const formData = watch();
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem("consultationForm", JSON.stringify(formData));
    }
  }, [formData]);

  const handleBrowseDoctors = () => {
    navigate("/doctors", { state: { fromConsultation: true } });
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = availableDoctors.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setValue("doctorId", doctorId);
    setAvailableSlots([]);
    setValue("time", "");
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const start = new Date(slot.slot_start);
    const end = new Date(slot.slot_end);
    return `${start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const onSubmit = async (data: ConsultationFormData) => {
    // For demo: Allow booking even without session
    // if (!session?.user?.id) {
    //   toast({
    //     title: "Authentication required",
    //     description: "Please sign in to book a consultation",
    //     variant: "destructive",
    //   });
    //   navigate("/signin");
    //   return;
    // }

    if (!selectedDoctor) {
      toast({
        title: "Doctor required",
        description: "Please select a doctor",
        variant: "destructive",
      });
      return;
    }

    if (!data.date || !data.time) {
      toast({
        title: "Date and time required",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":");
      const slotStart = new Date(`${data.date}T${hours}:${minutes}:00`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30 minutes

      // Create appointment with actual user ID
      if (!session?.user?.id) {
        toast({
          title: "Authentication required",
          description: "Please sign in to book a consultation",
          variant: "destructive",
        });
        navigate("/signin");
        return;
      }

      await createAppointment({
        patient_id: session.user.id,
        doctor_id: selectedDoctor.id,
        slot_start: slotStart.toISOString(),
        slot_end: slotEnd.toISOString(),
        specialty: selectedDoctor.specialties?.[0]?.specialty || "General",
        symptoms: data.symptoms,
        consultation_type: data.consultation_type || "video",
      });

      toast({
        title: "Consultation Scheduled!",
        description: `Your appointment with Dr. ${selectedDoctor.name} is confirmed for ${slotStart.toLocaleString()}`,
      });

      // Clear saved form data
      localStorage.removeItem("consultationForm");

      // Navigate to dashboard or confirmation page
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Error booking appointment:", error);

      // Show actual error to user
      toast({
        title: "Booking Failed",
        description: error?.message || "Could not save appointment to database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/">
            <Button variant="ghost" className="mb-6 transition-all duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Book Your <span className="text-primary">Consultation</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Tell us about your symptoms and we'll match you with the right specialist
            </p>
          </div>

          <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Consultation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="doctorId">Select Doctor *</Label>
                  {selectedDoctor ? (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium">Selected Doctor</p>
                      <p className="text-lg font-semibold text-primary">
                        {selectedDoctor.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDoctor.specialties?.[0]?.specialty || "General"}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSelectedDoctor(null);
                          setValue("doctorId", "");
                        }}
                      >
                        Change Doctor
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select
                        onValueChange={handleDoctorChange}
                        value={selectedDoctor?.id || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDoctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialties?.[0]?.specialty || "General"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={handleBrowseDoctors}
                      >
                        Browse All Doctors
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Describe Your Symptoms *</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Please describe what you're experiencing..."
                    className={`min-h-32 ${errors.symptoms ? "border-destructive" : ""}`}
                    {...register("symptoms")}
                  />
                  {errors.symptoms && (
                    <p className="text-sm text-destructive">{errors.symptoms.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Preferred Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      min={minDate}
                      {...register("date")}
                      className={errors.date ? "border-destructive" : ""}
                      onChange={(e) => {
                        setValue("date", e.target.value);
                        setValue("time", ""); // Clear time when date changes
                      }}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Preferred Time *</Label>
                    {selectedDoctor && selectedDate ? (
                      <>
                        {loadingSlots ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <Select
                            onValueChange={(value) => {
                              const slot = availableSlots.find((s) => s.slot_start === value);
                              if (slot) {
                                const startTime = new Date(slot.slot_start);
                                const timeString = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;
                                setValue("time", timeString);
                              }
                            }}
                            value={selectedTime || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots.map((slot) => {
                                const startTime = new Date(slot.slot_start);
                                const timeString = `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;
                                return (
                                  <SelectItem key={slot.slot_start} value={slot.slot_start}>
                                    {formatTimeSlot(slot)}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-4 border rounded-lg text-center text-sm text-muted-foreground">
                            No slots available for this date
                          </div>
                        )}
                      </>
                    ) : (
                      <Input
                        id="time"
                        type="time"
                        {...register("time")}
                        className={errors.time ? "border-destructive" : ""}
                        disabled={!selectedDoctor || !selectedDate}
                      />
                    )}
                    {errors.time && (
                      <p className="text-sm text-destructive">{errors.time.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultation_type">Consultation Type</Label>
                  <Select
                    onValueChange={(value) => setValue("consultation_type", value)}
                    defaultValue="video"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Video Consultation
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">Audio Call</SelectItem>
                      <SelectItem value="chat">Chat Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    size="lg"
                    disabled={isSubmitting || !selectedDoctor || !selectedDate || !selectedTime}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Schedule Consultation
                      </>
                    )}
                  </Button>
                  {!selectedDoctor && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      size="lg"
                      onClick={handleBrowseDoctors}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Browse Available Doctors
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Consultation;
