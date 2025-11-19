-- Add detailed fields to gym_owners table for application form
-- Run this SQL in your Supabase SQL Editor under the Cloud tab

ALTER TABLE public.gym_owners
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_address text,
ADD COLUMN IF NOT EXISTS business_phone text,
ADD COLUMN IF NOT EXISTS business_email text,
ADD COLUMN IF NOT EXISTS years_in_business integer,
ADD COLUMN IF NOT EXISTS number_of_locations integer,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
