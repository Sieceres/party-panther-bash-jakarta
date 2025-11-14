-- Add category and sort_order columns to event_tags (with default values for existing rows)
ALTER TABLE public.event_tags
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'event_type',
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Add unique constraint to event_tag_assignments to prevent duplicates (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_event_tag_assignment'
  ) THEN
    ALTER TABLE public.event_tag_assignments
    ADD CONSTRAINT unique_event_tag_assignment UNIQUE (event_id, tag_id);
  END IF;
END $$;

-- Update RLS policies for event_tags to allow admin management
DROP POLICY IF EXISTS "Anyone can view event tags" ON public.event_tags;

CREATE POLICY "Anyone can view event tags"
ON public.event_tags
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert event tags" ON public.event_tags;
CREATE POLICY "Admins can insert event tags"
ON public.event_tags
FOR INSERT
WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can update event tags" ON public.event_tags;
CREATE POLICY "Admins can update event tags"
ON public.event_tags
FOR UPDATE
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete event tags" ON public.event_tags;
CREATE POLICY "Admins can delete event tags"
ON public.event_tags
FOR DELETE
USING (has_admin_role(auth.uid()));

-- Seed initial tag data (use ON CONFLICT DO NOTHING to handle existing tags)
-- Music Type tags
INSERT INTO public.event_tags (name, category, sort_order) VALUES
('Live Music', 'music_type', 1),
('DJ', 'music_type', 2),
('Karaoke', 'music_type', 3),
('Rock', 'music_type', 4)
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, sort_order = EXCLUDED.sort_order;

-- Event Type tags
INSERT INTO public.event_tags (name, category, sort_order) VALUES
('Concert', 'event_type', 1),
('Festival', 'event_type', 2),
('Bar Crawl', 'event_type', 3),
('Singles Night', 'event_type', 4),
('Networking', 'event_type', 5)
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, sort_order = EXCLUDED.sort_order;

-- Venue tags
INSERT INTO public.event_tags (name, category, sort_order) VALUES
('Rooftop', 'venue', 1),
('Lounge', 'venue', 2),
('Bar', 'venue', 3),
('Club', 'venue', 4),
('Restaurant', 'venue', 5)
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, sort_order = EXCLUDED.sort_order;

-- Crowd tags
INSERT INTO public.event_tags (name, category, sort_order) VALUES
('Students', 'crowd', 1),
('LGBTQ+ Friendly', 'crowd', 2),
('Over 30', 'crowd', 3),
('Expats', 'crowd', 4),
('Locals', 'crowd', 5)
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, sort_order = EXCLUDED.sort_order;

-- Create helper function to get tags by category
CREATE OR REPLACE FUNCTION public.get_event_tags_by_category()
RETURNS TABLE(
  id uuid,
  name text,
  category text,
  sort_order integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, category, sort_order
  FROM public.event_tags
  ORDER BY category, sort_order;
$$;