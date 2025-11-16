-- Create table for storing scraped documentation projects
CREATE TABLE IF NOT EXISTS public.scraped_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for storing scraped pages with hierarchy
CREATE TABLE IF NOT EXISTS public.scraped_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.scraped_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.scraped_pages(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, url)
);

-- Enable RLS
ALTER TABLE public.scraped_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "Anyone can view scraped projects"
  ON public.scraped_projects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create scraped projects"
  ON public.scraped_projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update scraped projects"
  ON public.scraped_projects FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete scraped projects"
  ON public.scraped_projects FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view scraped pages"
  ON public.scraped_pages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create scraped pages"
  ON public.scraped_pages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update scraped pages"
  ON public.scraped_pages FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete scraped pages"
  ON public.scraped_pages FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_scraped_pages_project_id ON public.scraped_pages(project_id);
CREATE INDEX idx_scraped_pages_parent_id ON public.scraped_pages(parent_id);
CREATE INDEX idx_scraped_pages_order ON public.scraped_pages(project_id, order_index);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scraped_projects
CREATE TRIGGER update_scraped_projects_updated_at
  BEFORE UPDATE ON public.scraped_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();