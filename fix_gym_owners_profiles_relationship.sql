-- Fix the missing foreign key relationship between gym_owners and profiles
-- Run this in your Supabase SQL Editor

-- Add foreign key constraint from gym_owners.user_id to profiles.id
ALTER TABLE public.gym_owners
DROP CONSTRAINT IF EXISTS gym_owners_user_id_fkey;

ALTER TABLE public.gym_owners
ADD CONSTRAINT gym_owners_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Verify the relationship was created
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'gym_owners_user_id_fkey';
