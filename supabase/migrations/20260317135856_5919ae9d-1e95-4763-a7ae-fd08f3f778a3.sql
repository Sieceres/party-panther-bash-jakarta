
-- Add restrictive RLS policies to block banned users from INSERT on key tables
-- These are RESTRICTIVE policies that override permissive ones

-- Block banned users from creating events
CREATE POLICY "Banned users cannot create events" ON public.events
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- Block banned users from creating promos
CREATE POLICY "Banned users cannot create promos" ON public.promos
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- Block banned users from commenting on events
CREATE POLICY "Banned users cannot comment on events" ON public.event_comments
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- Block banned users from commenting on promos
CREATE POLICY "Banned users cannot comment on promos" ON public.promo_comments
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- Block banned users from reviewing promos
CREATE POLICY "Banned users cannot review promos" ON public.promo_reviews
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- Block banned users from submitting reports
CREATE POLICY "Banned users cannot submit reports" ON public.reports
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));

-- Block banned users from joining events
CREATE POLICY "Banned users cannot join events" ON public.event_attendees
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_banned(auth.uid()));
