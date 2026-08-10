-- 4. PAYOUT REQUESTS NOTIFICATIONS TRIGGER
CREATE OR REPLACE FUNCTION trg_notify_from_payouts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_hotel_owner_id UUID;
    v_admin RECORD;
BEGIN
    SELECT owner_id INTO v_hotel_owner_id
    FROM hotels
    WHERE id = NEW.hotel_id;

    -- Notify Admins on New Payout Request
    IF TG_OP = 'INSERT' THEN
        FOR v_admin IN SELECT id FROM profiles WHERE role = 'admin' LOOP
            INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
            VALUES (v_admin.id, 'admin', 'admin', 'طلب سحب جديد', 'هناك طلب سحب جديد بانتظار المراجعة', NULL, jsonb_build_object('payout_id', NEW.id), false, now());
        END LOOP;
    END IF;

    -- Notify Hotel Owner on Payout Success
    IF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
            IF v_hotel_owner_id IS NOT NULL THEN
                INSERT INTO notifications (receiver_id, receiver_role, type, title, body, booking_id, data, is_read, created_at)
                VALUES (v_hotel_owner_id, 'hotel', 'payment', 'تم دفع طلب السحب', 'تم الموافقة على طلب السحب وتحويل المبلغ', NULL, jsonb_build_object('payout_id', NEW.id), false, now());
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payouts_notifications_event ON payout_requests;
CREATE TRIGGER trg_payouts_notifications_event
AFTER INSERT OR UPDATE OF status ON payout_requests
FOR EACH ROW EXECUTE FUNCTION trg_notify_from_payouts();
