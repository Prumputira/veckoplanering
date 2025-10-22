-- Remove the sync trigger first
DROP TRIGGER IF EXISTS sync_employee_name ON public.employees;
DROP FUNCTION IF EXISTS public.sync_employee_name_to_profile();

-- Step 1: Ensure all employee user_ids have corresponding profiles
INSERT INTO public.profiles (id, name, email)
SELECT e.user_id, e.name, ''
FROM public.employees e
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = e.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add the new user_id column to employee_schedules
ALTER TABLE public.employee_schedules 
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 3: Copy the user_id from employees to schedules
UPDATE public.employee_schedules es
SET user_id = e.user_id
FROM public.employees e
WHERE es.employee_id = e.id;

-- Step 4: Drop OLD RLS policies that depend on employee_id
DROP POLICY IF EXISTS "Users can read own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.employee_schedules;

-- Step 5: Remove old foreign key constraint
ALTER TABLE public.employee_schedules 
  DROP CONSTRAINT IF EXISTS employee_schedules_employee_id_fkey;

-- Step 6: Now drop the old employee_id column
ALTER TABLE public.employee_schedules 
  DROP COLUMN employee_id;

-- Step 7: Make user_id NOT NULL
ALTER TABLE public.employee_schedules 
  ALTER COLUMN user_id SET NOT NULL;

-- Step 8: Add new foreign key to profiles
ALTER TABLE public.employee_schedules 
  ADD CONSTRAINT employee_schedules_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Step 9: Create NEW RLS policies using user_id
CREATE POLICY "Users can read own schedules"
  ON public.employee_schedules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON public.employee_schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON public.employee_schedules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON public.employee_schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 10: Update profiles RLS to allow authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Step 11: Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  
  RETURN new;
END;
$$;

-- Step 12: Now safely drop the employees table
DROP TABLE IF EXISTS public.employees CASCADE;