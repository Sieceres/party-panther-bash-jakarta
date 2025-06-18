-- Create user roles enum and table
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'superadmin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY 
    CASE role 
      WHEN 'superadmin' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'user' THEN 3 
    END LIMIT 1;
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Superadmins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.get_user_role(auth.uid()) = 'superadmin');

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  venue_latitude DECIMAL(10,8),
  venue_longitude DECIMAL(11,8),
  price_amount INTEGER,
  price_currency TEXT DEFAULT 'IDR',
  image_url TEXT,
  organizer_name TEXT NOT NULL,
  organizer_whatsapp TEXT,
  max_attendees INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create promos table
CREATE TABLE public.promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_text TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_latitude DECIMAL(10,8),
  venue_longitude DECIMAL(11,8),
  valid_until DATE,
  original_price_amount INTEGER,
  discounted_price_amount INTEGER,
  price_currency TEXT DEFAULT 'IDR',
  image_url TEXT,
  category TEXT,
  day_of_week TEXT,
  area TEXT,
  drink_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on promos
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- Create event tags table (allowing NULL created_by for system tags)
CREATE TABLE public.event_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_tags
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

-- Create event_tag_assignments table
CREATE TABLE public.event_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.event_tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(event_id, tag_id)
);

-- Enable RLS on event_tag_assignments
ALTER TABLE public.event_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Create event comments table
CREATE TABLE public.event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_comments
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Create promo comments table
CREATE TABLE public.promo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID REFERENCES public.promos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on promo_comments
ALTER TABLE public.promo_comments ENABLE ROW LEVEL SECURITY;

-- Update profiles table to include profile_type
ALTER TABLE public.profiles ADD COLUMN profile_type TEXT DEFAULT 'user' CHECK (profile_type IN ('user', 'business'));
ALTER TABLE public.profiles ADD COLUMN business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- Create RLS policies

-- Events policies
CREATE POLICY "Anyone can view events" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any event" 
ON public.events FOR DELETE 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Promos policies
CREATE POLICY "Anyone can view promos" 
ON public.promos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create promos" 
ON public.promos FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own promos" 
ON public.promos FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any promo" 
ON public.promos FOR DELETE 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Event tags policies
CREATE POLICY "Anyone can view event tags" 
ON public.event_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage event tags" 
ON public.event_tags FOR ALL 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Event tag assignments policies
CREATE POLICY "Anyone can view event tag assignments" 
ON public.event_tag_assignments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage assignments for their events" 
ON public.event_tag_assignments FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.events e 
  WHERE e.id = event_id AND e.created_by = auth.uid()
));

-- Event comments policies
CREATE POLICY "Anyone can view event comments" 
ON public.event_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.event_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.event_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment" 
ON public.event_comments FOR DELETE 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Promo comments policies
CREATE POLICY "Anyone can view promo comments" 
ON public.promo_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.promo_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.promo_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment" 
ON public.promo_comments FOR DELETE 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Add admin deletion policy for profiles
CREATE POLICY "Admins can delete any profile" 
ON public.profiles FOR DELETE 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Update promo_reviews policies to allow admin deletion
CREATE POLICY "Admins can delete any review" 
ON public.promo_reviews FOR DELETE 
USING (public.get_user_role(auth.uid()) IN ('admin', 'superadmin'));

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promos_updated_at
BEFORE UPDATE ON public.promos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_comments_updated_at
BEFORE UPDATE ON public.event_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_comments_updated_at
BEFORE UPDATE ON public.promo_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default event tags (system tags with NULL created_by)
INSERT INTO public.event_tags (name, created_by) VALUES 
  ('Electronic', NULL),
  ('Dance', NULL),
  ('Rooftop', NULL),
  ('VIP', NULL),
  ('Cocktails', NULL),
  ('Premium', NULL),
  ('Sunset', NULL),
  ('Exclusive', NULL),
  ('Hip Hop', NULL),
  ('House', NULL),
  ('Techno', NULL),
  ('Jazz', NULL),
  ('Live Music', NULL),
  ('Karaoke', NULL),
  ('Pool Party', NULL);

-- Create fraud detection function
CREATE OR REPLACE FUNCTION public.check_review_fraud()
RETURNS TRIGGER AS $$
DECLARE
  negative_count INTEGER;
  total_count INTEGER;
  fraud_threshold DECIMAL := 0.8; -- 80% negative reviews
BEGIN
  -- Count user's reviews
  SELECT 
    COUNT(*) FILTER (WHERE rating <= 2),
    COUNT(*)
  INTO negative_count, total_count
  FROM public.promo_reviews 
  WHERE user_id = NEW.user_id;
  
  -- If user has more than 5 reviews and 80%+ are negative, flag as potential fraud
  IF total_count >= 5 AND (negative_count::DECIMAL / total_count) >= fraud_threshold THEN
    -- Log this for admin review (you could create a fraud_alerts table)
    RAISE WARNING 'Potential review fraud detected for user %, negative reviews: %/%', 
      NEW.user_id, negative_count, total_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for fraud detection
CREATE TRIGGER check_review_fraud_trigger
AFTER INSERT OR UPDATE ON public.promo_reviews
FOR EACH ROW
EXECUTE FUNCTION public.check_review_fraud();