import { Button } from "@/components/ui/button";
import { Brain, Heart, Stethoscope, Activity, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";

const Hero = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);
  return (
    <section className="relative hero-gradient pt-20 pb-32 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-breathe animation-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2">
              <span className="px-4 py-2 rounded-full glass-card text-primary text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Powered Healthcare Companion
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Your Health,
              <span className="bg-gradient-to-r from-primary via-primary/80 to-teal-600 bg-clip-text text-transparent"> Intelligently Cared For</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Experience AI-assisted healthcare that understands you. From instant symptom checks to personalized wellness insights—your well-being journey starts here.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/symptom-checker">
                <Button size="lg" className="text-lg transition-wellness hover:scale-105 hover:shadow-wellness-lg bg-primary hover:bg-primary/90">
                  <Brain className="w-5 h-5 mr-2" />
                  Check Symptoms
                </Button>
              </Link>

              {!isLoggedIn && (
                <Link to="/signup">
                  <Button variant="outline" size="lg" className="text-lg transition-wellness hover:scale-105 hover:shadow-wellness glass-card">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="text-center group cursor-pointer animate-fade-up animation-delay-100">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center transition-wellness group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-wellness">
                  <Brain className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="text-sm font-medium">AI Diagnosis</p>
                <p className="text-xs text-muted-foreground">Smart Analysis</p>
              </div>
              <div className="text-center group cursor-pointer animate-fade-up animation-delay-200">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center transition-wellness group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-wellness">
                  <Stethoscope className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="text-sm font-medium">Expert Doctors</p>
                <p className="text-xs text-muted-foreground">Verified Specialists</p>
              </div>
              <div className="text-center group cursor-pointer animate-fade-up animation-delay-300">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center transition-wellness group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-wellness">
                  <Activity className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="text-sm font-medium">Health Tracking</p>
                <p className="text-xs text-muted-foreground">Real-time Insights</p>
              </div>
              <div className="text-center group cursor-pointer animate-fade-up animation-delay-400">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center transition-wellness group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-wellness">
                  <Shield className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="text-sm font-medium">Privacy First</p>
                <p className="text-xs text-muted-foreground">HIPAA Compliant</p>
              </div>
            </div>
          </div>

          {/* Healthcare illustration area */}
          <div className="relative group animate-fade-up animation-delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/10 rounded-3xl blur-3xl transition-opacity duration-500 group-hover:opacity-75" />

            {/* Health metrics visualization */}
            <div className="relative glass-card rounded-3xl p-8 transition-wellness group-hover:scale-[1.02]">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-health-pulse">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Wellness Score</h3>
                <p className="text-muted-foreground">Your daily health snapshot</p>
              </div>

              {/* Mock health metrics */}
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Heart Rate</span>
                    <span className="text-primary font-bold">72 BPM</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000" />
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Sleep Quality</span>
                    <span className="text-primary font-bold">85%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-1000" />
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Stress Level</span>
                    <span className="text-green-600 font-bold">Low</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000" />
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Powered by AI Health Analytics
              </p>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default Hero;
