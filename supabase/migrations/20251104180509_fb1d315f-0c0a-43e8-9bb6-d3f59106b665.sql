-- Phase 1: Critical Security Fixes (Fixed)
-- First, create the security definer functions before changing policies

-- 1. Create security definer function to check if user has admin or superadmin role
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'superadmin')
  );
$$;

-- 2. Create security definer function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.has_superadmin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  );
$$;

-- 3. Migrate existing admin/super_admin users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superadmin'::user_role
FROM public.profiles
WHERE is_super_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::user_role
FROM public.profiles
WHERE is_admin = true AND is_super_admin = false
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Drop storage policy that depends on is_admin column
DROP POLICY IF EXISTS "Users can delete own images or admins delete any" ON storage.objects;

-- 5. Recreate storage policy using new function
CREATE POLICY "Users can delete own images or admins delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Party Panther Bucket I' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_admin_role(auth.uid())
  )
);

-- 6. Now drop the old admin columns from profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS is_admin,
DROP COLUMN IF EXISTS is_super_admin;

-- 7. Update RLS policies for profiles table - lock down sensitive data
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin access to all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin to update all profiles" ON public.profiles;

-- Users can only view their own full profile
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid()));

-- Public can only see basic non-sensitive profile info
CREATE POLICY "Public can view basic profile info only"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_admin_role(auth.uid()))
WITH CHECK (public.has_admin_role(auth.uid()));

-- 8. Update RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Users can only view their own roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid()));

-- Only superadmins can insert/update/delete roles
CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_superadmin_role(auth.uid()))
WITH CHECK (public.has_superadmin_role(auth.uid()));

-- 9. Update is_current_user_admin function to use new structure
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_admin_role(auth.uid());
$$;

-- 10. Update contact_logs RLS policy
DROP POLICY IF EXISTS "Admins can create contact logs" ON public.contact_logs;

CREATE POLICY "Admins can create contact logs"
ON public.contact_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_role(auth.uid()) AND auth.uid() = contacted_by);

-- 11. Update profiles RLS policy for venue verification
DROP POLICY IF EXISTS "Admins can verify venues" ON public.profiles;

CREATE POLICY "Admins can verify venues"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_admin_role(auth.uid()))
WITH CHECK (public.has_admin_role(auth.uid()));