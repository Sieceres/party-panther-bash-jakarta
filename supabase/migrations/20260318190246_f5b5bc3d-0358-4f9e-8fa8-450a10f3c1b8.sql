-- Fix stale JWT role claims: replace auth.jwt() checks with has_admin_role()/is_current_user_admin()

-- 1. Profiles: owners or admins (SELECT)
DROP POLICY IF EXISTS "Profiles: owners or admins" ON public.profiles;
CREATE POLICY "Profiles: owners or admins" ON public.profiles
FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR public.is_current_user_admin());

-- 2. Profiles: update by owner or admin (UPDATE)
DROP POLICY IF EXISTS "Profiles: update by owner or admin" ON public.profiles;
CREATE POLICY "Profiles: update by owner or admin" ON public.profiles
FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR public.is_current_user_admin())
WITH CHECK ((auth.uid() = user_id) OR public.is_current_user_admin());

-- 3. Reports: admins or owner (SELECT)
DROP POLICY IF EXISTS "Reports: admins or owner" ON public.reports;
CREATE POLICY "Reports: admins or owner" ON public.reports
FOR SELECT TO authenticated
USING ((auth.uid() = reporter_id) OR public.is_current_user_admin());