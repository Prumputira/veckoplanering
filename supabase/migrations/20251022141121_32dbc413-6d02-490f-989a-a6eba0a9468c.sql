-- Add unique constraint for the new user_id column combination
CREATE UNIQUE INDEX IF NOT EXISTS employee_schedules_user_week_day_key 
  ON public.employee_schedules(user_id, week_number, year, day_key);