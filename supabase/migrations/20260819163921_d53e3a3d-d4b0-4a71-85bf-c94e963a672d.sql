-- 1) Fix the notification trigger: use pg_net (net.http_post), not extensions.http_post
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_telegram boolean;
BEGIN
  SELECT (telegram_chat_id IS NOT NULL AND telegram_chat_id != '') INTO has_telegram
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF NOT COALESCE(has_telegram, false) THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/telegram-notify-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndHRiYWliaG16Ym1rbmpsZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzAyODAsImV4cCI6MjA2NTUwNjI4MH0.jChcXNsowGgb4dz1WTnoTWrBPTK8HeZsUjQA1Mhe5gc'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message,
        'link', NEW.link
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- never let notification delivery break the originating action
    NULL;
  END;

  RETURN NEW;
END;
$function$;

-- 2) Restore EXECUTE on RPCs the app actually calls
GRANT EXECUTE ON FUNCTION public.get_events_safe() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_attendee_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_co_organizers(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_full_profile_info(uuid) TO authenticated;
