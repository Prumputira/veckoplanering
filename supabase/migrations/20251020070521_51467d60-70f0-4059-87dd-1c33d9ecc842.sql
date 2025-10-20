-- Update default status for employee_schedules table to 'unset'
ALTER TABLE public.employee_schedules 
ALTER COLUMN status SET DEFAULT '{"segments": [{"status": "unset"}]}'::jsonb;