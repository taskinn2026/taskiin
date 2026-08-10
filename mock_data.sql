-- ============================================================================
-- MOCK DATA GENERATION SCRIPT
-- ============================================================================
-- This script fills the database with sample data for testing purposes.
-- It respects Foreign Key constraints by inserting data in the correct order.
--
-- Tables covered:
-- 1. profiles (Users: Admin, Hotel Partners, Pilgrims)
-- 2. hotels
-- 3. rooms
-- 4. room_prices
-- 5. offers
-- 6. bookings
-- 7. payments & payout_requests
-- 8. banners
-- 9. saved_searches & favorites
-- 10. conversations & messages
-- ============================================================================

-- 1. PROFILES
-- We use fixed UUIDs to easily reference them later.
-- Passwords are not handled here (Supabase Auth handles that), 
-- these are just the public profile records.

INSERT INTO public.profiles (id, full_name, email, phone, role, city, state, gender, avatar_url)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User', 'admin@talbia.com', '0500000000', 'admin', 'Riyadh', 'Riyadh', 'male', 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Partner Ahmed', 'partner1@hotel.com', '0511111111', 'hotel', 'Makkah', 'Makkah', 'male', 'https://ui-avatars.com/api/?name=Partner+Ahmed&background=10B981&color=fff'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Partner Sarah', 'partner2@hotel.com', '0522222222', 'hotel', 'Madinah', 'Madinah', 'female', 'https://ui-avatars.com/api/?name=Partner+Sarah&background=F59E0B&color=fff'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Pilgrim Omar', 'pilgrim1@gmail.com', '0533333333', 'pilgrim', 'Alger', 'Alger', 'male', 'https://ui-avatars.com/api/?name=Pilgrim+Omar&background=6366F1&color=fff'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'Pilgrim Fatima', 'pilgrim2@gmail.com', '0544444444', 'pilgrim', 'Oran', 'Oran', 'female', 'https://ui-avatars.com/api/?name=Pilgrim+Fatima&background=EC4899&color=fff')
ON CONFLICT (id) DO NOTHING;

-- 2. HOTELS
INSERT INTO public.hotels (id, owner_id, name, city, address, distance_to_haram_meters, verification_status, commission_percent, is_active)
VALUES
    ('h1111111-1111-1111-1111-111111111111', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Makkah Royal Tower', 'مكة', 'Ajyad Street, Makkah', 50, 'gold', 12.0, true),
    ('h2222222-2222-2222-2222-222222222222', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Madinah Harmony Hotel', 'المدينة', 'King Faisal Rd, Madinah', 300, 'blue', 10.0, true),
    ('h3333333-3333-3333-3333-333333333333', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Jabal Omar Hyatt', 'مكة', 'Jabal Omar, Makkah', 150, 'gold', 15.0, true)
ON CONFLICT (id) DO NOTHING;

-- 3. ROOMS
INSERT INTO public.rooms (id, hotel_id, title, room_type, total_beds, default_price)
VALUES
    ('r1111111-1111-1111-1111-111111111111', 'h1111111-1111-1111-1111-111111111111', 'Deluxe Kaaba View', 'quad', 4, 1200),
    ('r2222222-2222-2222-2222-222222222222', 'h1111111-1111-1111-1111-111111111111', 'Standard Double', 'double', 2, 600),
    ('r3333333-3333-3333-3333-333333333333', 'h2222222-2222-2222-2222-222222222222', 'Executive Suite', 'triple', 3, 900),
    ('r4444444-4444-4444-4444-444444444444', 'h3333333-3333-3333-3333-333333333333', 'King Room', 'double', 2, 1500)
ON CONFLICT (id) DO NOTHING;

-- 4. ROOM PRICES (Seasonal)
-- Adding a Ramadan price surge for the Deluxe Room
INSERT INTO public.room_prices (room_id, start_date, end_date, price)
VALUES
    ('r1111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 1800), -- High Season
    ('r2222222-2222-2222-2222-222222222222', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '15 days', 800)
ON CONFLICT DO NOTHING;

-- 5. OFFERS
INSERT INTO public.offers (id, room_id, price_per_night, discount_price, available_from, available_to, status)
VALUES
    ('o1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 1200, 1100, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'approved'),
    ('o2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', 600, null, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'approved'),
    ('o3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333', 900, 850, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 'approved'),
    ('o4444444-4444-4444-4444-444444444444', 'r4444444-4444-4444-4444-444444444444', 1500, null, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 6. BOOKINGS
INSERT INTO public.bookings (id, user_id, offer_id, status, check_in, check_out, guests, booking_ref, deposit_paid, checked_in_at)
VALUES
    -- Confirmed Booking for Pilgrim Omar
    ('b1111111-1111-1111-1111-111111111111', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'o1111111-1111-1111-1111-111111111111', 'confirmed', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 4, 'REF123', 400, null),
    
    -- Pending Booking for Pilgrim Fatima
    ('b2222222-2222-2222-2222-222222222222', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'o3333333-3333-3333-3333-333333333333', 'pending', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 3, 'REF456', 300, null),

    -- Checked-in Booking
    ('b3333333-3333-3333-3333-333333333333', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'o2222222-2222-2222-2222-222222222222', 'confirmed', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 2, 'REF789', 200, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 7. PAYMENTS
INSERT INTO public.payments (booking_id, amount, status, payment_method)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 400, 'paid', 'credit_card'),
    ('b3333333-3333-3333-3333-333333333333', 200, 'paid', 'edahabiacard')
ON CONFLICT DO NOTHING;

-- 8. PAYOUT REQUESTS
INSERT INTO public.payout_requests (hotel_id, amount, status)
VALUES
    ('h1111111-1111-1111-1111-111111111111', 5000, 'pending'),
    ('h2222222-2222-2222-2222-222222222222', 2500, 'approved')
ON CONFLICT DO NOTHING;

-- 9. BANNERS
INSERT INTO public.banners (type, title, subtitle, image_url, position, is_active)
VALUES
    ('promo', 'عروض رمضان المبارك', 'خصم يصل إلى 30% على فنادق مكة', 'https://images.unsplash.com/photo-1565552695502-3c467a3z5c32?auto=format&fit=crop&q=80', 1, true),
    ('season', 'موسم العمرة', 'أفضل الأسعار بالقرب من الحرم', 'https://images.unsplash.com/photo-159160412993-c90a82fdb303?auto=format&fit=crop&q=80', 2, true)
ON CONFLICT DO NOTHING;

-- 10. SAVED SEARCHES & FAVORITES
INSERT INTO public.favorites (user_id, offer_id)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'o2222222-2222-2222-2222-222222222222'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'o1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO public.saved_searches (user_id, city, guests, budget_max)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Makkah', 4, 2000)
ON CONFLICT DO NOTHING;

-- 11. CONVERSATIONS & MESSAGES
-- Create a conversation between Pilgrim Omar and Hotel Partner Ahmed
WITH conv AS (
    INSERT INTO public.conversations (type, unique_key)
    VALUES ('user_hotel', 'conv_1')
    RETURNING id
)
INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT id, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'user' FROM conv
UNION ALL
SELECT id, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'hotel' FROM conv;

-- Add messages to that conversation
INSERT INTO public.messages (conversation_id, sender_id, sender_role, message, message_type)
SELECT 
    c.id, 
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 
    'pilgrim', 
    'السلام عليكم، هل الغرفة تطل على الكعبة؟', 
    'text'
FROM public.conversations c WHERE c.unique_key = 'conv_1';

INSERT INTO public.messages (conversation_id, sender_id, sender_role, message, message_type)
SELECT 
    c.id, 
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 
    'hotel', 
    'وعليكم السلام، نعم يا عمر، الغرفة تطل مباشرة على الحرم.', 
    'text'
FROM public.conversations c WHERE c.unique_key = 'conv_1';

-- ============================================================================
-- END OF MOCK DATA
-- ============================================================================
