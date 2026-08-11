-- Add phone column to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS phone text;
