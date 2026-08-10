-- This script adds the missing columns to the notifications table
-- to permanently fix the '400 Bad Request' column does not exist error.

DO $$
BEGIN
    -- Add the 'type' column (used to distinguish chat vs system alerts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='type') THEN
        ALTER TABLE notifications ADD COLUMN type TEXT;
    END IF;

    -- Add the 'data' column (used to store JSON metadata like conversation_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
    END IF;
END $$;
