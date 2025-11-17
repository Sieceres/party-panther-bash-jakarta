-- Drop all overloads of get_events_with_details function
DROP FUNCTION IF EXISTS get_events_with_details(uuid, integer, date, time);
DROP FUNCTION IF EXISTS get_events_with_details(uuid);
DROP FUNCTION IF EXISTS get_events_with_details();

-- Recreate with attendee count fix using direct count as fallback
CREATE FUNCTION get_events_with_details(
  user_id_param UUID DEFAULT NULL,
  p_limit INT DEFAULT NULL,
  p_after_date DATE DEFAULT NULL,
  p_after_time TIME DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  date DATE,
  "time" TIME,
  venue_name TEXT,
  venue_address TEXT,
  venue_latitude NUMERIC,
  venue_longitude NUMERIC,
  image_url TEXT,
  organizer_name TEXT,
  organizer_whatsapp TEXT,
  price_currency TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_recurrent BOOLEAN,
  slug TEXT,
  attendee_count BIGINT,
  is_joined BOOLEAN,
  creator_name TEXT,
  creator_avatar TEXT,
  creator_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
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
    e.organizer_name,
    CASE 
      WHEN user_id_param IS NOT NULL THEN e.organizer_whatsapp
      ELSE NULL
    END as organizer_whatsapp,
    e.price_currency,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.is_recurrent,
    e.slug,
    -- Use direct count as fallback if view doesn't have data
    COALESCE(
      eas.attendee_count::BIGINT,
      (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id)
    ) as attendee_count,
    EXISTS(
      SELECT 1 FROM event_attendees ea 
      WHERE ea.event_id = e.id AND ea.user_id = user_id_param
    ) as is_joined,
    COALESCE(p.display_name, 'Anonymous') as creator_name,
    p.avatar_url as creator_avatar,
    COALESCE(p.is_verified, false) as creator_verified
  FROM events e
  LEFT JOIN profiles p ON e.created_by = p.user_id
  LEFT JOIN event_attendee_stats eas ON e.id = eas.event_id
  WHERE 
    (p_after_date IS NULL OR e.date > p_after_date)
    OR (p_after_date IS NOT NULL AND e.date = p_after_date AND p_after_time IS NOT NULL AND e.time > p_after_time)
  ORDER BY e.date ASC, e.time ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;