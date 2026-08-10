-- Fix Bookings Table (Add Chargily & Timestamp Columns)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checkout_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Fix Payments Table (Add Provider details)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);

-- Fix Notifications Table (Ensure metadata & correct types)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Note: 'type' check constraint might need dropping and re-adding if 'payment' is new
-- But we will assume 'type' is text or check exists. Ideally we alter the check.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'booking', 'chat', 'payment', 'admin'));
