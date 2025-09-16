-- Drop and recreate get_events_safe function to include slug field for human-readable URLs
DROP FUNCTION IF EXISTS public.get_events_safe();

CREATE OR REPLACE FUNCTION public.get_events_safe()
 RETURNS TABLE(id uuid, title text, description text, date date, "time" time without time zone, venue_name text, venue_address text, venue_latitude numeric, venue_longitude numeric, image_url text, price_currency text, is_recurrent boolean, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, organizer_name text, organizer_whatsapp text, slug text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
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
    -- Critical: Only expose organizer WhatsApp to authenticated users
    CASE 
      WHEN auth.uid() IS NOT NULL THEN e.organizer_whatsapp
      ELSE NULL
    END as organizer_whatsapp,
    e.slug
  FROM public.events e;
$function$