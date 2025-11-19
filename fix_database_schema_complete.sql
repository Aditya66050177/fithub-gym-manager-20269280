-- Complete database schema fix for admin visibility issues
-- Run this in your Supabase SQL Editor

-- 1. Add missing created_at column to gym_owners table
ALTER TABLE public.gym_owners 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Add foreign key from gym_owners to profiles
ALTER TABLE public.gym_owners
DROP CONSTRAINT IF EXISTS gym_owners_user_id_fkey;

ALTER TABLE public.gym_owners
ADD CONSTRAINT gym_owners_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 3. Add foreign key from user_roles to profiles
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 4. Verify all relationships
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname IN ('gym_owners_user_id_fkey', 'user_roles_user_id_fkey');

-- 5. Check gym_owners table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'gym_owners'
ORDER BY ordinal_position;
