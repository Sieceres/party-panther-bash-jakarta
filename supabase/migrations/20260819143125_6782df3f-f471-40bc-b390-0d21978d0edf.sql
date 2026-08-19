-- 1. events: remove wide-open public row policy remnants and hide sensitive columns from anon
DROP POLICY IF EXISTS "Public can view basic events" ON public.events;
DROP POLICY IF EXISTS "Event view (basic or owner)" ON public.events;
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);

REVOKE SELECT ON public.events FROM anon;
GRANT SELECT (id, title, description, date, "time", venue_name, venue_address,
  venue_latitude, venue_longitude, price_currency, image_url, organizer_name,
  created_by, created_at, updated_at, is_recurrent, slug, track_payments,
  access_level, max_attendees, enable_check_in, enable_photos, instagram_post_url,
  venue_id, custom_slug, custom_slug_expires_at) ON public.events TO anon;

-- 2. event_attendees: scope reads
DROP POLICY IF EXISTS "Authenticated users can view event attendees" ON public.event_attendees;
CREATE POLICY "Attendees, organizers and admins can view attendee rows"
ON public.event_attendees FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_event_attendees(event_id)
  OR public.is_current_user_admin()
);

CREATE OR REPLACE FUNCTION public.get_event_attendees(_event_id uuid)
RETURNS TABLE(
  id uuid, event_id uuid, user_id uuid, joined_at timestamptz,
  payment_status boolean, payment_date timestamptz, payment_marked_by uuid,
  payment_claimed_at timestamptz, receipt_url text, receipt_uploaded_at timestamptz,
  note text, is_anonymous boolean, is_co_organizer boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ea.id, ea.event_id, ea.user_id, ea.joined_at,
    CASE WHEN priv.ok THEN ea.payment_status ELSE false END,
    CASE WHEN priv.ok THEN ea.payment_date ELSE NULL END,
    CASE WHEN priv.ok THEN ea.payment_marked_by ELSE NULL END,
    CASE WHEN priv.ok THEN ea.payment_claimed_at ELSE NULL END,
    CASE WHEN priv.ok THEN ea.receipt_url ELSE NULL END,
    CASE WHEN priv.ok THEN ea.receipt_uploaded_at ELSE NULL END,
    CASE WHEN priv.ok THEN ea.note ELSE NULL END,
    ea.is_anonymous,
    ea.is_co_organizer
  FROM public.event_attendees ea
  CROSS JOIN LATERAL (
    SELECT (
      ea.user_id = auth.uid()
      OR public.can_manage_event_attendees(_event_id)
      OR public.is_current_user_admin()
    ) AS ok
  ) priv
  WHERE ea.event_id = _event_id
  ORDER BY ea.joined_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_attendees(uuid) TO anon, authenticated;

-- 3. promo_vouchers: no public reads
DROP POLICY IF EXISTS "Anyone can view voucher by code" ON public.promo_vouchers;
REVOKE SELECT ON public.promo_vouchers FROM anon;

-- 4. storage: keep html-reels folder admin-only
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'Party Panther Bucket I'
  AND COALESCE((storage.foldername(name))[1], '') <> 'html-reels'
);

DROP POLICY IF EXISTS "Public Access for Images" ON storage.objects;
CREATE POLICY "Public Access for Images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'Party Panther Bucket I'
  AND COALESCE((storage.foldername(name))[1], '') <> 'html-reels'
);

-- 5. lock down internal SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        pg_get_function_result(p.oid) = 'trigger'
        OR p.proname IN (
          'generate_slug','get_unique_event_slug','get_unique_promo_slug','get_unique_venue_slug',
          'get_full_profile_info','get_my_claim','get_event_attendee_counts','get_event_co_organizers',
          'get_user_role','get_events_safe','check_review_fraud'
        )
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.refresh_event_attendee_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refresh_promo_review_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_event_attendee_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_promo_review_stats() TO authenticated;