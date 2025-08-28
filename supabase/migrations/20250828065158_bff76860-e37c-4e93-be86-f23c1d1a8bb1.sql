-- Create event_event_tags junction table for many-to-many relationship
CREATE TABLE public.event_event_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_event_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for event tags
CREATE POLICY "Anyone can view event tags" 
ON public.event_event_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Event creators can manage tags for their events" 
ON public.event_event_tags 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_event_tags.event_id 
  AND events.created_by = auth.uid()
));

-- Create index for better performance
CREATE INDEX idx_event_event_tags_event_id ON public.event_event_tags(event_id);
CREATE INDEX idx_event_event_tags_tag_name ON public.event_event_tags(tag_name);