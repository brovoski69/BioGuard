-- ============================================
-- BioGuard Database Schema
-- Part 1: Create Tables
-- ============================================

-- Table 1: profiles
-- Stores user profile information linked to Supabase Auth
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL,
    age INT NOT NULL CHECK (age > 0 AND age < 150),
    weight FLOAT NOT NULL CHECK (weight > 0),
    height FLOAT NOT NULL CHECK (height > 0),
    body_type TEXT NOT NULL CHECK (body_type IN ('ectomorph', 'mesomorph', 'endomorph')),
    health_conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: simulation_sessions
-- Stores each simulation session data
CREATE TABLE simulation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    posture_angles JSONB NOT NULL DEFAULT '{}',
    joint_forces JSONB NOT NULL DEFAULT '{}',
    risk_scores JSONB NOT NULL DEFAULT '{}',
    load_weight FLOAT NOT NULL DEFAULT 0,
    activity_duration INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: reports
-- Stores generated reports with recommendations and projections
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
    recommendations TEXT[] DEFAULT '{}',
    long_term_projection JSONB DEFAULT '{}',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_user_id ON simulation_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON simulation_sessions(created_at DESC);
CREATE INDEX idx_sessions_scenario ON simulation_sessions(scenario);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at on all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON simulation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
