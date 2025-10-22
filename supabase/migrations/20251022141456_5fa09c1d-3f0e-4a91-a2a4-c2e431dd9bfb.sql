-- Add secure search_path to function per linter recommendation
CREATE OR REPLACE FUNCTION public.generate_name_from_email(_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT string_agg(upper(left(w,1)) || lower(substr(w,2)), ' ')
  FROM unnest(regexp_split_to_array(split_part($1,'@',1), '\.')) AS w;
$$;