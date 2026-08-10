-- 1) bookings table updates
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_price numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hotel_share_amount numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS is_no_show boolean DEFAULT false;

-- 2) hotel_wallets
CREATE TABLE IF NOT EXISTS public.hotel_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  balance numeric(10,2) DEFAULT 0,
  last_reconciliation_at timestamptz DEFAULT now(),
  CONSTRAINT fk_hotel FOREIGN KEY (hotel_id) REFERENCES public.hotels (id)
);
-- Ensure every existing hotel gets a wallet immediately
INSERT INTO public.hotel_wallets (hotel_id)
SELECT id FROM public.hotels
ON CONFLICT DO NOTHING;

-- 3) reconciliation_reports
CREATE TABLE IF NOT EXISTS public.reconciliation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_bookings integer DEFAULT 0,
  total_commission numeric(10,2) DEFAULT 0,
  total_deposits numeric(10,2) DEFAULT 0,
  net_balance numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  -- 6.1 Prevent double reconciliation for the same month
  CONSTRAINT unique_hotel_period UNIQUE (hotel_id, period_start, period_end)
);

-- 4) exchange_rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric(10,4) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_currency_pair UNIQUE (base_currency, target_currency)
);
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) 
VALUES ('SAR', 'DZD', 35.80) -- Mock initial rate
ON CONFLICT (base_currency, target_currency) 
DO UPDATE SET rate = EXCLUDED.rate, updated_at = now();

-- RLS FOR EXCHANGE RATES
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for exchange rates" ON public.exchange_rates FOR SELECT TO public USING (true);
CREATE POLICY "Admin write access for exchange rates" ON public.exchange_rates USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- ==========================================
-- STRICT MATH TRIGGERS
-- ==========================================

-- Trigger 1: Auto Calculate Commission on INSERT / UPDATE (if status is not cancelled)
CREATE OR REPLACE FUNCTION public.trg_compute_financials()
RETURNS TRIGGER AS $$
BEGIN
  -- Strict Application: Commission = 10%, Share = 90%
  -- We rely on the frontend or backend passing down total_price and deposit_amount initially.
  IF NEW.status != 'cancelled' THEN
     NEW.commission_amount := LEAST(NEW.total_price * 0.10, NEW.total_price);
     NEW.hotel_share_amount := NEW.total_price - NEW.commission_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_compute_financials ON public.bookings;
CREATE TRIGGER trg_bookings_compute_financials
BEFORE INSERT OR UPDATE OF total_price, deposit_amount ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.trg_compute_financials();

-- Trigger 2: Cancellation Rule (The 24 hours rule & No-Show logic)
CREATE OR REPLACE FUNCTION public.trg_handle_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed to cancelled and we haven't already processed it
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
     -- 6.2 Prevent double cancellation execution
     IF OLD.cancellation_status != 'none' THEN
        RAISE EXCEPTION 'Booking already cancelled or processed.';
     END IF;

     -- 6.4 Prevent refund if status != confirmed or pending, etc.
     IF OLD.status NOT IN ('pending', 'confirmed') THEN
        RAISE EXCEPTION 'Cannot cancel a booking that is already %', OLD.status;
     END IF;

     NEW.cancelled_at := now();

     -- If cancel is more than 24h before check_in = REFUND FULL
     IF NEW.cancelled_at < (NEW.check_in::timestamptz - interval '24 hours') THEN
        NEW.cancellation_status := 'refunded';
        NEW.commission_amount := 0;
        NEW.hotel_share_amount := 0;
        NEW.is_no_show := false;
     ELSE
        -- Less than 24h or already past check_in = NO SHOW (confiscate deposit)
        NEW.cancellation_status := 'confiscated';
        NEW.is_no_show := true;
        
        -- Commission = 10% of deposit, Hotel Share = 90% of deposit
        NEW.commission_amount := NEW.deposit_amount * 0.10;
        NEW.hotel_share_amount := NEW.deposit_amount * 0.90;
     END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_handle_cancellation ON public.bookings;
CREATE TRIGGER trg_bookings_handle_cancellation
BEFORE UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.trg_handle_cancellation();


-- ==========================================
-- MONTHLY RECONCILIATION FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.monthly_reconciliation(target_month date)
RETURNS void AS $$
DECLARE
  rec RECORD;
  net numeric(10,2);
  start_date date;
  end_date date;
BEGIN
  -- Get start and end of the target month
  start_date := date_trunc('month', target_month)::date;
  end_date := (start_date + interval '1 month - 1 day')::date;

  -- Ensure we run this in a strict loop per hotel
  FOR rec IN
    SELECT 
      b.offer_id,
      h.id as hotel_id,
      count(b.id) as total_b,
      sum(b.commission_amount) as sum_commission,
      sum(b.deposit_amount) as sum_deposits
    FROM public.bookings b
    JOIN public.offers o ON b.offer_id = o.id
    JOIN public.rooms r ON o.room_id = r.id
    JOIN public.hotels h ON r.hotel_id = h.id
    WHERE b.created_at::date BETWEEN start_date AND end_date
      AND b.status IN ('confirmed', 'completed', 'cancelled') -- Cancelled might have confiscations
    GROUP BY h.id
  LOOP
    -- Net formula: The platform received deposits (DZD).
    -- If hotel_share > deposit, platform owes hotel (net positive for hotel)
    -- But the equation requested was: difference = deposit_amount - commission
    -- So net = total_deposits_collected_by_platform - total_commission_owed_by_hotel
    -- If net > 0, the platform owes the hotel. If < 0, the hotel owes the platform.
    -- According to user request: net_balance = total_deposits - total_commission
    net := COALESCE(rec.sum_deposits, 0) - COALESCE(rec.sum_commission, 0);

    -- 6.1: handled by UNIQUE constraint on reconciliation_reports
    INSERT INTO public.reconciliation_reports (hotel_id, period_start, period_end, total_bookings, total_commission, total_deposits, net_balance)
    VALUES (rec.hotel_id, start_date, end_date, rec.total_b, COALESCE(rec.sum_commission,0), COALESCE(rec.sum_deposits,0), net)
    ON CONFLICT (hotel_id, period_start, period_end) DO NOTHING;

    -- Update hotel wallet (Atomic update)
    UPDATE public.hotel_wallets
    SET balance = balance + net,
        last_reconciliation_at = now()
    WHERE hotel_id = rec.hotel_id;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper to trigger it manually or via edge function easily
CREATE OR REPLACE FUNCTION public.trigger_monthly_reconciliation_now()
RETURNS void AS $$
BEGIN
  -- Reconcile previous month automatically
  PERFORM public.monthly_reconciliation((now() - interval '1 month')::date);
END;
$$ LANGUAGE plpgsql;
