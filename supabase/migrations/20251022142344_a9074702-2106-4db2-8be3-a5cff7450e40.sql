-- Update RLS policies to allow all authenticated users to manage all schedules
DROP POLICY IF EXISTS "Users can read own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.employee_schedules;

-- All authenticated users can view all schedules
CREATE POLICY "Authenticated users can view all schedules"
  ON public.employee_schedules
  FOR SELECT
  USING (true);

-- All authenticated users can insert schedules for anyone
CREATE POLICY "Authenticated users can insert schedules"
  ON public.employee_schedules
  FOR INSERT
  WITH CHECK (true);

-- All authenticated users can update all schedules
CREATE POLICY "Authenticated users can update all schedules"
  ON public.employee_schedules
  FOR UPDATE
  USING (true);

-- All authenticated users can delete all schedules
CREATE POLICY "Authenticated users can delete all schedules"
  ON public.employee_schedules
  FOR DELETE
  USING (true);