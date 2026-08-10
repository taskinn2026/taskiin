-- 1. إضافة أعمدة الخريطة الناقصة للفنادق
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS postal_code text;

-- 2. حقل لتحديد تفعيل خدمة "أبحث عن شريك غرفة"
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS partner_search_active boolean DEFAULT false;

-- 3. إضافة نوع الدفع لجدول المدفوعات لتجنب دوبلكيشن الـ deposit
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type text;
