import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { useSession } from "@/lib/auth";
import { getDoctors } from "@/lib/supabase-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ArrowRight, Loader2, Brain, Stethoscope, Heart, Shield, Activity, Sparkles, Send, Bot, User, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredDoctors, setFeaturedDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedDoctors();
  }, []);

  const loadFeaturedDoctors = async () => {
    try {
      const doctors = await getDoctors({
        minRating: 4.0,
        availableToday: true,
      });

      const sorted = doctors
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

      setFeaturedDoctors(sorted);
    } catch (error: any) {
      console.error("Error loading featured doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: any) => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book an appointment",
      });
      navigate("/signin");
      return;
    }

    navigate("/consultation", {
      state: {
        selectedDoctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialties[0]?.specialty || "General",
        },
      },
    });
  };

  return (
    <div className="min-h-screen">
      <main>
        <Hero />

        {/* AI Feature Highlight */}
        <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-up">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium inline-flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI-Powered Feature
                </span>
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Instant Symptom <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">Analysis</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Describe your symptoms and get instant AI-powered health insights. Our intelligent system analyzes your symptoms and provides personalized recommendations.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Get instant health assessments 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Receive personalized care recommendations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Know when to seek professional help</span>
                  </li>
                </ul>
                <Link to="/symptom-checker">
                  <Button size="lg" className="transition-wellness hover:scale-105 hover:shadow-wellness-lg">
                    <Brain className="w-5 h-5 mr-2" />
                    Try Symptom Checker
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="relative animate-fade-up animation-delay-200">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/10 rounded-3xl blur-3xl" />
                <Card className="relative glass-card border-0 shadow-wellness-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Symptom Checker</CardTitle>
                        <CardDescription>AI Health Analysis</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="glass-card rounded-xl p-4 border-l-4 border-primary">
                      <p className="text-sm text-muted-foreground italic">
                        "I've been experiencing headaches and fatigue for the past two days..."
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                        <Activity className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Tension Headache</p>
                          <p className="text-xs text-green-600">Low Severity</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium">General Fatigue</p>
                          <p className="text-xs text-amber-600">Monitor Recommended</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <Features />

        {/* Featured Doctors Section */}
        {loading ? (
          <section className="py-16 wellness-gradient">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            </div>
          </section>
        ) : featuredDoctors.length > 0 ? (
          <section className="py-20 wellness-gradient" id="featured-doctors">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium inline-flex items-center gap-2 mb-4">
                  <Stethoscope className="w-4 h-4" />
                  Expert Care
                </span>
                <h2 className="text-4xl font-bold mb-4">
                  Meet Our <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">Healthcare Experts</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Connect with certified healthcare professionals ready to provide personalized care
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
                {featuredDoctors.slice(0, 3).map((doctor, index) => (
                  <Card
                    key={doctor.id}
                    className={`glass-card border-0 hover:shadow-wellness-lg transition-wellness hover:scale-105 cursor-pointer animate-fade-up`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleBookAppointment(doctor)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                          <AvatarImage src={doctor.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-teal-600 text-white">
                            {doctor.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{doctor.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">
                              {doctor.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({doctor.ratingCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {doctor.specialties.slice(0, 2).map((spec: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec.specialty}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="outline" className="w-full mt-2 transition-wellness hover:bg-primary hover:text-white">
                          Book Consultation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/doctors")}
                  className="transition-wellness hover:scale-105 hover:shadow-wellness"
                >
                  View All Doctors
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Trust Section */}
        <section className="py-20 bg-gradient-to-b from-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Trusted by Thousands</h2>
              <p className="text-muted-foreground">Your health data is safe with enterprise-grade security</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
                <p className="text-sm text-muted-foreground">Full compliance with healthcare regulations</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">100K+ Users</h3>
                <p className="text-sm text-muted-foreground">Trusted by users worldwide</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">500+ Doctors</h3>
                <p className="text-sm text-muted-foreground">Verified healthcare professionals</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">Always here when you need us</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 via-teal-500/10 to-primary/10">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold mb-6">
                Start Your Wellness Journey Today
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of users who trust CareConnect for their healthcare needs. Get started for free and experience the future of healthcare.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="transition-wellness hover:scale-105 hover:shadow-wellness-lg text-lg px-8">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/symptom-checker">
                  <Button size="lg" variant="outline" className="transition-wellness hover:scale-105 glass-card text-lg px-8">
                    <Brain className="w-5 h-5 mr-2" />
                    Try Symptom Checker
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Index;
