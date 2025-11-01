-- Fix admin status check to use user_roles table instead of profiles for security
-- This prevents privilege escalation attacks
-- Using CREATE OR REPLACE to avoid breaking dependencies

-- Update get_user_admin_status function to check user_roles table
CREATE OR REPLACE FUNCTION public.get_user_admin_status(user_id_param uuid)
RETURNS TABLE(is_admin boolean, is_super_admin boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = user_id_param 
      AND role = 'admin'
    ) as is_admin,
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = user_id_param 
      AND role = 'superadmin'
    ) as is_super_admin;
$$;

-- Update is_current_user_admin function to use user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$;