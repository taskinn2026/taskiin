-- Add an RLS Policy to allow authenticated users to send notifications to other users
-- This safely re-enables the frontend notification logic without restrictive sender/receiver blocks.

-- 1. Ensure RLS is active
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Create the bypass policy
-- Check if the policy exists, and drop it if we need to replace it
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
    DROP POLICY IF EXISTS "Insert Notifications" ON notifications;
EXCEPTION WHEN OTHERS THEN
END $$;

-- 3. Create a relaxed INSERT policy that allows any logged-in user to create a notification
CREATE POLICY "Users can insert notifications for others" 
ON notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Also ensure users can read their OWN notifications
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
EXCEPTION WHEN OTHERS THEN
END $$;

CREATE POLICY "Users can view their own notifications" 
ON notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = receiver_id);

-- Also ensure users can update and delete their OWN notifications
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
EXCEPTION WHEN OTHERS THEN
END $$;

CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own notifications" 
ON notifications 
FOR DELETE 
TO authenticated 
USING (auth.uid() = receiver_id);
