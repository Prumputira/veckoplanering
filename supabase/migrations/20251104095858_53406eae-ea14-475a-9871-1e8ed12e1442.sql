-- Add is_closed column to office_weeks table to support marking weeks as closed
ALTER TABLE office_weeks ADD COLUMN IF NOT EXISTS is_closed boolean DEFAULT false;