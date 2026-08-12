-- 1. Fix the bookings status constraint to allow 'completed'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (
  status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled')
);

-- 2. Enable RLS and add policies for payout_requests
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow hotels to insert payout requests" ON public.payout_requests;
CREATE POLICY "Allow hotels to insert payout requests" 
ON public.payout_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.hotels 
    WHERE hotels.id = payout_requests.hotel_id 
    AND hotels.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow hotels to view payout requests" ON public.payout_requests;
CREATE POLICY "Allow hotels to view payout requests" 
ON public.payout_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.hotels 
    WHERE hotels.id = payout_requests.hotel_id 
    AND hotels.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow admins to manage payout requests" ON public.payout_requests;
CREATE POLICY "Allow admins to manage payout requests" 
ON public.payout_requests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
