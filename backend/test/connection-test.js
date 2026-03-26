/**
 * BioGuard - Supabase Connection Test
 * Run this to verify your Supabase setup is correct
 * 
 * Usage: npm test
 * Or: node test/connection-test.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.bold}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

async function runTests() {
    log.header('BioGuard Supabase Connection Test');

    // ============================================
    // Test 1: Environment Variables
    // ============================================
    log.info('Checking environment variables...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        log.error('SUPABASE_URL not found in environment');
        log.warn('Create a .env file with your Supabase credentials');
        process.exit(1);
    }
    log.success(`Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

    if (!supabaseKey) {
        log.error('SUPABASE_ANON_KEY not found in environment');
        process.exit(1);
    }
    log.success(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);

    // ============================================
    // Test 2: Create Client Connection
    // ============================================
    log.info('Creating Supabase client...');
    
    let supabase;
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        log.success('Supabase client created successfully');
    } catch (error) {
        log.error(`Failed to create client: ${error.message}`);
        process.exit(1);
    }

    // ============================================
    // Test 3: Check Tables Exist
    // ============================================
    log.header('Testing Database Tables');

    const tables = ['profiles', 'simulation_sessions', 'reports'];
    
    for (const table of tables) {
        try {
            const { error } = await supabase
                .from(table)
                .select('id')
                .limit(1);

            if (error) {
                if (error.message.includes('does not exist')) {
                    log.error(`Table '${table}' does not exist - run SQL setup scripts`);
                } else {
                    // RLS error means table exists but we're not authenticated
                    log.success(`Table '${table}' exists`);
                }
            } else {
                log.success(`Table '${table}' exists and accessible`);
            }
        } catch (error) {
            log.error(`Error checking table '${table}': ${error.message}`);
        }
    }

    // ============================================
    // Test 4: Check Storage Bucket
    // ============================================
    log.header('Testing Storage');

    try {
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
            log.warn(`Storage check: ${error.message}`);
        } else {
            const reportsBucket = data.find(b => b.name === 'reports');
            if (reportsBucket) {
                log.success(`Storage bucket 'reports' exists (public: ${reportsBucket.public})`);
            } else {
                log.warn("Storage bucket 'reports' not found - create it in Supabase dashboard");
            }
        }
    } catch (error) {
        log.warn(`Storage check failed: ${error.message}`);
    }

    // ============================================
    // Test 5: Check Auth Configuration
    // ============================================
    log.header('Testing Authentication');

    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            log.error(`Auth error: ${error.message}`);
        } else {
            log.success('Auth service is accessible');
            if (data.session) {
                log.info(`Active session found for: ${data.session.user.email}`);
            } else {
                log.info('No active session (this is expected for a fresh test)');
            }
        }
    } catch (error) {
        log.error(`Auth check failed: ${error.message}`);
    }

    // ============================================
    // Summary
    // ============================================
    log.header('Test Complete');
    log.info('If all tests passed, your Supabase is properly configured!');
    log.info('Next steps:');
    console.log('  1. Create a test user: npm run test:full');
    console.log('  2. Build the frontend UI');
    console.log('  3. Run the application');
}

runTests().catch(console.error);
