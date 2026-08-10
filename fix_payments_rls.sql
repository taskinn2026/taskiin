-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can insert payments for their own bookings" ON payments;
DROP POLICY IF EXISTS "Users can view payments for their own bookings" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- 1. INSERT Policy: Allow users to pay for their own bookings
CREATE POLICY "Users can insert payments for their own bookings" 
ON payments FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- 2. SELECT Policy: Allow users to view payments for their own bookings
CREATE POLICY "Users can view payments for their own bookings" 
ON payments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = payments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- 3. UPDATE/DELETE? Usually payments are immutable log. 
-- If needed, we can add them later. For now, INSERT/SELECT is key.
