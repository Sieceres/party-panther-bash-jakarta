-- Create simplified fallback functions for better performance

-- Simple events function without complex joins
CREATE OR REPLACE FUNCTION public.get_events_simple()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  date date,
  time time without time zone,
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
  slug text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    e.organizer_whatsapp,
    e.slug
  FROM public.events e
  ORDER BY e.date ASC, e.time ASC;
$function$;

-- Simple promos function without complex joins
CREATE OR REPLACE FUNCTION public.get_promos_simple()
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
  slug text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    pr.slug
  FROM public.promos pr
  ORDER BY pr.created_at DESC;
$function$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date_time ON public.events (date, time);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events (created_by);
CREATE INDEX IF NOT EXISTS idx_promos_created_at ON public.promos (created_at);
CREATE INDEX IF NOT EXISTS idx_promos_created_by ON public.promos (created_by);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees (user_id);
CREATE INDEX IF NOT EXISTS idx_promo_reviews_promo_id ON public.promo_reviews (promo_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_promos_user_id ON public.user_favorite_promos (user_id);