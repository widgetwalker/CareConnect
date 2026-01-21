import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to generate a random password
function generatePassword() {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

async function createDoctorAccounts() {
    console.log("🏥 Creating doctor accounts for existing doctors in database...\n");

    try {
        // Fetch all doctors from the database
        const { data: doctors, error: fetchError } = await supabase
            .from("doctors")
            .select("*");

        if (fetchError) {
            console.error("❌ Error fetching doctors:", fetchError);
            return;
        }

        if (!doctors || doctors.length === 0) {
            console.log("⚠️  No doctors found in the database");
            return;
        }

        console.log(`📋 Found ${doctors.length} doctors. Creating accounts...\n`);

        const doctorCredentials: Array<{
            name: string;
            email: string;
            password: string;
            speciality: string;
        }> = [];

        for (const doctor of doctors) {
            // Generate email from doctor name
            const email = `${doctor.name.toLowerCase().replace(/\s+/g, ".")}@careconnect.health`;
            const password = generatePassword();

            console.log(`Creating account for: ${doctor.name}`);
            console.log(`  Email: ${email}`);
            console.log(`  Speciality: ${doctor.specialty_id || "General Medicine"}`);

            try {
                // Create auth user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: doctor.name,
                            role: "doctor",
                            speciality: doctor.specialty_id || "General Medicine",
                        },
                        emailRedirectTo: undefined, // Disable email confirmation
                    },
                });

                if (authError) {
                    console.error(`  ❌ Error creating auth account:`, authError.message);
                    continue;
                }

                if (!authData.user) {
                    console.error(`  ❌ No user created`);
                    continue;
                }

                // Create doctor profile
                const { error: profileError } = await supabase
                    .from("doctor_profiles")
                    .insert({
                        id: crypto.randomUUID(),
                        user_id: authData.user.id,
                        doctor_id: doctor.id, // Link to existing doctor entry
                        speciality: doctor.specialty_id || "General Medicine",
                        description: doctor.bio || null,
                        location: "Mumbai, India", // Default location
                        experience: doctor.experience || "5 years",
                        fee: doctor.consultation_fee || 500,
                        qualifications: "MBBS, MD",
                        available_from: "9:00 AM",
                        available_to: "5:00 PM",
                        rating: doctor.rating || "4.5",
                        is_verified: true,
                    });

                if (profileError) {
                    console.error(`  ❌ Error creating doctor profile:`, profileError.message);
                    continue;
                }

                console.log(`  ✅ Account created successfully!\n`);

                doctorCredentials.push({
                    name: doctor.name,
                    email,
                    password,
                    speciality: doctor.specialty_id || "General Medicine",
                });
            } catch (error: any) {
                console.error(`  ❌ Unexpected error:`, error.message);
            }
        }

        // Print summary
        console.log("\n" + "=".repeat(80));
        console.log("📊 SUMMARY - Doctor Accounts Created");
        console.log("=".repeat(80) + "\n");

        if (doctorCredentials.length > 0) {
            console.log("✅ Successfully created accounts for the following doctors:\n");
            doctorCredentials.forEach(({ name, email, password, speciality }) => {
                console.log(`Doctor: ${name}`);
                console.log(`  Email: ${email}`);
                console.log(`  Password: ${password}`);
                console.log(`  Speciality: ${speciality}`);
                console.log("");
            });

            console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
            console.log("These passwords will not be shown again.\n");
        } else {
            console.log("⚠️  No doctor accounts were created");
        }

        console.log("=".repeat(80) + "\n");
    } catch (error: any) {
        console.error("❌ Fatal error:", error.message);
    }
}

// Run the script
createDoctorAccounts()
    .then(() => {
        console.log("✨ Script completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
