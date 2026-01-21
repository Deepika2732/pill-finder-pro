-- Create detection history table
CREATE TABLE public.detection_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pill_name TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  color TEXT,
  shape TEXT,
  imprint TEXT,
  description TEXT,
  usage TEXT,
  warnings TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no auth required for this demo)
CREATE POLICY "Anyone can view detection history" 
ON public.detection_history 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can insert detection history" 
ON public.detection_history 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public delete access
CREATE POLICY "Anyone can delete detection history" 
ON public.detection_history 
FOR DELETE 
USING (true);