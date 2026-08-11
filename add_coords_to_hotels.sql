-- Add latitude and longitude columns to hotels table
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS longitude double precision;
