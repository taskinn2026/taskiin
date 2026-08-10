-- ==============================================================================
-- 1. الفهارس (Indexes) لتحسين أداء استعلام بحث شركاء الغرفة
-- ==============================================================================
CREATE INDEX IF NOT EXISTS bookings_offer_idx ON bookings(offer_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_booking_type_idx ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS bookings_dates_idx ON bookings(check_in, check_out);

-- ==============================================================================
-- 2. تحديث جدول المحادثات لدعم ربطها بالعرض (offer_id) بقوة
-- ==============================================================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES offers(id) ON DELETE CASCADE;

-- ==============================================================================
-- 3. دالة RPC لإنشاء محادثة شريك غرفة (بشروط صارمة على مستوى قاعدة البيانات)
-- ==============================================================================
-- هذه الدالة تتأكد من أن كلا الطرفين لديهما حجز مؤكد/مدفوع في نفس العرض وتواريخ متداخلة
-- قبل إنشاء غرفة المحادثة.

CREATE OR REPLACE FUNCTION get_or_create_roommate_chat(
  p_other_user_id uuid,
  p_offer_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_user_id uuid := auth.uid();
  v_my_booking_count int;
  v_other_booking_count int;
  v_overlap_exists boolean;
  v_conversation_id uuid;
  v_unique_key text;
BEGIN
  -- 1. التحقق من أن المستخدم الحالي لديه حجز صالح
  SELECT COUNT(*) INTO v_my_booking_count
  FROM bookings
  WHERE user_id = v_my_user_id
    AND offer_id = p_offer_id
    AND status IN ('confirmed', 'paid', 'completed');

  IF v_my_booking_count = 0 THEN
    RAISE EXCEPTION 'Current user does not have a confirmed booking for this offer.';
  END IF;

  -- 2. التحقق من أن الطرف الآخر لديه حجز صالح
  SELECT COUNT(*) INTO v_other_booking_count
  FROM bookings
  WHERE user_id = p_other_user_id
    AND offer_id = p_offer_id
    AND status IN ('confirmed', 'paid', 'completed');

  IF v_other_booking_count = 0 THEN
    RAISE EXCEPTION 'Target user does not have a confirmed booking for this offer.';
  END IF;

  -- 3. التحقق من تداخل التواريخ (Overlap) - (بناء على طلب المستخدم)
  SELECT EXISTS (
    SELECT 1
    FROM bookings b1
    JOIN bookings b2 ON b1.offer_id = b2.offer_id 
      AND b1.user_id = v_my_user_id 
      AND b2.user_id = p_other_user_id
    WHERE b1.offer_id = p_offer_id
      AND b1.status IN ('confirmed', 'paid', 'completed')
      AND b2.status IN ('confirmed', 'paid', 'completed')
      AND b1.check_in < b2.check_out 
      AND b1.check_out > b2.check_in
  ) INTO v_overlap_exists;

  IF NOT v_overlap_exists THEN
    RAISE EXCEPTION 'Booking dates do not overlap. Chat cannot be created.';
  END IF;

  -- 4. تعيين مفتاح فريد للمحادثة لضمان عدم تكرار المحادثة لنفس العرض ونفس الشخصين
  IF v_my_user_id < p_other_user_id THEN
    v_unique_key := 'roommate_' || p_offer_id || '_' || v_my_user_id || '_' || p_other_user_id;
  ELSE
    v_unique_key := 'roommate_' || p_offer_id || '_' || p_other_user_id || '_' || v_my_user_id;
  END IF;

  -- 5. هل المحادثة موجودة مسبقاً؟
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE unique_key = v_unique_key;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- 6. إنشاء المحادثة الجديدة
  INSERT INTO conversations (type, unique_key, offer_id)
  VALUES ('roommate', v_unique_key, p_offer_id)
  RETURNING id INTO v_conversation_id;

  -- 7. إضافة المشاركين
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES 
    (v_conversation_id, v_my_user_id, 'pilgrim'),
    (v_conversation_id, p_other_user_id, 'pilgrim');

  RETURN v_conversation_id;
END;
$$;
