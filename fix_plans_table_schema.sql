-- Fix plans table to add missing duration_days column
-- Run this in your Supabase SQL Editor

-- Add duration_days column if it doesn't exist
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 30;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'plans'
    AND column_name = 'duration_days';
