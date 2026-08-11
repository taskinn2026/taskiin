CREATE TABLE public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Allow public read access to settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin to update app_settings" ON public.app_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Insert default footer links
INSERT INTO public.app_settings (key, value) VALUES (
  'footer_links',
  '[
    {"title": "من نحن", "url": "/#about"},
    {"title": "الشروط والأحكام", "url": "/#terms"},
    {"title": "سياسة الخصوصية", "url": "/#privacy"},
    {"title": "تواصل معنا", "url": "/#contact"}
  ]'::jsonb
);
