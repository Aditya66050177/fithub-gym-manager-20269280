-- Complete fix for admin access to gym owner requests
-- Run this in your Supabase SQL Editor under the Cloud tab

-- 1. First, ensure all users have a default 'user' role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT a.id, 'user'::app_role
FROM auth.users a
LEFT JOIN public.user_roles ur ON a.id = ur.user_id
WHERE ur.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2. Assign admin role to your user (replace with your actual email)
-- IMPORTANT: Change 'patiladitya724@gmail.com' to your actual admin email
UPDATE public.user_roles
SET role = 'admin'::app_role
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'patiladitya724@gmail.com'
  LIMIT 1
);

-- If the above doesn't work, try this insert instead:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'patiladitya724@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;

-- 3. Fix RLS policies for gym_owners table
DROP POLICY IF EXISTS "Users can create gym owner requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Users can view own requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Admins can view all gym owner requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Admins can update gym owner requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Admins can delete gym owner requests" ON public.gym_owners;

-- Recreate policies with correct permissions
CREATE POLICY "Users can create gym owner requests"
  ON public.gym_owners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests"
  ON public.gym_owners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gym owner requests"
  ON public.gym_owners FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gym owner requests"
  ON public.gym_owners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gym owner requests"
  ON public.gym_owners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Verify the setup (check results in output)
SELECT 'User Roles:' as check_type, u.email, ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY ur.role;

SELECT 'Gym Owner Requests:' as check_type, COUNT(*) as total_requests
FROM public.gym_owners;

SELECT 'Admin Check:' as check_type, 
       EXISTS (
         SELECT 1 FROM public.user_roles 
         WHERE role = 'admin'
       ) as has_admin_user;