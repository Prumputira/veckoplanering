-- Fix overly permissive RLS policies on employee_schedules
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Authenticated users can update all schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete all schedules" ON public.employee_schedules;

-- Create new restrictive policies
-- Users can view their own schedules, admins can view all
CREATE POLICY "Users view own schedules, admins view all"
ON public.employee_schedules
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own schedules, admins can insert all
CREATE POLICY "Users insert own schedules, admins insert all"
ON public.employee_schedules
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own schedules, admins can update all
CREATE POLICY "Users update own schedules, admins update all"
ON public.employee_schedules
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Users can delete their own schedules, admins can delete all
CREATE POLICY "Users delete own schedules, admins delete all"
ON public.employee_schedules
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));