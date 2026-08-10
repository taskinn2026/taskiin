-- Enable RLS on tables if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'conversation_participants'
-- Allow users to view their own participation rows
CREATE POLICY "Users can view their own conversation participations"
ON conversation_participants FOR SELECT
USING (auth.uid() = user_id);

-- 2. Policies for 'messages'
-- Allow users to view messages in conversations they are part of
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to insert messages into conversations they are part of
CREATE POLICY "Users can insert messages into their conversations"
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

-- Allow users to update their own messages (e.g. mark as deleted/edited if implemented)
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);
