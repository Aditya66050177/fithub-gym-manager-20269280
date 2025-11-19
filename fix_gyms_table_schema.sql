-- Fix gyms table schema - add missing columns
-- Run this in your Supabase SQL Editor

-- Add location column if it doesn't exist
ALTER TABLE public.gyms 
ADD COLUMN IF NOT EXISTS location text;

-- Add timings column if it doesn't exist
ALTER TABLE public.gyms 
ADD COLUMN IF NOT EXISTS timings text;

-- Add description column if it doesn't exist
ALTER TABLE public.gyms 
ADD COLUMN IF NOT EXISTS description text;

-- Verify the gyms table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'gyms'
ORDER BY ordinal_position;

-- Check if there are any gyms in the database
SELECT COUNT(*) as total_gyms FROM public.gyms;

-- Check gym_owners with approved status
SELECT go.*, p.name, p.email
FROM public.gym_owners go
JOIN public.profiles p ON p.id = go.user_id
WHERE go.status = 'approved';
