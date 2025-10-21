-- Update handle_new_user to automatically create both profile and employee records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  
  -- Insert into employees table with user_id
  INSERT INTO public.employees (name, user_id)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.id
  );
  
  RETURN new;
END;
$$;