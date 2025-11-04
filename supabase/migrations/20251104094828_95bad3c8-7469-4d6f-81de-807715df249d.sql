-- Create table for office weeks
CREATE TABLE public.office_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL,
  year integer NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(week_number, year, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.office_weeks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view office weeks
CREATE POLICY "All authenticated users can view office weeks"
  ON public.office_weeks
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert office weeks
CREATE POLICY "Admins can insert office weeks"
  ON public.office_weeks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update office weeks
CREATE POLICY "Admins can update office weeks"
  ON public.office_weeks
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete office weeks
CREATE POLICY "Admins can delete office weeks"
  ON public.office_weeks
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_office_weeks_year_week ON public.office_weeks(year, week_number);
CREATE INDEX idx_office_weeks_user ON public.office_weeks(user_id);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_office_weeks_updated_at
  BEFORE UPDATE ON public.office_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();