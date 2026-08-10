import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { supabase } from '../lib/supabase';
import { adminService } from '../services/adminService';
import {
    DollarSign, TrendingUp, Wallet, Briefcase, Building,
    CheckCircle, Edit2, Save, X, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const PLATFORM_COLOR = '#ef4444';
const HOTEL_COLOR = '#10b981';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const KCard = ({ title, value, sub, icon: Icon, accent = 'emerald', note }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        blue: 'bg-blue-50 text-blue-800 border-blue-200',
        amber: 'bg-amber-50 text-amber-800 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-800 border-purple-200',
        green: 'bg-green-50 text-green-800 border-green-200',
    };
    return (
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${colors[accent]}`}>
            <div className="flex items-center gap-2">
                <Icon size={16} className="opacity-70" />
                <span className="text-xs font-bold opacity-80">{title}</span>
            </div>
            <div className="text-2xl font-black">
                {value}
                {sub && <span className="text-xs font-bold ml-1 opacity-60">{sub}</span>}
            </div>
            {note && <div className="text-[10px] opacity-60">{note}</div>}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminFinancials({ lang = 'ar', currency = 'د.ج' }) {
    const isAr = lang === 'ar';
    const [bookings, setBookings] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [monthly, setMonthly] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRate, setEditingRate] = useState({}); // { hotelId: newRate }
    const [savingRate, setSavingRate] = useState(null);

    // ── Fetch all active bookings + hotels ───────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch bookings via offer→room to get hotel_id (same pattern as HotelFinancials)
            const { data: bData, error: bErr } = await supabase
                .from('bookings')
                .select(`
                    id, total_price, deposit_amount, status,
                    commission_amount, hotel_share_amount, created_at,
                    offer:offers(
                        room:rooms(hotel_id)
                    )
                `)
                .in('status', ['confirmed', 'paid'])
                .order('created_at', { ascending: true });

            // Fetch hotels via adminService (uses select('*') + proven RLS)
            const hotelsArr = await adminService.getHotels();
            setHotels(hotelsArr);

            if (bErr) { console.error('Bookings error:', bErr); }

            const booksArr = bData || [];
            setBookings(booksArr);

            // Monthly trend
            const byMonth = {};
            booksArr.forEach(b => {
                const month = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (!byMonth[month]) byMonth[month] = { month, revenue: 0, commission: 0 };
                byMonth[month].revenue += Number(b.total_price || 0);
                byMonth[month].commission += Number(b.commission_amount || Number(b.total_price || 0) * 0.10);
            });
            setMonthly(Object.values(byMonth));
        } catch (e) {
            console.error('AdminFinancials fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Realtime subscription ────────────────────────────────────────────────
    useEffect(() => {
        fetchData();
        const ch = supabase.channel('admin_financials_rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels' }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, [fetchData]);

    // ── Aggregate platform-level metrics ─────────────────────────────────────
    const global = React.useMemo(() => {
        // Build a rate lookup: fullId → commission rate (default 10%)
        const rateMap = {};
        hotels.forEach(h => { rateMap[h.fullId] = Number(h.commission || 10) / 100; });

        let totalRevenue = 0, totalDeposits = 0, totalCommission = 0, hotelBalances = 0;
        bookings.forEach(b => {
            const tp = Number(b.total_price || 0);
            const dep = Number(b.deposit_amount || 0);
            const hid = b.offer?.room?.hotel_id;
            const rate = rateMap[hid] ?? 0.10;  // dynamic rate from hotel
            const com = tp * rate;
            totalRevenue += tp;
            totalDeposits += dep;
            totalCommission += com;
            hotelBalances += dep * (1 - rate);
        });
        return {
            count: bookings.length,
            totalRevenue,
            totalDeposits,
            totalCommission,
            hotelBalances,
            uncollected: (totalRevenue - totalDeposits) * 0.10,
        };
    }, [bookings, hotels]);

    // ── Per-hotel aggregation for bar chart ──────────────────────────────────
    const hotelStats = React.useMemo(() => {
        const map = {};
        // Build lookup maps from hotels list
        const hotelNameMap = {};
        const rateMap = {};
        hotels.forEach(h => {
            hotelNameMap[h.fullId] = h.name;
            rateMap[h.fullId] = Number(h.commission || 10) / 100;
        });

        bookings.forEach(b => {
            const hid = b.offer?.room?.hotel_id;
            if (!hid) return;
            const name = (hotelNameMap[hid] || hid).slice(0, 14);
            const rate = rateMap[hid] ?? 0.10;
            const tp = Number(b.total_price || 0);
            const dep = Number(b.deposit_amount || 0);
            if (!map[hid]) map[hid] = { id: hid, name, revenue: 0, commission: 0, deposits: 0 };
            map[hid].revenue += tp;
            map[hid].commission += tp * rate;  // dynamic rate
            map[hid].deposits += dep;
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    }, [bookings, hotels]);

    // ── Commission pie ────────────────────────────────────────────────────────
    const donutData = [
        { name: isAr ? 'عمولة المنصة' : 'Platform Commission', value: global.totalCommission },
        { name: isAr ? 'دخل الفنادق' : 'Hotel Income', value: global.totalRevenue - global.totalCommission },
    ];

    // ── Update commission rate ────────────────────────────────────────────────
    const saveCommissionRate = async (hotelId) => {
        const newRate = parseFloat(editingRate[hotelId]);
        if (isNaN(newRate) || newRate < 0 || newRate > 100) {
            toast.error(isAr ? 'نسبة غير صحيحة (0–100)' : 'Invalid rate (0–100)');
            return;
        }
        setSavingRate(hotelId);
        try {
            await adminService.updateHotelCommission(hotelId, newRate);
            toast.success(isAr ? 'تم تحديث نسبة العمولة!' : 'Commission rate updated!');
            setEditingRate(prev => { const n = { ...prev }; delete n[hotelId]; return n; });
            fetchData();
        } catch (e) {
            console.error('Commission update error:', e);
            toast.error(e.message || (isAr ? 'فشل التحديث' : 'Update failed'));
        } finally {
            setSavingRate(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center gap-3 py-16 text-emerald-700 font-bold">
            <RefreshCw size={20} className="animate-spin" />
            {isAr ? 'جاري تحميل البيانات...' : 'Loading...'}
        </div>
    );

    return (
        <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

            {/* ── Platform KPI Cards ───────────────────────────────────────── */}
            {/* compute average rate for display */}
            {(() => {
                const avgRate = hotels.length
                    ? Math.round(hotels.reduce((s, h) => s + Number(h.commission || 10), 0) / hotels.length)
                    : 10;
                const hotelPct = 100 - avgRate;
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <KCard icon={Briefcase} accent="emerald" title={isAr ? 'إجمالي الحجوزات' : 'Total Bookings'} value={fmt(global.count)} />
                        <KCard icon={TrendingUp} accent="blue" title={isAr ? 'إجمالي قيمة الحجوزات' : 'Total Revenue'} value={fmt(global.totalRevenue)} sub={currency} />
                        <KCard icon={Wallet} accent="amber" title={isAr ? 'إجمالي العربون' : 'Total Deposits'} value={fmt(global.totalDeposits)} sub={currency} />
                        <KCard icon={DollarSign} accent="red" title={isAr ? 'عمولة المنصة المحصلة' : 'Collected Commission'} value={fmt(global.totalCommission)} sub={currency} note={isAr ? `${avgRate}% من كل حجز` : `${avgRate}% of booking`} />
                        <KCard icon={Building} accent="purple" title={isAr ? 'رصيد الفنادق داخل المنصة' : 'Hotel Balances'} value={fmt(global.hotelBalances)} sub={currency} note={isAr ? `${hotelPct}% من العربون` : `${hotelPct}% of deposit`} />
                        <KCard icon={AlertCircle} accent="green" title={isAr ? 'عمولات غير محصلة' : 'Uncollected Commission'} value={fmt(global.uncollected)} sub={currency} note={isAr ? `${avgRate}% من المتبقي` : `${avgRate}% of remaining`} />
                    </div>
                );
            })()}

            {/* ── Charts ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Bar: Revenue per hotel */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">{isAr ? 'الإيرادات حسب الفندق' : 'Revenue by Hotel'}</h3>
                    {hotelStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={hotelStats} barSize={16}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} width={55} />
                                <Tooltip formatter={(v) => [`${fmt(v)} ${currency}`, '']} />
                                <Legend iconSize={10} />
                                <Bar dataKey="revenue" name={isAr ? 'الإيرادات' : 'Revenue'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="commission" name={isAr ? 'العمولة' : 'Commission'} fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="deposits" name={isAr ? 'العربون' : 'Deposits'} fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">{isAr ? 'لا بيانات' : 'No data'}</div>
                    )}
                </div>

                {/* Donut: Platform vs Hotel */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">{isAr ? 'المنصة مقابل الفنادق' : 'Platform vs Hotels'}</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" labelLine={false}>
                                <Cell fill={PLATFORM_COLOR} />
                                <Cell fill={HOTEL_COLOR} />
                            </Pie>
                            <Tooltip formatter={(v) => [`${fmt(v)} ${currency}`, '']} />
                            <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Line: Monthly trend */}
            {monthly.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">{isAr ? 'الاتجاه الشهري للإيرادات' : 'Monthly Revenue Trend'}</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={monthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} width={55} />
                            <Tooltip formatter={(v) => [`${fmt(v)} ${currency}`, '']} />
                            <Legend iconSize={10} />
                            <Line type="monotone" dataKey="revenue" name={isAr ? 'الإيرادات' : 'Revenue'} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="commission" name={isAr ? 'العمولة' : 'Commission'} stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Commission Management Table ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                    <Edit2 size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-gray-900">{isAr ? 'إدارة عمولات الفنادق' : 'Hotel Commission Management'}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-start">{isAr ? 'الفندق' : 'Hotel'}</th>
                                <th className="px-4 py-3 text-center">{isAr ? 'نسبة العمولة الحالية' : 'Current Rate'}</th>
                                <th className="px-4 py-3 text-center">{isAr ? 'الإيرادات' : 'Revenue'}</th>
                                <th className="px-4 py-3 text-center">{isAr ? 'الحجوزات' : 'Bookings'}</th>
                                <th className="px-4 py-3 text-center">{isAr ? 'تعديل النسبة' : 'Edit Rate'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {hotels.map(hotel => {
                                const stat = hotelStats.find(s => s.id === hotel.fullId);
                                const hotelBookings = bookings.filter(b => b.offer?.room?.hotel_id === hotel.fullId);
                                const isEditing = hotel.fullId in editingRate;
                                return (
                                    <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{hotel.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                {hotel.commission ?? 10}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-700 font-semibold">
                                            {fmt(stat?.revenue || 0)} {currency}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600 font-medium">
                                            {hotelBookings.length}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number" min="0" max="100" step="0.5"
                                                        value={editingRate[hotel.fullId]}
                                                        onChange={e => setEditingRate(prev => ({ ...prev, [hotel.fullId]: e.target.value }))}
                                                        className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                    />
                                                    <span className="text-xs text-gray-400">%</span>
                                                    <button
                                                        onClick={() => saveCommissionRate(hotel.fullId)}
                                                        disabled={savingRate === hotel.fullId}
                                                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {savingRate === hotel.fullId ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingRate(prev => { const n = { ...prev }; delete n[hotel.fullId]; return n; })}
                                                        className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingRate(prev => ({ ...prev, [hotel.fullId]: hotel.commission ?? 10 }))}
                                                    className="flex items-center gap-1.5 mx-auto px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors"
                                                >
                                                    <Edit2 size={12} />
                                                    {isAr ? 'تعديل' : 'Edit'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {hotels.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                                        {isAr ? 'لا توجد فنادق' : 'No hotels found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
