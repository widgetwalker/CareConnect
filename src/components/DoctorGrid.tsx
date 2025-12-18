import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const doctors = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    rating: 4.9,
    reviews: 234,
    experience: "15 years",
    location: "New York, NY",
    available: "Today",
    fee: 120,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialty: "Dermatologist",
    rating: 4.8,
    reviews: 189,
    experience: "12 years",
    location: "Los Angeles, CA",
    available: "Tomorrow",
    fee: 100,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrician",
    rating: 5.0,
    reviews: 312,
    experience: "18 years",
    location: "Chicago, IL",
    available: "Today",
    fee: 110,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
  },
  {
    id: "4",
    name: "Dr. James Wilson",
    specialty: "General Physician",
    rating: 4.7,
    reviews: 156,
    experience: "10 years",
    location: "Houston, TX",
    available: "Today",
    fee: 90,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James"
  },
  {
    id: "5",
    name: "Dr. Priya Patel",
    specialty: "Psychiatrist",
    rating: 4.9,
    reviews: 278,
    experience: "14 years",
    location: "San Francisco, CA",
    available: "Tomorrow",
    fee: 150,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
  },
  {
    id: "6",
    name: "Dr. David Kim",
    specialty: "Orthopedic",
    rating: 4.8,
    reviews: 201,
    experience: "16 years",
    location: "Boston, MA",
    available: "Today",
    fee: 130,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
  }
];

const DoctorGrid = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromConsultation = location.state?.fromConsultation;

  const handleBookAppointment = (doctor: typeof doctors[0]) => {
    // Navigate to consultation with selected doctor
    navigate("/consultation", {
      state: {
        selectedDoctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
        },
      },
    });
  };

  return (
    <section id="doctors" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Meet Our <span className="text-primary">Expert Doctors</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Board-certified specialists ready to provide you with exceptional care
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-2 group">
              <CardHeader className="relative pb-4">
                <div className="flex items-start gap-4">
                  <img 
                    src={doctor.image} 
                    alt={doctor.name}
                    className="w-20 h-20 rounded-full bg-muted flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:ring-4 group-hover:ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-1 truncate">{doctor.name}</h3>
                    <Badge variant="secondary" className="mb-2">{doctor.specialty}</Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                      <span className="font-semibold">{doctor.rating}</span>
                      <span className="text-muted-foreground">({doctor.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{doctor.experience} experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{doctor.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Consultation Fee</p>
                    <p className="text-xl font-bold text-primary">${doctor.fee}</p>
                  </div>
                  <Badge variant={doctor.available === "Today" ? "default" : "secondary"}>
                    {doctor.available}
                  </Badge>
                </div>
                
                <Button 
                  className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg" 
                  variant="default"
                  onClick={() => handleBookAppointment(doctor)}
                >
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoctorGrid;
