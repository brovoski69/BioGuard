/**
 * SupabaseClient - Singleton class for Supabase connection
 * Initializes and exports a single Supabase client instance
 */

import { createClient } from '@supabase/supabase-js';

class SupabaseClient {
    static instance = null;
    client = null;

    constructor() {
        if (SupabaseClient.instance) {
            return SupabaseClient.instance;
        }

        // Get environment variables
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }

        // Initialize Supabase client with options
        this.client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        SupabaseClient.instance = this;
    }

    /**
     * Get the Supabase client instance
     * @returns {import('@supabase/supabase-js').SupabaseClient}
     */
    getClient() {
        return this.client;
    }

    /**
     * Get the singleton instance
     * @returns {SupabaseClient}
     */
    static getInstance() {
        if (!SupabaseClient.instance) {
            SupabaseClient.instance = new SupabaseClient();
        }
        return SupabaseClient.instance;
    }
}

// Export singleton instance
const supabaseClient = SupabaseClient.getInstance();
export const supabase = supabaseClient.getClient();
export default SupabaseClient;
