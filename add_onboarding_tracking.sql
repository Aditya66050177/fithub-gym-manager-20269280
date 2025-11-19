-- Add onboarding tracking to profiles table
-- Run this in your Supabase SQL Editor under the Cloud tab

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;