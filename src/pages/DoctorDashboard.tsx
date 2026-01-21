import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseclient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, FileText, Stethoscope, Users, ClipboardList, PlusCircle, X, Check, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";

interface Appointment {
    id: string;
    date: string;
    status: string;
    created_at: string;
    patient: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    medical_records?: MedicalRecord[];
}

interface MedicalRecord {
    id: string;
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    uploaded_at: string;
}

interface Prescription {
    id: string;
    diagnosis: string;
    medicines: string;
    instructions: string;
    notes: string;
    created_at: string;
    appointment_id: string;
}

const DoctorDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [doctorProfile, setDoctorProfile] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("appointments");
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    // Prescription form
    const [diagnosis, setDiagnosis] = useState("");
    const [medicines, setMedicines] = useState("");
    const [instructions, setInstructions] = useState("");
    const [notes, setNotes] = useState("");

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            navigate("/signin");
            return;
        }

        // Check if user is a doctor
        if (session.user.user_metadata?.role !== "doctor") {
            toast({
                title: "Access Denied",
                description: "This dashboard is for doctors only",
                variant: "destructive",
            });
            navigate("/dashboard");
            return;
        }

        setUser(session.user);
        await loadDoctorProfile(session.user.id);
        await loadAppointments(session.user.id);
        await loadPrescriptions(session.user.id);
        setLoading(false);
    };

    const loadDoctorProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from("doctor_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error) {
            console.error("Error loading doctor profile:", error);
        } else {
            setDoctorProfile(data);
        }
    };

    const loadAppointments = async (userId: string) => {
        // First get doctor profile to find associated doctor_id
        const { data: profile } = await supabase
            .from("doctor_profiles")
            .select("doctor_id")
            .eq("user_id", userId)
            .single();

        if (!profile?.doctor_id) {
            console.log("No doctor_id found for this user");
            return;
        }

        // Get appointments for this doctor
        const { data: appointmentsData, error } = await supabase
            .from("appointments")
            .select(`
        id,
        date,
        status,
        created_at,
        user:user_id (
          id,
          name,
          email,
          image
        )
      `)
            .eq("doctor_id", profile.doctor_id)
            .order("date", { ascending: true });

        if (error) {
            console.error("Error loading appointments:", error);
        } else {
            // Fetch medical records for each patient
            const appointmentsWithRecords = await Promise.all(
                (appointmentsData || []).map(async (apt) => {
                    const { data: records } = await supabase
                        .from("medical_records")
                        .select("*")
                        .eq("patient_id", apt.user.id)
                        .order("uploaded_at", { ascending: false });

                    return {
                        ...apt,
                        patient: apt.user,
                        medical_records: records || [],
                    };
                })
            );

            setAppointments(appointmentsWithRecords);
        }
    };

    const loadPrescriptions = async (userId: string) => {
        const { data, error } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("doctor_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading prescriptions:", error);
        } else {
            setPrescriptions(data || []);
        }
    };

    const handleSendPrescription = async () => {
        if (!selectedAppointment || !diagnosis || !medicines) {
            toast({
                title: "Missing information",
                description: "Please fill in diagnosis and medicines",
                variant: "destructive",
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from("prescriptions")
                .insert({
                    id: crypto.randomUUID(),
                    appointment_id: selectedAppointment.id,
                    doctor_id: user.id,
                    patient_id: selectedAppointment.patient.id,
                    diagnosis,
                    medicines,
                    instructions: instructions || null,
                    notes: notes || null,
                })
                .select()
                .single();

            if (error) throw error;

            // Send notification to patient
            await supabase.from("notifications").insert({
                id: crypto.randomUUID(),
                user_id: selectedAppointment.patient.id,
                type: "prescription_received",
                title: "New Prescription",
                message: `Dr. ${user.user_metadata?.full_name || user.email} has sent you a prescription`,
                related_id: data.id,
                is_read: false,
            });

            toast({
                title: "Prescription sent!",
                description: "The patient has been notified",
            });

            setShowPrescriptionDialog(false);
            setDiagnosis("");
            setMedicines("");
            setInstructions("");
            setNotes("");
            loadPrescriptions(user.id);
        } catch (error: any) {
            console.error("Error sending prescription:", error);
            toast({
                title: "Error",
                description: "Failed to send prescription",
                variant: "destructive",
            });
        }
    };

    const handleCancelAppointment = async () => {
        if (!selectedAppointment) return;

        try {
            const { error } = await supabase
                .from("appointments")
                .update({ status: "cancelled" })
                .eq("id", selectedAppointment.id);

            if (error) throw error;

            // Send notification to patient
            await supabase.from("notifications").insert({
                id: crypto.randomUUID(),
                user_id: selectedAppointment.patient.id,
                type: "appointment_cancelled",
                title: "Appointment Cancelled",
                message: `Your appointment on ${format(new Date(selectedAppointment.date), "MMM dd, yyyy")} has been cancelled by the doctor`,
                related_id: selectedAppointment.id,
                is_read: false,
            });

            toast({
                title: "Appointment cancelled",
                description: "The patient has been notified",
            });

            setShowCancelDialog(false);
            loadAppointments(user.id);
        } catch (error: any) {
            console.error("Error cancelling appointment:", error);
            toast({
                title: "Error",
                description: "Failed to cancel appointment",
                variant: "destructive",
            });
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            scheduled: "bg-green-100 text-green-800",
            confirmed: "bg-green-100 text-green-800",
            completed: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/signin");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Stethoscope className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const upcomingAppointments = appointments.filter(a =>
        a.status === "scheduled" && new Date(a.date) >= new Date()
    );
    const todayAppointments = upcomingAppointments.filter(a =>
        format(new Date(a.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
    );

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 container mx-auto py-8 px-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
                            <p className="text-muted-foreground mt-2">
                                Welcome back, Dr. {user?.user_metadata?.full_name || user?.email}!
                            </p>
                        </div>
                        <Button onClick={handleSignOut} variant="outline">
                            Sign Out
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Scheduled for today
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total upcoming
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Prescriptions Sent</CardTitle>
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{prescriptions.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total prescriptions
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="appointments">Appointments</TabsTrigger>
                            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="appointments" className="space-y-4">
                            {appointments.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                        <h3 className="text-xl font-semibold mb-2">No appointments yet</h3>
                                        <p className="text-muted-foreground">
                                            Patients will be able to book appointments with you
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                appointments.map((appointment) => (
                                    <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={appointment.patient.image} />
                                                        <AvatarFallback>
                                                            {appointment.patient.name?.charAt(0) || "P"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg">{appointment.patient.name}</CardTitle>
                                                        <CardDescription>{appointment.patient.email}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(appointment.status)}>
                                                    {appointment.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(appointment.date), "MMM dd, yyyy")}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    {format(new Date(appointment.date), "hh:mm a")}
                                                </div>
                                            </div>

                                            {appointment.medical_records && appointment.medical_records.length > 0 && (
                                                <div className="border-t pt-4">
                                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Medical Records
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {appointment.medical_records.map((record) => (
                                                            <div key={record.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                                                <div>
                                                                    <p className="text-sm font-medium">{record.title}</p>
                                                                    <p className="text-xs text-muted-foreground">{record.description}</p>
                                                                </div>
                                                                <Button size="sm" variant="outline" asChild>
                                                                    <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                                                                        View
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowPrescriptionDialog(true);
                                                    }}
                                                    disabled={appointment.status !== "scheduled"}
                                                >
                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                    Send Prescription
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowCancelDialog(true);
                                                    }}
                                                    disabled={appointment.status !== "scheduled"}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="prescriptions" className="space-y-4">
                            {prescriptions.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                        <h3 className="text-xl font-semibold mb-2">No prescriptions yet</h3>
                                        <p className="text-muted-foreground">
                                            Prescriptions you send to patients will appear here
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                prescriptions.map((prescription) => (
                                    <Card key={prescription.id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">Prescription</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(prescription.created_at), "MMM dd, yyyy")}
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold">Diagnosis:</p>
                                                <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Medicines:</p>
                                                <p className="text-sm text-muted-foreground">{prescription.medicines}</p>
                                            </div>
                                            {prescription.instructions && (
                                                <div>
                                                    <p className="text-sm font-semibold">Instructions:</p>
                                                    <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                                                </div>
                                            )}
                                            {prescription.notes && (
                                                <div>
                                                    <p className="text-sm font-semibold">Notes:</p>
                                                    <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Prescription Dialog */}
                <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Send Prescription</DialogTitle>
                            <DialogDescription>
                                Create and send a prescription to {selectedAppointment?.patient.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="diagnosis">Diagnosis *</Label>
                                <Input
                                    id="diagnosis"
                                    placeholder="Enter diagnosis"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="medicines">Medicines *</Label>
                                <Textarea
                                    id="medicines"
                                    placeholder="List medicines with dosage (e.g., Paracetamol 500mg - 1 tablet twice daily)"
                                    value={medicines}
                                    onChange={(e) => setMedicines(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instructions">Instructions</Label>
                                <Textarea
                                    id="instructions"
                                    placeholder="Additional instructions for the patient"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Private notes (optional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendPrescription}>
                                <Check className="w-4 h-4 mr-2" />
                                Send Prescription
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Cancel Dialog */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel Appointment</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel this appointment with {selectedAppointment?.patient.name}?
                                The patient will be notified.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                No, Keep it
                            </Button>
                            <Button variant="destructive" onClick={handleCancelAppointment}>
                                <X className="w-4 h-4 mr-2" />
                                Yes, Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default DoctorDashboard;
