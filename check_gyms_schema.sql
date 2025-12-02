-- Run this query in Supabase SQL Editor to see all columns in gyms table
-- This will show you which columns are NOT NULL (required)

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'gyms'
ORDER BY ordinal_position;
