-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create pills table for manual pill data entry
CREATE TABLE public.pills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generic_name TEXT NOT NULL,
  drug_class TEXT,
  colour TEXT,
  size TEXT,
  shape TEXT,
  dosage TEXT,
  uses TEXT,
  description TEXT,
  warnings TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pills ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can search pills)
CREATE POLICY "Anyone can view pills" 
ON public.pills 
FOR SELECT 
USING (true);

-- Public insert access (anyone can add pills)
CREATE POLICY "Anyone can insert pills" 
ON public.pills 
FOR INSERT 
WITH CHECK (true);

-- Public update access
CREATE POLICY "Anyone can update pills" 
ON public.pills 
FOR UPDATE 
USING (true);

-- Public delete access
CREATE POLICY "Anyone can delete pills" 
ON public.pills 
FOR DELETE 
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_pills_updated_at
BEFORE UPDATE ON public.pills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for pill images
INSERT INTO storage.buckets (id, name, public) VALUES ('pill-images', 'pill-images', true);

-- Storage policies for pill images
CREATE POLICY "Anyone can view pill images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pill-images');

CREATE POLICY "Anyone can upload pill images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pill-images');

CREATE POLICY "Anyone can update pill images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pill-images');

CREATE POLICY "Anyone can delete pill images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pill-images');