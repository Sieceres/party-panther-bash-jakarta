-- Add payment tracking option to events table
ALTER TABLE public.events 
ADD COLUMN track_payments boolean NOT NULL DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN public.events.track_payments IS 'Whether this event requires payment tracking and receipt uploads from attendees';