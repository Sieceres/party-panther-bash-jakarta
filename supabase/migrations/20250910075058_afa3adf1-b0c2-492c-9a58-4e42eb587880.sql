-- Create table for user favorite promos
CREATE TABLE public.user_favorite_promos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promo_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorite_promos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorite promos" 
ON public.user_favorite_promos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorite promos" 
ON public.user_favorite_promos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorite promos" 
ON public.user_favorite_promos 
FOR DELETE 
USING (auth.uid() = user_id);