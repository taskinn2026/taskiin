-- =======================================================
-- Trigger: تنبيه المعتمر عند تغيير الحجز إلى "مكتمل" (paid)
-- يعمل عند تغيير حقل status من confirmed → paid في جدول bookings
-- =======================================================

-- 1. الدالة التي تُنفَّذ عند التغيير
CREATE OR REPLACE FUNCTION notify_pilgrim_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- شرط التنشيط: الحالة الجديدة paid والحالة القديمة ليست paid
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO notifications (receiver_id, title, body, data, is_read, created_at)
    VALUES (
      NEW.user_id,
      'حجز مكتمل بنجاح! 🎉',
      'تهانينا، تم إتمام حجزك وتسجيل دخولك بنجاح.',
      jsonb_build_object('type', 'booking', 'booking_id', NEW.id, 'status', 'paid'),
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. إنشاء الـ Trigger (حذفه أولاً إن وُجد)
DROP TRIGGER IF EXISTS trg_notify_pilgrim_on_paid ON bookings;

CREATE TRIGGER trg_notify_pilgrim_on_paid
AFTER UPDATE OF status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_pilgrim_on_paid();
