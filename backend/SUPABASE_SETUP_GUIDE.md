# BioGuard - Complete Supabase Setup Guide

## Step 1: Create a Supabase Account & Project

### 1.1 Sign Up
1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Start your project"** or **"Sign Up"**
3. Sign in with **GitHub** (recommended) or email

### 1.2 Create New Project
1. Click **"New Project"**
2. Select your organization (or create one)
3. Fill in the details:
   - **Project name**: `bioguard`
   - **Database password**: Create a strong password (save it somewhere safe!)
   - **Region**: Select the closest to your location
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup to complete

---

## Step 2: Set Up the Database Tables

### 2.1 Open SQL Editor
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**

### 2.2 Create Tables
Copy and paste this SQL, then click **"Run"**:

```sql
-- ============================================
-- Table 1: profiles
-- Stores user profile information
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INT NOT NULL CHECK (age > 0 AND age < 150),
    weight FLOAT NOT NULL CHECK (weight > 0),
    height FLOAT NOT NULL CHECK (height > 0),
    body_type TEXT NOT NULL CHECK (body_type IN ('ectomorph', 'mesomorph', 'endomorph')),
    health_conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table 2: simulation_sessions
-- Stores each simulation session data
-- ============================================
CREATE TABLE simulation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    posture_angles JSONB NOT NULL DEFAULT '{}',
    joint_forces JSONB NOT NULL DEFAULT '{}',
    risk_scores JSONB NOT NULL DEFAULT '{}',
    load_weight FLOAT NOT NULL DEFAULT 0,
    activity_duration INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table 3: reports
-- Stores generated reports
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
    recommendations TEXT[] DEFAULT '{}',
    long_term_projection JSONB DEFAULT '{}',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_user_id ON simulation_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON simulation_sessions(created_at DESC);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_session_id ON reports(session_id);
```

✅ You should see **"Success. No rows returned"**

---

## Step 3: Set Up Row Level Security (RLS)

### 3.1 Enable RLS
In a new SQL query, run:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =====================
-- Profiles Policies
-- =====================
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- =====================
-- Simulation Sessions Policies
-- =====================
CREATE POLICY "Users can view own sessions"
ON simulation_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON simulation_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON simulation_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON simulation_sessions FOR DELETE
USING (auth.uid() = user_id);

-- =====================
-- Reports Policies
-- =====================
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
ON reports FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
ON reports FOR DELETE
USING (auth.uid() = user_id);
```

✅ You should see **"Success. No rows returned"**

---

## Step 4: Set Up Authentication

### 4.1 Email/Password Auth (Already enabled by default)
1. Go to **Authentication** → **Providers**
2. Confirm **Email** is enabled

### 4.2 Enable Google OAuth (Optional)
1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable Sign in with Google**
3. You'll need Google OAuth credentials:

#### Get Google OAuth Credentials:
1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Choose **Web application**
6. Add authorized redirect URI:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   (Replace YOUR_PROJECT_ID with your actual project ID)
7. Copy **Client ID** and **Client Secret**
8. Paste them in Supabase Google provider settings

### 4.3 Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000/**
   http://localhost:5173/**
   https://yourdomain.com/**
   ```

---

## Step 5: Set Up Storage for PDF Reports

### 5.1 Create Storage Bucket
1. Go to **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Name: `reports`
4. Toggle **OFF** "Public bucket" (keep it private)
5. Click **"Create bucket"**

### 5.2 Set Storage Policies
Go to **SQL Editor** and run:

```sql
-- Storage policy: Users can upload their own reports
CREATE POLICY "Users can upload own reports"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can update their own reports
CREATE POLICY "Users can update own reports"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Users can delete their own reports
CREATE POLICY "Users can delete own reports"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Step 6: Get Your API Keys

### 6.1 Find Your Keys
1. Go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 6.2 Create .env File
In your project's `backend/` folder, create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# For Node.js
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **IMPORTANT**: Add `.env` to your `.gitignore` file!

---

## Step 7: Verify Setup

### 7.1 Check Tables
1. Go to **Table Editor** in Supabase dashboard
2. You should see 3 tables: `profiles`, `simulation_sessions`, `reports`

### 7.2 Check Policies
1. Go to **Authentication** → **Policies**
2. You should see policies for each table

### 7.3 Check Storage
1. Go to **Storage**
2. You should see the `reports` bucket

---

## 🎉 Done! Your Supabase is Ready!

Now you can use the backend classes:

```javascript
import { AuthManager, PhysicsEngine, ScenarioManager } from './backend/index.js';

const auth = new AuthManager();
const scenarios = new ScenarioManager();

// Sign up a user
await auth.signUp('user@email.com', 'password123', {
    name: 'John',
    age: 30,
    weight: 70,
    height: 175,
    body_type: 'mesomorph',
    health_conditions: []
});
```

---

## Troubleshooting

### "permission denied for table profiles"
→ Make sure RLS policies are created correctly

### "relation profiles does not exist"
→ Run the table creation SQL first

### Google OAuth not working
→ Check redirect URL matches exactly in Google Console

### Storage upload fails
→ Make sure bucket name is `reports` and policies are set

---

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
