-- Create event_attendees table to track event joins
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_attendees
CREATE POLICY "Users can view event attendees" ON public.event_attendees
  FOR SELECT USING (true);

CREATE POLICY "Users can join events" ON public.event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON public.event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- Update events table to make organizer_name optional
ALTER TABLE public.events ALTER COLUMN organizer_name DROP NOT NULL;