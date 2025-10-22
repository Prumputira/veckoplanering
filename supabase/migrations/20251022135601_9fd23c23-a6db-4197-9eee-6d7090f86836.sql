-- Create trigger to sync employee name changes to profiles
CREATE OR REPLACE FUNCTION public.sync_employee_name_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the profile name when employee name changes
  UPDATE public.profiles
  SET name = NEW.name
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on employees table
DROP TRIGGER IF EXISTS sync_employee_name ON public.employees;
CREATE TRIGGER sync_employee_name
  AFTER UPDATE OF name ON public.employees
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION public.sync_employee_name_to_profile();