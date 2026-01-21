import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Star, MapPin, Video, Calendar, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { getDoctors } from "@/lib/supabase-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doctor } from "@/types";
import { supabase } from "@/lib/supabaseclient";

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

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDoctors();
  }, []);

  const filterDoctors = useCallback(() => {
    let filtered = [...doctors];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.specialties.some((s) =>
            s.specialty.toLowerCase().includes(query)
          ) ||
          doc.bio?.toLowerCase().includes(query)
      );
    }

    // Specialty filter
    if (specialtyFilter !== "all") {
      filtered = filtered.filter((doc) =>
        doc.specialties.some(
          (s) => s.specialty.toLowerCase() === specialtyFilter.toLowerCase()
        )
      );
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter((doc) => doc.available);
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, specialtyFilter, availabilityFilter]);

  useEffect(() => {
    filterDoctors();
  }, [filterDoctors]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      // Fetch from existing doctors table
      const existingDoctors = await getDoctors();

      // Fetch from new doctor_profiles (for doctors who signed up)
      const { data: doctorProfiles, error } = await supabase
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

      if (error) {
        console.error("Error loading doctor profiles:", error);
      }

      // Transform doctor profiles to match Doctor interface
      const profileDoctors = (doctorProfiles || []).map((profile: any) => ({
        id: profile.doctor_id || profile.id,
        name: profile.user?.name || "Doctor",
        specialties: [{ specialty: profile.speciality }],
        avatar: profile.user?.image || `https://i.pravatar.cc/150?u=${profile.user_id}`,
        rating: parseFloat(profile.rating) || 4.5,
        ratingCount: 0,
        bio: profile.description || `${profile.experience} of experience in ${profile.speciality}`,
        experience: parseInt(profile.experience) || 5,
        city: profile.location.split(",")[0] || "India",
        state: profile.location.split(",")[1] || "",
        fee: profile.fee,
        available: true,
      }));

      // Combine both sources, prioritizing profiles over existing
      const allDoctors = [...profileDoctors];

      // Add existing doctors that don't have profiles yet
      if (existingDoctors && existingDoctors.length > 0) {
        existingDoctors.forEach((doc: any) => {
          if (!allDoctors.find(d => d.id === doc.id)) {
            allDoctors.push(doc);
          }
        });
      }

      // Fallback to dummy data if no doctors found
      if (allDoctors.length === 0) {
        setDoctors(DUMMY_DOCTORS);
        setFilteredDoctors(DUMMY_DOCTORS);
      } else {
        setDoctors(allDoctors);
        setFilteredDoctors(allDoctors);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      setDoctors(DUMMY_DOCTORS);
      setFilteredDoctors(DUMMY_DOCTORS);
    } finally {
      setLoading(false);
    }
  };


  const handleBookAppointment = (doctor: Doctor) => {
    navigate("/consultation", {
      state: {
        selectedDoctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialties?.[0]?.specialty || "General",
        },
      },
    });
  };

  const handleViewProfile = (doctor: Doctor) => {
    toast({
      title: "Doctor Profile",
      description: `Viewing profile of ${doctor.name}. Our specialty is ${doctor.specialties?.[0]?.specialty}.`,
    });
  };

  const specialties = Array.from(
    new Set(
      doctors.flatMap((doc) => doc.specialties.map((s) => s.specialty))
    )
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" className="mb-6 transition-all duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 animate-fade-in">
              Find Your <span className="text-primary">Perfect Doctor</span>
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: "100ms" }}>
              Search from our network of certified healthcare professionals across all specialties
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-12 glass-card p-6 rounded-2xl animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Search by name, specialty, or condition..."
                    className="pl-10 h-12 rounded-xl focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((spec) => (
                    <SelectItem key={spec} value={spec.toLowerCase()}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={availabilityFilter}
                onValueChange={setAvailabilityFilter}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No doctors found matching your criteria. Try adjusting your search.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => {
                  setSearchQuery("");
                  setSpecialtyFilter("all");
                  setAvailabilityFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {filteredDoctors.map((doctor, index) => (
                <Card
                  key={doctor.id}
                  className="hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-none glass-card group overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="relative">
                    <div className="absolute top-4 right-4 z-10">
                      <Badge
                        variant={doctor.available ? "default" : "secondary"}
                        className={`${doctor.available ? "bg-green-500 hover:bg-green-600" : "bg-gray-200 text-gray-500"} border-none text-[10px] px-2 py-0`}
                      >
                        {doctor.available ? "Online" : "Away"}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-20 h-20 border-2 border-primary/20 p-1">
                          <AvatarImage src={doctor.avatar} className="rounded-full object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                            {doctor.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {doctor.available && (
                          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{doctor.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex bg-yellow-400/10 px-1.5 py-0.5 rounded-lg items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-bold text-yellow-700">
                              {doctor.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            ({doctor.ratingCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {doctor.specialties.map((spec, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-none">
                          {spec.specialty}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
                      "{doctor.bio}"
                    </p>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold">{doctor.experience}Yrs Exp</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1.5 bg-orange-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold">{doctor.city}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Consultation Fee</p>
                        <p className="text-2xl font-black text-foreground">₹{doctor.fee}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl font-bold shadow-md hover:shadow-primary/30 transition-all px-4"
                          onClick={() => handleBookAppointment(doctor)}
                          disabled={!doctor.available}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Book
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Doctors;
