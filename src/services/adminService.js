
import { supabase } from '../lib/supabase';

export const adminService = {
    // STRICT ANALYTICS (NATIVE POSTGRESQL NATIVE COMPUTATION ONLY)
    // -------------------------------------------------------------------------

    getFinancialKPIs: async (startDate, endDate) => {
        const { data, error } = await supabase.rpc('rpc_financial_kpis', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
        if (error) { console.error('Financial KPIs Error:', error); throw error; }
        return data || { total_bookings: 0, total_revenue: 0, total_deposits: 0, collected_commission: 0, hotel_balances: 0, uncollected_commission: 0, total_potential_profit: 0 };
    },

    getOperationalKPIs: async (startDate, endDate) => {
        const { data, error } = await supabase.rpc('rpc_operational_kpis', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
        if (error) { console.error('Operational KPIs Error:', error); throw error; }
        return data || { total_hotels: 0, total_users: 0, active_bookings: 0, upcoming_checkins: 0, upcoming_checkouts: 0 };
    },

    getRiskKPIs: async (startDate, endDate) => {
        const { data, error } = await supabase.rpc('rpc_risk_kpis', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
        if (error) { console.error('Risk KPIs Error:', error); throw error; }
        return data || { cancellation_rate: 0, no_show_rate: 0 };
    },

    getWalletExposure: async () => {
        const { data, error } = await supabase.rpc('rpc_wallet_exposure');
        if (error) { console.error('Wallet Exposure Error:', error); throw error; }
        return data || { positive_balance: 0, negative_balance: 0, hotels_in_debt: 0, hotels_in_credit: 0 };
    },

    getMonthlyRevenueGraph: async () => {
        const { data, error } = await supabase.rpc('rpc_monthly_revenue');
        if (error) { console.error('Monthly Revenue Error:', error); throw error; }
        return data || [];
    },

    getTopPerformers: async (startDate, endDate) => {
        const { data, error } = await supabase.rpc('rpc_top_hotels', {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });
        if (error) { console.error('Top Performers Error:', error); throw error; }
        return data || [];
    },
    // -------------------------------------------------------------------------

    // Get recent notifications/alerts for admin
    getAlerts: async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('receiver_role', 'admin')
            .eq('is_read', false)
            .neq('type', 'chat')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) return [];
        return data.map(n => ({
            id: n.id,
            type: n.type?.includes('payout') ? 'payout' : n.type?.includes('suspend') ? 'suspend' : 'doc',
            message: n.body || n.title,
            time: getRelativeTime(n.created_at)
        }));
    },

    getOffers: async () => {
        const { data, error } = await supabase
            .from('offers')
            .select('*, room:rooms(title, hotel:hotels(name, owner_id))')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(o => ({
            id: o.id.substring(0, 8).toUpperCase(),
            fullId: o.id,
            title: o.title,
            hotel: o.room?.hotel?.name || 'Hotel',
            owner_id: o.room?.hotel?.owner_id,
            room: o.room?.title || 'Room',
            price: o.discount_price || o.price_per_night,
            status: o.status,
            date: o.created_at?.split('T')[0]
        }));
    },

    // Update offer status
    updateOfferStatus: async (offerId, status, reason = null, ownerId = null) => {
        const { error } = await supabase
            .from('offers')
            .update({ status })
            .eq('id', offerId);
        if (error) throw error;

        // Frontend Notification sending removed. Database handles system notifications.
    },

    // Get bookings with guest info
    getBookings: async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                profile:profiles(full_name),
                offer:offers(title, price_per_night, discount_price, room:rooms(title, hotel:hotels(name)))
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return [];
        return data.map(b => ({
            id: b.booking_ref || b.id.substring(0, 8).toUpperCase(),
            fullId: b.id,
            guest: b.profile?.full_name || 'Guest',
            hotel: b.offer?.room?.hotel?.name || 'Hotel',
            room: b.offer?.room?.title || 'Room',
            offerTitle: b.offer?.title || '',
            date: b.check_in,
            amount: calculateBookingAmount(b),
            deposit_amount: b.deposit_amount || 0,
            booking_type: b.booking_type || 'full',
            price_per_night: b.offer?.price_per_night || 0,
            status: b.status
        }));
    },

    // Get all hotels (partners)
    getHotels: async () => {
        const { data, error } = await supabase
            .from('hotels')
            .select('*, owner:profiles(full_name)')
            .order('created_at', { ascending: false });

        if (error) return [];

        // Get offer/booking counts per hotel
        const hotelIds = data.map(h => h.id);

        // Count offers per hotel
        const { data: offersData } = await supabase
            .from('rooms')
            .select('hotel_id, offers(id)')
            .in('hotel_id', hotelIds);

        const offerCounts = {};
        offersData?.forEach(r => {
            if (!offerCounts[r.hotel_id]) offerCounts[r.hotel_id] = 0;
            offerCounts[r.hotel_id] += r.offers?.length || 0;
        });

        return data.map(h => ({
            id: h.id.substring(0, 8).toUpperCase(),
            fullId: h.id,
            name: h.name,
            verification: h.verification_status === 'gold' ? 'gold' : h.verification_status === 'blue' ? 'blue' : 'none',
            offers: offerCounts[h.id] || 0,
            bookings: 0, // Would need separate query
            commission: h.commission_percent || 10,
            status: h.is_active ? 'active' : 'suspended',
            docs: h.verification_status !== 'unverified'
        }));
    },

    // Toggle hotel active status
    toggleHotelStatus: async (hotelId, isActive) => {
        const { error } = await supabase
            .from('hotels')
            .update({ is_active: isActive })
            .eq('id', hotelId);
        if (error) throw error;
    },

    // Update commission percent for a hotel
    updateHotelCommission: async (hotelId, percent) => {
        const { error } = await supabase
            .from('hotels')
            .update({ commission_percent: percent })
            .eq('id', hotelId);
        if (error) throw error;
    },

    // Get payout requests
    getPayouts: async () => {
        const { data, error } = await supabase
            .from('payout_requests')
            .select('*, hotel:hotels(name)')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(p => ({
            id: p.id.substring(0, 8).toUpperCase(),
            fullId: p.id,
            hotel: p.hotel?.name || 'Guest',
            amount: Number(p.amount),
            date: p.created_at?.split('T')[0],
            status: p.status
        }));
    },

    // Update payout status
    updatePayoutStatus: async (payoutId, status) => {
        const { error } = await supabase
            .from('payout_requests')
            .update({ status })
            .eq('id', payoutId);
        if (error) throw error;
    },

    // Get exchange rate
    getExchangeRate: async () => {
        const { data } = await supabase.from('exchange_rates')
            .select('rate')
            .eq('base_currency', 'SAR')
            .eq('target_currency', 'DZD')
            .single();
        return data?.rate || 35.80;
    },

    // Update exchange rate
    updateExchangeRate: async (newRate) => {
        const { error } = await supabase.from('exchange_rates')
            .upsert(
                { base_currency: 'SAR', target_currency: 'DZD', rate: newRate, updated_at: new Date() },
                { onConflict: 'base_currency, target_currency' }
            );
        if (error) throw error;
    },

    // Get finance summary
    getFinanceSummary: async () => {
        // Platform balance = total payments - total payouts paid
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'paid');
        const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        const { data: payouts } = await supabase
            .from('payout_requests')
            .select('amount, status');

        const paidPayouts = payouts?.filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        const pendingPayouts = payouts?.filter(p => p.status === 'pending' || p.status === 'processing')
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        // Calculate commission (assuming average 10%)
        const commission = Math.round(totalPayments * 0.1);

        return {
            platformBalance: totalPayments - paidPayouts,
            hotelDues: pendingPayouts,
            totalCommission: commission
        };
    },

    // Broadcast a notification to users
    broadcastNotification: async (targetAudience, title, body, url) => {
        const { error } = await supabase.rpc('broadcast_notification', {
            p_target_audience: targetAudience,
            p_title: title,
            p_body: body,
            p_url: url
        });
        if (error) throw error;
    }
};

// Helper functions
function getRelativeTime(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 60) return `${diff} دقيقة`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ساعة`;
    return `${Math.floor(diff / 1440)} يوم`;
}

function calculateBookingAmount(booking) {
    if (booking.total_price != null) return Number(booking.total_price);

    // Fallback if missing
    if (!booking.check_in || !booking.check_out) return 0;
    const nights = Math.max(1, Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)));
    const pricePerNight = booking.offer?.discount_price || booking.offer?.price_per_night || 0;

    const baseTotal = nights * Number(pricePerNight);

    if (booking.booking_type === 'bed') {
        const guests = Math.max(1, booking.guests || 1);
        return Math.round(baseTotal / 4) * guests;
    }

    return baseTotal;
}
