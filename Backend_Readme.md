Build the complete backend and Supabase integration for a web app called 
"BioGuard — Virtual Joint Stress Simulator" using vanilla JavaScript (ES6 
Classes) and the Supabase JavaScript SDK. Also provide full step-by-step 
Supabase setup instructions.

PART 1 — SUPABASE SETUP (Step by Step)

Provide complete instructions for:

Step 1: Create Supabase Project
- Go to supabase.com → New Project
- Choose project name: "bioguard"
- Set a strong database password
- Select closest region

Step 2: Create all required database tables with exact SQL:

Table 1: profiles
- id (uuid, primary key, references auth.users)
- name (text)
- age (int)
- weight (float)
- height (float)
- body_type (text) — 'ectomorph' | 'mesomorph' | 'endomorph'
- health_conditions (text array) — ['arthritis', 'osteoporosis', etc.]
- created_at (timestamp, default now())

Table 2: simulation_sessions
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references profiles)
- scenario (text)
- posture_angles (jsonb) — {trunk: 45, knee: 90, hip: 80}
- joint_forces (jsonb) — {knee: 320, spine: 700, hip: 280}
- risk_scores (jsonb) — {knee: 65, spine: 80, hip: 30, overall: 72}
- load_weight (float)
- activity_duration (int)
- created_at (timestamp, default now())

Table 3: reports
- id (uuid, primary key, default gen_random_uuid())
- user_id (uuid, references profiles)
- session_id (uuid, references simulation_sessions)
- recommendations (text array)
- long_term_projection (jsonb) — risk scores at 6mo, 1yr, 2yr, 5yr, 10yr
- pdf_url (text)
- created_at (timestamp, default now())

Step 3: Set up Row Level Security (RLS) policies
- Enable RLS on all tables
- Users can only read/write their own data
- Provide exact SQL for all policies

Step 4: Set up Supabase Auth
- Enable email/password authentication
- Enable Google OAuth (step-by-step)
- Set redirect URLs for local and production

Step 5: Set up Supabase Storage
- Create a bucket called "reports" for PDF storage
- Set bucket to private
- Add storage policy so users can only access their own files

Step 6: Get API keys
- Where to find SUPABASE_URL and SUPABASE_ANON_KEY
- How to store them safely in a .env file

PART 2 — JAVASCRIPT BACKEND CLASSES

Build these ES6 classes with full implementation:

1. SupabaseClient class
   - Initialize Supabase connection
   - Export single instance (singleton pattern)

2. AuthManager class
   - signUp(email, password, profileData)
   - signIn(email, password)
   - signInWithGoogle()
   - signOut()
   - getCurrentUser()
   - onAuthStateChange(callback)

3. ProfileManager class
   - createProfile(userId, profileData)
   - getProfile(userId)
   - updateProfile(userId, updates)

4. SessionManager class
   - saveSession(userId, sessionData)
     * sessionData includes: scenario, posture_angles, 
       joint_forces, risk_scores, load_weight, duration
   - getSessions(userId) — fetch all past sessions
   - getSession(sessionId) — fetch single session
   - deleteSession(sessionId)

5. ReportManager class
   - generateReport(userId, sessionId, reportData)
   - uploadPDF(userId, pdfBlob) — upload to Supabase Storage
   - getReportURL(filePath) — get signed URL for download
   - getReports(userId) — fetch all past reports

6. PhysicsEngine class (Core OOP)
   - constructor(profileData) — takes age, weight, height, conditions
   - calculateJointForces(postureAngles, loadWeight)
     * Uses biomechanics formulas:
       - Knee torque = (bodyWeight × 0.5 × sin(kneeAngle)) + (load × momentArm)
       - Spinal compression = bodyWeight × sin(trunkAngle) + load
       - Hip force = bodyWeight × cos(hipAngle) × 0.6
   - calculateRiskScores(jointForces)
     * Compares forces to age-adjusted safe thresholds
     * Returns score 0–100 for each joint
   - projectLongTermDamage(riskScores)
     * Projects cumulative damage at 6mo, 1yr, 2yr, 5yr, 10yr
     * Factor in age and health conditions
   - getRecommendations(riskScores)
     * Returns array of personalized advice strings

7. ScenarioManager class
   - List of preset scenarios with default posture angles:
     * sitting_desk: {trunk: 85, knee: 90, hip: 90}
     * running: {trunk: 10, knee: 45, hip: 30}
     * heavy_lifting: {trunk: 45, knee: 60, hip: 50}
     * high_heels: {trunk: 5, knee: 15, hip: 10}
     * standing_long: {trunk: 0, knee: 5, hip: 0}
   - loadScenario(scenarioName) — returns posture angles
   - getAllScenarios() — returns all scenario metadata

PART 3 — API INTEGRATION FLOW

Show complete flow from user action to database:

1. User signs up → AuthManager.signUp() → ProfileManager.createProfile()
2. User loads scenario → ScenarioManager.loadScenario()
3. User adjusts sliders → PhysicsEngine.calculateJointForces()
4. User saves session → SessionManager.saveSession()
5. User generates report → PhysicsEngine.projectLongTermDamage() 
   → ReportManager.generateReport() → ReportManager.uploadPDF()
6. User views history → SessionManager.getSessions() → render past sessions

PART 4 — ERROR HANDLING & SECURITY
- Wrap all Supabase calls in try/catch with meaningful error messages
- Validate all inputs before sending to database
- Never expose service role key in frontend
- Rate limit simulation saves (max 1 per minute per user)

Provide all code in clean, well-commented ES6 class format 
ready to drop into the project.