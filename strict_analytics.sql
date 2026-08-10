-- ==========================================
-- STRICT ANALYTICS: INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_offer_id ON public.bookings(offer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_is_no_show ON public.bookings(is_no_show);

-- ==========================================
-- STRICT ANALYTICS: KPI AGGREGATIONS (RPC)
-- ==========================================

-- 1. Financial KPIs
CREATE OR REPLACE FUNCTION public.rpc_financial_kpis(start_date timestamptz, end_date timestamptz)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status IN ('confirmed','paid') AND created_at >= start_date AND created_at <= end_date),
        'total_revenue', COALESCE(SUM(total_price) FILTER (WHERE status IN ('confirmed','paid')), 0),
        'total_deposits', COALESCE(SUM(deposit_amount) FILTER (WHERE status IN ('confirmed','paid')), 0),
        'collected_commission', COALESCE(SUM(deposit_amount * 0.10) FILTER (WHERE status IN ('confirmed','paid')), 0),
        'hotel_balances', COALESCE(SUM(deposit_amount * 0.90) FILTER (WHERE status IN ('confirmed','paid')), 0),
        'uncollected_commission', COALESCE(SUM((total_price - deposit_amount) * 0.10) FILTER (WHERE status IN ('confirmed','paid')), 0),
        'total_potential_profit', COALESCE(SUM(deposit_amount * 0.10) FILTER (WHERE status IN ('confirmed','paid')), 0) + COALESCE(SUM((total_price - deposit_amount) * 0.10) FILTER (WHERE status IN ('confirmed','paid')), 0)
    ) INTO result
    FROM public.bookings
    WHERE created_at >= start_date AND created_at <= end_date;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Operational KPIs
CREATE OR REPLACE FUNCTION public.rpc_operational_kpis(start_date timestamptz, end_date timestamptz)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_hotels', (SELECT COUNT(*) FROM public.hotels WHERE created_at >= start_date AND created_at <= end_date),
        'total_users', (SELECT COUNT(*) FROM auth.users WHERE created_at >= start_date AND created_at <= end_date),
        'active_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed' AND check_in >= NOW() AND created_at >= start_date AND created_at <= end_date),
        'upcoming_checkins', (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed' AND check_in BETWEEN NOW() AND NOW() + interval '7 days' AND created_at >= start_date AND created_at <= end_date),
        'upcoming_checkouts', (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed' AND check_out BETWEEN NOW() AND NOW() + interval '7 days' AND created_at >= start_date AND created_at <= end_date)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Risk KPIs
CREATE OR REPLACE FUNCTION public.rpc_risk_kpis(start_date timestamptz, end_date timestamptz)
RETURNS json AS $$
DECLARE
    result json;
    total_bookings numeric;
BEGIN
    -- Get total bookings in period for percentage division
    SELECT COUNT(*)::numeric INTO total_bookings 
    FROM public.bookings WHERE created_at >= start_date AND created_at <= end_date;

    SELECT json_build_object(
        'cancellation_rate', CASE WHEN total_bookings > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'cancelled') / total_bookings) * 100, 2) ELSE 0 END,
        'no_show_rate', CASE WHEN total_bookings > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_no_show = true) / total_bookings) * 100, 2) ELSE 0 END
    ) INTO result
    FROM public.bookings
    WHERE created_at >= start_date AND created_at <= end_date;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Hotel Wallet Exposure (Global - Not time bound strictly)
CREATE OR REPLACE FUNCTION public.rpc_wallet_exposure()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'positive_balance', COALESCE(SUM(balance) FILTER (WHERE balance > 0), 0),
        'negative_balance', COALESCE(SUM(balance) FILTER (WHERE balance < 0), 0),
        'hotels_in_debt', COUNT(*) FILTER (WHERE balance < 0),
        'hotels_in_credit', COUNT(*) FILTER (WHERE balance > 0)
    ) INTO result
    FROM public.hotel_wallets;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Monthly Revenue Graph
CREATE OR REPLACE FUNCTION public.rpc_monthly_revenue()
RETURNS TABLE(month timestamptz, revenue numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT DATE_TRUNC('month', created_at) AS month,
           SUM(commission_amount) AS revenue
    FROM public.bookings
    WHERE status IN ('confirmed','paid','completed')
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Top Performing Hotels (By GMV)
CREATE OR REPLACE FUNCTION public.rpc_top_hotels(start_date timestamptz, end_date timestamptz)
RETURNS TABLE(hotel_id uuid, hotel_name text, revenue numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT h.id AS hotel_id,
           h.name AS hotel_name,
           SUM(b.total_price) AS revenue
    FROM public.bookings b
    JOIN public.offers o ON b.offer_id = o.id
    JOIN public.rooms r ON o.room_id = r.id
    JOIN public.hotels h ON r.hotel_id = h.id
    WHERE b.status IN ('confirmed','paid','completed')
      AND b.created_at >= start_date
      AND b.created_at <= end_date
    GROUP BY h.id, h.name
    ORDER BY revenue DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose to API
GRANT EXECUTE ON FUNCTION public.rpc_financial_kpis(timestamptz, timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_operational_kpis(timestamptz, timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_risk_kpis(timestamptz, timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_wallet_exposure() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_monthly_revenue() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_top_hotels(timestamptz, timestamptz) TO authenticated, anon;
