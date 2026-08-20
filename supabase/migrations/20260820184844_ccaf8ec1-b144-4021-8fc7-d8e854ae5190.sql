-- 1. event_invite_codes: restrict overly permissive SELECT
DROP POLICY IF EXISTS "Authenticated users can view valid codes" ON public.event_invite_codes;

CREATE POLICY "Invited user can view own code"
ON public.event_invite_codes
FOR SELECT
TO authenticated
USING (
  used_by = auth.uid()
  OR (
    invited_user_email IS NOT NULL
    AND lower(invited_user_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
  OR public.is_current_user_admin()
);

-- 2. promo_reviews: stop exposing reviewer user_id publicly
DROP POLICY IF EXISTS "Anyone can view promo reviews" ON public.promo_reviews;

CREATE POLICY "Users can view their own reviews"
ON public.promo_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_current_user_admin());

CREATE OR REPLACE FUNCTION public.get_promo_reviews(p_promo_id text)
RETURNS TABLE(
  id uuid,
  promo_id text,
  user_id uuid,
  rating integer,
  comment text,
  is_anonymous boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id,
    r.promo_id,
    CASE
      WHEN COALESCE(r.is_anonymous, false)
        AND r.user_id IS DISTINCT FROM auth.uid()
        AND NOT public.is_current_user_admin()
      THEN NULL
      ELSE r.user_id
    END AS user_id,
    r.rating,
    r.comment,
    COALESCE(r.is_anonymous, false) AS is_anonymous,
    r.created_at,
    r.updated_at
  FROM public.promo_reviews r
  WHERE r.promo_id = p_promo_id
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_promo_reviews(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_promo_reviews(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_user_review_count(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::bigint FROM public.promo_reviews WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_user_review_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_review_count(uuid) TO anon, authenticated, service_role;

-- 3. Revoke direct EXECUTE on internal-only SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_removed_from_event(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_event_co_organizer(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.should_show_organizer_contact() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_event_attendee_counts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_event_co_organizers(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_full_profile_info(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_safe_profile_info(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_custom_slug_available(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_event_custom_slug(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_admin_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_superadmin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_superadmin_role(uuid) FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';