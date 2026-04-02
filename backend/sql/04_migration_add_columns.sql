-- ============================================
-- BioGuard Database Schema
-- Part 4: Migration - Add New Columns
-- ============================================
-- Run this ONLY if you already have existing tables
-- This adds the new columns without dropping data
-- ============================================

-- =====================
-- Step 1: Add new columns to profiles
-- =====================

-- Add email column (for user search)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add updated_at column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================
-- Step 2: Add new columns to simulation_sessions
-- =====================

ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================
-- Step 3: Add new columns to reports
-- =====================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================
-- Step 4: Create new indexes
-- =====================

-- Index for scenario filtering
CREATE INDEX IF NOT EXISTS idx_sessions_scenario ON simulation_sessions(scenario);

-- Index for email search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================
-- Step 5: Create updated_at trigger function
-- =====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================
-- Step 6: Create triggers for auto-updating updated_at
-- =====================

-- Drop existing triggers if they exist (to avoid duplicates)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON simulation_sessions;
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;

-- Create triggers
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

-- =====================
-- Step 7: Backfill updated_at for existing rows
-- =====================

UPDATE profiles SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE simulation_sessions SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE reports SET updated_at = created_at WHERE updated_at IS NULL;

-- ============================================
-- Migration complete!
-- ============================================
