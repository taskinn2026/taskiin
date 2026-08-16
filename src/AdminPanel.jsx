import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { commonService } from './services/commonService';
import { adminService } from './services/adminService';
import {
    LayoutDashboard, Briefcase, Hotel, Wallet, Megaphone, BarChart3,
    Bell, Globe, LogOut, Check, X, Eye, Edit, Trash2, Ban, Plus, Pause, Play,
    ChevronDown, Filter, Download, Send, Tag, CalendarCheck, BadgeCheck,
    TrendingUp, AlertCircle, DollarSign, Users, Clock, Search, ArrowRight, Building, Menu, Save, FileText
} from 'lucide-react';
import NotificationBellAdmin from './components/NotificationBellAdmin';
import AdminFinancials from './components/AdminFinancials';
import AdminPagesSection from './components/AdminPagesSection';
import CustomPageViewer from './components/CustomPageViewer';
import { Footer } from './components/Footer';

const ADMIN_T = {
    ar: {
        dashboard: 'لوحة القيادة', offers: 'العروض والحجوزات', partners: 'الفنادق والشركاء',
        finance: 'المالية والسحب', marketing: 'الترويج والمحتوى', insights: 'التحليلات',
        bookingsToday: 'حجوزات اليوم', totalRevenue: 'إجمالي المدفوعات', pendingOffers: 'عروض للمراجعة',
        payoutRequests: 'طلبات سحب', activeHotels: 'فنادق نشطة', alerts: 'تنبيهات ذكية',
        allOffers: 'جميع العروض', pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض',
        approve: 'قبول', reject: 'رفض', edit: 'تعديل', delete: 'حذف', view: 'عرض',
        hotel: 'الفندق', room: 'الغرفة', price: 'السعر', status: 'الحالة', date: 'التاريخ', depositPaid: 'عربون مدفوع', deposit: 'العربون', fullyPaid: 'تم الدفع كلياً',
        actions: 'إجراءات', bookings: 'الحجوزات', guest: 'المعتمر', amount: 'المبلغ',
        verified_gold: 'ذهبي', verified_blue: 'أزرق', unverified: 'غير موثق',
        offersCount: 'العروض', bookingsCount: 'الحجوزات', commission: 'العمولة', docs: 'المستندات',
        suspend: 'تعليق', activate: 'تفعيل', active: 'نشط', suspended: 'موقوف',
        platformBalance: 'رصيد المنصة', hotelDues: 'مستحقات الفنادق', totalCommission: 'إجمالي العمولات',
        payoutHistory: 'سجل السحوبات', processing: 'قيد المعالجة', paid: 'تم الدفع',
        banners: 'البنرات الإعلانية', addBanner: 'إضافة بنر', featuredOffers: 'عروض مميزة',
        notifications: 'إشعارات جماعية', sendNotif: 'إرسال إشعار', seasonSettings: 'إعدادات المواسم',
        topViewed: 'الأكثر مشاهدة', searchStats: 'إحصائيات البحث', demandCurve: 'منحنى الطلب',
        makkah: 'مكة المكرمة', madinah: 'المدينة المنورة', views: 'مشاهدة',
        reason: 'سبب الإجراء', confirm: 'تأكيد', cancel: 'إلغاء', save: 'حفظ', currency: 'د.ج',
        scheduled: 'مجدول', logout: 'خروج', backHome: 'العودة للرئيسية', pages: 'الصفحات المخصصة'
    },
    en: {
        dashboard: 'Dashboard', offers: 'Offers & Bookings', partners: 'Hotels & Partners',
        finance: 'Finance', marketing: 'Marketing', insights: 'Insights',
        bookingsToday: "Today's Bookings", totalRevenue: 'Total Revenue', pendingOffers: 'Pending Offers',
        payoutRequests: 'Payout Requests', activeHotels: 'Active Hotels', alerts: 'Smart Alerts',
        allOffers: 'All Offers', pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
        approve: 'Approve', reject: 'Reject', edit: 'Edit', delete: 'Delete', view: 'View',
        hotel: 'Hotel', room: 'Room', price: 'Price', status: 'Status', date: 'Date', depositPaid: 'Deposit Paid', deposit: 'Deposit', fullyPaid: 'Fully Paid',
        actions: 'Actions', bookings: 'Bookings', guest: 'Guest', amount: 'Amount',
        verified_gold: 'Gold', verified_blue: 'Blue', unverified: 'Unverified',
        offersCount: 'Offers', bookingsCount: 'Bookings', commission: 'Commission', docs: 'Docs',
        suspend: 'Suspend', activate: 'Activate', active: 'Active', suspended: 'Suspended',
        platformBalance: 'Platform Balance', hotelDues: 'Hotel Dues', totalCommission: 'Total Commission',
        payoutHistory: 'Payout History', processing: 'Processing', paid: 'Paid',
        banners: 'Banners', addBanner: 'Add Banner', featuredOffers: 'Featured Offers',
        notifications: 'Push Notifications', sendNotif: 'Send Notification', seasonSettings: 'Season Settings',
        topViewed: 'Most Viewed', searchStats: 'Search Stats', demandCurve: 'Demand Curve',
        makkah: 'Makkah', madinah: 'Madinah', views: 'views',
        reason: 'Reason', confirm: 'Confirm', cancel: 'Cancel', save: 'Save', currency: 'DZD',
        scheduled: 'Scheduled', logout: 'Logout', backHome: 'Back to Home', pages: 'Custom Pages'
    }
};

// Fix 7: Admin Panel Fixes (Undefined lang, keys, target user)
// Ensure 'lang' is passed to all sub-components or defined from props.
// Checked 'DashboardSection' - it uses 'lang' but wasn't receiving it in some calls? 
// The issues were likely in the 'AdminSidebar' or 'DashboardSection' usage.

const AdminSidebar = ({ activeSection, setActiveSection, lang, t, setRole, onLogout, isOpen, onClose }) => {
    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
        { id: 'offers', icon: Briefcase, label: t.offers },
        { id: 'partners', icon: Hotel, label: t.partners },
        { id: 'finance', icon: Wallet, label: t.finance },
        { id: 'marketing', icon: Megaphone, label: t.marketing },
        { id: 'insights', icon: BarChart3, label: t.insights },
        { id: 'pages', icon: FileText, label: t.pages }
    ];
    // Fix: Ensure key unique
    return (
        <aside className={`fixed top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} h-full w-64 bg-white border-${lang === 'ar' ? 'l' : 'r'} border-gray-100 flex flex-col z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}`}>
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRole('user')}>
                    <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {lang === 'ar' ? 'ت' : 'T'}
                    </div>
                    <div>
                        <span className="text-lg font-bold text-emerald-900">{lang === 'ar' ? 'تلبية' : 'Talbia'}</span>
                        <span className="text-amber-600 font-bold">{lang === 'ar' ? 'تسكين' : 'Taskin'}</span>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Admin Panel</div>
                    </div>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map(item => (
                    <button key={item.id} onClick={() => { setActiveSection(item.id); if (onClose) onClose(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'
                            }`}>
                        <item.icon size={20} />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100 space-y-2">
                <button onClick={() => setRole('user')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <LogOut size={20} />
                    {t.backHome}
                </button>
                <button onClick={async () => {
                    try {
                        if (onLogout) {
                            await onLogout();
                        } else {
                            // Fallback
                            const { supabase } = await import('./lib/supabase.js');
                            await supabase.auth.signOut({ scope: 'local' });
                            localStorage.clear();
                            sessionStorage.clear();
                            setRole('pilgrim');
                        }
                    } catch (e) {
                        console.error('Logout error', e);
                    }
                }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors mt-2">
                    <LogOut size={20} className="text-red-600" />
                    {t.logout}
                </button>
            </div>
        </aside>
    );
};

// Status Badge
const StatusBadge = ({ status, t }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700',
        confirmed: 'bg-green-50 text-green-700', completed: 'bg-blue-50 text-blue-700', processing: 'bg-amber-50 text-amber-700',
        deposit_paid: 'bg-cyan-50 text-cyan-700',
        paid: 'bg-green-50 text-green-700', active: 'bg-green-50 text-green-700', suspended: 'bg-red-50 text-red-700',
        scheduled: 'bg-purple-50 text-purple-700', gold: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700', none: 'bg-gray-100 text-gray-600'
    };
    const labels = {
        pending: t.pending, approved: t.approved, rejected: t.rejected, confirmed: t.depositPaid,
        completed: t.fullyPaid, processing: t.processing, paid: t.paid, active: t.active, suspended: t.suspended,
        scheduled: t.scheduled, gold: t.verified_gold, blue: t.verified_blue, none: t.unverified
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
};

// Action Modal
const AdminModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

// Time Filter Dropdown
const TimeFilter = ({ value, onChange, t, lang }) => {
    const options = [
        { id: 'today', label: lang === 'ar' ? 'اليوم' : 'Today' },
        { id: '7d', label: lang === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days' },
        { id: '30d', label: lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days' },
        { id: 'this_month', label: lang === 'ar' ? 'هذا الشهر' : 'This Month' },
        { id: 'last_month', label: lang === 'ar' ? 'الشهر الماضي' : 'Last Month' }
    ];

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{lang === 'ar' ? 'الفترة:' : 'Period:'}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block px-3 py-1.5 shadow-sm font-medium"
            >
                {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
        </div>
    );
};

// Helper: Get Date Range from Period String
const getDateRange = (period) => {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (period === 'today') {
        // start is already out bounds to today at midnight
    } else if (period === '7d') {
        start.setDate(start.getDate() - 7);
    } else if (period === '30d') {
        start.setDate(start.getDate() - 30);
    } else if (period === 'this_month') {
        start.setDate(1);
    } else if (period === 'last_month') {
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); // Last day of previous month
    }
    return { startDate: start, endDate: end };
};

// Dashboard Section
const DashboardSection = ({ t, lang }) => {
    const [period, setPeriod] = useState('30d');
    const [finKPIs, setFinKPIs] = useState({ total_bookings: 0, total_revenue: 0, total_deposits: 0, collected_commission: 0, hotel_balances: 0, uncollected_commission: 0, total_potential_profit: 0 });
    const [opKPIs, setOpKPIs] = useState({ total_hotels: 0, total_users: 0, active_bookings: 0, upcoming_checkins: 0, upcoming_checkouts: 0 });
    const [riskKPIs, setRiskKPIs] = useState({ cancellation_rate: 0, no_show_rate: 0 });
    const [wallet, setWallet] = useState({ positive_balance: 0, negative_balance: 0, hotels_in_debt: 0, hotels_in_credit: 0 });
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const { startDate, endDate } = getDateRange(period);
                const [fin, op, risk, wall, alertsData] = await Promise.all([
                    adminService.getFinancialKPIs(startDate, endDate),
                    adminService.getOperationalKPIs(startDate, endDate),
                    adminService.getRiskKPIs(startDate, endDate),
                    adminService.getWalletExposure(), // global, not timebound
                    adminService.getAlerts()
                ]);
                setFinKPIs(fin);
                setOpKPIs(op);
                setRiskKPIs(risk);
                setWallet(wall);
                setAlerts(alertsData);
            } catch (e) {
                console.error('Failed to load strict dashboard data:', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [period]);

    if (loading) return <div className="p-10 text-center text-gray-500 font-bold flex justify-center items-center gap-3"><div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> {lang === 'ar' ? 'جاري التحضير...' : 'Loading Data...'}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <BarChart3 className="text-emerald-600" size={24} />
                    {lang === 'ar' ? 'التحليلات المالية' : 'Financial Analytics'}
                </h2>
            </div>

            {/* Main financial analytics with charts + commission management */}
            <AdminFinancials lang={lang} currency={t.currency} />

            {/* Alerts Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Bell size={20} className="text-amber-500" />
                    {t.alerts}
                </h3>
                <div className="space-y-3">
                    {alerts.length > 0 ? alerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100 group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${alert.type === 'doc' ? 'bg-amber-100 text-amber-600' : alert.type === 'suspend' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                                    <AlertCircle size={16} />
                                </div>
                                <span className="text-sm font-bold text-gray-700">{alert.message}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-400">{alert.time}</span>
                                <button
                                    onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">{lang === 'ar' ? 'لا توجد تنبيهات' : 'No alerts'}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Offers Section
const OffersSection = ({ t, lang }) => {
    const [filter, setFilter] = useState('all');
    const [modal, setModal] = useState({ open: false, type: '', item: null });
    const [offers, setOffers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(35.80);

    const loadData = async () => {
        try {
            const [offersData, bookingsData, rate] = await Promise.all([
                adminService.getOffers(),
                adminService.getBookings(),
                adminService.getExchangeRate()
            ]);
            setOffers(offersData);
            setBookings(bookingsData);
            setExchangeRate(rate);
        } catch (e) {
            console.error('Failed to load offers:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleAction = async (type, offer, reason = null) => {
        try {
            const statusMap = { approve: 'approved', reject: 'rejected', suspend: 'suspended', activate: 'approved' };
            await adminService.updateOfferStatus(offer.fullId, statusMap[type], reason, offer.owner_id);
            setModal({ open: false, type: '', item: null });
            loadData(); // Refresh
        } catch (e) {
            toast.error('Failed: ' + e.message);
        }
    };

    const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected', 'suspended'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-emerald-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                        {f === 'all' ? t.allOffers : (t[f] || (f === 'suspended' ? (lang === 'ar' ? 'موقوف' : 'Suspended') : f))} {f !== 'all' && `(${offers.filter(o => o.status === f).length})`}
                    </button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-start">ID</th>
                                <th className="px-4 py-3 text-start">{t.hotel}</th>
                                <th className="px-4 py-3 text-start">{lang === 'ar' ? 'العرض' : 'Offer'}</th>
                                <th className="px-4 py-3 text-start">{t.price}</th>
                                <th className="px-4 py-3 text-start">{t.status}</th>
                                <th className="px-4 py-3 text-start">{t.date}</th>
                                <th className="px-4 py-3 text-start">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(offer => (
                                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{offer.id}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{offer.hotel}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-bold text-gray-900">{offer.title || (lang === 'ar' ? 'عرض مخصص' : 'Custom Offer')}</div>
                                        <div className="text-xs text-gray-500">{offer.room}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{offer.price} {t.currency}</td>
                                    <td className="px-4 py-3"><StatusBadge status={offer.status} t={t} /></td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{offer.date}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {offer.status === 'pending' && <>
                                                <button onClick={() => setModal({ open: true, type: 'approve', item: offer })} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title={t.approve}><Check size={14} /></button>
                                                <button onClick={() => setModal({ open: true, type: 'reject', item: offer })} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title={t.reject}><X size={14} /></button>
                                            </>}
                                            {offer.status === 'approved' && (
                                                <button onClick={() => setModal({ open: true, type: 'suspend', item: offer })} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100" title={lang === 'ar' ? 'توقيف النشر' : 'Suspend'}><Pause size={14} /></button>
                                            )}
                                            {offer.status === 'suspended' && (
                                                <button onClick={() => setModal({ open: true, type: 'activate', item: offer })} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title={lang === 'ar' ? 'إعادة النشر' : 'Publish'}><Play size={14} /></button>
                                            )}
                                            <button onClick={() => setModal({ open: true, type: 'view', item: offer })} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100" title={t.view}><Eye size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">{lang === 'ar' ? 'لا توجد عروض' : 'No offers found'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bookings Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">{t.bookings}</h3>
                <div className="space-y-3">
                    {bookings.length > 0 ? bookings.map(b => {
                        const amount = Number(b.amount) || 0;
                        const deposit = Number(b.deposit_amount) || 0;
                        const remaining = amount - deposit;

                        return (
                            <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border ${b.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-bold text-gray-900">{b.guest}</div>
                                        <StatusBadge status={b.status} t={t} />
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{b.hotel}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        <span className="font-medium">{b.offerTitle || b.room}</span> • {b.date} • {lang === 'ar' ? 'رقم الحجز:' : 'Ref:'} <span className="font-mono">{b.id}</span>
                                    </div>
                                </div>
                                <div className="text-end flex-shrink-0 ml-4 flex flex-col gap-1 items-end">
                                    <div className="text-sm">
                                        <span className="text-gray-500">{lang === 'ar' ? 'الإجمالي:' : 'Total:'} </span>
                                        <span className="font-bold text-gray-900">{amount.toLocaleString()} {t.currency}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">{t.deposit}: </span>
                                        <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">
                                            {deposit > 0 ? deposit.toLocaleString() : '0'} {t.currency}
                                        </span>
                                    </div>
                                    <div className="text-sm pt-1 border-t border-gray-200 mt-1 flex flex-col items-end">
                                        <div>
                                            <span className="text-gray-500 text-xs">{lang === 'ar' ? 'المتبقي الدفع:' : 'Remaining:'} </span>
                                            <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                {remaining > 0 ? Math.round(remaining / exchangeRate).toLocaleString() : '0'} SAR
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium" dir="ltr">({remaining.toLocaleString()} DZD)</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-4 text-gray-400">{lang === 'ar' ? 'لا توجد حجوزات' : 'No bookings'}</div>
                    )}
                </div>
            </div>
            <AdminModal isOpen={modal.open} onClose={() => setModal({ open: false, type: '', item: null })} title={modal.type === 'approve' ? t.approve : modal.type === 'reject' ? t.reject : modal.type === 'suspend' ? (lang === 'ar' ? 'توقيف العرض' : 'Suspend Offer') : modal.type === 'activate' ? (lang === 'ar' ? 'تفعيل العرض' : 'Activate Offer') : t.view}>
                <div className="space-y-4">
                    {modal.item && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                            <div><span className="text-gray-500 text-xs">{t.hotel}:</span> <span className="font-bold text-gray-900">{modal.item.hotel}</span></div>
                            <div><span className="text-gray-500 text-xs">{lang === 'ar' ? 'العرض:' : 'Offer:'}</span> <span className="font-bold text-gray-900">{modal.item.title || modal.item.room}</span></div>
                            <div><span className="text-gray-500 text-xs">{t.price}:</span> <span className="font-bold text-emerald-700">{modal.item.price} {t.currency}</span></div>
                            {modal.type === 'view' && <div><span className="text-gray-500 text-xs">{t.status}:</span> <span className="font-bold"><StatusBadge status={modal.item.status} t={t} /></span></div>}
                        </div>
                    )}
                    {modal.type === 'reject' && <div><label className="text-xs font-bold text-gray-600 mb-2 block">{t.reason}</label><textarea id="rejectReason" className="w-full border border-gray-200 rounded-xl p-3 text-sm h-20 bg-gray-50 outline-none focus:border-red-500 placeholder-gray-400" placeholder={lang === 'ar' ? 'اكتب سبب الرفض هنا ليتم إرساله للفندق...' : 'Type rejection reason to send to the hotel...'}></textarea></div>}

                    <div className="flex gap-3">
                        {modal.type !== 'view' && (
                            <>
                                <button onClick={() => setModal({ open: false, type: '', item: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">{t.cancel}</button>
                                <button onClick={() => {
                                    const reason = modal.type === 'reject' ? document.getElementById('rejectReason')?.value : null;
                                    handleAction(modal.type, modal.item, reason);
                                }} className={`flex-1 py-3 text-white rounded-xl font-bold ${(modal.type === 'reject' || modal.type === 'suspend') ? 'bg-red-600' : 'bg-emerald-800'}`}>{t.confirm}</button>
                            </>
                        )}
                        {modal.type === 'view' && (
                            <button onClick={() => setModal({ open: false, type: '', item: null })} className="w-full py-3 bg-emerald-800 text-white rounded-xl font-bold">{t.confirm}</button>
                        )}
                    </div>
                </div>
            </AdminModal>
        </div>
    );
};

// Partners Section
const PartnersSection = ({ t, lang }) => {
    const [modal, setModal] = useState({ open: false, hotel: null });
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const data = await adminService.getHotels();
            setHotels(data);
        } catch (e) {
            console.error('Failed to load hotels:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleToggleStatus = async (hotel) => {
        try {
            await adminService.toggleHotelStatus(hotel.fullId, hotel.status !== 'active');
            loadData(); // Refresh
        } catch (e) {
            toast.error('Failed: ' + e.message);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-start">ID</th>
                                <th className="px-4 py-3 text-start">{t.hotel}</th>
                                <th className="px-4 py-3 text-start">{t.status}</th>
                                <th className="px-4 py-3 text-center">{t.offersCount}</th>
                                <th className="px-4 py-3 text-center">{t.commission}</th>
                                <th className="px-4 py-3 text-center">{t.docs}</th>
                                <th className="px-4 py-3 text-start">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {hotels.map(h => (
                                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{h.id}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{h.name}</span>
                                            <StatusBadge status={h.verification} t={t} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={h.status} t={t} /></td>
                                    <td className="px-4 py-3 text-center text-sm font-medium">{h.offers}</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-emerald-700">{h.commission}%</td>
                                    <td className="px-4 py-3 text-center">{h.docs ? <Check size={16} className="text-green-600 mx-auto" /> : <X size={16} className="text-red-500 mx-auto" />}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <button onClick={() => setModal({ open: true, hotel: h })} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"><Eye size={14} /></button>
                                            <button onClick={() => handleToggleStatus(h)} className={`p-1.5 rounded-lg ${h.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                                {h.status === 'active' ? <Ban size={14} /> : <Check size={14} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {hotels.length === 0 && (
                                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">{lang === 'ar' ? 'لا توجد فنادق' : 'No hotels found'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AdminModal isOpen={modal.open} onClose={() => setModal({ open: false, hotel: null })} title={modal.hotel?.name || ''}>
                {modal.hotel && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-xl text-center"><div className="text-2xl font-bold text-gray-900">{modal.hotel.offers}</div><div className="text-xs text-gray-500">{t.offersCount}</div></div>
                            <div className="bg-gray-50 p-3 rounded-xl text-center"><div className="text-2xl font-bold text-gray-900">{modal.hotel.bookings || 0}</div><div className="text-xs text-gray-500">{t.bookingsCount}</div></div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                            <span className="text-sm font-medium text-emerald-800">{t.commission}</span>
                            <span className="font-bold text-emerald-900">{modal.hotel.commission}%</span>
                        </div>
                        <button onClick={() => setModal({ open: false, hotel: null })} className="w-full py-3 bg-emerald-800 text-white rounded-xl font-bold">{t.confirm}</button>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

// Finance Section
const FinanceSection = ({ t, lang }) => {
    const [summary, setSummary] = useState({ platformBalance: 0, hotelDues: 0, totalCommission: 0 });
    const [payouts, setPayouts] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(35.80);
    const [savingRate, setSavingRate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [summaryData, payoutsData, rate] = await Promise.all([
                    adminService.getFinanceSummary(),
                    adminService.getPayouts(),
                    adminService.getExchangeRate()
                ]);
                setSummary(summaryData);
                setPayouts(payoutsData);
                setExchangeRate(rate);
            } catch (e) {
                console.error('Failed to load finance data:', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-6 rounded-2xl">
                    <div className="text-sm opacity-80 mb-2">{t.platformBalance}</div>
                    <div className="text-3xl font-bold">{summary.platformBalance.toLocaleString()} {t.currency}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <div className="text-sm text-gray-500 mb-2">{t.hotelDues}</div>
                    <div className="text-3xl font-bold text-gray-900">{summary.hotelDues.toLocaleString()} {t.currency}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <div className="text-sm text-gray-500 mb-2">{t.totalCommission}</div>
                    <div className="text-3xl font-bold text-emerald-700">{summary.totalCommission.toLocaleString()} {t.currency}</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 mb-1">{lang === 'ar' ? 'سعر صرف العملات' : 'Exchange Rates'}</h3>
                    <p className="text-xs text-gray-500">{lang === 'ar' ? 'يستخدم لتحويل الريال السعودي إلى الدينار الجزائري في واجهة المستخدم' : 'Used for SAR to DZD conversion on the client side'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700">1 SAR =</span>
                    <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="w-24 border border-gray-200 rounded-lg p-2 text-center font-bold"
                    />
                    <span className="text-sm font-bold text-gray-700">DZD</span>
                    <button
                        onClick={async () => {
                            try {
                                setSavingRate(true);
                                await adminService.updateExchangeRate(Number(exchangeRate));
                                toast.error(lang === 'ar' ? 'تم حفظ سعر الصرف!' : 'Saved successfully!');
                            } catch (e) {
                                toast.error('Error saving exchange rate');
                            } finally {
                                setSavingRate(false);
                            }
                        }}
                        disabled={savingRate}
                        className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                        {savingRate ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التعديل' : 'Save')}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">{t.payoutHistory}</h3>
                <div className="space-y-3">
                    {payouts.length > 0 ? payouts.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <div className="font-medium text-gray-900">{p.hotel}</div>
                                <div className="text-xs text-gray-500">{p.id} • {p.date}</div>
                            </div>
                            <div className="text-end flex items-center gap-3">
                                <div className="text-end">
                                    <div className="font-bold text-gray-900">{p.amount.toLocaleString()} {t.currency}</div>
                                    <StatusBadge status={p.status} t={t} />
                                </div>
                                {(p.status === 'processing' || p.status === 'pending') && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من إتمام التحويل وتصفير المبلغ؟' : 'Confirm transfer?')) {
                                                try {
                                                    await adminService.updatePayoutStatus(p.fullId, 'paid');
                                                    toast.success(lang === 'ar' ? 'تم تأكيد التحويل بنجاح' : 'Transfer confirmed');
                                                    const newPayouts = await adminService.getPayouts();
                                                    setPayouts(newPayouts);
                                                    const summaryData = await adminService.getFinanceSummary();
                                                    setSummary(summaryData);
                                                } catch (e) {
                                                    toast.error('Error confirming transfer');
                                                }
                                            }
                                        }}
                                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        title={lang === 'ar' ? 'تأكيد التحويل' : 'Confirm Transfer'}
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-4 text-gray-400">{lang === 'ar' ? 'لا توجد طلبات سحب' : 'No payout requests'}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// MarketingSection with Real DB Connection
const MarketingSection = ({ t, lang }) => {
    const [notifModal, setNotifModal] = useState(false);
    const [broadcastData, setBroadcastData] = useState({ audience: 'pilgrims', title: '', body: '', url: '' });
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [bannerModal, setBannerModal] = useState({ open: false, type: '', banner: null });
    const [banners, setBanners] = useState([]);
    const [seasonBanners, setSeasonBanners] = useState([]); // New state
    const [seasonBannerModal, setSeasonBannerModal] = useState({ open: false, banner: null }); // New modal state
    const [footerLinks, setFooterLinks] = useState([]);
    const [chargilyLink, setChargilyLink] = useState('');
    const [chargilyLiveMode, setChargilyLiveMode] = useState(false);
    const [customPages, setCustomPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const handleSendBroadcast = async () => {
        if (!broadcastData.title || !broadcastData.body) {
            toast.error(lang === 'ar' ? 'يرجى إدخال العنوان والمحتوى' : 'Title and body are required');
            return;
        }
        try {
            setSendingBroadcast(true);
            await adminService.broadcastNotification(
                broadcastData.audience,
                broadcastData.title,
                broadcastData.body,
                broadcastData.url || null
            );
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 relative overflow-hidden`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Send size={20} className="text-purple-600" />
                                </div>
                            </div>
                            <div className="mx-3 flex-1">
                                <p className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'تم الإرسال بنجاح!' : 'Broadcast Sent!'}</p>
                                <p className="mt-1 text-xs text-gray-500">{lang === 'ar' ? 'تم تحويل الإشعار الجماعي بنجاح لجميع الفئات المستهدفة.' : 'The broadcast notification has been successfully delivered.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ));
            setNotifModal(false);
            setBroadcastData({ audience: 'pilgrims', title: '', body: '', url: '' });
        } catch (e) {
            console.error('Error sending broadcast:', e);
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 relative overflow-hidden`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle size={20} className="text-red-600" />
                                </div>
                            </div>
                            <div className="mx-3 flex-1">
                                <p className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'فشل الإرسال!' : 'Broadcast Failed!'}</p>
                                <p className="mt-1 text-xs text-gray-500">{lang === 'ar' ? 'حدث خطأ غير متوقع أثناء إرسال الإشعار الجماعي.' : 'An unexpected error occurred while sending the broadcast.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ));
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploadingBanner(true);
            const url = await commonService.uploadBannerImage(file);
            setBannerModal(prev => ({ ...prev, banner: { ...prev.banner, image_url: url } }));
        } catch (error) {
            console.error(error);
            toast.error(lang === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
        } finally {
            setUploadingBanner(false);
        }
    };

    const fetchBanners = async () => {
        setLoading(true);
        const [bannersData, seasonBannersData, footerData, pagesData, chargilyData, chargilyLiveModeData] = await Promise.all([
            commonService.getAllBanners(),
            commonService.getAdminSeasonBanners().catch(e => { console.error('No season_banners table yet', e); return []; }),
            commonService.getAppSettings('footer_links').catch(e => []),
            commonService.getCustomPages().catch(e => []),
            commonService.getAppSettings('chargily_link').catch(e => ''),
            commonService.getAppSettings('chargily_live_mode').catch(e => false)
        ]);
        setBanners(bannersData || []);
        setSeasonBanners(seasonBannersData || []);
        setFooterLinks(footerData || []);
        setCustomPages(pagesData || []);
        setChargilyLink(chargilyData || '');
        setChargilyLiveMode(chargilyLiveModeData === 'true' || chargilyLiveModeData === true);
        setLoading(false);
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleToggle = async (id, currentStatus) => {
        try {
            await commonService.toggleBanner(id, !currentStatus);
            // Optimistic update
            setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
        } catch (e) {
            console.error(e);
            toast.error("Failed to toggle banner");
        }
    };

    const handleSaveBanner = async () => {
        try {
            const payload = {
                title: bannerModal.banner?.title?.ar || bannerModal.banner?.title || 'New Banner',
                subtitle: bannerModal.banner?.subtitle?.ar || bannerModal.banner?.subtitle || '',
                is_active: bannerModal.banner?.id ? bannerModal.banner?.is_active : true, // Keep existing status if updating
                type: bannerModal.type,
                image_url: bannerModal.banner?.image_url || 'https://images.unsplash.com/photo-1542259144-64b26961c172', // Default fallback
                action_url: bannerModal.banner?.action_url || null
            };

            // Keep existing position if it exists, otherwise provide default 10
            if (!bannerModal.banner?.id) {
                payload.position = 10;
            }

            if (bannerModal.banner?.id) {
                await commonService.updateBanner(bannerModal.banner.id, payload);
            } else {
                await commonService.createBanner(payload);
            }

            setBannerModal({ open: false, type: '', banner: null });
            fetchBanners(); // refresh
        } catch (e) {
            console.error(e);
            toast.error(lang === 'ar' ? 'فشل حفظ البانر: ' + e.message : 'Failed to save banner: ' + e.message);
        }
    };

    // ========== SEASON BANNER HANDLERS ==========
    const handleToggleSeasonBanner = async (id, currentStatus) => {
        try {
            await commonService.toggleSeasonBanner(id, !currentStatus);
            // Optimistic update
            if (!currentStatus) {
                // If we are activating this one, we must deactivate all others in the local state too
                setSeasonBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: true } : { ...b, is_active: false }));
            } else {
                setSeasonBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: false } : b));
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to toggle season banner");
        }
    };

    const handleDeleteSeasonBanner = async (id) => {
        if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا البانر؟' : 'Are you sure you want to delete this banner?')) return;
        try {
            await commonService.deleteSeasonBanner(id);
            setSeasonBanners(prev => prev.filter(b => b.id !== id));
            toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted successfully');
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete banner");
        }
    };

    const handleSaveSeasonBanner = async () => {
        try {
            const payload = {
                title: seasonBannerModal.banner?.title || 'New Season Banner',
                description: seasonBannerModal.banner?.description || '',
                is_active: seasonBannerModal.banner?.id ? seasonBannerModal.banner?.is_active : false,
                image_url: seasonBannerModal.banner?.image_url || 'https://images.unsplash.com/photo-1542259144-64b26961c172',
                link_url: seasonBannerModal.banner?.link_url || null,
                target_role: seasonBannerModal.banner?.target_role || 'all'
            };

            if (seasonBannerModal.banner?.id) {
                await commonService.updateSeasonBanner(seasonBannerModal.banner.id, payload);
            } else {
                await commonService.createSeasonBanner(payload);
            }

            setSeasonBannerModal({ open: false, banner: null });
            fetchBanners(); // refresh
            toast.success(lang === 'ar' ? 'تم الحفظ' : 'Saved successfully');
        } catch (e) {
            console.error(e);
            toast.error(lang === 'ar' ? 'فشل الحفظ' : 'Failed to save');
        }
    };

    const seasonBanner = banners.find(b => b.type === 'season') || null;
    const promoBanners = banners.filter(b => b.type === 'promo');

    const handleSaveSettings = async () => {
        try {
            await commonService.updateAppSettings('footer_links', footerLinks);
            await commonService.updateAppSettings('chargily_link', chargilyLink);
            await commonService.updateAppSettings('chargily_live_mode', chargilyLiveMode);
            toast.success(lang === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved');
        } catch (e) {
            console.error(e);
            toast.error(lang === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
        }
    };

    // Helper to safely get title/desc
    const getText = (obj) => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[lang] || obj['en'] || '';
    };

    if (loading) return <div className="p-10 text-center">Loading Banners...</div>;

    return (
        <div className="space-y-6">
            {/* Season Banner Management */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900">{lang === 'ar' ? 'بانر الموسم' : 'Season Banner'}</h3>
                        <p className="text-xs text-gray-500">{lang === 'ar' ? 'يظهر بانر واحد فقط في نفس الوقت' : 'Only one banner displayed at a time'}</p>
                    </div>
                    <button onClick={() => setSeasonBannerModal({ open: true, banner: null })}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
                        <Plus size={16} />{lang === 'ar' ? 'إضافة بانر موسمي' : 'Add Banner'}
                    </button>
                </div>
                {seasonBanners.length > 0 ? (
                    <div className="space-y-4">
                        {seasonBanners.map(sb => (
                            <div key={sb.id} className={`border rounded-xl overflow-hidden ${sb.is_active ? 'border-emerald-500 shadow-md ring-2 ring-emerald-50' : 'border-gray-100'}`}>
                                <div className={`h-24 ${sb.is_active ? 'bg-gradient-to-r from-emerald-800 to-emerald-600' : 'bg-gradient-to-r from-gray-700 to-gray-600'} flex items-center justify-between px-6 relative overflow-hidden`}>
                                    {sb.image_url && <img src={sb.image_url} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />}
                                    <div className="text-white relative z-10 w-3/4">
                                        <div className="text-lg font-bold truncate">{getText(sb.title)}</div>
                                        <div className="text-sm opacity-80 truncate">{getText(sb.description)}</div>
                                    </div>
                                    <span className={`px-3 py-1 text-white text-xs font-bold rounded-full relative z-10 ${sb.target_role === 'all' ? 'bg-amber-500' : sb.target_role === 'pilgrim' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                        {sb.target_role === 'all' ? (lang === 'ar' ? 'الجميع' : 'All') : sb.target_role === 'pilgrim' ? (lang === 'ar' ? 'للمعتمرين' : 'Pilgrims') : (lang === 'ar' ? 'للفنادق' : 'Hotels')}
                                    </span>
                                </div>
                                <div className="p-4 flex justify-between items-center bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${sb.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {sb.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSeasonBannerModal({ open: true, banner: sb })} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title={t.edit}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteSeasonBanner(sb.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t.delete || 'حذف'}>
                                            <Trash2 size={16} />
                                        </button>
                                        <div onClick={() => handleToggleSeasonBanner(sb.id, sb.is_active)} className={`w-12 h-7 rounded-full ${sb.is_active ? 'bg-emerald-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                                            <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow ${sb.is_active ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-400">
                        {lang === 'ar' ? 'لا يوجد بانر موسمي' : 'No Season Banner Found'}
                    </div>
                )}
            </div>

            {/* Promo Banners Management */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900">{lang === 'ar' ? 'بانرات العروض' : 'Promo Banners'}</h3>
                        <p className="text-xs text-gray-500">{lang === 'ar' ? 'يُعرض واحد فقط كـ Slider' : 'One displayed as slider'}</p>
                    </div>
                    <button onClick={() => setBannerModal({ open: true, type: 'promo', banner: null })}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                        <Plus size={16} />{t.addBanner}
                    </button>
                </div>
                <div className="space-y-3">
                    {promoBanners.length > 0 ? promoBanners.map(b => (
                        <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border ${b.is_active ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${b.is_active ? 'bg-blue-600' : 'bg-gray-400'} flex items-center justify-center text-white`}>
                                    <Megaphone size={18} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{getText(b.title)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setBannerModal({ open: true, type: 'promo', banner: b })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t.edit}>
                                    <Edit size={16} />
                                </button>
                                <div onClick={() => handleToggle(b.id, b.is_active)} className={`w-10 h-6 rounded-full ${b.is_active ? 'bg-blue-600' : 'bg-gray-300'} relative cursor-pointer transition-colors`}>
                                    <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all shadow ${b.is_active ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}`}></div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-4 text-gray-400">{lang === 'ar' ? 'لا توجد بانرات' : 'No promo banners'}</div>
                    )}
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">{lang === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</h3>
                    <button onClick={handleSaveSettings} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Save size={16} />{t.save}</button>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'ar' ? 'رابط دفع خارجي مخصص (اختياري)' : 'Custom Direct Payment Link'}</label>
                    <input type="text" value={chargilyLink} onChange={e => setChargilyLink(e.target.value)} placeholder={lang === 'ar' ? 'أدخل رابط الدفع المباشر هنا...' : 'Enter direct payment link...'} className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500" />
                    <p className="text-xs text-gray-500 mt-1">{lang === 'ar' ? 'يُستخدم فقط إذا كنت تريد تخطي الدفع المدمج بالكامل وتحويل المستخدمين لصفحة خارجية.' : 'Used only to bypass the built-in checkout.'}</p>
                </div>
                
                <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{lang === 'ar' ? 'تفعيل الدفع المباشر (Live Mode)' : 'Enable Live Payment Mode'}</span>
                        <span className="text-xs text-gray-500">{lang === 'ar' ? 'عند التفعيل، سيتم استخدام مفتاح Live وإرسال الأموال لحسابك. عند التعطيل، يستخدم وضع الاختبار.' : 'When enabled, live keys are used. Otherwise, test mode is used.'}</span>
                    </div>
                    <button 
                        onClick={() => setChargilyLiveMode(!chargilyLiveMode)} 
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chargilyLiveMode ? 'bg-emerald-600' : 'bg-gray-300'}`}
                        dir="ltr"
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chargilyLiveMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-bold text-gray-900 mb-3">{lang === 'ar' ? 'روابط الفوتر' : 'Footer Links'}</h4>
                <div className="space-y-3">
                    {footerLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <input type="text" placeholder={lang === 'ar' ? 'العنوان' : 'Title'} value={link.title} onChange={e => { const newL = [...footerLinks]; newL[idx].title = e.target.value; setFooterLinks(newL); }} className="flex-1 border border-gray-200 rounded-lg p-2" />
                            <div className="flex-1 flex gap-2">
                                <input type="text" placeholder={lang === 'ar' ? 'الرابط (http://... أو #page=slug)' : 'URL (or #page=slug)'} value={link.url} onChange={e => { const newL = [...footerLinks]; newL[idx].url = e.target.value; setFooterLinks(newL); }} className="flex-1 border border-gray-200 rounded-lg p-2" />
                                <select value={link.url.startsWith('#page=') ? link.url : ''} onChange={e => { if(e.target.value) { const newL = [...footerLinks]; newL[idx].url = e.target.value; setFooterLinks(newL); } }} className="border border-gray-200 rounded-lg p-2 text-sm text-gray-600 bg-white min-w-[120px]">
                                    <option value="" disabled>{lang === 'ar' ? 'اختر صفحة...' : 'Select Page...'}</option>
                                    {customPages.map(p => <option key={p.id} value={`#page=${p.slug}`}>{p.title}</option>)}
                                </select>
                            </div>
                            <button onClick={() => { const newL = footerLinks.filter((_, i) => i !== idx); setFooterLinks(newL); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-end md:self-auto"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    <button onClick={() => setFooterLinks([...footerLinks, {title: '', url: ''}])} className="text-emerald-600 font-bold text-sm">+ {lang === 'ar' ? 'إضافة رابط' : 'Add Link'}</button>
                </div>
            </div>
        </div>

            {/* Notifications (Kept Static) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">{t.notifications}</h3>
                    <button onClick={() => setNotifModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold"><Send size={16} />{t.sendNotif}</button>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="text-sm text-purple-800">{lang === 'ar' ? 'آخر إشعار: \"عروض رمضان المبارك متاحة الآن!\"' : 'Last notification: \"Ramadan offers are now available!\"'}</div>
                    <div className="text-xs text-purple-600 mt-1">{lang === 'ar' ? 'تم إرسالها إلى 12,450 مستخدم' : 'Sent to 12,450 users'}</div>
                </div>
            </div>

            {/* Notification Modal */}
            <AdminModal isOpen={notifModal} onClose={() => setNotifModal(false)} title={t.sendNotif}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'المستهدفون' : 'Target Audience'}</label>
                        <select
                            value={broadcastData.audience}
                            onChange={e => setBroadcastData(prev => ({ ...prev, audience: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                        >
                            <option value="pilgrims">{lang === 'ar' ? 'المعتمرون' : 'Pilgrims'}</option>
                            <option value="hotels">{lang === 'ar' ? 'الفنادق' : 'Hotels'}</option>
                            <option value="all">{lang === 'ar' ? 'الجميع' : 'All Users'}</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder={lang === 'ar' ? 'عنوان الإشعار' : 'Notification Title'}
                        value={broadcastData.title}
                        onChange={e => setBroadcastData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                    />

                    <textarea
                        placeholder={lang === 'ar' ? 'محتوى الإشعار...' : 'Notification content...'}
                        value={broadcastData.body}
                        onChange={e => setBroadcastData(prev => ({ ...prev, body: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-3 h-24 bg-gray-50"
                    />

                    <input
                        type="text"
                        placeholder={lang === 'ar' ? 'رابط التوجيه (اختياري)' : 'Target URL (Optional)'}
                        value={broadcastData.url}
                        onChange={e => setBroadcastData(prev => ({ ...prev, url: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-left"
                        dir="ltr"
                    />

                    <button
                        onClick={handleSendBroadcast}
                        disabled={sendingBroadcast}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold disabled:opacity-50 mt-4 flex justify-center items-center"
                    >
                        {sendingBroadcast ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : t.sendNotif}
                    </button>
                </div>
            </AdminModal>

            {/* Season Banner Modal */}
            <AdminModal isOpen={seasonBannerModal.open} onClose={() => setSeasonBannerModal({ open: false, banner: null })} title={lang === 'ar' ? 'إضافة بانر موسمي' : 'Add Season Banner'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'العنوان' : 'Title'}</label>
                        <input type="text"
                            value={seasonBannerModal.banner?.title || ''}
                            onChange={e => setSeasonBannerModal({ ...seasonBannerModal, banner: { ...seasonBannerModal.banner, title: e.target.value } })}
                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                        <textarea
                            value={seasonBannerModal.banner?.description || ''}
                            onChange={e => setSeasonBannerModal({ ...seasonBannerModal, banner: { ...seasonBannerModal.banner, description: e.target.value } })}
                            className="w-full border border-gray-200 rounded-xl p-3 h-20 bg-gray-50"></textarea>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'رابط الزر (اختياري)' : 'Link URL (Optional)'}</label>
                        <input type="text"
                            value={seasonBannerModal.banner?.link_url || ''}
                            onChange={e => setSeasonBannerModal({ ...seasonBannerModal, banner: { ...seasonBannerModal.banner, link_url: e.target.value } })}
                            placeholder="https://test.com/offer"
                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-left" dir="ltr" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'الفئة المستهدفة' : 'Target Role'}</label>
                        <select
                            value={seasonBannerModal.banner?.target_role || 'all'}
                            onChange={e => setSeasonBannerModal({ ...seasonBannerModal, banner: { ...seasonBannerModal.banner, target_role: e.target.value } })}
                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                        >
                            <option value="all">{lang === 'ar' ? 'كل المستخدمين' : 'All Users'}</option>
                            <option value="pilgrim">{lang === 'ar' ? 'المعتمرون' : 'Pilgrims'}</option>
                            <option value="hotel">{lang === 'ar' ? 'الفنادق' : 'Hotels'}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'الصورة (أدخل رابط أو إختر ملف)' : 'Image (URL or Upload)'}</label>
                        <div className="flex gap-2">
                            <input type="text"
                                value={seasonBannerModal.banner?.image_url || ''}
                                onChange={e => setSeasonBannerModal({ ...seasonBannerModal, banner: { ...seasonBannerModal.banner, image_url: e.target.value } })}
                                placeholder="https://..."
                                className="flex-1 border border-gray-200 rounded-xl p-3 bg-gray-50 text-xs text-left" dir="ltr" />

                            <label className={`flex items-center justify-center px-4 rounded-xl cursor-pointer ${uploadingBanner ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} font-bold text-sm transition-colors border border-transparent`}>
                                {uploadingBanner ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع صورة' : 'Upload')}
                                <input type="file" accept="image/*" onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                        setUploadingBanner(true);
                                        const url = await commonService.uploadBannerImage(file);
                                        setSeasonBannerModal(prev => ({ ...prev, banner: { ...prev.banner, image_url: url } }));
                                    } catch (error) {
                                        console.error(error);
                                        toast.error(lang === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
                                    } finally {
                                        setUploadingBanner(false);
                                    }
                                }} disabled={uploadingBanner} className="hidden" />
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setSeasonBannerModal({ open: false, banner: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">{t.cancel}</button>
                        <button onClick={handleSaveSeasonBanner} className="flex-1 py-3 bg-emerald-800 text-white rounded-xl font-bold">{t.save}</button>
                    </div>
                </div>
            </AdminModal>

            {/* Banner Modal */}
            <AdminModal isOpen={bannerModal.open} onClose={() => setBannerModal({ open: false, type: '', banner: null })} title={t.addBanner}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'العنوان' : 'Title'}</label>
                        <input type="text"
                            value={bannerModal.banner?.title || ''}
                            onChange={e => setBannerModal({ ...bannerModal, banner: { ...bannerModal.banner, title: e.target.value } })}
                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                        <textarea
                            value={bannerModal.banner?.subtitle || ''}
                            onChange={e => setBannerModal({ ...bannerModal, banner: { ...bannerModal.banner, subtitle: e.target.value } })}
                            className="w-full border border-gray-200 rounded-xl p-3 h-20 bg-gray-50"></textarea>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'رابط الزر (اختياري)' : 'Button Link (Optional)'}</label>
                        <input type="text"
                            value={bannerModal.banner?.action_url || ''}
                            onChange={e => setBannerModal({ ...bannerModal, banner: { ...bannerModal.banner, action_url: e.target.value } })}
                            placeholder="https://test.com/offer"
                            className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'الصورة (أدخل رابط أو إختر ملف)' : 'Image (URL or Upload)'}</label>
                        <div className="flex gap-2">
                            <input type="text"
                                value={bannerModal.banner?.image_url || ''}
                                onChange={e => setBannerModal({ ...bannerModal, banner: { ...bannerModal.banner, image_url: e.target.value } })}
                                placeholder="https://..."
                                className="flex-1 border border-gray-200 rounded-xl p-3 bg-gray-50 text-xs" />

                            <label className={`flex items-center justify-center px-4 rounded-xl cursor-pointer ${uploadingBanner ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} font-bold text-sm transition-colors border border-transparent`}>
                                {uploadingBanner ? (lang === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (lang === 'ar' ? 'رفع صورة' : 'Upload')}
                                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploadingBanner} className="hidden" />
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setBannerModal({ open: false, type: '', banner: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">{t.cancel}</button>
                        <button onClick={handleSaveBanner} className="flex-1 py-3 bg-emerald-800 text-white rounded-xl font-bold">{t.save}</button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
};

// Insights Section (Explicit SQL Endpoints)
const InsightsSection = ({ t, lang }) => {
    const [period, setPeriod] = useState('30d');
    const [topHotels, setTopHotels] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInsights = async () => {
            setLoading(true);
            try {
                const { startDate, endDate } = getDateRange(period);
                const [top, monthly] = await Promise.all([
                    adminService.getTopPerformers(startDate, endDate),
                    adminService.getMonthlyRevenueGraph() // Global months
                ]);
                setTopHotels(top || []);
                setMonthlyRevenue(monthly || []);
            } catch (error) {
                console.error('Failed to load insights:', error);
            } finally {
                setLoading(false);
            }
        };
        loadInsights();
    }, [period]);

    if (loading) return <div className="p-10 text-center flex justify-center"><div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>;

    const maxRevenue = Math.max(...topHotels.map(h => h.revenue), 1);
    const maxMonthly = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <TrendingUp className="text-emerald-600" size={24} />
                    {lang === 'ar' ? 'التحليلات والمؤشرات البيانية' : 'Analytics & Insights'}
                </h2>
                <TimeFilter value={period} onChange={setPeriod} lang={lang} t={t} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Performing Hotels */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BadgeCheck size={20} className="text-emerald-600" />
                        {lang === 'ar' ? 'أفضل 10 فنادق أداءً' : 'Top 10 Performing Hotels'}
                    </h3>
                    <div className="space-y-4">
                        {topHotels.length > 0 ? topHotels.map((hotel, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-600'}`}>{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-bold text-gray-900 truncate pr-2 max-w-[200px]">{hotel.hotel_name}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-emerald-700">{(hotel.revenue || 0).toLocaleString()}</span>
                                            <span className="text-xs text-gray-500 ml-1">{t.currency}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(hotel.revenue / maxRevenue) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl">{lang === 'ar' ? 'لا يوجد بيانات لهذه الفترة' : 'No data available'}</div>
                        )}
                    </div>
                </div>

                {/* Monthly Platform Revenue Curve */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        {lang === 'ar' ? 'منحنى أرباح المنصة (شهرياً)' : 'Monthly Platform Revenue Curve'}
                    </h3>
                    <div className="flex-1 flex flex-col justify-end space-y-4">
                        {monthlyRevenue.length > 0 ? monthlyRevenue.map((m, i) => {
                            const date = new Date(m.month);
                            const monthName = date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' });
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-bold text-gray-600">{monthName}</span>
                                        <span className="font-black text-blue-700">{(m.revenue || 0).toLocaleString()} <span className="text-xs text-gray-400 font-normal">{t.currency}</span></span>
                                    </div>
                                    <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <div className={`h-full rounded-full bg-blue-500 transition-all duration-500`} style={{ width: `${(m.revenue / maxMonthly) * 100}%` }}></div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl h-full flex items-center justify-center">{lang === 'ar' ? 'المنحنى البياني فارغ' : 'Graph empty'}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Admin Panel
export default function AdminPanel({ lang, setLang, setRole, onLogout, onPageClick, selectedPageSlug }) {
    const [activeSection, setActiveSection] = useState(window.location.hash.replace('#', '') || 'dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        window.location.hash = activeSection;
    }, [activeSection]);
    const t = ADMIN_T[lang];

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard': return <DashboardSection t={t} lang={lang} />;
            case 'offers': return <OffersSection t={t} lang={lang} />;
            case 'partners': return <PartnersSection t={t} lang={lang} />;
            case 'finance': return <FinanceSection t={t} lang={lang} />;
            case 'marketing': return <MarketingSection t={t} lang={lang} />;
            case 'insights': return <InsightsSection t={t} lang={lang} />;
            case 'pages': return <AdminPagesSection t={t} lang={lang} />;
            default: return <DashboardSection t={t} lang={lang} />;
        }
    };

    return (
        <div className={`min-h-screen bg-stone-50 font-[Tajawal]`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            
            <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} lang={lang} t={t} setRole={setRole} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`${lang === 'ar' ? 'md:mr-64' : 'md:ml-64'} min-h-screen transition-all duration-300`}>
                <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm md:shadow-none">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -mx-2 hover:bg-gray-100 rounded-xl md:hidden text-gray-700">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">{t[activeSection]}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBellAdmin />
                        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
                            <Globe size={18} />
                            {lang === 'ar' ? 'English' : 'العربية'}
                        </button>
                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold">A</div>
                    </div>
                </header>
                <main className="p-6 flex-1 w-full">
                    {selectedPageSlug ? (
                        <CustomPageViewer slug={selectedPageSlug} onBack={() => onPageClick(null)} lang={lang} onPageClick={onPageClick} hideFooter={true} />
                    ) : (
                        renderSection()
                    )}
                </main>
                <Footer lang={lang} onPageClick={(slug) => { onPageClick(slug); window.scrollTo(0,0); }} />
            </div>
        </div>
    );
}

