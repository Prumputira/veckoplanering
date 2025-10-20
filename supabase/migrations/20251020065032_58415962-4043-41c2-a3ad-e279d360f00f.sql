-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read employees
CREATE POLICY "Allow all to read employees"
ON public.employees
FOR SELECT
TO public
USING (true);

-- Create policy to allow all authenticated users to insert employees
CREATE POLICY "Allow all to insert employees"
ON public.employees
FOR INSERT
TO public
WITH CHECK (true);

-- Insert the 25 employees
INSERT INTO public.employees (name) VALUES
  ('Adam'),
  ('Alan'),
  ('Anders'),
  ('Björn'),
  ('Ferhat'),
  ('Frida'),
  ('Gustavo'),
  ('Henric'),
  ('Johan'),
  ('Johanna'),
  ('Jonas L'),
  ('Madeleine'),
  ('Manuel'),
  ('Martin D'),
  ('Marita'),
  ('Martin L'),
  ('Mattias'),
  ('Olafur'),
  ('Patrik'),
  ('Petra'),
  ('Rasmus'),
  ('Roger'),
  ('Sofia'),
  ('Sven'),
  ('Tomas');