-- ====================================================
-- FIX: Allow public reading of confirmed/paid bookings
-- so pilgrim avatars show on Room Cards and in Offer Details
-- Run this in Supabase SQL Editor
-- ====================================================

-- Enable RLS on bookings (if not already)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive-read policies if they exist (ignore errors if not present)
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can view bookings" ON bookings;
DROP POLICY IF EXISTS "Allow read confirmed bookings" ON bookings;

-- 1. Own bookings: user can always see ALL their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- 2. Public preview policy: anyone (even logged out) can view confirmed/paid bookings
--    This is needed to show pilgrim avatars on the offer cards and in Offer Details
CREATE POLICY "Anyone can view confirmed and paid bookings"
ON bookings FOR SELECT
USING (status IN ('confirmed', 'paid'));

-- 3. Own INSERT/UPDATE: only the booking owner
CREATE POLICY "Users can insert their own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ====================================================
-- Also update supabase_schema.sql reference columns
-- These columns were confirmed in production schema but missing from local reference:
-- bookings: partner_search_active (boolean DEFAULT false)
-- payments: payment_type (text)
-- hotels: neighborhood (text), postal_code (text)
-- ====================================================
