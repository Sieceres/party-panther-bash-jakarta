CREATE TABLE public.admin_ai_access_state (
 model text PRIMARY KEY,
 reason text NOT NULL,
 status integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_ai_access_state TO authenticated;
GRANT ALL ON public.admin_ai_access_state TO service_role;
ALTER TABLE public.admin_ai_access_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage AI access state" ON public.admin_ai_access_state FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE FUNCTION public.touch_admin_ai_access_state() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER touch_admin_ai_access_state BEFORE UPDATE ON public.admin_ai_access_state FOR EACH ROW EXECUTE FUNCTION public.touch_admin_ai_access_state();