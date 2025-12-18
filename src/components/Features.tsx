import { Brain, Stethoscope, Activity, Shield, Heart, Pill, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI Symptom Checker",
    description: "Get instant, AI-powered health assessments. Describe your symptoms and receive personalized guidance on next steps.",
    color: "from-primary to-teal-600",
  },
  {
    icon: Stethoscope,
    title: "Expert Consultations",
    description: "Connect with verified healthcare professionals for video consultations from the comfort of your home.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Activity,
    title: "Health Analytics",
    description: "Track your wellness journey with comprehensive health metrics, trends, and personalized insights.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Pill,
    title: "Medication Reminders",
    description: "Never miss a dose with smart medication tracking and timely reminder notifications.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Heart,
    title: "Wellness Programs",
    description: "Access curated wellness programs for mental health, nutrition, fitness, and stress management.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Easy Scheduling",
    description: "Book appointments with your preferred healthcare providers in just a few clicks.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: MessageCircle,
    title: "24/7 Health Chat",
    description: "Get answers to your health questions anytime with our AI-powered health assistant.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Shield,
    title: "Privacy Protected",
    description: "Your health data is encrypted and secured with enterprise-grade security standards.",
    color: "from-slate-600 to-slate-700",
  },
];

const Features = () => {
  return (
    <section className="py-24 wellness-gradient">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium inline-block mb-4">
            Why Choose CareConnect
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Complete Healthcare,
            <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent"> Reimagined</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Experience healthcare that adapts to your needs. Our AI-powered platform combines cutting-edge technology with compassionate care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group glass-card border-0 transition-wellness hover:scale-105 hover:shadow-wellness-lg animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-20 text-center">
          <p className="text-muted-foreground mb-8">Trusted by healthcare professionals worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-medium">FDA Registered</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <span className="font-medium">100K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              <span className="font-medium">500+ Doctors</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
