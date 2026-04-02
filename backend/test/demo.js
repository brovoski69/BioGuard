/**
 * BioGuard - Interactive Demo Script
 * Tests all backend functionality with real Supabase data
 * 
 * Usage: node test/demo.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import PhysicsEngine from '../classes/PhysicsEngine.js';
import ScenarioManager from '../classes/ScenarioManager.js';
import readline from 'readline';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.bold}${colors.magenta}═══ ${msg} ═══${colors.reset}\n`),
    data: (label, value) => console.log(`   ${colors.cyan}${label}:${colors.reset} ${value}`)
};

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDemo() {
    log.header('BioGuard Interactive Demo');
    
    console.log('This demo will:');
    console.log('  1. Create a test user account');
    console.log('  2. Create a user profile');
    console.log('  3. Run a simulation with the PhysicsEngine');
    console.log('  4. Save a session to the database');
    console.log('  5. Generate a report');
    console.log('');

    // ============================================
    // Step 1: Get user input
    // ============================================
    log.header('Step 1: User Registration');
    
    const email = await question('Enter test email (or press Enter for random): ') || 
                  `demo_${Date.now()}@bioguard.test`;
    const password = await question('Enter password (min 6 chars, or Enter for default): ') || 
                     'TestPassword123!';
    
    console.log('');
    log.info(`Email: ${email}`);
    log.info(`Password: ${password.replace(/./g, '*')}`);

    // Attempt signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        log.error(`Signup failed: ${authError.message}`);
        
        // Try login instead
        log.info('Attempting login with existing account...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (loginError) {
            log.error(`Login also failed: ${loginError.message}`);
            log.warn('You may need to enable email auth in Supabase or confirm email');
            rl.close();
            return;
        }
        
        log.success(`Logged in! User ID: ${loginData.user.id.substring(0, 8)}...`);
        var userId = loginData.user.id;
    } else {
        log.success(`Account created! User ID: ${authData.user.id.substring(0, 8)}...`);
        var userId = authData.user.id;
        
        if (authData.user.identities?.length === 0) {
            log.warn('Email confirmation may be required before full access');
        }
    }

    // ============================================
    // Step 2: Create Profile
    // ============================================
    log.header('Step 2: User Profile');
    
    const name = await question('Your name: ') || 'Demo User';
    const age = parseInt(await question('Age (default 30): ')) || 30;
    const weight = parseFloat(await question('Weight in kg (default 70): ')) || 70;
    const height = parseFloat(await question('Height in cm (default 170): ')) || 170;
    
    console.log('\nBody types: ectomorph, mesomorph, endomorph');
    const bodyType = await question('Body type (default mesomorph): ') || 'mesomorph';
    
    console.log('\nHealth conditions (comma-separated, or none):');
    console.log('Options: arthritis, osteoporosis, herniated_disc, knee_injury, hip_replacement, obesity, scoliosis, sciatica');
    const conditionsInput = await question('Conditions: ');
    const healthConditions = conditionsInput ? conditionsInput.split(',').map(c => c.trim()) : [];

    // Check if profile exists
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                name,
                age,
                weight,
                height,
                body_type: bodyType,
                health_conditions: healthConditions,
                email
            })
            .eq('id', userId);
        
        if (updateError) {
            log.error(`Profile update failed: ${updateError.message}`);
        } else {
            log.success('Profile updated!');
        }
    } else {
        // Create new profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                name,
                age,
                weight,
                height,
                body_type: bodyType,
                health_conditions: healthConditions,
                email
            });

        if (profileError) {
            log.error(`Profile creation failed: ${profileError.message}`);
        } else {
            log.success('Profile created!');
        }
    }

    // Display profile
    const profile = { name, age, weight, height, body_type: bodyType, health_conditions: healthConditions };
    console.log('\n📋 Profile Summary:');
    log.data('Name', profile.name);
    log.data('Age', profile.age);
    log.data('Weight', `${profile.weight} kg`);
    log.data('Height', `${profile.height} cm`);
    log.data('BMI', (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1));
    log.data('Body Type', profile.body_type);
    log.data('Conditions', profile.health_conditions.length ? profile.health_conditions.join(', ') : 'None');

    // ============================================
    // Step 3: Select Scenario
    // ============================================
    log.header('Step 3: Select Activity Scenario');
    
    const scenarios = new ScenarioManager();
    const allScenarios = scenarios.getAllScenarios();
    
    console.log('Available scenarios:');
    allScenarios.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.icon} ${s.name} (${s.category})`);
    });
    
    const scenarioChoice = parseInt(await question('\nSelect scenario (1-12): ')) || 3;
    const selectedScenario = allScenarios[scenarioChoice - 1] || allScenarios[2];
    
    log.success(`Selected: ${selectedScenario.icon} ${selectedScenario.name}`);
    console.log(`   Description: ${selectedScenario.description}`);
    console.log(`   Default angles: trunk=${selectedScenario.postureAngles.trunk}°, knee=${selectedScenario.postureAngles.knee}°, hip=${selectedScenario.postureAngles.hip}°`);

    // Get load weight
    const loadWeight = parseFloat(await question('\nExternal load weight (kg, default 0): ')) || 0;
    
    // ============================================
    // Step 4: Run Physics Simulation
    // ============================================
    log.header('Step 4: Physics Simulation');
    
    const physics = new PhysicsEngine(profile);
    const jointForces = physics.calculateJointForces(selectedScenario.postureAngles, loadWeight);
    const riskScores = physics.calculateRiskScores(jointForces);
    const projections = physics.projectLongTermDamage(riskScores);
    const recommendations = physics.getRecommendations(riskScores);
    const riskLevel = physics.getRiskLevel(riskScores.overall);

    console.log('\n⚡ Joint Forces (Newtons):');
    log.data('Knee', `${jointForces.knee}N`);
    log.data('Spine', `${jointForces.spine}N`);
    log.data('Hip', `${jointForces.hip}N`);
    log.data('Ankle', `${jointForces.ankle}N`);
    log.data('Shoulder', `${jointForces.shoulder}N`);

    console.log('\n📊 Risk Scores (0-100):');
    log.data('Knee Risk', `${riskScores.knee}/100`);
    log.data('Spine Risk', `${riskScores.spine}/100`);
    log.data('Hip Risk', `${riskScores.hip}/100`);
    log.data('Overall Risk', `${riskScores.overall}/100 (${riskLevel.toUpperCase()})`);

    console.log('\n📈 Long-term Projections (Overall Risk):');
    log.data('6 months', `${projections['6months'].overall}/100`);
    log.data('1 year', `${projections['1year'].overall}/100`);
    log.data('5 years', `${projections['5years'].overall}/100`);
    log.data('10 years', `${projections['10years'].overall}/100`);

    // ============================================
    // Step 5: Save Session to Database
    // ============================================
    log.header('Step 5: Save Session');
    
    const saveSession = await question('Save this session to database? (y/n): ');
    
    if (saveSession.toLowerCase() === 'y') {
        const { data: sessionData, error: sessionError } = await supabase
            .from('simulation_sessions')
            .insert({
                user_id: userId,
                scenario: selectedScenario.name,
                posture_angles: selectedScenario.postureAngles,
                joint_forces: jointForces,
                risk_scores: riskScores,
                load_weight: loadWeight,
                activity_duration: selectedScenario.typicalDuration
            })
            .select()
            .single();

        if (sessionError) {
            log.error(`Session save failed: ${sessionError.message}`);
        } else {
            log.success(`Session saved! ID: ${sessionData.id.substring(0, 8)}...`);
            
            // Save report
            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .insert({
                    user_id: userId,
                    session_id: sessionData.id,
                    recommendations: recommendations,
                    long_term_projection: projections
                })
                .select()
                .single();

            if (reportError) {
                log.error(`Report save failed: ${reportError.message}`);
            } else {
                log.success(`Report saved! ID: ${reportData.id.substring(0, 8)}...`);
            }
        }
    }

    // ============================================
    // Step 6: Show Recommendations
    // ============================================
    log.header('Step 6: Recommendations');
    
    console.log('💡 Personalized Recommendations:\n');
    recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
    });

    // ============================================
    // Cleanup
    // ============================================
    log.header('Demo Complete!');
    
    console.log('📝 Summary:');
    console.log(`   • User: ${email}`);
    console.log(`   • Scenario: ${selectedScenario.name}`);
    console.log(`   • Overall Risk: ${riskScores.overall}/100 (${riskLevel})`);
    console.log(`   • Recommendations: ${recommendations.length}`);
    console.log('');
    
    const signOut = await question('Sign out? (y/n): ');
    if (signOut.toLowerCase() === 'y') {
        await supabase.auth.signOut();
        log.success('Signed out.');
    }

    rl.close();
}

runDemo().catch(err => {
    log.error(`Demo failed: ${err.message}`);
    console.error(err);
    rl.close();
});
