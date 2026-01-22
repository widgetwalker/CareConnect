import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Trash2, Plus, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface MedicalRecord {
    id: string;
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    record_type?: string;
    uploaded_at: string;
}

interface MedicalRecordsProps {
    userId: string;
}

export const MedicalRecords = ({ userId }: MedicalRecordsProps) => {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [title, setTitle] = useState("");
    const [recordType, setRecordType] = useState("lab_report");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { toast } = useToast();

    // Get the authenticated user ID
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCurrentUserId(session.user.id);
            }
        };
        getUser();
    }, []);

    const loadRecords = async () => {
        if (!currentUserId) return;

        setLoading(true);

        // Get current user's email
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
            console.error("No session or email found");
            setLoading(false);
            return;
        }

        // Find the user ID in the database that matches this email
        const { data: userRecord } = await supabase
            .from("user")
            .select("id")
            .eq("email", session.user.email)
            .single();

        if (!userRecord) {
            console.log("No user record found with email:", session.user.email);
            setLoading(false);
            return;
        }

        console.log("Loading medical records for user ID:", userRecord.id);

        // Query medical records using the database user ID
        const { data, error } = await supabase
            .from("medical_records")
            .select("*")
            .eq("patient_id", userRecord.id)
            .order("uploaded_at", { ascending: false });

        if (error) {
            console.error("Error loading medical records:", error);
        } else {
            console.log("Medical records loaded:", data?.length || 0);
            setRecords(data || []);
        }
        setLoading(false);
    };

    // Load records when currentUserId is available
    useEffect(() => {
        if (currentUserId) {
            loadRecords();
        }
    }, [currentUserId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!title || !file) {
            toast({
                title: "Missing information",
                description: "Please provide a title and select a file",
                variant: "destructive",
            });
            return;
        }

        if (!currentUserId) {
            toast({
                title: "Authentication error",
                description: "Please sign in again",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);

        try {
            // First, ensure the user exists in the user table
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                throw new Error("No active session");
            }

            // Check if user exists in user table (by ID or email)
            let { data: existingUser, error: userCheckError } = await supabase
                .from("user")
                .select("id, email")
                .or(`id.eq.${currentUserId},email.eq.${session.user.email}`)
                .maybeSingle();

            let finalUserId = currentUserId; // The ID we'll use for the medical record

            // If user doesn't exist, create them
            if (!existingUser) {
                console.log("User doesn't exist, creating new user record...");
                const { data: newUser, error: userCreateError } = await supabase
                    .from("user")
                    .insert({
                        id: currentUserId,
                        email: session.user.email || "",
                        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
                        email_verified: session.user.email_confirmed_at ? true : false,
                        role: session.user.user_metadata?.role || "patient",
                        image: session.user.user_metadata?.avatar_url || null,
                    })
                    .select()
                    .single();

                if (userCreateError) {
                    // Check if it's a duplicate key error (user was created between check and insert)
                    if (userCreateError.code === '23505') {
                        console.log("User already exists (created concurrently), re-fetching...");
                        // Re-fetch the user
                        const { data: refetchedUser } = await supabase
                            .from("user")
                            .select("id")
                            .eq("email", session.user.email)
                            .single();
                        if (refetchedUser) {
                            finalUserId = refetchedUser.id;
                            console.log("Using existing user ID:", finalUserId);
                        }
                    } else {
                        console.error("Error creating user record:", userCreateError);
                        console.error("Error details:", JSON.stringify(userCreateError, null, 2));
                        throw new Error(`Failed to create user record: ${userCreateError.message}`);
                    }
                } else {
                    console.log("User created successfully");
                }
            } else if (existingUser.id !== currentUserId) {
                // User exists with same email but different ID
                console.warn("User exists with same email but different ID");
                console.warn("Existing user ID:", existingUser.id);
                console.warn("Current auth user ID:", currentUserId);
                console.warn("Using existing user ID for medical record");
                // Use the existing user's ID to satisfy the foreign key constraint
                finalUserId = existingUser.id;
            }

            // Verify the user exists before inserting medical record
            const { data: verifyUser } = await supabase
                .from("user")
                .select("id")
                .eq("id", finalUserId)
                .single();

            if (!verifyUser) {
                throw new Error("Failed to verify user exists before uploading record");
            }

            console.log("Using user ID for medical record:", finalUserId);

            // Upload file to Supabase Storage
            const fileName = `${finalUserId}/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("medical-records")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("medical-records")
                .getPublicUrl(fileName);

            // Save record to database
            const { error: dbError } = await supabase
                .from("medical_records")
                .insert({
                    id: crypto.randomUUID(),
                    patient_id: finalUserId, // Use the verified user ID
                    title,
                    description: description || null,
                    file_url: urlData.publicUrl,
                    file_type: file.type,
                    record_type: recordType,
                });

            if (dbError) throw dbError;

            toast({
                title: "Success!",
                description: "Medical record uploaded successfully",
            });

            setShowUploadDialog(false);
            setFile(null);
            setRecordType("lab_report");
            loadRecords();
        } catch (error: any) {
            console.error("Error uploading file:", error);
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload medical record",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (recordId: string) => {
        const { error } = await supabase
            .from("medical_records")
            .delete()
            .eq("id", recordId);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to delete record",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Deleted",
                description: "Medical record deleted successfully",
            });
            loadRecords();
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Medical Records
                        </CardTitle>
                        <CardDescription>Upload and manage your medical history</CardDescription>
                    </div>
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Upload Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload Medical Record</DialogTitle>
                                <DialogDescription>
                                    Share your medical history with your doctors
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Blood Test Report"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="record-type">Record Type</Label>
                                    <Select value={recordType} onValueChange={setRecordType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lab_report">Lab Report (Blood, Urine)</SelectItem>
                                            <SelectItem value="radiology">Radiology/Imaging (X-Ray, MRI, CT)</SelectItem>
                                            <SelectItem value="prescription">Prescription</SelectItem>
                                            <SelectItem value="vaccination">Vaccination Record</SelectItem>
                                            <SelectItem value="specialist_report">Specialist Report</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Additional details about this record"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="file">File *</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Supported formats: PDF, JPG, PNG, DOC, DOCX
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleUpload} disabled={uploading}>
                                    {uploading ? "Uploading..." : "Upload"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : records.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No medical records yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Upload your medical history to share with doctors
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <h4 className="font-semibold">{record.title}</h4>
                                    {record.record_type && (
                                        <p className="text-xs font-medium text-primary mt-0.5 uppercase tracking-wide">
                                            {record.record_type.replace(/_/g, " ")}
                                        </p>
                                    )}
                                    {record.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Uploaded {format(new Date(record.uploaded_at), "MMM dd, yyyy")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4 mr-2" />
                                            View
                                        </a>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(record.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
