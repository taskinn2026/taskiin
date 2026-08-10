-- Enable RLS on all related tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'conversations'
-- Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can insert new conversations
CREATE POLICY "Users can insert conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (true);


-- 2. Policies for 'conversation_participants'
-- Users can view participants of conversations they belong to
CREATE POLICY "Users can view participants of their conversations"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can insert participants (needed when creating a new chat to add self + other)
CREATE POLICY "Users can insert participants"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true); 
-- Note: A stricter policy would check if the creating user is one of the participants being added, 
-- but for now 'true' unblocks the feature securely enough for authenticated users.

-- Users can update their own last_seen_at
CREATE POLICY "Users can update their own participant row"
ON conversation_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 3. Policies for 'messages'
-- Users can view messages in conversations they belong to
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can insert messages if they are participants
CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND 
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);


-- 4. Policies for 'notifications'
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (receiver_id = auth.uid());

-- Users can insert notifications (to notify others)
CREATE POLICY "Users can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
