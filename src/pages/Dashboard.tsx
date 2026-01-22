import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseclient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import {
  getUserAppointments,
  getPatientPrescriptions,
  getMedicalRecords,
  getPatientProfile,
} from "@/lib/supabase-queries";
import { Calendar, FileText, Activity, Clock, Video, User, Mail, Phone, Pencil, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Appointment, Prescription, MedicalRecord, PatientProfile } from "@/types";
import { MedicalRecords } from "@/components/MedicalRecords";
import { Prescriptions } from "@/components/Prescriptions";
import { Notifications } from "@/components/Notifications";

const Dashboard = () => {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Call Notification State
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);

  // Active Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle Active Call Stream
  useEffect(() => {
    if (isCallActive && incomingCall?.callType === 'video') {
      // Request Camera Access
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          toast({
            title: "Camera Error",
            description: "Could not access camera/microphone. Please check permissions.",
            variant: "destructive"
          });
        });
    }

    return () => {
      // Cleanup stream on end
      if (!isCallActive && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCallActive, incomingCall]);

  const handleEndCall = () => {
    setIsCallActive(false);
    setShowCallDialog(false);
    setIncomingCall(null);

    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    toast({ title: "Call Ended", description: "Video call session ended." });
  };

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Sync edit state with loaded data
  useEffect(() => {
    if (session?.user || patientProfile) {
      const name = patientProfile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.name || "";
      setEditName(name);
      setEditPhone(patientProfile?.phone || "");
    }
  }, [session, patientProfile]);

  // Real-time Call Listener
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log("Setting up real-time call listener for:", session.user.id);

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          if (payload.new.type === 'incoming_call') {
            try {
              let callData = { doctorName: 'Doctor', callType: 'Video' };
              try {
                const parsed = JSON.parse(payload.new.message);
                callData = { ...callData, ...parsed };
              } catch (e) {
                callData.doctorName = 'Doctor';
              }
              setIncomingCall(callData);
              setShowCallDialog(true);
            } catch (err) {
              console.error("Error processing incoming call:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]);

  const handleAnswerCall = async () => {
    setShowCallDialog(false);
    setIsCallActive(true);
    toast({ title: "Call Connected", description: "Camera starting..." });

    // Signal Acceptance to Doctor
    // We send this notification TO the Doctor's ID so they can see it via RLS
    if (incomingCall?.doctorId) {
      try {
        await supabase.from("notifications").insert({
          id: crypto.randomUUID(),
          user_id: incomingCall.doctorId, // Send to Doctor!
          type: "call_accepted",
          title: "Call Accepted",
          message: JSON.stringify({ patientId: session.user.id }),
          is_read: false
        });
      } catch (e) { console.error("Signal error", e); }
    } else {
      console.warn("No doctor ID found in call data, cannot reply.");
    }
  };

  const handleDeclineCall = () => {
    setShowCallDialog(false);
    setIncomingCall(null);
    toast({ title: "Call Declined", description: "You declined the call." });
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;

    console.log("Saving profile for user:", session.user.id);

    try {
      // 1. Ensure user exists in public.user table
      const { data: existingUser } = await supabase
        .from("user")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!existingUser) {
        // Create user record if missing
        console.log("User missing in public table, creating...");
        const { error: createError } = await supabase
          .from("user")
          .insert({
            id: session.user.id,
            email: session.user.email,
            name: editName || session.user.email?.split('@')[0] || "User",
            role: "patient"
          });

        if (createError) {
          console.error("Failed to create user base record:", createError);
          // Continue - maybe it exists but RLS hid it
        }
      } else {
        // Update existing user name
        const { error: userError } = await supabase
          .from("user")
          .update({ name: editName })
          .eq("id", session.user.id);

        if (userError) console.error("Error updating user table:", userError);
      }

      // 2. Update auth metadata (name)
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: editName }
      });

      if (authError) console.error("Error updating auth:", authError);

      // 3. Update user_profiles table (detailed info)
      // Check if table exists/is accessible
      const { error: accessError } = await supabase
        .from("user_profiles")
        .select("id")
        .limit(1);

      if (accessError && accessError.code === '42P01') {
        console.error("Table user_profiles does not exist!");
        toast({
          title: "System Error",
          description: "Profile table missing. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: session.user.id,
          full_name: editName,
          phone: editPhone,
          email: session.user.email,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Profile update error details:", profileError);
        throw new Error(profileError.message);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      setIsEditingProfile(false);
      loadDashboardData();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message || "Unknown error"}`,
        variant: "destructive"
      });
    }
  };

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsPending(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!session?.user?.id) {
      console.log("No user session found, skipping data load");
      return;
    }

    console.log("Loading dashboard data for user:", session.user.id);
    setLoading(true);
    try {
      const [appts, scripts, records, profile] = await Promise.all([
        getUserAppointments(session.user.id),
        getPatientPrescriptions(session.user.id),
        getMedicalRecords(session.user.id),
        getPatientProfile(session.user.id),
      ]);

      console.log("Appointments fetched:", appts);
      console.log("Prescriptions fetched:", scripts);
      console.log("Medical records fetched:", records);
      console.log("Patient profile fetched:", profile);

      setAppointments(appts as Appointment[]);
      setPrescriptions(scripts as Prescription[]);
      setMedicalRecords(records as MedicalRecord[]);
      setPatientProfile(profile as PatientProfile);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, toast]);

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/signin");
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session?.user?.id, loadDashboardData]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign out";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const upcomingAppointments = appointments.filter((apt) => {
    // Show all active appointments (pending or confirmed) regardless of date
    // This ensures past pending appointments still show up until resolved
    return apt.status !== "cancelled" && apt.status !== "completed";
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back, {session.user.name || session.user.email}!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Notifications userId={session.user.id} />
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="records">Medical Records</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {upcomingAppointments.length === 1 ? "appointment" : "appointments"} scheduled
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{prescriptions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Current prescriptions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{medicalRecords.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total records
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Your account details</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                      {isEditingProfile ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {isEditingProfile ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Phone Number"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveProfile}>Save Changes</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-base">{patientProfile?.full_name || session.user.name || "Not set"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-base">{session.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Phone</p>
                            <p className="text-base">{patientProfile?.phone || "Not set"}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate("/doctors")}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Browse Doctors
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate("/consultation")}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Consultation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {upcomingAppointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>Your scheduled consultations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {apt.doctor_name || `Doctor ${apt.doctor_id.substring(0, 8)}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(apt.date)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Appointments</CardTitle>
                  <CardDescription>Your appointment history</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No appointments found</p>
                      <Button
                        className="mt-4"
                        onClick={() => navigate("/consultation")}
                      >
                        Book Your First Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">
                                {apt.doctor_name || `Doctor ${apt.doctor_id.substring(0, 8)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {apt.specialty || "General Consultation"}
                              </p>
                            </div>
                            <Badge className={getStatusColor(apt.status)}>
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(apt.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {apt.consultation_type || "video"}
                            </div>
                          </div>
                          {apt.symptoms && (
                            <p className="text-sm pt-2 border-t">
                              <span className="font-medium">Symptoms: </span>
                              {apt.symptoms}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              <Prescriptions userId={session.user.id} />
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              <MedicalRecords userId={session.user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>


      {/* Incoming Call Dialog */}
      {
        showCallDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card text-card-foreground border shadow-xl rounded-xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-300">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  {incomingCall?.callType === 'audio' ? <Phone className="w-8 h-8 text-primary" /> : <Video className="w-8 h-8 text-primary" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Incoming {incomingCall?.callType} Call</h3>
                  <p className="text-muted-foreground">{incomingCall?.doctorName} is calling...</p>
                </div>
                <div className="flex gap-4 justify-center pt-4">
                  <Button variant="destructive" size="lg" className="rounded-full w-14 h-14 p-0" onClick={handleDeclineCall}>
                    <X className="w-6 h-6" />
                  </Button>
                  <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14 p-0" onClick={handleAnswerCall}>
                    <Phone className="w-6 h-6" />
                  </Button>
                </div>
                <div className="flex justify-between px-8 text-xs text-muted-foreground font-medium">
                  <span>Decline</span>
                  <span>Answer</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Active Video Call Interface */}
      {isCallActive && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">

          {/* Header / Info */}
          <div className="absolute top-8 left-8 z-10">
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-semibold">{incomingCall?.doctorName}</span>
              <span className="text-sm opacity-75">({formatDate(new Date().toISOString())})</span>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-gray-900 rounded-xl overflow-hidden shadow-2xl mx-4">
            {/* Main Video (My stream for now, effectively mirror) */}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
            />

            {/* Placeholder for Remote Stream (simulated) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white/20 flex items-center justify-center overflow-hidden">
              <User className="w-12 h-12 text-muted-foreground opacity-50" />
              <p className="absolute bottom-2 text-xs text-white/50">Dr. Video (Waiting...)</p>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 flex gap-6 z-10">
            <Button variant="secondary" size="lg" className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600 border-none text-white">
              <Video className="w-6 h-6" />
            </Button>
            <Button variant="secondary" size="lg" className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600 border-none text-white">
              <Phone className="w-6 h-6" />
            </Button>

            <Button variant="destructive" size="lg" className="rounded-full w-16 h-16 shadow-lg hover:scale-105 transition-transform" onClick={handleEndCall}>
              <Phone className="w-8 h-8 rotate-[135deg]" />
            </Button>
          </div>
        </div>
      )}
    </div >
  );
};

export default Dashboard;
