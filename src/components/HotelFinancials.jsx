import React, { useState, useEffect, useCallback } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import {
    Briefcase, DollarSign, Wallet, TrendingUp, CheckCircle,
    AlertCircle, Calendar, ArrowDownCircle, RefreshCw
} from 'lucide-react';

const PLATFORM_COLOR = '#ef4444'; // red  – platform's share
const HOTEL_COLOR = '#10b981'; // green – hotel's share
const DEPOSIT_COLOR = '#3b82f6'; // blue  – deposit
const REMAINING_COLOR = '#f59e0b'; // amber – remaining

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

// ── Compact KPI card ─────────────────────────────────────────────────────────
const KCard = ({ title, value, sub, icon: Icon, accent = 'emerald', note }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        sky: 'bg-sky-50 text-sky-700 border-sky-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        green: 'bg-green-50 text-green-700 border-green-200',
    };
    return (
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${colors[accent]}`}>
            <div className="flex items-center gap-2">
                <Icon size={16} className="opacity-70" />
                <span className="text-xs font-bold opacity-80 leading-tight">{title}</span>
            </div>
            <div className="text-2xl font-black leading-none">
                {value}
                {sub && <span className="text-xs font-bold ml-1 opacity-60">{sub}</span>}
            </div>
            {note && <div className="text-[10px] opacity-60 leading-snug">{note}</div>}
        </div>
    );
};

// ── Custom Donut label ────────────────────────────────────────────────────────
const DonutLabel = ({ cx, cy, name, percent }) => (
    <>
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#1f2937" className="text-base font-black" fontSize={20} fontWeight={900}>
            {(percent * 100).toFixed(0)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize={11}>
            {name}
        </text>
    </>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function HotelFinancials({ hotelId, lang = 'ar', currency = 'د.ج' }) {
    const [bookings, setBookings] = useState([]);
    const [commissionRate, setCommissionRate] = useState(10); // actual % from DB
    const [loading, setLoading] = useState(true);
    const isAr = lang === 'ar';

    // ── Fetch bookings for this hotel ────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!hotelId) return;
        setLoading(true);
        try {
            // Fetch hotel's commission rate
            const { data: hotelData } = await supabase
                .from('hotels')
                .select('commission_percent')
                .eq('id', hotelId)
                .maybeSingle();
            if (hotelData) setCommissionRate(Number(hotelData.commission_percent) || 10);

            // bookings → offers → rooms → hotel_id
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, total_price, deposit_amount, deposit_paid, status,
                    commission_amount, hotel_share_amount,
                    offer:offers!bookings_offer_id_fkey(
                        room:rooms!offers_room_id_fkey(hotel_id)
                    )
                `)
                .in('status', ['confirmed', 'paid'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Client-side hotel filter via offer.room.hotel_id
            const filtered = (data || []).filter(
                b => b.offer?.room?.hotel_id === hotelId
            );
            setBookings(filtered);
        } catch (e) {
            console.error('HotelFinancials fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    // ── Supabase Realtime ────────────────────────────────────────────────────
    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel(`hotel_financials_${hotelId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchData, hotelId]);

    // ── Derived metrics ──────────────────────────────────────────────────────
    const metrics = React.useMemo(() => {
        let totalRevenue = 0;
        let totalDeposits = 0;
        let commissionDB = 0;  // commission_amount from DB if available
        let hotelShareDB = 0;  // hotel_share_amount from DB if available

        bookings.forEach(b => {
            totalRevenue += Number(b.total_price || 0);
            totalDeposits += Number(b.deposit_amount || 0);
            commissionDB += Number(b.commission_amount || 0);
            hotelShareDB += Number(b.hotel_share_amount || 0);
        });

        const rate = commissionRate / 100;
        // Use dynamic rate
        const platformCutDeposit = totalDeposits * rate;
        const hotelBalanceInPlatform = totalDeposits * (1 - rate);
        const remainingAtHotel = totalRevenue - totalDeposits;
        const commissionOnRemaining = remainingAtHotel * rate;
        const hotelNetRevenue = totalRevenue * (1 - rate);

        return {
            count: bookings.length,
            totalRevenue,
            totalDeposits,
            platformCutDeposit,
            hotelBalanceInPlatform,
            remainingAtHotel,
            commissionOnRemaining,
            hotelNetRevenue,
        };
    }, [bookings, commissionRate]);

    // ── Chart data ───────────────────────────────────────────────────────────
    const hotelPct = 100 - commissionRate;
    const donutPlatform = [
        { name: isAr ? `المنصة (${commissionRate}%)` : `Platform (${commissionRate}%)`, value: metrics.platformCutDeposit },
        { name: isAr ? `الفندق (${hotelPct}%)` : `Hotel (${hotelPct}%)`, value: metrics.hotelBalanceInPlatform },
    ];

    const barData = bookings.slice(0, 10).map((b, i) => ({
        name: `#${i + 1}`,
        [isAr ? 'العربون' : 'Deposit']: Number(b.deposit_amount || 0),
        [isAr ? 'المتبقي' : 'Remaining']: Number(b.total_price || 0) - Number(b.deposit_amount || 0),
    }));

    if (loading) return (
        <div className="flex items-center justify-center gap-3 py-16 text-emerald-700 font-bold">
            <RefreshCw size={20} className="animate-spin" />
            {isAr ? 'جاري تحميل البيانات...' : 'Loading financial data...'}
        </div>
    );

    return (
        <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

            {/* ── 8 KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <KCard icon={Briefcase} accent="emerald" sub="" title={isAr ? 'إجمالي الحجوزات' : 'Total Bookings'} value={fmt(metrics.count)} />
                <KCard icon={TrendingUp} accent="blue" sub={currency} title={isAr ? 'إجمالي قيمة الحجوزات' : 'Total Booking Value'} value={fmt(metrics.totalRevenue)} />
                <KCard icon={Wallet} accent="amber" sub={currency} title={isAr ? 'العربون المستلم (عبر المنصة)' : 'Deposits Received'} value={fmt(metrics.totalDeposits)} />
                <KCard icon={DollarSign} accent="red" sub={currency} title={isAr ? `عمولة المنصة من العربون (${commissionRate}%)` : `Platform Cut (${commissionRate}% of Deposit)`} value={fmt(metrics.platformCutDeposit)} note={isAr ? 'محصّلة فوراً' : 'Collected immediately'} />
                <KCard icon={CheckCircle} accent="purple" sub={currency} title={isAr ? 'رصيد الفندق (قابل للسحب)' : 'Hotel Balance (Withdrawable)'} value={fmt(metrics.hotelBalanceInPlatform)} note={isAr ? `${hotelPct}% من العربون` : `${hotelPct}% of deposit`} />
                <KCard icon={Calendar} accent="sky" sub={currency} title={isAr ? 'المتبقي (يدفعه المعتمر في الفندق)' : 'Remaining at Hotel'} value={fmt(metrics.remainingAtHotel)} />
                <KCard icon={AlertCircle} accent="orange" sub={currency} title={isAr ? `عمولة المنصة على المتبقي (${commissionRate}%)` : `Commission on Remaining (${commissionRate}%)`} value={fmt(metrics.commissionOnRemaining)} note={isAr ? 'مستحقة على الفندق لاحقاً' : 'Owed by hotel later'} />
                <KCard icon={ArrowDownCircle} accent="green" sub={currency} title={isAr ? 'صافي دخل الفندق' : 'Hotel Net Income'} value={fmt(metrics.hotelNetRevenue)} note={isAr ? `بعد خصم ${commissionRate}% للمنصة` : `After ${commissionRate}% platform fee`} />
            </div>

            {/* ── Charts row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Donut: Platform vs Hotel split */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">
                        {isAr ? 'توزيع العربون (المنصة مقابل الفندق)' : 'Deposit Split (Platform vs Hotel)'}
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={donutPlatform}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                            >
                                <Cell fill={PLATFORM_COLOR} />
                                <Cell fill={HOTEL_COLOR} />
                            </Pie>
                            <Tooltip formatter={(v) => [`${fmt(v)} ${currency}`, '']} />
                            <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar: Per-booking deposit vs remaining */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">
                        {isAr ? 'آخر الحجوزات: العربون والمتبقي' : 'Recent Bookings: Deposit vs Remaining'}
                    </h3>
                    {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={barData} barSize={14}>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} width={50} />
                                <Tooltip formatter={(v) => [`${fmt(v)} ${currency}`, '']} />
                                <Legend iconType="square" iconSize={10} />
                                <Bar dataKey={isAr ? 'العربون' : 'Deposit'} fill={DEPOSIT_COLOR} radius={[4, 4, 0, 0]} />
                                <Bar dataKey={isAr ? 'المتبقي' : 'Remaining'} fill={REMAINING_COLOR} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                            {isAr ? 'لا توجد حجوزات لعرضها' : 'No bookings to display'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
