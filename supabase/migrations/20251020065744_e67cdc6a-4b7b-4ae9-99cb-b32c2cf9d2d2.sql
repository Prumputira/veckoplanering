-- Create table for storing employee schedules per week
CREATE TABLE public.employee_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  day_key TEXT NOT NULL CHECK (day_key IN ('mon', 'tue', 'wed', 'thu', 'fri')),
  status JSONB NOT NULL DEFAULT '{"segments": [{"status": "office"}]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, week_number, year, day_key)
);

-- Enable Row Level Security
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_schedules
CREATE POLICY "Allow all to read schedules" 
ON public.employee_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all to insert schedules" 
ON public.employee_schedules 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all to update schedules" 
ON public.employee_schedules 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all to delete schedules" 
ON public.employee_schedules 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_employee_schedules_week ON public.employee_schedules(employee_id, week_number, year);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_employee_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_schedules_updated_at
BEFORE UPDATE ON public.employee_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_employee_schedules_updated_at();