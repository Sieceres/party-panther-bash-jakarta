-- Create a table for promo reviews
CREATE TABLE public.promo_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.promo_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for promo reviews
CREATE POLICY "Anyone can view promo reviews" 
ON public.promo_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reviews" 
ON public.promo_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.promo_reviews 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.promo_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_promo_reviews_updated_at
BEFORE UPDATE ON public.promo_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();