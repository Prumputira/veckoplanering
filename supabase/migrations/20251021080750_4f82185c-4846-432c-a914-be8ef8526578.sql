-- Insert existing users into employees table if they don't already have an employee record
INSERT INTO public.employees (name, user_id)
SELECT 
  p.name,
  p.id
FROM public.profiles p
LEFT JOIN public.employees e ON e.user_id = p.id
WHERE e.user_id IS NULL;