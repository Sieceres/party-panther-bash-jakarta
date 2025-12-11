-- Create instagram_templates table
CREATE TABLE public.instagram_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  settings_url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_starter BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view public templates and their own"
ON public.instagram_templates
FOR SELECT
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
ON public.instagram_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
ON public.instagram_templates
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
ON public.instagram_templates
FOR DELETE
USING (auth.uid() = created_by);

-- Superadmins can manage starter templates
CREATE POLICY "Superadmins can manage all templates"
ON public.instagram_templates
FOR ALL
USING (has_superadmin_role(auth.uid()));

-- Index for faster queries
CREATE INDEX idx_instagram_templates_public ON public.instagram_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_instagram_templates_created_by ON public.instagram_templates(created_by);

-- Updated at trigger
CREATE TRIGGER update_instagram_templates_updated_at
BEFORE UPDATE ON public.instagram_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();