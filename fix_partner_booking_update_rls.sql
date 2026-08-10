-- =========================================================================
-- FIX: ALLOW HOTEL PARTNERS TO UPDATE BOOKINGS (e.g., to 'paid' status)
-- =========================================================================

-- The current policy "Users can update their own bookings" ONLY allows Pilgrims (user_id).
-- We need to add a specialized policy allowing Partners to update bookings tied to their offers.

-- Drop if it already exists to prevent duplicate errors
DROP POLICY IF EXISTS "Partners can update their own hotel bookings" ON bookings;

-- Create policy allowing Hotel Owners to UPDATE bookings linked to their owned Hotels
CREATE POLICY "Partners can update their own hotel bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM offers o
        JOIN rooms r ON o.room_id = r.id
        JOIN hotels h ON r.hotel_id = h.id
        WHERE o.id = bookings.offer_id 
        AND h.owner_id = auth.uid()
    )
);
