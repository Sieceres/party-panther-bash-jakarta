-- Create materialized view for promo review aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS public.promo_review_stats AS
SELECT 
  promo_id_uuid as promo_id,
  COUNT(*)::bigint as total_reviews,
  AVG(rating)::numeric as avg_rating,
  MAX(updated_at) as last_review_date
FROM public.promo_reviews
WHERE promo_id_uuid IS NOT NULL
GROUP BY promo_id_uuid;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_review_stats_promo_id 
ON public.promo_review_stats (promo_id);

-- Create index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_promo_review_stats_avg_rating 
ON public.promo_review_stats (avg_rating DESC);

-- Initial refresh
REFRESH MATERIALIZED VIEW public.promo_review_stats;

-- Create materialized view for event attendee counts
CREATE MATERIALIZED VIEW IF NOT EXISTS public.event_attendee_stats AS
SELECT 
  event_id,
  COUNT(*)::bigint as attendee_count,
  MAX(joined_at) as last_join_date
FROM public.event_attendees
GROUP BY event_id;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_attendee_stats_event_id 
ON public.event_attendee_stats (event_id);

-- Initial refresh
REFRESH MATERIALIZED VIEW public.event_attendee_stats;

-- Function to refresh promo review stats
CREATE OR REPLACE FUNCTION public.refresh_promo_review_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.promo_review_stats;
END;
$$;

-- Function to refresh event attendee stats
CREATE OR REPLACE FUNCTION public.refresh_event_attendee_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.event_attendee_stats;
END;
$$;

-- Update get_promos_with_details to use materialized view
CREATE OR REPLACE FUNCTION public.get_promos_with_details(user_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  discount_text text,
  venue_name text,
  venue_address text,
  venue_latitude numeric,
  venue_longitude numeric,
  image_url text,
  price_currency text,
  original_price_amount integer,
  discounted_price_amount integer,
  valid_until date,
  area text,
  category text,
  promo_type text,
  day_of_week text[],
  drink_type text[],
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  slug text,
  creator_name text,
  creator_avatar text,
  creator_verified boolean,
  average_rating numeric,
  total_reviews bigint,
  is_favorite boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.id,
    pr.title,
    pr.description,
    pr.discount_text,
    pr.venue_name,
    pr.venue_address,
    pr.venue_latitude,
    pr.venue_longitude,
    pr.image_url,
    pr.price_currency,
    pr.original_price_amount,
    pr.discounted_price_amount,
    pr.valid_until,
    pr.area,
    pr.category,
    pr.promo_type,
    pr.day_of_week,
    pr.drink_type,
    pr.created_by,
    pr.created_at,
    pr.updated_at,
    pr.slug,
    COALESCE(p.display_name, 'Anonymous') as creator_name,
    p.avatar_url as creator_avatar,
    COALESCE(p.is_verified, false) as creator_verified,
    COALESCE(rs.avg_rating, 0)::numeric as average_rating,
    COALESCE(rs.total_reviews, 0)::bigint as total_reviews,
    COALESCE(fav.is_favorite, false) as is_favorite
  FROM public.promos pr
  LEFT JOIN public.profiles p ON pr.created_by = p.user_id
  LEFT JOIN public.promo_review_stats rs ON pr.id = rs.promo_id
  LEFT JOIN (
    SELECT promo_id, true as is_favorite
    FROM public.user_favorite_promos
    WHERE user_id = user_id_param
  ) fav ON pr.id = fav.promo_id
  ORDER BY pr.created_at DESC;
$$;

-- Update get_events_with_details to use materialized view
CREATE OR REPLACE FUNCTION public.get_events_with_details(user_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  date date,
  "time" time without time zone,
  venue_name text,
  venue_address text,
  venue_latitude numeric,
  venue_longitude numeric,
  image_url text,
  price_currency text,
  is_recurrent boolean,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  organizer_name text,
  organizer_whatsapp text,
  slug text,
  attendee_count bigint,
  is_joined boolean,
  creator_name text,
  creator_avatar text,
  creator_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.time,
    e.venue_name,
    e.venue_address,
    e.venue_latitude,
    e.venue_longitude,
    e.image_url,
    e.price_currency,
    e.is_recurrent,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.organizer_name,
    CASE 
      WHEN user_id_param IS NOT NULL THEN e.organizer_whatsapp
      ELSE NULL
    END as organizer_whatsapp,
    e.slug,
    COALESCE(ac.attendee_count, 0) as attendee_count,
    COALESCE(ea.is_joined, false) as is_joined,
    COALESCE(p.display_name, 'Anonymous') as creator_name,
    p.avatar_url as creator_avatar,
    COALESCE(p.is_verified, false) as creator_verified
  FROM public.events e
  LEFT JOIN public.event_attendee_stats ac ON e.id = ac.event_id
  LEFT JOIN (
    SELECT event_id, true as is_joined
    FROM public.event_attendees
    WHERE user_id = user_id_param
  ) ea ON e.id = ea.event_id
  LEFT JOIN public.profiles p ON e.created_by = p.user_id
  ORDER BY e.date ASC, e.time ASC;
$$;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh every 10 minutes for promo reviews
SELECT cron.schedule(
  'refresh-promo-review-stats',
  '*/10 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.promo_review_stats'
);

-- Schedule refresh every 10 minutes for event attendees
SELECT cron.schedule(
  'refresh-event-attendee-stats',
  '*/10 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.event_attendee_stats'
);