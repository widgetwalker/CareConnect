import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing.');
    supabaseInstance = {
        from: () => ({
            select: () => ({
                eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
                order: () => Promise.resolve({ data: [], error: null }),
                in: () => Promise.resolve({ data: [], error: null }),
                ilike: () => Promise.resolve({ data: [], error: null }),
                insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
            }),
        }),
        rpc: () => Promise.resolve({ data: [], error: null }),
    } as any;
} else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
