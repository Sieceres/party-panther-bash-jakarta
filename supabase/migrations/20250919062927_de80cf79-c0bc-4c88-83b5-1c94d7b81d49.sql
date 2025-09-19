-- Create optimized RPC function for events with all related data
CREATE OR REPLACE FUNCTION public.get_events_with_details(user_id_param uuid DEFAULT NULL)
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
    -- Only expose organizer WhatsApp to authenticated users
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
  LEFT JOIN (
    SELECT event_id, COUNT(*) as attendee_count
    FROM public.event_attendees
    GROUP BY event_id
  ) ac ON e.id = ac.event_id
  LEFT JOIN (
    SELECT event_id, true as is_joined
    FROM public.event_attendees
    WHERE user_id = user_id_param
  ) ea ON e.id = ea.event_id
  LEFT JOIN public.profiles p ON e.created_by = p.user_id
  ORDER BY e.date ASC, e.time ASC;
$function$;

-- Create optimized RPC function for promos with all related data
CREATE OR REPLACE FUNCTION public.get_promos_with_details(user_id_param uuid DEFAULT NULL)
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
    pr.slug,
    COALESCE(p.display_name, 'Anonymous') as creator_name,
    p.avatar_url as creator_avatar,
    COALESCE(p.is_verified, false) as creator_verified,
    COALESCE(rs.average_rating, 0) as average_rating,
    COALESCE(rs.total_reviews, 0) as total_reviews,
    COALESCE(fav.is_favorite, false) as is_favorite
  FROM public.promos pr
  LEFT JOIN public.profiles p ON pr.created_by = p.user_id
  LEFT JOIN (
    SELECT 
      promo_id, 
      AVG(rating)::numeric as average_rating,
      COUNT(*)::bigint as total_reviews
    FROM public.promo_reviews
    GROUP BY promo_id
  ) rs ON pr.id = rs.promo_id::uuid
  LEFT JOIN (
    SELECT promo_id, true as is_favorite
    FROM public.user_favorite_promos
    WHERE user_id = user_id_param
  ) fav ON pr.id = fav.promo_id
  ORDER BY pr.created_at DESC;
$function$;

-- Create function to get user admin status (cached)
CREATE OR REPLACE FUNCTION public.get_user_admin_status(user_id_param uuid)
 RETURNS TABLE(is_admin boolean, is_super_admin boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(p.is_admin, false) as is_admin,
    COALESCE(p.is_super_admin, false) as is_super_admin
  FROM public.profiles p
  WHERE p.user_id = user_id_param;
$function$;