-- Create instagram_posts table for storing post metadata
CREATE TABLE public.instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only superadmins can manage their own posts
CREATE POLICY "Superadmins can view their posts"
  ON public.instagram_posts
  FOR SELECT
  USING (has_superadmin_role(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Superadmins can create posts"
  ON public.instagram_posts
  FOR INSERT
  WITH CHECK (has_superadmin_role(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Superadmins can update their posts"
  ON public.instagram_posts
  FOR UPDATE
  USING (has_superadmin_role(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (has_superadmin_role(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Superadmins can delete their posts"
  ON public.instagram_posts
  FOR DELETE
  USING (has_superadmin_role(auth.uid()) AND created_by = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_instagram_posts_updated_at
  BEFORE UPDATE ON public.instagram_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();