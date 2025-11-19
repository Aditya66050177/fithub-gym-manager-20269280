-- Fix RLS policies for gym_owners table
-- Run this in your Supabase SQL Editor under the Cloud tab

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can create gym owner requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Users can view own requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Admins can view all gym owner requests" ON public.gym_owners;
DROP POLICY IF EXISTS "Admins can update gym owner requests" ON public.gym_owners;

-- Recreate policies with correct permissions
-- Allow users to insert their own gym owner requests
CREATE POLICY "Users can create gym owner requests"
  ON public.gym_owners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own gym owner requests
CREATE POLICY "Users can view own requests"
  ON public.gym_owners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to view all gym owner requests
CREATE POLICY "Admins can view all gym owner requests"
  ON public.gym_owners FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any gym owner request
CREATE POLICY "Admins can update gym owner requests"
  ON public.gym_owners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete gym owner requests if needed
CREATE POLICY "Admins can delete gym owner requests"
  ON public.gym_owners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));