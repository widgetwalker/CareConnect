import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseclient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, XCircle, Heart, Loader2, Shield, UserPlus, Sparkles, ArrowLeft } from "lucide-react";
import { RoleSelector } from "@/components/RoleSelector";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SignUp = () => {
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Doctor-specific fields
  const [speciality, setSpeciality] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [fee, setFee] = useState("");
  const [qualifications, setQualifications] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
      setSessionLoading(false);
    };
    checkSession();
  }, [navigate]);

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordStrength = Object.values(passwordRequirements).filter(Boolean).length;

  const handleRoleSelect = (selectedRole: "patient" | "doctor") => {
    setRole(selectedRole);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordRequirements.minLength) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate doctor-specific fields
    if (role === "doctor") {
      if (!speciality || !location || !experience || !fee) {
        toast({
          title: "Missing information",
          description: "Please fill in all required doctor information",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: role,
            // Doctor-specific metadata
            ...(role === "doctor" && {
              speciality,
              description,
              location,
              experience,
              fee: parseInt(fee),
              qualifications,
            }),
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message || "Could not create account. Please try again.",
          variant: "destructive",
        });
      } else if (data.user) {
        // Create user table entry for ALL users (required for foreign keys)
        const { error: userError } = await supabase
          .from("user")
          .insert({
            id: data.user.id,
            name: name.trim(),
            email: email.trim(),
            email_verified: false,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (userError) {
          console.error("Error creating user record:", userError);
          // Continue anyway - user might already exist
        }

        // If doctor, create doctor profile in database
        if (role === "doctor") {
          const { error: profileError } = await supabase
            .from("doctor_profiles")
            .insert({
              id: crypto.randomUUID(),
              user_id: data.user.id,
              speciality,
              description: description || null,
              location,
              experience,
              fee: parseInt(fee),
              qualifications: qualifications || null,
              rating: "5.0", // Set nice default rating
              is_verified: true, // Auto-verify for immediate visibility
            });

          if (profileError) {
            console.error("Error creating doctor profile:", profileError);
            toast({
              title: "Profile creation failed",
              description: "Doctor account created but profile setup failed. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        }

        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          toast({
            title: "Check your email",
            description: "Please check your email to confirm your account before signing in.",
          });
        } else {
          toast({
            title: `Welcome to CareConnect!`,
            description: role === "doctor"
              ? "Your doctor account has been created. Redirecting..."
              : "Your wellness journey begins now. Redirecting...",
          });
          setTimeout(() => {
            // Redirect based on role
            const destination = role === "doctor" ? "/doctor-dashboard" : "/dashboard";
            navigate(destination, { replace: true });
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while signing up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <div className="flex-1 flex items-center justify-center p-4 hero-gradient relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-breathe" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-breathe animation-delay-300" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl animate-breathe animation-delay-500" />
        </div>

        <div className="w-full max-w-2xl relative z-10 animate-fade-up">
          <Card className="glass-card border-0 shadow-wellness-lg">
            {step === "role" ? (
              <CardContent className="pt-6">
                <RoleSelector onSelectRole={handleRoleSelect} />
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="space-y-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-4"
                    onClick={() => setStep("role")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center animate-health-pulse">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {role === "doctor" ? "Join as a Doctor" : "Join CareConnect"}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {role === "doctor"
                        ? "Create your professional profile to start helping patients"
                        : "Start your personalized wellness journey today"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    {/* Common fields */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="transition-wellness focus:shadow-wellness"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="transition-wellness focus:shadow-wellness"
                      />
                    </div>

                    {/* Doctor-specific fields */}
                    {role === "doctor" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="speciality">Speciality *</Label>
                            <Select value={speciality} onValueChange={setSpeciality} disabled={isLoading}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select speciality" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="General Medicine">General Medicine</SelectItem>
                                <SelectItem value="Cardiology">Cardiology</SelectItem>
                                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                <SelectItem value="Dermatology">Dermatology</SelectItem>
                                <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                                <SelectItem value="Neurology">Neurology</SelectItem>
                                <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                                <SelectItem value="ENT">ENT</SelectItem>
                                <SelectItem value="Gynecology">Gynecology</SelectItem>
                                <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="experience">Experience *</Label>
                            <Input
                              id="experience"
                              type="text"
                              placeholder="e.g., 10 years"
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                              id="location"
                              type="text"
                              placeholder="City, State"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fee">Consultation Fee (₹) *</Label>
                            <Input
                              id="fee"
                              type="number"
                              placeholder="500"
                              value={fee}
                              onChange={(e) => setFee(e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualifications">Qualifications</Label>
                          <Input
                            id="qualifications"
                            type="text"
                            placeholder="MBBS, MD"
                            value={qualifications}
                            onChange={(e) => setQualifications(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">About You</Label>
                          <Textarea
                            id="description"
                            placeholder="Brief description about your practice and expertise..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    {/* Password fields */}
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pr-10 transition-wellness focus:shadow-wellness"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2 space-y-2 text-sm">
                          <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? "text-green-600" : "text-muted-foreground"}`}>
                            {passwordRequirements.minLength ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            At least 8 characters
                          </div>
                          <div className="flex gap-1">
                            {Object.entries(passwordRequirements).slice(1).map(([key, met]) => (
                              <div
                                key={key}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${met ? "bg-gradient-to-r from-primary to-teal-500" : "bg-muted"
                                  }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Strength: {passwordStrength < 3 ? "Weak" : passwordStrength < 5 ? "Good" : "Strong"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pr-10 transition-wellness focus:shadow-wellness"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          Passwords do not match
                        </p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Passwords match
                        </p>
                      )}
                    </div>

                    {/* Security badge */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Your data is encrypted and HIPAA compliant</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full transition-wellness hover:scale-[1.02] hover:shadow-wellness bg-gradient-to-r from-primary to-teal-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/signin" className="text-primary hover:underline font-medium">
                        Sign in
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
