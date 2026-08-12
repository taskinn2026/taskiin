-- =========================================================================
-- STRICT DATABASE-DRIVEN NOTIFICATIONS MIGRATION (NO POLLING, NO FRONTEND)
-- =========================================================================

-- 1. BOOKINGS NOTIFICATIONS TRIGGER
CREATE OR REPLACE FUNCTION trg_notify_from_bookings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_partner_id UUID;
    v_admin RECORD;
    v_is_new_pending BOOLEAN := FALSE;
    v_is_new_confirmed BOOLEAN := FALSE;
    v_is_new_completed BOOLEAN := FALSE;
BEGIN
    -- Resolve Partner ID from Booking
    SELECT h.owner_id INTO v_partner_id
    FROM bookings b
    JOIN offers o ON b.offer_id = o.id
    JOIN rooms r ON o.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE b.id = NEW.id;

    -- Determine State Changes
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'pending' THEN v_is_new_pending := TRUE; END IF;
        IF NEW.status = 'confirmed' OR NEW.status = 'paid' THEN v_is_new_confirmed := TRUE; END IF;
        IF NEW.status = 'completed' THEN v_is_new_completed := TRUE; END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' THEN v_is_new_pending := TRUE; END IF;
        IF (NEW.status = 'confirmed' OR NEW.status = 'paid') AND (OLD.status IS DISTINCT FROM 'confirmed' AND OLD.status IS DISTINCT FROM 'paid') THEN v_is_new_confirmed := TRUE; END IF;
        IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN v_is_new_completed := TRUE; END IF;
    END IF;

    -- ==========================================
    -- EVENT: حجز جديد (New Booking / Pending)
    -- ==========================================
    IF v_is_new_pending THEN
        -- Notify Hotel Owner (حجز جديد)
        IF v_partner_id IS NOT NULL THEN
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_partner_id, 'partner', 'booking', 'حجز جديد', 'قام معتمر بحجز غرفة في عرضك', NEW.id, '{}'::jsonb, false, now());
        END IF;
    END IF;

    -- ==========================================
    -- EVENT: تم الدفع (Deposit Paid / Confirmed)
    -- ==========================================
    IF v_is_new_confirmed THEN
        -- Notify Pilgrim
        INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
        VALUES (NEW.user_id, 'pilgrim', 'booking', 'تم دفع العربون', 'تم استلام عربون الحجز الخاص بك بنجاح', NEW.id, '{}'::jsonb, false, now());

        -- Notify Hotel Owner
        IF v_partner_id IS NOT NULL THEN
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_partner_id, 'partner', 'booking', 'تم دفع العربون', 'تم استلام العربون لحجز جديد', NEW.id, '{}'::jsonb, false, now());
        END IF;
    END IF;

    -- ==========================================
    -- EVENT: إتمام الحجز (Booking Completed)
    -- ==========================================
    IF v_is_new_completed THEN
        -- Notify Pilgrim
        INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
        VALUES (NEW.user_id, 'pilgrim', 'booking', 'تم إتمام الحجز', 'تم استلام المبلغ المتبقي وتسليم الغرفة لك', NEW.id, '{}'::jsonb, false, now());

        -- Notify Admins
        FOR v_admin IN SELECT id FROM profiles WHERE role = 'admin' LOOP
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_admin.id, 'admin', 'admin', 'تم إتمام حجز', 'الفندق أكمل الحجز رقم ' || LEFT(CAST(NEW.id AS TEXT), 8), NEW.id, '{}'::jsonb, false, now());
        END LOOP;

        -- Notify Hotel Owner
        IF v_partner_id IS NOT NULL THEN
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_partner_id, 'partner', 'booking', 'تم إتمام الحجز', 'تم استلام المبلغ المتبقي، حجز مكتمل', NEW.id, '{}'::jsonb, false, now());
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_notifications_event ON bookings;
CREATE TRIGGER trg_bookings_notifications_event
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW EXECUTE FUNCTION trg_notify_from_bookings();


-- 2. PAYMENTS NOTIFICATIONS TRIGGER (DEPOSIT PAID)
CREATE OR REPLACE FUNCTION trg_notify_from_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_partner_id UUID;
    v_pilgrim_id UUID;
    v_admin RECORD;
    v_is_new_deposit_paid BOOLEAN := FALSE;
    v_is_deposit_failed BOOLEAN := FALSE;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'paid' THEN v_is_new_deposit_paid := TRUE; END IF;
        IF NEW.status = 'failed' THEN v_is_deposit_failed := TRUE; END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN v_is_new_deposit_paid := TRUE; END IF;
        IF NEW.status = 'failed' AND OLD.status IS DISTINCT FROM 'failed' THEN v_is_deposit_failed := TRUE; END IF;
    END IF;

    IF v_is_new_deposit_paid OR v_is_deposit_failed THEN
        -- Resolve Pilgrim ID and Partner ID from Booking
        SELECT b.user_id, h.owner_id INTO v_pilgrim_id, v_partner_id
        FROM bookings b
        JOIN offers o ON b.offer_id = o.id
        JOIN rooms r ON o.room_id = r.id
        JOIN hotels h ON r.hotel_id = h.id
        WHERE b.id = NEW.booking_id;
    END IF;

    IF v_is_new_deposit_paid THEN
        -- Notify Pilgrim (دفع العربون)
        IF v_pilgrim_id IS NOT NULL THEN
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_pilgrim_id, 'pilgrim', 'payment', 'تم دفع العربون', 'تم استلام العربون بنجاح وحجزك الآن بانتظار إتمامه عند الوصول للفندق', NEW.booking_id, jsonb_build_object('reason', 'deposit_paid', 'payment_id', NEW.id), false, now());
        END IF;

        -- Notify Hotel Owner (دفع العربون)
        IF v_partner_id IS NOT NULL THEN
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_partner_id, 'partner', 'booking', 'تم دفع عربون حجز', 'قام معتمر بدفع العربون', NEW.booking_id, jsonb_build_object('payment_id', NEW.id), false, now());
        END IF;

        -- Notify Admins (عربون جديد)
        FOR v_admin IN SELECT id FROM profiles WHERE role = 'admin' LOOP
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_admin.id, 'admin', 'admin', 'تم دفع عربون جديد', 'تم دفع عربون للحجز رقم ' || LEFT(CAST(NEW.booking_id AS TEXT), 8), NEW.booking_id, jsonb_build_object('payment_id', NEW.id), false, now());
        END LOOP;
    END IF;

    IF v_is_deposit_failed THEN
        -- Notify Pilgrim (فشل دفع العربون)
        IF v_pilgrim_id IS NOT NULL THEN
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_pilgrim_id, 'pilgrim', 'payment', 'فشل الدفع', 'لم يتم إتمام عملية الدفع، يرجى المحاولة مرة أخرى', NEW.booking_id, jsonb_build_object('reason', 'payment_failed', 'payment_id', NEW.id), false, now());
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_notifications_event ON payments;
CREATE TRIGGER trg_payments_notifications_event
AFTER INSERT OR UPDATE OF status ON payments
FOR EACH ROW EXECUTE FUNCTION trg_notify_from_payments();


-- 3. MESSAGES NOTIFICATIONS TRIGGER (CHAT)
CREATE OR REPLACE FUNCTION trg_notify_from_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_receiver_id UUID;
    v_receiver_role TEXT;
    v_sender_name TEXT;
BEGIN
    -- Determine the 'other participant' (receiver)
    SELECT cp.user_id INTO v_receiver_id
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
    LIMIT 1;

    -- Get sender name
    SELECT full_name INTO v_sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Get receiver role (pilgrim, partner, admin)
    SELECT role INTO v_receiver_role
    FROM profiles
    WHERE id = v_receiver_id;

    -- Insert Chat Notification
    IF v_receiver_id IS NOT NULL AND v_receiver_role IS NOT NULL THEN
        -- Fallback 'partner' rule if profile says hotel
        IF v_receiver_role = 'hotel' THEN v_receiver_role := 'partner'; END IF;

        INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
        VALUES (
            v_receiver_id,
            v_receiver_role,
            'chat',
            COALESCE(v_sender_name, 'رسالة جديدة'),
            NEW.content,
            NULL,
            jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
            false,
            now()
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_notifications_event ON messages;
CREATE TRIGGER trg_messages_notifications_event
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION trg_notify_from_messages();
