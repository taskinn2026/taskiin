-- ============================================================================
-- MOCK DATA GENERATION SCRIPT (SINGLE USER MODE - V2)
-- ============================================================================
-- Adapted to use existing User ID: b51a4001-6228-4808-b185-cce04d13be17
-- This user will act as both the Hotel Owner AND the Pilgrim for testing.
--
-- Tables covered:
-- 1. profiles (Upsert for the existing user)
-- 2. hotels (All owned by this user)
-- 3. rooms
-- 4. room_prices
-- 5. offers
-- 6. bookings (All made by this user)
-- 7. payments etc.
-- ============================================================================

-- Variables
-- User ID: b51a4001-6228-4808-b185-cce04d13be17

-- 1. PROFILES
-- We update the existing profile or insert if missing (though FK user must exist)
INSERT INTO public.profiles (id, full_name, email, phone, role, city, state, gender, avatar_url)
VALUES 
    ('b51a4001-6228-4808-b185-cce04d13be17', 'Partner Ahmed (Test)', 'madaniameur26@gmail.com', '0555555555', 'hotel', 'Makkah', 'Makkah', 'male', 'https://ui-avatars.com/api/?name=Partner+Ahmed&background=10B981&color=fff')
ON CONFLICT (id) DO UPDATE 
SET 
    role = 'hotel', -- Force role to hotel to test Partner Panel
    full_name = 'Partner Ahmed (Test)',
    phone = '0555555555',
    city = 'Makkah';

-- 2. HOTELS
INSERT INTO public.hotels (id, owner_id, name, city, address, distance_to_haram_meters, verification_status, commission_percent, is_active)
VALUES
    ('h1111111-1111-1111-1111-111111111111', 'b51a4001-6228-4808-b185-cce04d13be17', 'Makkah Royal Tower', 'مكة', 'Ajyad Street, Makkah', 50, 'gold', 12.0, true),
    ('h2222222-2222-2222-2222-222222222222', 'b51a4001-6228-4808-b185-cce04d13be17', 'Madinah Harmony Hotel', 'المدينة', 'King Faisal Rd, Madinah', 300, 'blue', 10.0, true),
    ('h3333333-3333-3333-3333-333333333333', 'b51a4001-6228-4808-b185-cce04d13be17', 'Jabal Omar Hyatt', 'مكة', 'Jabal Omar, Makkah', 150, 'gold', 15.0, true)
ON CONFLICT (id) DO UPDATE SET owner_id = 'b51a4001-6228-4808-b185-cce04d13be17';

-- 3. ROOMS
INSERT INTO public.rooms (id, hotel_id, title, room_type, total_beds, default_price)
VALUES
    ('r1111111-1111-1111-1111-111111111111', 'h1111111-1111-1111-1111-111111111111', 'Deluxe Kaaba View', 'quad', 4, 1200),
    ('r2222222-2222-2222-2222-222222222222', 'h1111111-1111-1111-1111-111111111111', 'Standard Double', 'double', 2, 600),
    ('r3333333-3333-3333-3333-333333333333', 'h2222222-2222-2222-2222-222222222222', 'Executive Suite', 'triple', 3, 900),
    ('r4444444-4444-4444-4444-444444444444', 'h3333333-3333-3333-3333-333333333333', 'King Room', 'double', 2, 1500)
ON CONFLICT (id) DO NOTHING;

-- 4. ROOM PRICES (Seasonal)
INSERT INTO public.room_prices (room_id, start_date, end_date, price)
VALUES
    ('r1111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 1800),
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
-- Using the SAME user ID as the guest (Self-booking for testing)
INSERT INTO public.bookings (id, user_id, offer_id, status, check_in, check_out, guests, booking_ref, deposit_paid, checked_in_at)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'b51a4001-6228-4808-b185-cce04d13be17', 'o1111111-1111-1111-1111-111111111111', 'confirmed', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 4, 'REF123', 400, null),
    ('b2222222-2222-2222-2222-222222222222', 'b51a4001-6228-4808-b185-cce04d13be17', 'o3333333-3333-3333-3333-333333333333', 'pending', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 3, 'REF456', 300, null),
    ('b3333333-3333-3333-3333-333333333333', 'b51a4001-6228-4808-b185-cce04d13be17', 'o2222222-2222-2222-2222-222222222222', 'confirmed', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 2, 'REF789', 200, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET user_id = 'b51a4001-6228-4808-b185-cce04d13be17';

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
    ('b51a4001-6228-4808-b185-cce04d13be17', 'o2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

INSERT INTO public.saved_searches (user_id, city, guests, budget_max)
VALUES
    ('b51a4001-6228-4808-b185-cce04d13be17', 'Makkah', 4, 2000)
ON CONFLICT DO NOTHING;

-- 11. CONVERSATIONS & MESSAGES
-- Conversation between User (Himself) and Hotel (Himself)
WITH conv AS (
    INSERT INTO public.conversations (type, unique_key)
    VALUES ('user_hotel', 'conv_self_test')
    RETURNING id
)
INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT id, 'b51a4001-6228-4808-b185-cce04d13be17', 'user' FROM conv
UNION ALL
SELECT id, 'b51a4001-6228-4808-b185-cce04d13be17', 'hotel' FROM conv;

INSERT INTO public.messages (conversation_id, sender_id, sender_role, message, message_type)
SELECT 
    c.id, 
    'b51a4001-6228-4808-b185-cce04d13be17', 
    'pilgrim', 
    'السلام عليكم، هذا اختبار للمحادثة', 
    'text'
FROM public.conversations c WHERE c.unique_key = 'conv_self_test';

-- 12. BROADCASTS
INSERT INTO public.broadcasts (sender_id, sender_role, title, message, target_city, status)
VALUES
    ('b51a4001-6228-4808-b185-cce04d13be17', 'admin', 'تحديث النظام', 'سيتم إجراء صيانة دورية الليلة.', 'Makkah', 'sent')
ON CONFLICT DO NOTHING;

-- 13. NOTIFICATIONS
INSERT INTO public.notifications (receiver_id, receiver_role, type, title, body, is_read)
VALUES
    ('b51a4001-6228-4808-b185-cce04d13be17', 'pilgrim', 'system', 'مرحباً بك', 'أهلاً بك في منصة تلبية!', false)
ON CONFLICT DO NOTHING;

-- 14. USER DEVICES
INSERT INTO public.user_devices (user_id, fcm_token, platform)
VALUES
    ('b51a4001-6228-4808-b185-cce04d13be17', 'mock_fcm_token_99999', 'android')
ON CONFLICT DO NOTHING;

-- END OF MOCK DATA
