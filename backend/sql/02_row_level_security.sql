-- ============================================
-- BioGuard Database Schema
-- Part 2: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =====================
-- Profiles Policies
-- =====================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- =====================
-- Simulation Sessions Policies
-- =====================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON simulation_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON simulation_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON simulation_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON simulation_sessions FOR DELETE
USING (auth.uid() = user_id);

-- =====================
-- Reports Policies
-- =====================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
ON reports FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports"
ON reports FOR DELETE
USING (auth.uid() = user_id);
