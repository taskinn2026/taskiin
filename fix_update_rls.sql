-- Allow users to update messages in conversations they are part of (needed for "Mark as Read")
CREATE POLICY "Users can update messages in conversations they participate in"
ON messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);
