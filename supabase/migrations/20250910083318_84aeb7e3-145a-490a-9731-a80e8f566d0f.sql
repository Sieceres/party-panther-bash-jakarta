-- Fix infinite recursion in profiles RLS policies
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Restrict direct profile table access" ON public.profiles;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_admin = TRUE OR is_super_admin = TRUE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate the policy using the security definer function
CREATE POLICY "Allow profile access to owners and admins" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR auth.uid() = id 
  OR public.is_current_user_admin()
);