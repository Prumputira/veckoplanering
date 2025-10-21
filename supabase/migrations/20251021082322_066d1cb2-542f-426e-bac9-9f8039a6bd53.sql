-- Make user_id NOT NULL in employees table
-- This ensures every employee is associated with a user and prevents orphaned records

-- First, update any NULL user_id values (should be none due to trigger, but just in case)
UPDATE public.employees 
SET user_id = id 
WHERE user_id IS NULL;

-- Make user_id column NOT NULL
ALTER TABLE public.employees 
ALTER COLUMN user_id SET NOT NULL;