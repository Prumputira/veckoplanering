-- Make user_id nullable in office_weeks table to support closed weeks without assigned users
ALTER TABLE office_weeks ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure that if is_closed is false, user_id must be set
-- (This ensures data integrity while allowing NULL user_id for closed weeks)
ALTER TABLE office_weeks 
ADD CONSTRAINT user_id_required_when_open 
CHECK (is_closed = true OR user_id IS NOT NULL);