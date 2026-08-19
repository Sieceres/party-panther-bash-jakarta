ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_info text;
ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS payment_claimed_at timestamp with time zone;