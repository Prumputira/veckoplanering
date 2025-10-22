-- Fix generate_name_from_email to use unnest correctly
CREATE OR REPLACE FUNCTION public.generate_name_from_email(_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_agg(upper(left(w,1)) || lower(substr(w,2)), ' ')
  FROM unnest(regexp_split_to_array(split_part($1,'@',1), '\\.')) AS w;
$$;

-- Backfill any existing profiles with empty names again (idempotent)
UPDATE public.profiles
SET name = public.generate_name_from_email(email)
WHERE (name IS NULL OR name = '');