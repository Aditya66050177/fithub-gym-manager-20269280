-- Fix gyms table foreign key to reference profiles instead of auth.users
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing foreign key constraint
ALTER TABLE public.gyms 
DROP CONSTRAINT IF EXISTS gyms_owner_id_fkey;

-- 2. Add the correct foreign key constraint referencing profiles
ALTER TABLE public.gyms
ADD CONSTRAINT gyms_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. Verify the constraint was created
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'gyms_owner_id_fkey';
