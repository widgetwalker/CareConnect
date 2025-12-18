import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing.');
    supabaseInstance = {} as any;
} else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
