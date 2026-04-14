
SELECT cron.schedule(
  'poll-telegram-updates',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/telegram-poll',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndHRiYWliaG16Ym1rbmpsZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzAyODAsImV4cCI6MjA2NTUwNjI4MH0.jChcXNsowGgb4dz1WTnoTWrBPTK8HeZsUjQA1Mhe5gc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
