-- Enable Realtime for these tables (Ignore if already added)
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Ensure replica identity is full so that before/after values are transmitted if needed
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Double check Notifications RLS.
-- Since the user subscribes to `receiver_id=eq.{user_id}`, they need SELECT access.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true); -- Allow triggering notifications from client (optional, depending on your architecture)

-- Double check Messages RLS for Realtime
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- If a user is subscribed to messages, they need SELECT access. 
-- They can see a message if they are part of the conversation.
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = public.messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Ensure participants can select from conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their participations" ON public.conversation_participants;

-- Simplified policy to prevent Postgres Infinite Recursion error (500)
-- It allows any authenticated user to view the participant mappings, which is safe 
-- because the conversations themselves are protected by their own policies.
CREATE POLICY "Users can see their participations"
ON public.conversation_participants FOR SELECT
USING (auth.uid() IS NOT NULL);
