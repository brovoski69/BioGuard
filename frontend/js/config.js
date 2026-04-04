// ═══════════════════════════════════════════════════════════════════════
// BioGuard — Configuration
// Set your Supabase credentials here for frontend authentication
// ═══════════════════════════════════════════════════════════════════════

// For production, these should be environment variables
// For demo/development, you can set them directly here

window.BIOGUARD_CONFIG = {
    // Your Supabase project URL (from Supabase dashboard)
    // Example: 'https://abcdefghijklmnop.supabase.co'
    SUPABASE_URL: '',
    
    // Your Supabase anon/public key (from Supabase dashboard -> Settings -> API)
    // This is safe to expose in frontend code
    SUPABASE_ANON_KEY: '',
    
    // App settings
    APP_NAME: 'BioGuard',
    VERSION: '2.0.0',
    
    // Demo mode - set to true to bypass auth
    DEMO_MODE: true
};

// Instructions:
// 1. Go to your Supabase project dashboard
// 2. Navigate to Settings -> API
// 3. Copy the "Project URL" and paste it as SUPABASE_URL
// 4. Copy the "anon public" key and paste it as SUPABASE_ANON_KEY
// 5. Set DEMO_MODE to false when ready for real authentication
