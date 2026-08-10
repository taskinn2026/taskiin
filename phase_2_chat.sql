-- PHASE 2: Chat Refinements

-- 1. Add Read Status
-- Add nullable read_at timestamp. If null, message is unread.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Allow Deletion (within 1 hour)
-- Users can delete their own messages if they were created less than 1 hour ago.
CREATE POLICY "Users can delete their own messages within 1 hour"
ON messages FOR DELETE
USING (
  auth.uid() = sender_id 
  AND 
  created_at > (now() - interval '1 hour')
);
