
CREATE TABLE public.html_reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  html_url TEXT NOT NULL,
  thumbnail_url TEXT,
  default_duration INTEGER NOT NULL DEFAULT 6,
  default_fps INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.html_reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view html_reels"
ON public.html_reels FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Admins insert html_reels"
ON public.html_reels FOR INSERT
WITH CHECK (public.is_current_user_admin() AND auth.uid() = created_by);

CREATE POLICY "Admins update html_reels"
ON public.html_reels FOR UPDATE
USING (public.is_current_user_admin());

CREATE POLICY "Admins delete html_reels"
ON public.html_reels FOR DELETE
USING (public.is_current_user_admin());

CREATE TRIGGER update_html_reels_updated_at
BEFORE UPDATE ON public.html_reels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for html-reels/ folder in existing bucket
CREATE POLICY "Admins read html-reels storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'Party Panther Bucket I' AND (storage.foldername(name))[1] = 'html-reels' AND public.is_current_user_admin());

CREATE POLICY "Admins write html-reels storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Party Panther Bucket I' AND (storage.foldername(name))[1] = 'html-reels' AND public.is_current_user_admin());

CREATE POLICY "Admins update html-reels storage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Party Panther Bucket I' AND (storage.foldername(name))[1] = 'html-reels' AND public.is_current_user_admin());

CREATE POLICY "Admins delete html-reels storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'Party Panther Bucket I' AND (storage.foldername(name))[1] = 'html-reels' AND public.is_current_user_admin());
