-- Revoke public access to materialized views (they should only be used by database functions)
REVOKE ALL ON public.promo_review_stats FROM PUBLIC;
REVOKE ALL ON public.promo_review_stats FROM anon;
REVOKE ALL ON public.promo_review_stats FROM authenticated;

REVOKE ALL ON public.event_attendee_stats FROM PUBLIC;
REVOKE ALL ON public.event_attendee_stats FROM anon;
REVOKE ALL ON public.event_attendee_stats FROM authenticated;

-- Grant SELECT to the database functions that need them (using postgres role)
GRANT SELECT ON public.promo_review_stats TO postgres;
GRANT SELECT ON public.event_attendee_stats TO postgres;