-- Create custom_pages table
CREATE TABLE IF NOT EXISTS public.custom_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read custom_pages" ON public.custom_pages;
DROP POLICY IF EXISTS "Admins can manage custom_pages" ON public.custom_pages;

-- 1. Read: Anyone can read custom_pages
CREATE POLICY "Anyone can read custom_pages"
ON public.custom_pages
FOR SELECT
USING (true);

-- 2. All operations: Admins can do anything
CREATE POLICY "Admins can manage custom_pages"
ON public.custom_pages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
