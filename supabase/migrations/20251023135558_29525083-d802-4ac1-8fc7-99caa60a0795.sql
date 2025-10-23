-- Add default_office column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN default_office TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.profiles.default_office IS 'User''s default office location (Solna, Sundsvall, Enköping, Nyköping)';