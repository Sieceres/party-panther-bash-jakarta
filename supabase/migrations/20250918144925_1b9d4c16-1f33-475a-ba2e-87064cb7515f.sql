-- First, let's check if there are actual attendees in the database
SELECT 
  ea.event_id,
  e.title as event_title,
  COUNT(*) as attendee_count
FROM public.event_attendees ea
JOIN public.events e ON e.id = ea.event_id
GROUP BY ea.event_id, e.title
ORDER BY attendee_count DESC;

-- Let's also check the specific event if we know the ID
SELECT * FROM public.event_attendees 
WHERE event_id IN (
  SELECT id FROM public.events 
  WHERE slug = 'test-event' OR title LIKE '%test%'
);