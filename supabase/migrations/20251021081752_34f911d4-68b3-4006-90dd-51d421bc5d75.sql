-- Fix critical RLS security issues on employee_schedules table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all to read schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Allow all to insert schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Allow all to update schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Allow all to delete schedules" ON public.employee_schedules;

-- Create secure user-scoped policies for employee_schedules
CREATE POLICY "Users can read own schedules" ON public.employee_schedules
FOR SELECT TO authenticated
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own schedules" ON public.employee_schedules
FOR INSERT TO authenticated
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own schedules" ON public.employee_schedules
FOR UPDATE TO authenticated
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own schedules" ON public.employee_schedules
FOR DELETE TO authenticated
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- Fix employees table RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;

CREATE POLICY "Authenticated users can view employees" ON public.employees
FOR SELECT TO authenticated
USING (true);