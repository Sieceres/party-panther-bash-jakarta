-- Fix 1: Remove overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Fix 2: Restrict event_invite_codes to authenticated users only
DROP POLICY IF EXISTS "Anyone can view valid codes" ON public.event_invite_codes;

CREATE POLICY "Authenticated users can view valid codes"
ON public.event_invite_codes
FOR SELECT
TO authenticated
USING (
  (NOT is_revoked) 
  AND ((expires_at IS NULL) OR (expires_at > now()))
);