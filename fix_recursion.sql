-- FIX INFINITE RECURSION IN RLS

-- 1. Create a secure function to check participation without triggering RLS recursively
-- SECURITY DEFINER means this function runs with admin privileges, bypassing RLS checks on the table it queries.
CREATE OR REPLACE FUNCTION is_participant(_conversation_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = _conversation_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive/buggy policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- 3. Re-create policies using the safe function

-- A. conversations
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  is_participant(id)
);

-- B. conversation_participants
CREATE POLICY "Users can view participants of their conversations"
ON conversation_participants FOR SELECT
USING (
  -- I can always see myself
  user_id = auth.uid() 
  OR 
  -- I can see others if I am a participant in that conversation
  is_participant(conversation_id)
);

-- C. messages
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  is_participant(conversation_id)
);

CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND 
  is_participant(conversation_id)
);
