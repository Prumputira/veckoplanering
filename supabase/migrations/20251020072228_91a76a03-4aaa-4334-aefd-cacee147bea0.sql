-- Add UPDATE and DELETE policies for employees table
CREATE POLICY "Allow all to update employees" 
ON public.employees 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all to delete employees" 
ON public.employees 
FOR DELETE 
USING (true);

-- Add policies for employee_schedules to work with authenticated users
-- (policies already exist but confirming they work correctly)