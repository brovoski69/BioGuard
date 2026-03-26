# BioGuard Backend

Complete backend implementation for the **BioGuard — Virtual Joint Stress Simulator** using ES6 classes and Supabase.

## 📁 Project Structure

```
backend/
├── classes/
│   ├── SupabaseClient.js   # Singleton Supabase connection
│   ├── AuthManager.js      # Authentication (signup, signin, OAuth)
│   ├── ProfileManager.js   # User profile CRUD operations
│   ├── SessionManager.js   # Simulation session management
│   ├── ReportManager.js    # Report generation & PDF storage
│   ├── PhysicsEngine.js    # Biomechanics calculations
│   └── ScenarioManager.js  # Preset scenarios management
├── sql/
│   ├── 01_create_tables.sql      # Database schema
│   ├── 02_row_level_security.sql # RLS policies
│   └── 03_storage_setup.sql      # Storage bucket setup
├── index.js                # Main entry point & exports
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `bioguard`, set password, select region
3. Run SQL scripts in order:
   - `sql/01_create_tables.sql`
   - `sql/02_row_level_security.sql`
   - `sql/03_storage_setup.sql`

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 4. Usage Example

```javascript
import { 
    AuthManager, 
    ProfileManager, 
    PhysicsEngine, 
    ScenarioManager 
} from './backend/index.js';

// Initialize managers
const auth = new AuthManager();
const profiles = new ProfileManager();
const scenarios = new ScenarioManager();

// Sign up user
const { user } = await auth.signUp('user@example.com', 'password123', {
    name: 'John Doe',
    age: 35,
    weight: 75,
    height: 175,
    body_type: 'mesomorph',
    health_conditions: ['arthritis']
});

// Load scenario
const { scenario } = scenarios.loadScenario('heavy_lifting');

// Initialize physics engine with profile
const physics = new PhysicsEngine({
    age: 35,
    weight: 75,
    height: 175,
    body_type: 'mesomorph',
    health_conditions: ['arthritis']
});

// Calculate joint forces
const forces = physics.calculateJointForces(scenario.postureAngles, 20);
const risks = physics.calculateRiskScores(forces);
const recommendations = physics.getRecommendations(risks);

console.log('Forces:', forces);
console.log('Risk Scores:', risks);
console.log('Recommendations:', recommendations);
```

## 📚 Class Reference

### AuthManager
- `signUp(email, password, profileData)` - Register new user
- `signIn(email, password)` - Email/password login
- `signInWithGoogle()` - OAuth login
- `signOut()` - Logout
- `getCurrentUser()` - Get authenticated user
- `onAuthStateChange(callback)` - Subscribe to auth events

### ProfileManager
- `createProfile(userId, profileData)` - Create user profile
- `getProfile(userId)` - Get profile by ID
- `updateProfile(userId, updates)` - Update profile fields

### SessionManager
- `saveSession(userId, sessionData)` - Save simulation (rate limited: 1/min)
- `getSessions(userId)` - Get all user sessions
- `getSession(sessionId)` - Get single session
- `deleteSession(sessionId)` - Delete session

### ReportManager
- `generateReport(userId, sessionId, reportData)` - Create report
- `uploadPDF(userId, pdfBlob)` - Upload PDF to storage
- `getReportURL(filePath)` - Get signed download URL
- `getReports(userId)` - Get all user reports

### PhysicsEngine
- `constructor(profileData)` - Initialize with user data
- `calculateJointForces(postureAngles, loadWeight)` - Calculate forces
- `calculateRiskScores(jointForces)` - Calculate risk 0-100
- `projectLongTermDamage(riskScores)` - Project 6mo-10yr damage
- `getRecommendations(riskScores)` - Get personalized advice
- `getFullAnalysis(postureAngles, loadWeight)` - Complete analysis

### ScenarioManager
- `loadScenario(scenarioName)` - Load preset scenario
- `getAllScenarios()` - Get all available scenarios
- `getScenariosByCategory(category)` - Filter by category
- `searchScenarios(query)` - Search scenarios

## 🔧 Available Scenarios

| ID | Name | Category |
|----|------|----------|
| sitting_desk | Sitting at Desk | work |
| running | Running | exercise |
| heavy_lifting | Heavy Lifting | work |
| high_heels | Walking in High Heels | lifestyle |
| standing_long | Prolonged Standing | work |
| squatting | Squatting | exercise |
| cycling | Cycling | exercise |
| climbing_stairs | Climbing Stairs | daily |
| gardening | Gardening | leisure |
| driving | Driving | daily |
| sleeping_side | Side Sleeping | rest |
| yoga_downdog | Yoga - Downward Dog | exercise |

## ⚠️ Error Handling

All methods return `{ data, error }` pattern:

```javascript
const { session, error } = await sessionManager.saveSession(userId, data);
if (error) {
    console.error('Failed to save:', error.message);
    return;
}
// Use session...
```

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Users can only access their own data
- Rate limiting on session saves (1 per minute)
- Input validation on all operations
- Private storage bucket with signed URLs
