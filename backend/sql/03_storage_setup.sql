-- ============================================
-- BioGuard Database Schema
-- Part 3: Storage Bucket Setup
-- ============================================

-- NOTE: Run these commands in Supabase SQL Editor
-- or use the Supabase Dashboard to create the bucket

-- Create the reports storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);

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
