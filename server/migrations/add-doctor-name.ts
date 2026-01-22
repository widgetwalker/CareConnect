/**
 * Migration Script: Add doctor_name column to appointments table
 * Run this script to update your database with the fix for doctor name preservation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🔄 Starting doctor_name migration...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../supabase/migrations/add_doctor_name_to_appointments.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration SQL loaded from:', migrationPath);
        console.log('\n📝 Migration content:');
        console.log('─'.repeat(60));
        console.log(migrationSQL);
        console.log('─'.repeat(60));
        console.log('\n⚠️  Note: The SQL will be executed via Supabase RPC.');
        console.log('If you see errors, please copy the SQL and run it manually in Supabase SQL Editor.\n');

        // Execute the migration
        // Note: Supabase client doesn't support executing raw DDL directly
        // We need to use the SQL Editor or supabase CLI for this

        console.log('⚠️  IMPORTANT: This script cannot directly execute DDL statements.');
        console.log('\nPlease follow these steps:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy the migration SQL from above');
        console.log('4. Paste and execute it in the SQL Editor\n');
        console.log('OR use Supabase CLI:');
        console.log('   supabase db push\n');

        // Instead, let's verify the current state and provide helpful info
        console.log('📊 Checking current appointments...');

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('id, doctor_id, doctor_name')
            .limit(5);

        if (error) {
            console.log('⚠️  Could not fetch appointments (this is expected if doctor_name column doesn\'t exist yet)');
            console.log('Error:', error.message);
        } else {
            console.log('\n✅ Sample appointments:');
            console.table(appointments);

            const hasDoctoName = appointments && appointments.length > 0 && appointments[0].hasOwnProperty('doctor_name');
            if (hasDoctoName) {
                console.log('\n✅ doctor_name column already exists!');
                const withNames = appointments?.filter(a => a.doctor_name);
                console.log(`📈 ${withNames?.length || 0} out of ${appointments?.length || 0} appointments have doctor names stored`);
            } else {
                console.log('\n❌ doctor_name column does NOT exist yet');
                console.log('Please run the migration SQL manually as instructed above');
            }
        }

    } catch (error) {
        console.error('\n❌ Error during migration:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration().then(() => {
    console.log('\n✨ Migration script completed');
    console.log('Remember to run the SQL manually in Supabase SQL Editor if not done yet!');
    process.exit(0);
});
