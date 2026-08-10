-- FIX CHAT CREATION (Chicken-and-Egg RLS Problem)

-- This function creates the conversation AND adds participants in one atomic transaction.
-- It runs with SECURITY DEFINER, meaning it bypasses the RLS check that prevents
-- users from seeing a conversation they are not YET a participant of.

CREATE OR REPLACE FUNCTION create_new_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Validation
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create conversation
  INSERT INTO conversations (type)
  VALUES ('user_user')
  RETURNING id INTO new_id;

  -- 2. Add participants (Current User + Other User)
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES 
    (new_id, current_user_id, 'user'),
    (new_id, other_user_id, 'user');

  RETURN new_id;
END;
$$;
