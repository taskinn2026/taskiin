-- Completely fault-tolerant Trigger for generating Chat Notifications
CREATE OR REPLACE FUNCTION trg_generate_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_id UUID;
    v_sender_name TEXT;
    v_body_text TEXT;
BEGIN
    -- Wrap everything in exception handling to ensure under no circumstance
    -- does a notification crash prevent a message from being inserted.
    BEGIN
        -- 1. Get the receiver ID from conversation_participants (excluding the sender)
        -- We explicitly cast to text then back to uuid to avoid strict type mismatch crashes
        SELECT user_id INTO v_receiver_id
        FROM conversation_participants
        WHERE conversation_id = NEW.conversation_id
          AND user_id::text != NEW.sender_id::text
        LIMIT 1;

        -- 2. If we found a valid receiver
        IF v_receiver_id IS NOT NULL THEN
            
            -- 3. Extract sender's name gracefully
            SELECT full_name INTO v_sender_name
            FROM profiles
            WHERE id = NEW.sender_id;

            -- 4. Construct body
            v_body_text := 'رسالة جديدة من ' || COALESCE(v_sender_name, 'مستخدم');

            -- 5. Force Insert Notification as Database Admin
            INSERT INTO notifications (receiver_id, title, body, type, data, created_at)
            VALUES (
                v_receiver_id,
                'رسالة جديدة',
                v_body_text,
                'chat',
                jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
                NOW()
            );

        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- If anything fails (like a missing column or type error), silently swallow it
        -- so the chat message itself still gets saved safely without breaking the WebSocket.
        RAISE WARNING 'Notification Generation Failed: %', SQLERRM;
    END;

    -- Return the message so it's guaranteed to be saved regardless of notification status.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely re-bind
DROP TRIGGER IF EXISTS on_message_insert_generate_notification ON messages;

CREATE TRIGGER on_message_insert_generate_notification
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION trg_generate_chat_notification();
