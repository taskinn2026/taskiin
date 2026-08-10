CREATE OR REPLACE FUNCTION public.get_or_create_roommate_chat(
    p_offer_id UUID,
    p_other_user_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_current_user_id UUID;
    v_my_booking_exists BOOLEAN;
    v_other_booking_exists BOOLEAN;
    v_overlap_exists BOOLEAN;
    v_unique_key TEXT;
BEGIN
    -- 1. Get current authenticated user
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate that the current user has a valid (confirmed or paid) booking for this offer
    SELECT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE offer_id = p_offer_id
          AND user_id = v_current_user_id
          AND status IN ('confirmed', 'paid')
    ) INTO v_my_booking_exists;

    IF NOT v_my_booking_exists THEN
        RAISE EXCEPTION 'You do not have a confirmed booking for this offer to initiate a roommate chat.';
    END IF;

    -- 3. Validate that the other user has a valid booking for this offer
    SELECT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE offer_id = p_offer_id
          AND user_id = p_other_user_id
          AND status IN ('confirmed', 'paid')
    ) INTO v_other_booking_exists;

    IF NOT v_other_booking_exists THEN
        RAISE EXCEPTION 'The other user does not have a confirmed booking for this offer.';
    END IF;

    -- 4. Strict Validation: Ensure their dates actually intersect mathematically 
    SELECT EXISTS (
        SELECT 1
        FROM public.bookings b1
        JOIN public.bookings b2 ON b1.offer_id = b2.offer_id
        WHERE b1.offer_id = p_offer_id
          AND b1.user_id = v_current_user_id
          AND b2.user_id = p_other_user_id
          AND b1.status IN ('confirmed', 'paid')
          AND b2.status IN ('confirmed', 'paid')
          -- Intersection logic: (StartA < EndB) and (EndA > StartB)
          AND b1.check_in < b2.check_out 
          AND b1.check_out > b2.check_in
    ) INTO v_overlap_exists;

    IF NOT v_overlap_exists THEN
        RAISE EXCEPTION 'You cannot chat with this user because your booking dates do not overlap.';
    END IF;

    -- 5. If all validations pass, safely Get or Create the Roommate Conversation
    IF v_current_user_id < p_other_user_id THEN
        v_unique_key := 'roommate_' || v_current_user_id::text || '_' || p_other_user_id::text || '_' || p_offer_id::text;
    ELSE
        v_unique_key := 'roommate_' || p_other_user_id::text || '_' || v_current_user_id::text || '_' || p_offer_id::text;
    END IF;

    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE unique_key = v_unique_key
    LIMIT 1;

    -- If a chat already exists, return it
    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- Otherwise, safely insert new conversation
    INSERT INTO public.conversations (type, unique_key)
    VALUES ('roommate', v_unique_key)
    RETURNING id INTO v_conversation_id;

    -- Insert participant relationships
    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES 
        (v_conversation_id, v_current_user_id, 'participant'),
        (v_conversation_id, p_other_user_id, 'participant');

    RETURN v_conversation_id;
END;
$$;
