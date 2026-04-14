
-- Enable pg_net if not already
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send Telegram notification via edge function
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_telegram boolean;
  supabase_url text;
  anon_key text;
BEGIN
  -- Quick check: does user have telegram linked?
  SELECT (telegram_chat_id IS NOT NULL AND telegram_chat_id != '') INTO has_telegram
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF NOT has_telegram THEN
    RETURN NEW;
  END IF;

  -- Call the telegram-notify-user edge function
  PERFORM extensions.http_post(
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

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_user_notification_send_telegram
AFTER INSERT ON public.user_notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_telegram_notification();
