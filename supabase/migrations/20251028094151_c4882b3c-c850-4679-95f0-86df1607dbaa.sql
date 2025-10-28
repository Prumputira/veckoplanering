-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reminder to run every Friday at 13:30 UTC (approximately 14:30 Swedish time)
-- During standard time (UTC+1): 14:30 Swedish = 13:30 UTC
-- During daylight saving (UTC+2): 14:30 Swedish = 12:30 UTC
SELECT cron.schedule(
  'send-weekly-schedule-reminder',
  '30 13 * * 5', -- Every Friday at 13:30 UTC
  $$
  SELECT
    net.http_post(
        url:='https://fgzfpfxwstvlizhyltip.supabase.co/functions/v1/send-schedule-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnemZwZnh3c3R2bGl6aHlsdGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDA4ODIsImV4cCI6MjA3NjQ3Njg4Mn0.c2i8zgJ2D8RR3weKW1GA4o8vrqrJr_TkZ7cwVWnDT0A"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);