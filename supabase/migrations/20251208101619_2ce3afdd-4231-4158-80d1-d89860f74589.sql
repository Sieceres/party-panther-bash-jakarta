-- Add parent_id column to event_comments for reply threading
ALTER TABLE public.event_comments
ADD COLUMN parent_id uuid REFERENCES public.event_comments(id) ON DELETE CASCADE;

-- Add parent_id column to promo_comments for reply threading
ALTER TABLE public.promo_comments
ADD COLUMN parent_id uuid REFERENCES public.promo_comments(id) ON DELETE CASCADE;

-- Create indexes for efficient reply lookups
CREATE INDEX idx_event_comments_parent_id ON public.event_comments(parent_id);
CREATE INDEX idx_promo_comments_parent_id ON public.promo_comments(parent_id);