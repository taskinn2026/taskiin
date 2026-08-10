-- 1. Drop ALL existing policies on the public schema to ensure a clean slate
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Make sure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Apply New Permissive Policies

-- Profiles: Anyone can view profiles (needed for roommates/chat avatars), but only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Hotels, Rooms, Offers, Room Prices: Anyone can view. Authenticated users can insert/update (backend UI)
CREATE POLICY "Public Read All Hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Auth Insert Hotels" ON public.hotels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Hotels" ON public.hotels FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Public Read All Rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Auth Insert Rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Rooms" ON public.rooms FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Public Read All Offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Auth Insert Offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Offers" ON public.offers FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Public Read All Room Prices" ON public.room_prices FOR SELECT USING (true);
CREATE POLICY "Auth Insert Room Prices" ON public.room_prices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Room Prices" ON public.room_prices FOR UPDATE TO authenticated USING (true);

-- Bookings: Anyone can view (needed to find roommates/intersecting guests). Auth can insert/update.
CREATE POLICY "Public Read Bookings (Roommates logic)" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Auth Insert Bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth Update Bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- Allow webhook/system to update bookings (if needed without auth, usually done via service role which bypasses RLS)

-- Payments: Users can read their own payments, or all (for simplicity).
CREATE POLICY "Public Read Payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Auth Insert Payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- Chat System (Conversations, Participants, Messages): 
-- Required to be readable so the UI can check existing conversations and overlapping users.
CREATE POLICY "Public Read Conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Auth Insert Conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Conversations" ON public.conversations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Public Read Conv Participants" ON public.conversation_participants FOR SELECT USING (true);
CREATE POLICY "Auth Insert Conv Participants" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Conv Participants" ON public.conversation_participants FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Public Read Messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Auth Insert Messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Messages" ON public.messages FOR UPDATE TO authenticated USING (true);
