import { Card } from "@/components/ui/card";
import { User, Stethoscope } from "lucide-react";

interface RoleSelectorProps {
    onSelectRole: (role: "patient" | "doctor") => void;
}

export const RoleSelector = ({ onSelectRole }: RoleSelectorProps) => {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Choose Your Role</h2>
                <p className="text-muted-foreground">
                    Select how you'd like to join CareConnect
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    className="p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary group"
                    onClick={() => onSelectRole("patient")}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">I'm a Patient</h3>
                            <p className="text-sm text-muted-foreground">
                                Book appointments, consult with doctors, and manage your health
                            </p>
                        </div>
                    </div>
                </Card>

                <Card
                    className="p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary group"
                    onClick={() => onSelectRole("doctor")}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Stethoscope className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">I'm a Doctor</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage appointments, view patient records, and provide care
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
