-- Add user_id column to employees table to link with profiles
ALTER TABLE public.employees 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Make user_id unique so each user can only have one employee record
ALTER TABLE public.employees 
ADD CONSTRAINT employees_user_id_unique UNIQUE (user_id);

-- Update RLS policies for employees to be based on user_id
DROP POLICY IF EXISTS "Allow all to read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow all to insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow all to update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow all to delete employees" ON public.employees;

-- Everyone can view all employees (for the schedule view)
CREATE POLICY "Anyone can view employees"
ON public.employees
FOR SELECT
USING (true);

-- Only authenticated users can insert their own employee record
CREATE POLICY "Users can insert their own employee record"
ON public.employees
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own employee record
CREATE POLICY "Users can update their own employee record"
ON public.employees
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own employee record
CREATE POLICY "Users can delete their own employee record"
ON public.employees
FOR DELETE
USING (auth.uid() = user_id);