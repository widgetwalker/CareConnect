import { useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Download, Trash2, Plus, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface MedicalRecord {
    id: string;
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    uploaded_at: string;
}

interface MedicalRecordsProps {
    userId: string;
}

export const MedicalRecords = ({ userId }: MedicalRecordsProps) => {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();

    const loadRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("medical_records")
            .select("*")
            .eq("patient_id", userId)
            .order("uploaded_at", { ascending: false });

        if (error) {
            console.error("Error loading medical records:", error);
        } else {
            setRecords(data || []);
        }
        setLoading(false);
    };

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

        setUploading(true);

        try {
            // Upload file to Supabase Storage
            const fileName = `${userId}/${Date.now()}_${file.name}`;
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
                    patient_id: userId,
                    title,
                    description: description || null,
                    file_url: urlData.publicUrl,
                    file_type: file.type,
                });

            if (dbError) throw dbError;

            toast({
                title: "Success!",
                description: "Medical record uploaded successfully",
            });

            setShowUploadDialog(false);
            setTitle("");
            setDescription("");
            setFile(null);
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

    // Load records on mount
    useState(() => {
        loadRecords();
    });

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
