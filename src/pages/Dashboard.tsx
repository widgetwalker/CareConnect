import { useEffect, useState, useCallback } from "react";
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
import { Calendar, FileText, Activity, Clock, Video, User, Mail, Phone } from "lucide-react";
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

  // Doctor ID to Name mapping (matches our dummy doctors)
  const DOCTOR_NAMES: Record<string, string> = {
    "11111111-1111-1111-1111-111111111111": "Dr. Sarah Chen",
    "22222222-2222-2222-2222-222222222222": "Dr. James Wilson",
    "33333333-3333-3333-3333-333333333333": "Dr. Priya Sharma",
    "44444444-4444-4444-4444-444444444444": "Dr. Robert Miller",
    "55555555-5555-5555-5555-555555555555": "Dr. Anita Desai",
    "66666666-6666-6666-6666-666666666666": "Dr. Michael Ross",
    "77777777-7777-7777-7777-777777777777": "Dr. Elena Gilbert",
    "88888888-8888-8888-8888-888888888888": "Dr. David Tennant",
  };

  const getDoctorName = (doctorId: string) => {
    return DOCTOR_NAMES[doctorId] || `Doctor ${doctorId.substring(0, 8)}`;
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
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-base">{session.user.name || patientProfile?.full_name || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-base">{session.user.email}</p>
                      </div>
                    </div>
                    {patientProfile?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p className="text-base">{patientProfile.phone}</p>
                        </div>
                      </div>
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
                              {getDoctorName(apt.doctor_id)}
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
                                {getDoctorName(apt.doctor_id)}
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
    </div>
  );
};

export default Dashboard;
