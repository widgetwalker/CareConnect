import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Download, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Prescription {
  id: string;
  diagnosis: string;
  medicines: string;
  instructions: string;
  notes: string;
  created_at: string;
  doctor: {
    id: string;
    name: string;
    email: string;
  };
}

interface PrescriptionsProps {
  userId: string;
}

export const Prescriptions = ({ userId }: PrescriptionsProps) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, [userId]);

  const loadPrescriptions = async () => {
    setLoading(true);

    try {
      // First get prescriptions
      const { data: prescriptionsData, error: prescError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", userId)
        .order("created_at", { ascending: false });

      if (prescError) throw prescError;

      // Then fetch doctor details for each prescription
      const prescriptionsWithDoctors = await Promise.all(
        (prescriptionsData || []).map(async (prescription) => {
          const { data: doctorData } = await supabase
            .from("user")
            .select("id, name, email")
            .eq("id", prescription.doctor_id)
            .single();

          return {
            ...prescription,
            doctor: doctorData || { id: prescription.doctor_id, name: "Unknown Doctor", email: "" }
          };
        })
      );

      setPrescriptions(prescriptionsWithDoctors);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    }

    setLoading(false);
  };

  const handlePrint = (prescription: Prescription) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${format(new Date(prescription.created_at), "MMM dd, yyyy")}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #0EA5E9;
              margin: 0 0 10px 0;
            }
            .section {
              margin: 20px 0;
            }
            .section h3 {
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin: 10px 0;
            }
            .label {
              font-weight: bold;
              width: 150px;
            }
            .medicines {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              white-space: pre-wrap;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CareConnect</h1>
            <p>Medical Prescription</p>
          </div>
          
          <div class="section">
            <div class="info-row">
              <span class="label">Doctor:</span>
              <span>${prescription.doctor?.name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span>${format(new Date(prescription.created_at), "MMMM dd, yyyy")}</span>
            </div>
          </div>

          <div class="section">
            <h3>Diagnosis</h3>
            <p>${prescription.diagnosis || "Not specified"}</p>
          </div>

          <div class="section">
            <h3>Prescribed Medicines</h3>
            <div class="medicines">${prescription.medicines}</div>
          </div>

          ${prescription.instructions ? `
          <div class="section">
            <h3>Instructions</h3>
            <p>${prescription.instructions}</p>
          </div>
          ` : ""}

          ${prescription.notes ? `
          <div class="section">
            <h3>Additional Notes</h3>
            <p>${prescription.notes}</p>
          </div>
          ` : ""}

          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>This is a computer-generated prescription.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          My Prescriptions
        </CardTitle>
        <CardDescription>View prescriptions from your doctors</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No prescriptions yet</h3>
            <p className="text-muted-foreground">
              Prescriptions from your consultations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{prescription.doctor?.name || "Doctor"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(prescription.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(prescription)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">Diagnosis:</p>
                    <p className="text-sm text-muted-foreground">{prescription.diagnosis || "Not specified"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1">Prescribed Medicines:</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{prescription.medicines}</p>
                    </div>
                  </div>

                  {prescription.instructions && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Instructions:</p>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}

                  {prescription.notes && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
