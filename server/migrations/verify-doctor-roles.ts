/**
 * Script to verify and fix doctor roles in the user table
 * This ensures doctors can access patient medical records through RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAndFixDoctorRoles() {
    console.log('🔍 Verifying doctor roles...\n');

    try {
        // 1. Check if role column exists in user table
        console.log('📋 Checking user table structure...');
        const { data: users, error: usersError } = await supabase
            .from('user')
            .select('id, name, email, role')
            .limit(1);

        if (usersError) {
            if (usersError.message.includes('column "role" does not exist')) {
                console.log('⚠️  Role column does NOT exist in user table');
                console.log('You need to run the migration: fix_doctor_medical_records_access.sql\n');
                console.log('Steps:');
                console.log('1. Go to Supabase Dashboard → SQL Editor');
                console.log('2. Copy the content from supabase/migrations/fix_doctor_medical_records_access.sql');
                console.log('3. Run it in the SQL Editor\n');
                return;
            } else {
                throw usersError;
            }
        }

        console.log('✅ Role column exists in user table\n');

        // 2. Get all doctor profiles
        console.log('👨‍⚕️ Fetching doctor profiles...');
        const { data: doctorProfiles, error: profilesError } = await supabase
            .from('doctor_profiles')
            .select(`
        id,
        user_id,
        user:user_id (
          id,
          name,
          email,
          role
        )
      `);

        if (profilesError) {
            throw profilesError;
        }

        console.log(`Found ${doctorProfiles?.length || 0} doctor profiles\n`);

        if (!doctorProfiles || doctorProfiles.length === 0) {
            console.log('ℹ️  No doctor profiles found');
            return;
        }

        // 3. Check which doctors don't have role='doctor'
        const doctorsNeedingFix: any[] = [];

        doctorProfiles.forEach((profile: any) => {
            const user = profile.user;
            console.log(`\n📌 Doctor Profile ID: ${profile.id}`);
            console.log(`   User ID: ${profile.user_id}`);
            console.log(`   Name: ${user?.name || 'N/A'}`);
            console.log(`   Email: ${user?.email || 'N/A'}`);
            console.log(`   Role: ${user?.role || '(not set)'}`);

            if (!user || user.role !== 'doctor') {
                doctorsNeedingFix.push({
                    profileId: profile.id,
                    userId: profile.user_id,
                    currentRole: user?.role || null,
                });
            }
        });

        if (doctorsNeedingFix.length === 0) {
            console.log('\n\n✅ All doctors have correct roles!');
            console.log('Doctors should be able to view patient medical records.');
            return;
        }

        console.log(`\n\n⚠️  Found ${doctorsNeedingFix.length} doctor(s) without proper role\n`);

        // 4. Attempt to fix roles (this might fail if using anon key)
        console.log('🔧 Attempting to fix doctor roles...\n');

        for (const doctor of doctorsNeedingFix) {
            try {
                const { error: updateError } = await supabase
                    .from('user')
                    .update({ role: 'doctor' })
                    .eq('id', doctor.userId);

                if (updateError) {
                    console.log(`❌ Failed to update role for user ${doctor.userId}:`, updateError.message);
                    console.log('   You may need to run the SQL migration manually.');
                } else {
                    console.log(`✅ Successfully set role='doctor' for user ${doctor.userId}`);
                }
            } catch (err: any) {
                console.error(`❌ Error updating user ${doctor.userId}:`, err.message);
            }
        }

        console.log('\n✨ Role verification complete!\n');
        console.log('💡 If updates failed, run the migration SQL file:');
        console.log('   supabase/migrations/fix_doctor_medical_records_access.sql\n');

    } catch (error: any) {
        console.error('\n❌ Error during verification:', error);
        console.error('Message:', error.message);
    }
}

// Run the verification
verifyAndFixDoctorRoles().then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});
