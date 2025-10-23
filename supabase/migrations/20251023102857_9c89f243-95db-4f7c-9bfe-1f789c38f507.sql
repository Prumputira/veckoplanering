-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users view own schedules, admins view all" ON employee_schedules;

-- Create new SELECT policy allowing all authenticated users to view all schedules
CREATE POLICY "All authenticated users can view all schedules"
ON employee_schedules
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);