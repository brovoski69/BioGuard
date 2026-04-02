// Database connection handler - uses singleton pattern so we only have one connection
import { createClient } from '@supabase/supabase-js';

class SupabaseClient {
    static instance = null;
    client = null;

    constructor() {
        // Already have a connection? Return that instead of making a new one
        if (SupabaseClient.instance) {
            return SupabaseClient.instance;
        }

        // Try both Vite (frontend) and Node (backend) env variable formats
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }

        // Set up the connection with auto token refresh
        this.client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        SupabaseClient.instance = this;
    }

    getClient() {
        return this.client;
    }

    static getInstance() {
        if (!SupabaseClient.instance) {
            SupabaseClient.instance = new SupabaseClient();
        }
        return SupabaseClient.instance;
    }
}

// Create and export a single shared connection
const supabaseClient = SupabaseClient.getInstance();
export const supabase = supabaseClient.getClient();
export default SupabaseClient;
