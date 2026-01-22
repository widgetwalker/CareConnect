import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseclient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, FileText, Stethoscope, Users, ClipboardList, PlusCircle, X, Check, Edit, Video, Phone, MessageCircle } from "lucide-react";
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
    specialty?: string;
    symptoms?: string;
    consultation_type?: string;
    prescription?: Prescription; // Added prescription field
}

interface Prescription {
    id: string;
    diagnosis: string;
    medicines: string;
    instructions?: string;
    notes?: string;
    created_at: string;
}

interface MedicalRecord {
    id: string;
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    uploaded_at: string;
}

const DoctorDashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [doctorProfile, setDoctorProfile] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [showRecordsDialog, setShowRecordsDialog] = useState(false);
    const [showViewPrescriptionDialog, setShowViewPrescriptionDialog] = useState(false);
    const [viewPrescriptionData, setViewPrescriptionData] = useState<Prescription | null>(null);

    // Prescription form
    const [diagnosis, setDiagnosis] = useState("");
    const [medicines, setMedicines] = useState("");
    const [instructions, setInstructions] = useState("");
    const [notes, setNotes] = useState("");

    // Reschedule form
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");

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
        setLoading(false);
    };

    const loadDoctorProfile = async (userId: string) => {
        console.log("Loading doctor profile for user_id:", userId);

        const { data, error } = await supabase
            .from("doctor_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error) {
            console.error("Error loading doctor profile:", error);
            console.log("Error details:", JSON.stringify(error, null, 2));
        } else {
            console.log("Doctor profile loaded:", data);
            setDoctorProfile(data);
        }
    };

    const loadAppointments = async (userId: string) => {
        console.log("=== Loading appointments for user:", userId);

        // Get the user's email for fallback lookup
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user email:", user?.email);

        // First get doctor profile to find associated doctor_id
        let profile = null;

        // Try to find by user_id first
        const { data: profileByUserId, error: userIdError } = await supabase
            .from("doctor_profiles")
            .select("id, doctor_id, user_id")
            .eq("user_id", userId)
            .single();

        if (profileByUserId) {
            profile = profileByUserId;
            console.log("Found profile by user_id:", profile);
        } else {
            console.log("No profile found by user_id, trying email lookup...");

            // If not found by user_id, try to find by matching email in the user table
            if (user?.email) {
                const { data: allProfiles } = await supabase
                    .from("doctor_profiles")
                    .select(`
                        id,
                        doctor_id,
                        user_id,
                        user:user_id (
                            email
                        )
                    `);

                console.log("All doctor profiles:", allProfiles);
                console.log("Number of profiles:", allProfiles?.length);

                // Log each profile for debugging
                allProfiles?.forEach((p: any, index: number) => {
                    console.log(`Profile ${index}:`, p);
                    console.log(`  - id: ${p.id}`);
                    console.log(`  - doctor_id: ${p.doctor_id}`);
                    console.log(`  - user_id: ${p.user_id}`);
                    console.log(`  - user: ${JSON.stringify(p.user)}`);
                });

                // Find the profile where the user's email matches
                profile = allProfiles?.find((p: any) => p.user?.email === user.email);
                console.log("Found profile by email:", profile);

                // Fallback: If there's only one profile and email matching didn't work, just use it
                if (!profile && allProfiles && allProfiles.length === 1) {
                    console.log("Only one doctor profile exists, using it as fallback");
                    profile = allProfiles[0];
                }
            }
        }

        if (!profile) {
            console.log("No doctor profile found for this user at all!");
            return;
        }

        // Use doctor_id if available, otherwise use profile.id
        // This matches the logic in getDoctors()
        const doctorIdToQuery = profile.doctor_id || profile.id;


        console.log("Loading appointments for doctor ID:", doctorIdToQuery);

        // Get all appointments for this doctor (without joins to avoid FK errors)
        const { data: appointmentsData, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("doctor_id", doctorIdToQuery)
            .order("date", { ascending: true });

        console.log("Query params - doctor_id:", doctorIdToQuery);
        console.log("Appointments query error:", error);
        console.log("Appointments data:", appointmentsData);

        if (error) {
            console.error("Error loading appointments:", error);
        } else {
            console.log("Appointments loaded:", appointmentsData);

            // Fetch patient details and medical records for each appointment
            const appointmentsWithDetails = await Promise.all(
                (appointmentsData || []).map(async (apt) => {
                    // Fetch patient details from user_profiles
                    const { data: patientProfile } = await supabase
                        .from("user_profiles")
                        .select("id, full_name, email, avatar_url")
                        .eq("id", apt.user_id)
                        .single();

                    // Fetch medical records
                    const { data: records, error: recordsError } = await supabase
                        .from("medical_records")
                        .select("*")
                        .eq("patient_id", apt.user_id)
                        .order("uploaded_at", { ascending: false });

                    // Log medical records fetch result for debugging
                    if (recordsError) {
                        console.error(`Error fetching medical records for patient ${apt.user_id}:`, recordsError);
                        console.error("Error details:", JSON.stringify(recordsError, null, 2));
                    } else {
                        console.log(`Fetched ${records?.length || 0} medical records for patient ${apt.user_id}`);
                    }

                    // Fetch existing prescription (Get the latest one)
                    const { data: prescriptions } = await supabase
                        .from("prescriptions")
                        .select("*")
                        .eq("appointment_id", apt.id)
                        .order("created_at", { ascending: false })
                        .limit(1);

                    const prescription = prescriptions && prescriptions.length > 0 ? prescriptions[0] : null;

                    return {
                        ...apt,
                        patient: {
                            id: apt.user_id,
                            name: patientProfile?.full_name || "Patient",
                            email: patientProfile?.email || "",
                            image: patientProfile?.avatar_url || "",
                        },
                        medical_records: records || [],
                        prescription: prescription || null,
                    };
                })
            );

            console.log("Appointments with details:", appointmentsWithDetails);
            setAppointments(appointmentsWithDetails);
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

        console.log("Sending prescription...");
        console.log("Doctor ID:", user.id);
        console.log("Patient ID:", selectedAppointment.patient.id);

        try {
            // OPTIONAL: Ensure doctor exists in public user table (Fixes FK error)
            const { error: userCheck } = await supabase
                .from("user")
                .upsert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || "Doctor",
                    role: "doctor"
                }, { onConflict: 'id' });

            if (userCheck) console.warn("Could not upsert doctor user:", userCheck);

            const prescriptionData = {
                id: crypto.randomUUID(),
                appointment_id: selectedAppointment.id,
                doctor_id: user.id,
                patient_id: selectedAppointment.patient.id,
                diagnosis,
                medicines,
                instructions: instructions || null,
                notes: notes || null,
            };

            const { data, error } = await supabase
                .from("prescriptions")
                .insert(prescriptionData)
                .select()
                .single();

            if (error) {
                console.error("Prescription insert failed:", error);

                // FALLBACK: If FK error, try inserting without doctor_id/patient_id FKs if possible, 
                // OR alert the user clearly
                if (error.code === '23503') { // Foreign key violation
                    throw new Error("System Error: Doctor or Patient ID mismatch in database. Please contact admin.");
                }
                throw error;
            }

            // Send notification to patient
            await supabase.from("notifications").insert({
                id: crypto.randomUUID(),
                user_id: selectedAppointment.patient.id,
                type: "prescription_received",
                title: "New Prescription",
                message: `Dr. ${user.user_metadata?.full_name || user.email} has sent you a prescription for ${diagnosis}`,
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

            // CRITICAL: Refresh the list so the "View Prescription" button updates with the NEW data
            await loadAppointments(user.id);
            setSelectedAppointment(null);
        } catch (error: any) {
            console.error("Error sending prescription:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send prescription",
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
                message: `Your appointment on ${format(new Date(selectedAppointment.date), "MMM dd, yyyy 'at' hh:mm a")} has been cancelled by Dr. ${user.user_metadata?.full_name || user.email}`,
                related_id: selectedAppointment.id,
                is_read: false,
            });

            toast({
                title: "Appointment cancelled",
                description: "The patient has been notified",
            });

            setShowCancelDialog(false);
            setSelectedAppointment(null);
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

    const handleRescheduleAppointment = async () => {
        if (!selectedAppointment || !newDate || !newTime) {
            toast({
                title: "Missing information",
                description: "Please select both date and time",
                variant: "destructive",
            });
            return;
        }

        try {
            const newDateTime = new Date(`${newDate}T${newTime}`);

            const { error } = await supabase
                .from("appointments")
                .update({
                    date: newDateTime.toISOString(),
                    status: "scheduled"
                })
                .eq("id", selectedAppointment.id);

            if (error) throw error;

            // Send notification to patient
            await supabase.from("notifications").insert({
                id: crypto.randomUUID(),
                user_id: selectedAppointment.patient.id,
                type: "appointment_rescheduled",
                title: "Appointment Rescheduled",
                message: `Your appointment has been rescheduled to ${format(newDateTime, "MMM dd, yyyy 'at' hh:mm a")} by Dr. ${user.user_metadata?.full_name || user.email}`,
                related_id: selectedAppointment.id,
                is_read: false,
            });

            toast({
                title: "Appointment rescheduled",
                description: "The patient has been notified",
            });

            setShowRescheduleDialog(false);
            setNewDate("");
            setNewTime("");
            setSelectedAppointment(null);
            loadAppointments(user.id);
        } catch (error: any) {
            console.error("Error rescheduling appointment:", error);
            toast({
                title: "Error",
                description: "Failed to reschedule appointment",
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

    const todayAppointments = appointments.filter(a =>
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
                    <div className="grid gap-6 md:grid-cols-2">
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
                                <div className="text-2xl font-bold">{appointments.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total upcoming
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Appointments List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Patient Appointments</CardTitle>
                            <CardDescription>Manage your scheduled appointments</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appointments.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-xl font-semibold mb-2">No upcoming appointments</h3>
                                    <p className="text-muted-foreground">
                                        Patients will be able to book appointments with you
                                    </p>
                                </div>
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

                                            {/* Symptoms/Reason for Visit */}
                                            {(appointment.symptoms || appointment.specialty) && (
                                                <div className="pt-3 border-t space-y-2">
                                                    {appointment.specialty && (
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-foreground">Specialty: </span>
                                                            <span className="text-muted-foreground">{appointment.specialty}</span>
                                                        </div>
                                                    )}
                                                    {appointment.symptoms && (
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-foreground">Symptoms: </span>
                                                            <span className="text-muted-foreground">{appointment.symptoms}</span>
                                                        </div>
                                                    )}
                                                    {appointment.consultation_type && (
                                                        <div className="text-sm">
                                                            <span className="font-semibold text-foreground">Type: </span>
                                                            <span className="text-muted-foreground capitalize">{appointment.consultation_type}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowRecordsDialog(true);
                                                    }}
                                                >
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    View Records ({appointment.medical_records?.length || 0})
                                                </Button>

                                                {/* Start Consultation Button */}
                                                {appointment.consultation_type === 'video' && (
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                        <Video className="w-4 h-4 mr-2" />
                                                        Start Video Call
                                                    </Button>
                                                )}
                                                {appointment.consultation_type === 'audio' && (
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                        <Phone className="w-4 h-4 mr-2" />
                                                        Start Audio Call
                                                    </Button>
                                                )}
                                                {(appointment.consultation_type === 'chat' || appointment.consultation_type === 'text') && (
                                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                                        <MessageCircle className="w-4 h-4 mr-2" />
                                                        Start Chat
                                                    </Button>
                                                )}

                                                {appointment.prescription && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="bg-teal-100 text-teal-800 hover:bg-teal-200"
                                                        onClick={() => {
                                                            setViewPrescriptionData(appointment.prescription!);
                                                            setShowViewPrescriptionDialog(true);
                                                        }}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        View Prescription
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowPrescriptionDialog(true);
                                                    }}
                                                >
                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                    Send Prescription
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowRescheduleDialog(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Reschedule
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowCancelDialog(true);
                                                    }}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Medical Records Dialog */}
                <Dialog open={showRecordsDialog} onOpenChange={setShowRecordsDialog}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Patient Medical Records</DialogTitle>
                            <DialogDescription>
                                Medical records for {selectedAppointment?.patient.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {selectedAppointment?.medical_records && selectedAppointment.medical_records.length > 0 ? (
                                selectedAppointment.medical_records.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{record.title}</p>
                                            <p className="text-sm text-muted-foreground">{record.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Uploaded: {format(new Date(record.uploaded_at), "MMM dd, yyyy")}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline" asChild>
                                            <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                                                View File
                                            </a>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">No medical records available</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRecordsDialog(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
                            <Button variant="outline" onClick={() => {
                                setShowPrescriptionDialog(false);
                                setDiagnosis("");
                                setMedicines("");
                                setInstructions("");
                                setNotes("");
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendPrescription}>
                                <Check className="w-4 h-4 mr-2" />
                                Send Prescription
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reschedule Dialog */}
                <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reschedule Appointment</DialogTitle>
                            <DialogDescription>
                                Select a new date and time for {selectedAppointment?.patient.name}'s appointment
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="newDate">New Date *</Label>
                                <Input
                                    id="newDate"
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newTime">New Time *</Label>
                                <Input
                                    id="newTime"
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowRescheduleDialog(false);
                                setNewDate("");
                                setNewTime("");
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleRescheduleAppointment}>
                                <Check className="w-4 h-4 mr-2" />
                                Reschedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* View Prescription Dialog */}
                <Dialog open={showViewPrescriptionDialog} onOpenChange={setShowViewPrescriptionDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Prescription Details</DialogTitle>
                            <DialogDescription>
                                Issued on {viewPrescriptionData?.created_at && format(new Date(viewPrescriptionData.created_at), "PPP")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Diagnosis</Label>
                                <div className="p-3 bg-muted/50 rounded-md font-medium">
                                    {viewPrescriptionData?.diagnosis}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Medicines</Label>
                                <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                                    {viewPrescriptionData?.medicines}
                                </div>
                            </div>
                            {viewPrescriptionData?.instructions && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Instructions</Label>
                                    <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                                        {viewPrescriptionData.instructions}
                                    </div>
                                </div>
                            )}
                            {viewPrescriptionData?.notes && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Private Notes</Label>
                                    <div className="p-3 bg-yellow-50/50 text-yellow-800 rounded-md whitespace-pre-wrap text-sm border border-yellow-100">
                                        {viewPrescriptionData.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setShowViewPrescriptionDialog(false)}>
                                Close
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
