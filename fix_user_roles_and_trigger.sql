-- Fix user roles and add trigger for auto-assignment
-- Run this in your Supabase SQL Editor under the Cloud tab

-- 1. Insert default 'user' role for all existing users who don't have a role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT a.id, 'user'::app_role
FROM auth.users a
LEFT JOIN public.user_roles ur ON a.id = ur.user_id
WHERE ur.id IS NULL;

-- 2. Create or replace function to auto-assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default 'user' role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  RETURN NEW;
END;
$$;

-- 3. Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 4. Verify the roles were inserted (optional, for checking)
-- SELECT COUNT(*) FROM public.user_roles;