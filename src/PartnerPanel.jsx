import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, BedDouble, Tag, Briefcase, MessageCircle, Wallet, User,
    Globe, LogOut, Plus, Edit, Eye, TrendingUp, DollarSign, Clock,
    Check, X, Upload, FileText, Bell, AlertCircle, Calendar, CheckCircle,
    MapPin, Image, Trash2, Send, Wifi, Coffee, Wind, Tv, Bath, Car, Menu
} from 'lucide-react';
import { authService } from './services/authService';
import { hotelService } from './services/hotelService';
import { pilgrimService } from './services/pilgrimService'; // for chats if needed
import { commonService } from './services/commonService';
import { supabase } from './lib/supabase';
import { toast } from 'react-hot-toast';
import HotelFinancials from './components/HotelFinancials';

// ========== ACTION REQUIRED: ERROR BOUNDARY ==========
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    componentDidCatch(error, errorInfo) { console.error("Uncaught Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-red-800 mb-2">Something went wrong</h1>
                    <p className="text-red-600 mb-6 max-w-md">{this.state.error?.message || 'An unexpected error occurred.'}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-700 text-white rounded-xl font-bold hover:bg-red-800">
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ========== MOCK DATA (Legacy/Fallback) ==========
const ROOMS_DATA = [];

const OFFERS_DATA = [
    { id: 'OFF-01', roomId: 'RM-101', startDate: '2025-03-01', endDate: '2025-03-15', saleType: 'room', price: 800, discount: 950, availBeds: null, season: 'ramadan', status: 'approved' },
    { id: 'OFF-02', roomId: 'RM-102', startDate: '2025-03-10', endDate: '2025-03-20', saleType: 'bed', price: 150, discount: null, availBeds: 2, season: 'ramadan', status: 'pending' },
    { id: 'OFF-03', roomId: 'RM-103', startDate: '2025-06-01', endDate: '2025-06-15', saleType: 'bed', price: 180, discount: 200, availBeds: 3, season: 'hajj', status: 'approved' },
    { id: 'OFF-04', roomId: 'RM-104', startDate: '2025-04-01', endDate: '2025-04-10', saleType: 'bed', price: 120, discount: null, availBeds: 5, season: 'normal', status: 'pending' }
];

const PARTNER_MOCK = {
    // Kept for static structure fallback if needed, but primarily will use state
    stats: { bookings: 0, bedsLeft: 0, income: '0', occupancy: '0%' },
    alerts: [],
    bookings: [],
    chats: [],
    finance: { total: '0', fee: '0', net: '0', pending: '0' },
    withdrawals: []
};

// ========== TRANSLATIONS ==========
import LocationPicker from './components/LocationPicker';

const T = {
    ar: {
        overview: 'الرئيسية', rooms: 'الغرف', offers: 'العروض', bookings: 'الحجوزات',
        chat: 'التواصل', finance: 'المالية', profile: 'الملف والتوثيق',
        totalBookings: 'إجمالي الحجوزات', totalRevenue: 'إجمالي مبيعات الفندق', totalDeposits: 'العربون المستلم (عبر المنصة)',
        platformCommission: 'عمولة المنصة على العربون (10%)', hotelNetRevenue: 'الصافي النهائي للفندق',
        hotelBalance: 'رصيد الفندق داخل المنصة (90%)', remainingAmount: 'المتبقي (يدفعه المعتمر في الفندق)',
        commissionDue: 'عمولة المنصة (10% على المتبقي)',
        currentBookings: 'الحجوزات الحالية', bedsLeft: 'الأسرة المتبقية', expectedIncome: 'الدخل المتوقع',
        occupancyRate: 'نسبة الإشغال', alerts: 'التنبيهات', recentBookings: 'آخر الحجوزات',
        // Rooms
        roomsList: 'قائمة الغرف', addRoom: 'إضافة غرفة جديدة', editRoom: 'تعديل الغرفة',
        roomName: 'اسم/رقم الغرفة', roomType: 'نوع الغرفة', bedsCount: 'عدد الأسرة',
        acceptsBooking: 'تقبل حجز', fullRoomOnly: 'غرفة كاملة فقط', bedOnly: 'سرير فقط', both: 'كلاهما',
        roomImages: 'صور الغرفة', amenities: 'المرافق', createOfferForRoom: 'إنشاء عرض لهذه الغرفة',
        double: 'ثنائية', triple: 'ثلاثية', quad: 'رباعية', quint: 'خماسية',
        wifi: 'واي فاي', ac: 'تكييف', tv: 'تلفاز', bathroom: 'حمام خاص', minibar: 'ميني بار', parking: 'موقف سيارات',
        // Offers
        offersList: 'قائمة العروض', addOffer: 'إضافة عرض جديد', editOffer: 'تعديل العرض',
        selectRoom: 'اختر الغرفة', selectRoomFirst: 'يجب اختيار غرفة أولاً',
        startDate: 'تاريخ البداية', endDate: 'تاريخ النهاية', saleType: 'نوع البيع',
        fullRoom: 'غرفة كاملة', bed: 'سرير', price: 'السعر', availableBeds: 'الأسرة المتاحة',
        discount: 'السعر قبل الخصم', season: 'الموسم', normal: 'عادي', ramadan: 'رمضان', hajj: 'حج',
        linkedRoom: 'الغرفة المرتبطة', offerPeriod: 'فترة العرض',
        // Status
        status: 'الحالة', pending: 'قيد المراجعة', approved: 'مقبول', active: 'نشط',
        // Common
        actions: 'إجراءات', save: 'حفظ', cancel: 'إلغاء', currency: 'د.ج', images: 'صور',
        guestName: 'المعتمر', checkIn: 'الوصول', checkOut: 'المغادرة', amount: 'المبلغ',
        totalEarnings: 'إجمالي الدخل', platformFee: 'عمولة المنصة', netProfit: 'صافي المستحقات',
        pendingPayouts: 'بانتظار التحويل', withdraw: 'طلب سحب', withdrawHistory: 'سجل السحوبات',
        hotelName: 'اسم الفندق', city: 'المدينة', makkah: 'مكة المكرمة', madinah: 'المدينة المنورة',
        uploadDocs: 'رفع المستندات', commercialReg: 'السجل التجاري', taxId: 'الرقم الضريبي',
        hotelLicense: 'رخصة الفندق', confirmed: 'مؤكد', paid: 'تم التحويل', processing: 'قيد المعالجة',
        gold: 'موثق ذهبي', blue: 'موثق أزرق', none: 'غير موثق',
        typeMessage: 'اكتب رسالتك...', online: 'متصل', offline: 'غير متصل', backHome: 'العودة للرئيسية', confirm: 'تأكيد',
        seasonalPricing: 'التسعير الموسمي', addSeasonalPrice: 'إضافة موسم', defaultPrice: 'السعر الافتراضي', add: 'إضافة'
    },
    en: {
        overview: 'Overview', rooms: 'Rooms', offers: 'Offers', bookings: 'Bookings',
        chat: 'Chat', finance: 'Finance', profile: 'Profile',
        totalBookings: 'Total Bookings', totalRevenue: 'Total Hotel Sales', totalDeposits: 'Deposits Received (via Platform)',
        platformCommission: 'Platform Commission on Deposit (10%)', hotelNetRevenue: 'Hotel Net Revenue',
        hotelBalance: 'Hotel Balance in Platform (90%)', remainingAmount: 'Remaining (Pilgrim Pays at Hotel)',
        commissionDue: 'Platform Commission (10% on Remaining)',
        currentBookings: 'Current Bookings', bedsLeft: 'Beds Left', expectedIncome: 'Expected Income',
        occupancyRate: 'Occupancy Rate', alerts: 'Alerts', recentBookings: 'Recent Bookings',
        roomsList: 'Rooms List', addRoom: 'Add New Room', editRoom: 'Edit Room',
        roomName: 'Room Name/Number', roomType: 'Room Type', bedsCount: 'Beds Count',
        acceptsBooking: 'Accepts Booking', fullRoomOnly: 'Full Room Only', bedOnly: 'Bed Only', both: 'Both',
        roomImages: 'Room Images', amenities: 'Amenities', createOfferForRoom: 'Create Offer for This Room',
        double: 'Double', triple: 'Triple', quad: 'Quad', quint: 'Quint',
        wifi: 'WiFi', ac: 'AC', tv: 'TV', bathroom: 'Private Bathroom', minibar: 'Minibar', parking: 'Parking',
        offersList: 'Offers List', addOffer: 'Add New Offer', editOffer: 'Edit Offer',
        selectRoom: 'Select Room', selectRoomFirst: 'You must select a room first',
        startDate: 'Start Date', endDate: 'End Date', saleType: 'Sale Type',
        fullRoom: 'Full Room', bed: 'Bed', price: 'Price', availableBeds: 'Available Beds',
        discount: 'Original Price', season: 'Season', normal: 'Normal', ramadan: 'Ramadan', hajj: 'Hajj',
        linkedRoom: 'Linked Room', offerPeriod: 'Offer Period',
        status: 'Status', pending: 'Pending', approved: 'Approved', active: 'Active',
        actions: 'Actions', save: 'Save', cancel: 'Cancel', currency: 'DZD', images: 'Images',
        guestName: 'Guest', checkIn: 'Check-in', checkOut: 'Check-out', amount: 'Amount',
        totalEarnings: 'Total Earnings', platformFee: 'Platform Fee', netProfit: 'Net Profit',
        pendingPayouts: 'Pending Payout', withdraw: 'Request Withdrawal', withdrawHistory: 'Withdrawal History',
        hotelName: 'Hotel Name', city: 'City', makkah: 'Makkah', madinah: 'Madinah',
        uploadDocs: 'Upload Documents', commercialReg: 'Commercial Reg', taxId: 'Tax ID',
        hotelLicense: 'Hotel License', confirmed: 'Confirmed', paid: 'Paid', processing: 'Processing',
        gold: 'Gold Verified', blue: 'Blue Verified', none: 'Unverified',
        typeMessage: 'Type a message...', online: 'Online', offline: 'Offline', backHome: 'Back Home', confirm: 'Confirm',
        seasonalPricing: 'Seasonal Pricing', addSeasonalPrice: 'Add Season', defaultPrice: 'Default Price', add: 'Add'
    }
};

// ========== COMPONENTS ==========
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-white w-full ${sizes[size]} rounded-2xl shadow-2xl overflow-hidden`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const Badge = ({ status, t }) => {
    const styles = {
        active: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700',
        confirmed: 'bg-green-50 text-green-700', paid: 'bg-blue-50 text-blue-700', processing: 'bg-amber-50 text-amber-700',
        gold: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700', none: 'bg-gray-100 text-gray-600',
        ramadan: 'bg-purple-50 text-purple-700', hajj: 'bg-rose-50 text-rose-700', normal: 'bg-gray-100 text-gray-600'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>{t[status] || status}</span>;
};

const AmenityIcon = ({ type }) => {
    const icons = { wifi: Wifi, ac: Wind, tv: Tv, bathroom: Bath, minibar: Coffee, parking: Car };
    const Icon = icons[type] || Wifi;
    return <Icon size={14} />;
};

const Sidebar = ({ active, setActive, lang, t, setRole, isOpen, onClose, onLogout }) => {
    const menu = [
        { id: 'overview', icon: LayoutDashboard }, { id: 'rooms', icon: BedDouble }, { id: 'offers', icon: Tag },
        { id: 'bookings', icon: Briefcase }, { id: 'finance', icon: Wallet }, { id: 'profile', icon: User }
    ];

    // Calculate CSS transform based on lang and open state
    const transformClass = isOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full');

    return (
        <aside className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-64 bg-white border-${lang === 'ar' ? 'l' : 'r'} border-gray-100 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${transformClass} shadow-2xl md:shadow-none`}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRole('pilgrim')}>
                    <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">{lang === 'ar' ? 'ت' : 'T'}</div>
                    <div>
                        <span className="text-lg font-bold text-emerald-900">{lang === 'ar' ? 'تلبية' : 'Talbia'}</span>
                        <span className="text-amber-600 font-bold">{lang === 'ar' ? 'تسكين' : 'Taskin'}</span>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">Hotel Panel</div>
                    </div>
                </div>
                {/* Close Button for Mobile */}
                <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menu.map(m => (
                    <button key={m.id} onClick={() => { setActive(m.id); if (onClose) onClose(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active === m.id ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <m.icon size={20} />{t[m.id]}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
                <button onClick={() => setRole('pilgrim')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 mb-2">
                    <Globe size={20} />{t.backHome}
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
                }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={20} className="text-red-600" />{t.logout || (lang === 'ar' ? 'تسجيل الخروج' : 'Logout')}
                </button>
            </div>
        </aside>
    );
};

// ========== ROOMS SECTION ==========
const RoomsSection = ({ t, lang, onCreateOffer, roomsList = [] }) => {
    const [modal, setModal] = useState({ open: false, room: null });
    const [pricingRoom, setPricingRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Safety check
    const safeRooms = Array.isArray(roomsList) ? roomsList : [];

    useEffect(() => {
        if (modal.room) setFormData(modal.room);
        else setFormData({ name: '', type: 'double', beds: 2, amenities: [] });
        setSelectedFiles([]);
    }, [modal.room]);

    const saveRoom = async () => {
        setLoading(true);
        try {
            const session = await authService.getCurrentSession();
            const h = await hotelService.getMyHotel(session.user.id);
            if (!h) return;

            // Handle Image Uploads
            const newImageUrls = [];
            for (const file of selectedFiles) {
                const url = await hotelService.uploadRoomImage(file);
                newImageUrls.push(url);
            }

            // Combine with existing images
            const existingImages = Array.isArray(formData.images) ? formData.images : [];
            const finalImages = [...existingImages, ...newImageUrls].slice(0, 5); // Limit to 5

            // Sanitize payload for 'rooms' table (all schema fields from update.sql)
            const payload = {
                title: formData.title || formData.name || 'New Room',
                room_type: formData.room_type || formData.type || 'double',
                total_beds: parseInt(formData.total_beds || formData.beds || 2),
                capacity: parseInt(formData.capacity) || parseInt(formData.total_beds || formData.beds || 2),
                description: formData.description || null,
                bed_type: formData.bed_type || null,
                bathroom_type: formData.bathroom_type || null,
                has_view: formData.has_view || false,
                images: finalImages,
                amenities: formData.amenities || []
            };

            if (formData.id) {
                await hotelService.updateRoom(formData.id, payload);
            } else {
                await hotelService.createRoom({ ...payload, hotel_id: h.id });
            }
            toast.success(t.success ? t.success : "Room saved successfully.");
            // window.location.reload(); // Removed to prevent session flicker/logout
        } catch (e) {
            console.error("Save Room Error:", e);
            toast.error(`Error: ${e.message || "Unknown error occurred"}`);
        } finally {
            setLoading(false);
            setModal({ open: false, room: null });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">{t.roomsList}</h2>
                <button onClick={() => setModal({ open: true, room: null })} className="flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-xl text-sm font-bold">
                    <Plus size={16} />{t.addRoom}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeRooms.map(room => (
                    <div key={room.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{room.title || room.name}</h3>
                                <span className="text-sm text-gray-500">{lang === 'ar' ? room.room_type : room.room_type} • {room.total_beds} {lang === 'ar' ? 'أسرة' : 'beds'}</span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setModal({ open: true, room })} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100" title={t.edit || 'تعديل'}><Edit size={14} /></button>
                                <button onClick={() => setPricingRoom(room)} className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100" title={t.seasonalPricing}><Calendar size={14} /></button>
                                <button
                                    onClick={async () => {
                                        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الغرفة؟ سيتم حذف جميع العروض المرتبطة بها!' : 'Delete this room? All associated offers will be deleted!')) {
                                            try {
                                                await hotelService.deleteRoom(room.id);
                                                if (onRefresh) onRefresh();
                                            } catch (e) {
                                                toast.error('Error: ' + e.message);
                                            }
                                        }
                                    }}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                    title={t.delete || 'حذف'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {(room.amenities || []).map(a => (
                                <span key={a} className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs">
                                    <AmenityIcon type={a} />{t[a]}
                                </span>
                            ))}
                        </div>

                        <button onClick={() => onCreateOffer(room)} className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                            <Tag size={16} />{t.createOfferForRoom}
                        </button>
                    </div>
                ))}
                {safeRooms.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">{t.noData || 'No Rooms Found'}</div>}
            </div>

            <Modal isOpen={modal.open} onClose={() => setModal({ open: false, room: null })} title={modal.room ? t.editRoom : t.addRoom} size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{t.roomName}</label>
                        <input type="text" value={formData.title || formData.name || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder={lang === 'ar' ? 'مثال: غرفة 101' : 'Example: Room 101'} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-2 block">{t.roomType}</label>
                            <select value={formData.room_type || formData.type || 'double'} onChange={e => setFormData({ ...formData, room_type: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50">
                                <option value="double">{t.double}</option>
                                <option value="triple">{t.triple}</option>
                                <option value="quad">{t.quad}</option>
                                <option value="quint">{t.quint}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-2 block">{t.bedsCount}</label>
                            <input type="number" value={formData.total_beds || formData.beds || 2} onChange={e => setFormData({ ...formData, total_beds: parseInt(e.target.value) })} min="1" max="10" className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{t.images} (Max 5)</label>
                        {(() => {
                            const displayItems = [
                                ...(Array.isArray(formData.images) ? formData.images : []).map((img, i) => ({ type: 'exist', data: img, index: i })),
                                ...selectedFiles.map((f, i) => ({ type: 'new', data: f, index: i }))
                            ];
                            return (
                                <div className="grid grid-cols-4 gap-2">
                                    {displayItems.map((item, i) => (
                                        <div key={i} className={`relative rounded-lg overflow-hidden border border-gray-200 ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'col-span-1 aspect-square'}`}>
                                            <img src={item.type === 'exist' ? item.data : URL.createObjectURL(item.data)} className="w-full h-full object-cover" alt="" />
                                            <button onClick={() => {
                                                if (item.type === 'exist') setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== item.index) });
                                                else setSelectedFiles(selectedFiles.filter((_, idx) => idx !== item.index));
                                            }} className="absolute top-1 right-1 bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-white transition-colors shadow-sm"><Trash2 size={12} /></button>
                                            {i === 0 && <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Main</div>}
                                        </div>
                                    ))}
                                    {displayItems.length < 5 && (
                                        <label className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-colors text-gray-400 hover:text-emerald-600 ${displayItems.length === 0 ? 'col-span-2 row-span-2 aspect-square' : 'col-span-1 aspect-square'}`}>
                                            <Upload size={20} />
                                            <span className="text-[10px] font-bold mt-1">{t.upload || 'Add'}</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={e => {
                                                if (e.target.files) {
                                                    const files = Array.from(e.target.files);
                                                    const remaining = 5 - displayItems.length;
                                                    setSelectedFiles([...selectedFiles, ...files.slice(0, remaining)]);
                                                }
                                            }} />
                                        </label>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setModal({ open: false, room: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">{t.cancel}</button>
                        <button onClick={saveRoom} disabled={loading} className="flex-1 py-3 bg-emerald-800 text-white rounded-xl font-bold">{loading ? t.loading : t.save}</button>
                    </div>
                </div>
            </Modal>

            {pricingRoom && <PricingManager t={t} lang={lang} room={pricingRoom} onClose={() => setPricingRoom(null)} />}
        </div>
    );
};

const PricingManager = ({ t, lang, room, onClose }) => {
    const [prices, setPrices] = useState([]);
    const [newPrice, setNewPrice] = useState({ start_date: '', end_date: '', price: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!room) return;
        const load = async () => {
            try {
                const data = await hotelService.getRoomPrices(room.id);
                setPrices(data || []);
            } catch (e) { console.error(e); }
        };
        load();
    }, [room]);

    const handleAdd = async () => {
        if (!newPrice.start_date || !newPrice.end_date || !newPrice.price) return;
        setLoading(true);
        try {
            const added = await hotelService.addSeasonalPrice({ ...newPrice, room_id: room.id });
            setPrices([...prices, ...added]);
            setNewPrice({ start_date: '', end_date: '', price: '' });
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{t.seasonalPricing} - {room.title}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                    <h4 className="font-bold text-sm mb-2">{t.addSeasonalPrice}</h4>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <input type="date" value={newPrice.start_date} onChange={e => setNewPrice({ ...newPrice, start_date: e.target.value })} className="border rounded-lg p-2 text-xs" />
                        <input type="date" value={newPrice.end_date} onChange={e => setNewPrice({ ...newPrice, end_date: e.target.value })} className="border rounded-lg p-2 text-xs" />
                        <input type="number" placeholder={t.price} value={newPrice.price} onChange={e => setNewPrice({ ...newPrice, price: e.target.value })} className="border rounded-lg p-2 text-xs" />
                    </div>
                    <button onClick={handleAdd} disabled={loading} className="w-full bg-emerald-800 text-white rounded-lg py-2 font-bold text-sm">{loading ? t.loading : t.add}</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {prices.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                            <span className="text-xs text-gray-500">{p.start_date} → {p.end_date}</span>
                            <span className="font-bold text-emerald-800 text-sm">{p.price} {t.currency}</span>
                        </div>
                    ))}
                    {prices.length === 0 && <div className="text-center text-gray-400 text-xs py-2">{t.noData}</div>}
                </div>
            </div>
        </div>
    );
};

// ========== OFFERS SECTION ==========
const OffersSection = ({ t, lang, preselectedRoom, offersList = [], roomsList = [], onRefresh }) => {
    const [modal, setModal] = useState({ open: !!preselectedRoom, selectedRoom: preselectedRoom?.id || '' });
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    // Safety
    const safeOffers = Array.isArray(offersList) ? offersList : [];
    const safeRooms = Array.isArray(roomsList) ? roomsList : [];

    useEffect(() => {
        if (modal.open && modal.selectedRoom) {
            setFormData(prev => ({ ...prev, room_id: modal.selectedRoom }));
        }
    }, [modal]);

    const handleSaveOffer = async () => {
        setLoading(true);
        try {
            if (!formData.room_id && !modal.selectedRoom) {
                toast.error(lang === 'ar' ? 'يرجى اختيار غرفة' : 'Please select a room');
                setLoading(false);
                return;
            }
            // Validation: Price is required only for Fixed Price mode
            // Validation: Price is required only for Fixed Price mode
            let finalPrice = parseFloat(formData.price_per_night);
            let finalDiscount = formData.discount_price ? parseFloat(formData.discount_price) : null;

            if (formData.is_fixed_price) {
                if (!formData.price_per_night) {
                    toast.error(lang === 'ar' ? 'يرجى إدخال السعر' : 'Please enter price');
                    setLoading(false);
                    return;
                }
            } else {
                // Seasonal Mode: Verify if room has pricing
                const roomId = modal.selectedRoom || formData.room_id;
                try {
                    const roomPrices = await hotelService.getRoomPrices(roomId);
                    if (!roomPrices || roomPrices.length === 0) {
                        toast.error(lang === 'ar'
                            ? 'خطأ: هذه الغرفة لا تحتوي على أسعار موسمية! يرجى إضافة الأسعار في قسم "الغرف" أولاً.'
                            : 'Error: This room has no seasonal prices! Please add prices in the "Rooms" section first.');
                        setLoading(false);
                        return;
                    }
                    // Use the lowest current/future seasonal price
                    const today = new Date().toISOString().split('T')[0];
                    const validPrices = roomPrices
                        .filter(p => p.end_date >= today)
                        .map(p => parseFloat(p.price));

                    if (validPrices.length > 0) {
                        finalPrice = Math.min(...validPrices);
                    } else {
                        // Fallback if all prices are in the past? Alert user
                        toast.error(lang === 'ar'
                            ? 'تنبيه: جميع الأسعار الموسمية لهذه الغرفة منتهية الصلاحية. يرجى إضافة أسعار جديدة.'
                            : 'Warning: All seasonal prices for this room are expired. Please add new prices.');
                        setLoading(false);
                        return;
                    }
                    finalDiscount = null;
                } catch (err) {
                    console.error("Price fetch err", err);
                }
            }

            // Validate: if original price provided, it MUST be higher than sale price
            if (formData.is_fixed_price && finalDiscount && finalPrice >= finalDiscount) {
                toast.error(lang === 'ar'
                    ? 'خطأ: السعر يجب أن يكون أقل من السعر قبل الخصم'
                    : 'Error: Sale price must be less than original price');
                setLoading(false);
                return;
            }

            // Payload Construction
            const payload = {
                room_id: modal.selectedRoom || formData.room_id,
                title: formData.title || null,
                price_per_night: finalDiscount || finalPrice,
                discount_price: (formData.is_fixed_price && finalDiscount) ? finalPrice : null,
                available_from: formData.available_from || null,
                available_to: formData.available_to || null,
                is_fixed_price: formData.is_fixed_price || false
            };

            if (modal.editMode && modal.editId) {
                // Update existing offer
                await hotelService.updateOffer(modal.editId, payload);
                toast.success(lang === 'ar' ? 'تم تحديث العرض بنجاح' : 'Offer updated successfully');
            } else {
                // Create new offer
                payload.status = 'pending';
                await hotelService.createOffer(payload);
                toast.success(lang === 'ar' ? 'تم إنشاء العرض بنجاح - بانتظار موافقة الإدارة' : 'Offer created - awaiting admin approval');
            }
            if (onRefresh) onRefresh();
        } catch (e) {
            console.error("Save Offer Error:", e);
            toast.error(`Error: ${e.message || "Check console for details"}`);
        } finally {
            setLoading(false);
            setModal({ open: false, selectedRoom: '', editMode: false, editId: null });
            setFormData({});
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">{t.offersList}</h2>
                <button onClick={() => setModal({ open: true, selectedRoom: '' })} className="flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-xl text-sm font-bold">
                    <Plus size={16} />{t.addOffer}
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-start">ID</th>
                                <th className="px-4 py-3 text-start">{t.linkedRoom}</th>
                                <th className="px-4 py-3 text-start">{t.offerPeriod}</th>
                                <th className="px-4 py-3 text-center">{t.price}</th>
                                <th className="px-4 py-3 text-center">{t.status}</th>
                                <th className="px-4 py-3 text-center">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {safeOffers.map(offer => {
                                const room = offer.room;
                                return (
                                    <tr key={offer.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500">{offer.id.slice(0, 8)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{offer.title || room?.title || room?.name}</div>
                                            <div className="text-xs text-gray-500">{room?.room_type} • {room?.title || room?.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1"><Calendar size={12} />{offer.available_from}</div>
                                            <div className="flex items-center gap-1 text-gray-400">→ {offer.available_to}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="font-bold text-gray-900">{offer.discount_price || offer.price_per_night} {t.currency}</div>
                                            {offer.discount_price && (
                                                <div className="text-xs text-gray-400 line-through">{offer.price_per_night}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center"><Badge status={offer.status} t={t} /></td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex gap-1 justify-center">
                                                <button
                                                    onClick={() => {
                                                        setFormData({
                                                            ...offer,
                                                            price_per_night: offer.discount_price || offer.price_per_night,
                                                            discount_price: offer.discount_price ? offer.price_per_night : null
                                                        });
                                                        setModal({ open: true, selectedRoom: offer.room_id, editMode: true, editId: offer.id });
                                                    }}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                                    title={t.edit || 'Edit'}
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this offer?')) {
                                                            try {
                                                                await hotelService.deleteOffer(offer.id);
                                                                if (onRefresh) onRefresh();
                                                            } catch (e) {
                                                                toast.error('Error: ' + e.message);
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                    title={t.delete || 'Delete'}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {safeOffers.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-gray-400">{t.noData || 'No Offers'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modal.open} onClose={() => { setModal({ open: false, selectedRoom: '', editMode: false, editId: null }); setFormData({}); }} title={modal.editMode ? (t.editOffer || 'تعديل العرض') : t.addOffer} size="lg">
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <label className="text-xs font-bold text-amber-800 mb-2 block">{t.selectRoom} *</label>
                        <select value={modal.selectedRoom} onChange={(e) => setModal({ ...modal, selectedRoom: e.target.value })}
                            className="w-full border border-amber-200 rounded-xl p-3 bg-white font-medium"
                            disabled={modal.editMode}>
                            <option value="">{t.selectRoomFirst}</option>
                            {safeRooms.map(room => (
                                <option key={room.id} value={room.id}>{room.title || room.name} ({room.total_beds})</option>
                            ))}
                        </select>
                    </div>

                    {modal.selectedRoom && (
                        <>
                            {/* Offer Title */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'اسم العرض' : 'Offer Title'}</label>
                                <input
                                    type="text"
                                    value={formData.title || ''}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={lang === 'ar' ? 'مثال: عرض رمضان المميز' : 'Example: Ramadan Special'}
                                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-2 block">{t.startDate}</label>
                                    <input type="date" value={formData.available_from || ''} onChange={e => setFormData({ ...formData, available_from: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-2 block">{t.endDate}</label>
                                    <input type="date" value={formData.available_to || ''} onChange={e => setFormData({ ...formData, available_to: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                                </div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                                <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'نظام التسعير' : 'Pricing Mode'}</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFormData({ ...formData, is_fixed_price: false })}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border ${!formData.is_fixed_price ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        {lang === 'ar' ? 'تسعير موسمي (من الغرفة)' : 'Seasonal (From Room)'}
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_fixed_price: true })}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all border ${formData.is_fixed_price ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        {lang === 'ar' ? 'سعر ثابت' : 'Fixed Price'}
                                    </button>
                                </div>
                                {!formData.is_fixed_price && (
                                    <div className="mt-2 text-xs text-emerald-600 bg-emerald-50/50 p-2 rounded">
                                        {lang === 'ar' ? 'سيتم استخدام الأسعار الموسمية المحددة للغرفة تلقائياً.' : 'Seasonal prices defined for the room will be applied automatically.'}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {formData.is_fixed_price && (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-2 block">{t.price} ({t.currency})</label>
                                            <input type="number" value={formData.price_per_night || ''} onChange={e => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-2 block">{t.discount} ({lang === 'ar' ? 'اختياري' : 'optional'})</label>
                                            <input type="number" value={formData.discount_price || ''} onChange={e => setFormData({ ...formData, discount_price: parseFloat(e.target.value) })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setModal({ open: false, selectedRoom: '' })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">{t.cancel}</button>
                        <button onClick={handleSaveOffer}
                            disabled={!modal.selectedRoom || loading}
                            className={`flex-1 py-3 rounded-xl font-bold ${modal.selectedRoom ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                            {loading ? t.loading : t.save}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// ========== OTHER SECTIONS (Simplified) ==========
const Overview = ({ t, lang, stats, alerts, recentBookings, hotel, onDeleteAlert }) => (
    <div className="space-y-6">
        {/* Financial Analytics – Realtime via HotelFinancials */}
        <HotelFinancials hotelId={hotel?.id} lang={lang} currency={t.currency} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Bell size={18} className="text-amber-500" />{t.alerts}</h3>
                <div className="space-y-3">
                    {alerts && alerts.length > 0 ? alerts.map(a => (
                        <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl group ${a.type === 'warning' ? 'bg-amber-50' : a.type === 'success' ? 'bg-green-50' : 'bg-blue-50'}`}>
                            <AlertCircle size={18} className={a.type === 'warning' ? 'text-amber-600' : a.type === 'success' ? 'text-green-600' : 'text-blue-600'} />
                            <span className="text-sm font-medium text-gray-700 flex-1">{a.msg}</span>
                            {onDeleteAlert && (
                                <button
                                    onClick={() => onDeleteAlert(a.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50/80 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    )) : <div className="text-center text-gray-400 py-4">{t.noData}</div>}
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">{t.recentBookings}</h3>
                <div className="space-y-3">
                    {recentBookings && recentBookings.length > 0 ? recentBookings.slice(0, 3).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <img
                                    src={b.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.profile?.full_name || t.guestName)}&background=random`}
                                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                    alt=""
                                />
                                <div>
                                    <div className="font-medium text-gray-900">{b.profile?.full_name || t.guestName}</div>
                                    <div className="text-xs text-gray-500">{b.offer?.title || b.offer?.room?.title || 'عرض'} • {new Date(b.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <Badge status={b.status} t={t} />
                        </div>
                    )) : <div className="text-center text-gray-400 py-4">{t.noData}</div>}
                </div>
            </div>
        </div>
    </div>
);

                        <th className="px-4 py-3 text-start">{t.guestName}</th>
                        <th className="px-4 py-3 text-start">{lang === 'ar' ? 'العرض المرتبط' : 'Linked Offer'}</th>
                        <th className="px-4 py-3 text-center">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                        <th className="px-4 py-3 text-center">{lang === 'ar' ? 'الضيوف' : 'Guests'}</th>
                        <th className="px-4 py-3 text-center">{t.checkIn}</th>
                        <th className="px-4 py-3 text-center">{t.checkOut}</th>
                        <th className="px-4 py-3 text-center">{t.amount}</th>
                        <th className="px-4 py-3 text-center">{t.status}</th>
                        <th className="px-4 py-3 text-center">{t.actions}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {bookings && bookings.length > 0 ? bookings.map((b, i) => (
                        <tr key={b.id + '-' + i} className={`transition-colors ${b.status === 'paid' ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-3 text-sm font-mono text-gray-500">{b.id.slice(0, 8)}...</td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={b.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.profile?.full_name || t.guestName)}&background=random`}
                                        className="w-8 h-8 rounded-full object-cover bg-gray-200"
                                        alt=""
                                    />
                                    <div>
                                        <div>{b.profile?.full_name || t.guestName}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{b.offer?.title || b.offer?.room?.title}</td>
                            <td className="px-4 py-3 text-center text-sm">
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${b.booking_type === 'room' || b.booking_type === 'full' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {b.booking_type === 'room' || b.booking_type === 'full' ? (lang === 'ar' ? 'غرفة كاملة' : 'Full Room') : (lang === 'ar' ? 'سرير' : 'Bed')}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{b.guests || 1}</td>
                            <td className="px-4 py-3 text-center text-sm">{b.check_in}</td>
                            <td className="px-4 py-3 text-center text-sm">{b.check_out}</td>
                            <td className="px-4 py-3 text-center">
                                {(() => {
                                    const nights = Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)));
                                    const pricePerNight = b.offer?.discount_price || b.offer?.price_per_night || 0;
                                    const baseTotal = nights * Number(pricePerNight);

                                    let computedTotal = b.total_price; if(computedTotal == null) { computedTotal = baseTotal; if (b.booking_type === 'bed') { const guests = Math.max(1, b.guests || 1); computedTotal = Math.round(baseTotal / (b.offer?.room?.capacity || 4)) * guests; } }

                                    return (
                                        <>
                                            <div className="font-bold text-gray-900">{computedTotal} {t.currency}</div>
                                            {b.deposit_amount ? (
                                                <div className="text-xs text-emerald-600 font-bold mt-1">
                                                    {lang === 'ar' ? 'عربون:' : 'Deposit:'} {b.deposit_amount} {t.currency}
                                                </div>
                                            ) : null}
                                            {computedTotal && b.deposit_amount && (computedTotal - b.deposit_amount > 0) ? (
                                                <div className="text-xs text-orange-600 font-bold mt-1 flex flex-col items-center gap-0.5">
                                                    <div>{lang === 'ar' ? 'متبقي:' : 'Rem:'} {Math.round((computedTotal - b.deposit_amount) / exchangeRate).toLocaleString()} SAR</div>
                                                    <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap" dir="ltr">({(computedTotal - b.deposit_amount).toLocaleString()} DZD)</div>
                                                </div>
                                            ) : null}
                                        </>
                                    );
                                })()}
                            </td>
                            <td className="px-4 py-3 text-center"><Badge status={b.status} t={t} /></td>
                            <td className="px-4 py-3 text-center">
                                {(b.status === 'confirmed' || b.status === 'paid') && (
                                    <button
                                        onClick={() => onStatusUpdate(b.id)}
                                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                                    >
                                        <Check size={14} />
                                        {lang === 'ar' ? 'إتمام الحجز' : 'Complete Booking'}
                                    </button>
                                )}
                                {b.status === 'completed' && (
                                    <span className="px-3 py-1.5 bg-gray-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-green-200">
                                        <CheckCircle size={14} />
                                        {lang === 'ar' ? 'مكتمل' : 'Completed'}
                                    </span>
                                )}
                            </td>
                        </tr>
                    )) : <tr><td colSpan="8" className="text-center p-8 text-gray-400">{t.noData}</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
    );
};

const Finance = ({ t, hotel }) => {
    const [modal, setModal] = useState(false);
    const [payouts, setPayouts] = useState([]);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState({ balance: 0 });
    const [reconciliations, setReconciliations] = useState([]);

    useEffect(() => {
        if (!hotel) return;
        const load = async () => {
            try {
                const [pData, wData, rData] = await Promise.all([
                    hotelService.getHotelFinance(hotel.id),
                    hotelService.getHotelWallet(hotel.id),
                    hotelService.getHotelReconciliations(hotel.id)
                ]);
                setPayouts(pData || []);
                setWallet(wData || { balance: 0 });
                setReconciliations(rData || []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, [hotel]);

    const handleWithdraw = async () => {
        if (!amount || isNaN(amount) || amount <= 0) return;
        if (amount > wallet.balance) {
            toast.error(t.ar ? 'الرصيد غير كاف' : 'Insufficient balance');
            return;
        }
        setLoading(true);
        try {
            await hotelService.requestPayout(hotel.id, parseFloat(amount));
            // refresh
            const data = await hotelService.getHotelFinance(hotel.id);
            setPayouts(data || []);
            setModal(false);
            setAmount('');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>{t.loading || 'Loading...'}</div>;

    // Calculate Live Available Balance
    const commissionRate = hotel?.commission_percent || 10;
    const rate = commissionRate / 100;
    const totalDeposits = myBookings
        .filter(b => b.status === 'confirmed' || b.status === 'paid' || b.status === 'completed')
        .reduce((sum, b) => sum + Number(b.deposit_amount || 0), 0);
    const liveHotelBalance = totalDeposits * (1 - rate);
    const totalPayouts = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const availableBalance = Math.max(0, liveHotelBalance - totalPayouts);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-5 rounded-2xl shadow-lg shadow-emerald-900/10">
                    <div className="text-sm opacity-80 mb-2">{t.netProfit || 'Wallet Balance'}</div>
                    <div className="text-3xl font-bold">{availableBalance.toLocaleString()} {t.currency || 'DZD'}</div>
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                    <div className="text-sm text-amber-700 mb-2">{t.pendingPayouts || 'Pending Withdrawals'}</div>
                    <div className="text-2xl font-bold text-amber-800">
                        {payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()} {t.currency || 'DZD'}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={() => setModal(true)} disabled={availableBalance <= 0} className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 disabled:opacity-50">
                    <Wallet size={18} />{t.withdraw || 'Request Payout'}
                </button>
            </div>

            {/* Reconciliation Reports */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">{t.ar ? 'التقارير المالية (التسوية)' : 'Monthly Reconciliations'}</h3>
                    <button
                        onClick={async () => {
                            try {
                                const { data, error } = await supabase.functions.invoke('generate-reconciliation-pdf', {
                                    body: { hotel_id: hotel.id }
                                });
                                if (error) throw error;
                                if (data?.url) window.open(data.url, '_blank');
                                else toast.success(t.ar ? 'تم إرسال التقرير' : 'Report generated');
                            } catch (e) {
                                toast.error('PDF Generation Edge Function not yet deployed');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                    >
                        <FileText size={16} /> {t.ar ? 'تحميل التقرير PDF' : 'Download PDF'}
                    </button>
                </div>
                {reconciliations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                                <tr>
                                    <th className="px-4 py-3 rounded-r-xl">{t.ar ? 'الفترة' : 'Period'}</th>
                                    <th className="px-4 py-3">{t.ar ? 'الحجوزات' : 'Bookings'}</th>
                                    <th className="px-4 py-3">{t.ar ? 'إجمالي العربون' : 'Total Deposits'}</th>
                                    <th className="px-4 py-3">{t.ar ? 'عمولة المنصة' : 'Total Commission'}</th>
                                    <th className="px-4 py-3 rounded-l-xl">{t.ar ? 'الصافي' : 'Net Balance'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reconciliations.map(r => (
                                    <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-semibold text-gray-900">{r.period_start} - {r.period_end}</td>
                                        <td className="px-4 py-3 text-gray-600">{r.total_bookings}</td>
                                        <td className="px-4 py-3 text-gray-600">{Number(r.total_deposits).toLocaleString()} {t.currency}</td>
                                        <td className="px-4 py-3 text-red-600">{Number(r.total_commission).toLocaleString()} {t.currency}</td>
                                        <td className="px-4 py-3 font-bold text-emerald-700">{Number(r.net_balance).toLocaleString()} {t.currency}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="text-gray-400 text-center py-4">{t.noData || 'No reports yet'}</div>}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">{t.withdrawHistory || 'Payout History'}</h3>
                {payouts.length > 0 ? payouts.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
                        <div>
                            <div className="font-medium text-gray-900">{w.amount} {t.currency || 'DZD'}</div>
                            <div className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString()}</div>
                        </div>
                        <Badge status={w.status} t={t} />
                    </div>
                )) : <div className="text-gray-400 text-center py-4">{t.noData || 'No payouts yet'}</div>}
            </div>

            <Modal isOpen={modal} onClose={() => setModal(false)} title={t.withdraw || 'Request Payout'}>
                <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-xl text-center">
                        <div className="text-sm text-emerald-600">{t.netProfit || 'Available Balance'}</div>
                        <div className="text-3xl font-bold text-emerald-800">{availableBalance.toLocaleString()} {t.currency || 'DZD'}</div>
                    </div>
                    <input type="number" max={availableBalance} value={amount} onChange={e => setAmount(e.target.value)} placeholder={t.amount || 'Amount'} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    <button onClick={handleWithdraw} disabled={loading} className="w-full py-3 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900">{loading ? t.loading || 'Loading...' : t.confirm || 'Confirm'}</button>
                </div>
            </Modal>
        </div>
    );
};

const Profile = ({ t, lang, hotel }) => {
    const [formData, setFormData] = useState({ name: '', city: 'makkah', verification_status: 'unverified' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (hotel) setFormData(hotel);
    }, [hotel]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const session = await authService.getCurrentSession();
            if (!hotel) {
                // Create
                await hotelService.createHotel(session.user.id, formData);
            } else {
                // Update
                await hotelService.updateHotel(hotel.id, formData);
            }
            window.location.reload();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                        {/* Placeholder for hotel image trigger */}
                        <Image size={32} className="text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{formData.name || 'New Hotel'}</h3>
                        <p className="text-sm text-gray-500">{formData.city}</p>
                    </div>
                    <Badge status={formData.verification_status} t={t} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{t.hotelName}</label>
                        <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{t.city}</label>
                        <select value={formData.city || 'makkah'} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50">
                            <option value="makkah">{t.makkah}</option>
                            <option value="madinah">{t.madinah}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" dir="ltr" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{lang === 'ar' ? 'المسافة عن الحرم (متر)' : 'Distance to Haram (m)'}</label>
                        <input type="number" value={formData.distance_to_haram_meters || ''} onChange={e => setFormData({ ...formData, distance_to_haram_meters: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50" />
                    </div>
                    <div className="md:col-span-2 mt-2">
                        <LocationPicker 
                            lang={lang}
                            initialLat={formData.latitude}
                            initialLng={formData.longitude}
                            onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-emerald-800 text-white rounded-xl font-bold">{loading ? t.loading : t.save}</button>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h4 className="font-bold text-gray-900 mb-4">{t.uploadDocs}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[t.commercialReg, t.taxId, t.hotelLicense].map((doc, i) => (
                        <div key={i} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-emerald-300 cursor-pointer">
                            <FileText size={24} className="mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-500">{doc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ========== HOTEL SETUP WIZARD ==========
const HotelSetupWizard = ({ t, lang, onSave, loading }) => {
    const [formData, setFormData] = useState({ name: '', city: 'makkah', address: '', distance: 0, description: '' });

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-[Tajawal]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-emerald-800 p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Briefcase size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{lang === 'ar' ? 'إكمال ملف الفندق' : 'Complete Hotel Profile'}</h2>
                    <p className="text-emerald-100 text-sm">{lang === 'ar' ? 'يرجى إدخال بيانات الفندق للبدء' : 'Please enter hotel details to start'}</p>
                </div>
                <div className="p-8 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{t.hotelName}</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder={lang === 'ar' ? 'اسم الفندق...' : 'Hotel Name...'} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{t.city}</label>
                        <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white">
                            <option value="makkah">{t.makkah}</option>
                            <option value="madinah">{t.madinah}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{lang === 'ar' ? 'المسافة عن الحرم (متر)' : 'Distance to Haram (m)'}</label>
                        <input type="number" value={formData.distance} onChange={e => setFormData({ ...formData, distance: parseInt(e.target.value) })} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                    </div>
                    <div className="mt-2">
                        <LocationPicker 
                            lang={lang}
                            initialLat={formData.latitude}
                            initialLng={formData.longitude}
                            onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 outline-none h-24 resize-none" />
                    </div>
                    <button onClick={() => onSave(formData)} disabled={!formData.name || loading} className="w-full py-3.5 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-800/20 mt-4">
                        {loading ? t.loading : (lang === 'ar' ? 'إنشاء حساب الفندق' : 'Create Hotel Account')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========== MAIN COMPONENT ==========
export default function PartnerPanel({ lang, setLang, setRole, onLogout }) {
    const [active, setActive] = useState(window.location.hash.replace('#', '') || 'overview');

    useEffect(() => {
        window.location.hash = active;
    }, [active]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [offerRoom, setOfferRoom] = useState(null);
    const [hotel, setHotel] = useState(null);
    const [myRooms, setMyRooms] = useState([]);
    const [myOffers, setMyOffers] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [setupLoading, setSetupLoading] = useState(false); // For creation
    const [alerts, setAlerts] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(35.80);
    const [seasonBanner, setSeasonBanner] = useState(null);
    const t = T[lang];

    // Initial Fetch
    const loadData = async () => {
        try {
            const session = await authService.getCurrentSession();
            if (session?.user) {
                const h = await hotelService.getMyHotel(session.user.id);
                setHotel(h);
                if (h) {
                    try {
                        const [r, o, b, dbRate, sb] = await Promise.all([
                            hotelService.getHotelRooms(h.id).catch(e => { console.error("Rooms fetch error", e); return []; }),
                            hotelService.getHotelOffers(h.id).catch(e => { console.error("Offers fetch error", e); return []; }),
                            hotelService.getHotelBookings(h.id).catch(e => { console.error("Bookings fetch error", e); return []; }),
                            supabase.from('exchange_rates').select('rate').eq('target_currency', 'DZD').eq('base_currency', 'SAR').single().then(res => res.data?.rate || 35.80).catch(() => 35.80),
                            commonService.getActiveSeasonBanner('hotel').catch(() => null)
                        ]);
                        setMyRooms(r || []);
                        setMyOffers(o || []);
                        setMyBookings(b || []);
                        setExchangeRate(dbRate);
                        setSeasonBanner(sb);
                        const n = await hotelService.getNotifications(h.owner_id || session.user.id);
                        // Filter to show only unread (assuming getNotifications returns recent ones, we filter client side or service side)
                        // Ideally service filters, but for now client side filter if service returns all:
                        const unread = n?.filter(x => !x.is_read) || [];
                        setAlerts(unread.map(x => ({ id: x.id, type: x.type === 'booking' ? 'success' : 'info', msg: x.body, created_at: x.created_at })) || []);
                    } catch (innerErr) {
                        console.error("Error fetching hotel details:", innerErr);
                    }
                }
            }
        } catch (err) {
            console.error("Init Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Mark notifications as read/clear
    const handleClearNotifications = async () => {
        setAlerts([]);
        if (hotel?.owner_id) {
            await hotelService.markAllNotificationsRead(hotel.owner_id);
        }
    };

    const handleDeleteNotification = async (notifId) => {
        setAlerts(prev => prev.filter(a => a.id !== notifId));
        try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
        } catch (e) {
            console.error('Failed to delete notification', e);
        }
    };

    // Subscribe to Notifications
    React.useEffect(() => {
        if (!hotel || !hotel.owner_id) return;
        const sub = hotelService.subscribeToNotifications(hotel.owner_id, (newNotif) => {
            setAlerts(prev => [{ id: newNotif.id, type: newNotif.type === 'booking' ? 'success' : 'info', msg: newNotif.body, created_at: newNotif.created_at || new Date().toISOString() }, ...prev]);
        });
        return () => sub.unsubscribe();
    }, [hotel]);

    // Initial Fetch
    React.useEffect(() => {
        loadData();
    }, []);

    const handleCreateHotel = async (data) => {
        setSetupLoading(true);
        try {
            const session = await authService.getCurrentSession();
            // Map City to Arabic for DB
            const cityMap = { 'makkah': 'مكة', 'madinah': 'المدينة' };
            const dbCity = cityMap[data.city] || data.city;

            // Default fields to ensure compatibility
            const payload = {
                name: data.name,
                city: dbCity,
                address: data.address,
                distance_to_haram_meters: parseInt(data.distance || 0),
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                description: data.description,
                owner_id: session.user.id,
                is_active: true,
                verification_status: 'unverified'
            };

            console.log("Creating Hotel with payload:", payload); // Debug

            const newHotel = await hotelService.createHotel(session.user.id, payload);
            setHotel(newHotel);
            // window.location.reload();
        } catch (e) {
            console.error(e);
            toast.error((lang === 'ar' ? 'فشل إنشاء الفندق: ' : 'Failed to create hotel: ') + e.message);
        } finally {
            setSetupLoading(false);
        }
    };

    const handleCreateOffer = (room) => {
        setOfferRoom(room);
        setActive('offers');
    };

    const completeBooking = async (bookingId) => {
        const { data, error } = await supabase
            .from("bookings")
            .update({ status: "completed" })
            .eq("id", bookingId)
            .select();

        if (error) {
            console.error("Error completing booking:", error);
            alert("حدث خطأ أثناء إتمام الحجز");
            return;
        }

        console.log("Booking updated:", data);
        alert("تم إتمام الحجز بنجاح");

        loadData(); // Re-fetch all data to refresh UI instantly
    };

    // Derived Stats (Strict 7-metric financial formula)
    const stats = React.useMemo(() => {
        if (!myBookings) return null;

        // Filter only confirmed or paid bookings
        const activeBookings = myBookings.filter(b => b.status === 'confirmed' || b.status === 'paid');

        let totalRevenue = 0;    // SUM(total_price)
        let totalDeposits = 0;  // SUM(deposit_amount)

        activeBookings.forEach(b => {
            totalRevenue += Number(b.total_price || 0);
            totalDeposits += Number(b.deposit_amount || 0);
        });

        const platformCommission = totalDeposits * 0.10;               // 10% from deposit (collected)
        const hotelBalance = totalDeposits * 0.90;               // 90% of deposit owed to hotel
        const remainingAmount = totalRevenue - totalDeposits;       // what pilgrim pays at hotel
        const commissionDue = remainingAmount * 0.10;             // 10% on remaining (owed by hotel)
        const hotelNetRevenue = totalRevenue - (totalRevenue * 0.10); // hotel keeps 90% overall

        return {
            totalBookings: activeBookings.length,
            totalRevenue,
            totalDeposits,
            platformCommission,
            hotelBalance,
            remainingAmount,
            commissionDue,
            hotelNetRevenue
        };
    }, [myBookings]);

    const render = () => {
        if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-800 font-bold animate-pulse">{t.loading}...</div>;

        // Show Wizard if no hotel found
        if (!hotel) return <HotelSetupWizard t={t} lang={lang} onSave={handleCreateHotel} loading={setupLoading} />;

        switch (active) {
            case 'overview': return <Overview t={t} lang={lang} stats={stats} alerts={alerts} recentBookings={myBookings} hotel={hotel} onDeleteAlert={async (id) => {
                setAlerts(prev => prev.filter(a => a.id !== id));
                try { await supabase.from('notifications').update({ is_read: true }).eq('id', id); } catch (e) { console.error(e); }
            }} />;
            case 'rooms': return <RoomsSection t={t} lang={lang} onCreateOffer={handleCreateOffer} roomsList={myRooms} onRefresh={loadData} />;
            case 'offers': return <OffersSection t={t} lang={lang} preselectedRoom={offerRoom} offersList={myOffers} roomsList={myRooms} onRefresh={loadData} />;
            // Logic Fix 8: Filter bookings to show ONLY confirmed or paid (Canonical Flow)
            case 'bookings': return <Bookings t={t} lang={lang} bookings={myBookings.filter(b => b.status === 'confirmed' || b.status === 'paid' || b.status === 'completed')} onStatusUpdate={completeBooking} exchangeRate={exchangeRate} />;
            case 'finance': return <Finance t={t} hotel={hotel} />;
            case 'profile': return <Profile t={t} lang={lang} hotel={hotel} onSave={() => { }} />;
            default: return <Overview t={t} lang={lang} stats={stats} hotel={hotel} />;
        }
    };

    // Reset offerRoom when switching away from offers
    React.useEffect(() => {
        if (active !== 'offers') setOfferRoom(null);
    }, [active]);

    // If showing wizard, return it directly to avoid Sidebar rendering
    if (!loading && !hotel) return render();

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-stone-50 font-[Tajawal]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                <Sidebar active={active} setActive={setActive} lang={lang} t={t} setRole={setRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

                <div className={`${lang === 'ar' ? 'md:mr-64' : 'md:ml-64'} min-h-screen transition-all duration-300`}>
                    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm md:shadow-none">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="p-2 -mx-2 hover:bg-gray-100 rounded-xl md:hidden text-gray-700">
                                <Menu size={24} />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">{t[active]}</h1>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="relative">
                                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 hover:bg-gray-100 rounded-xl">
                                    <Bell size={22} className="text-gray-600" />
                                    {alerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                                </button>
                                {showNotifs && (
                                    <div className={`absolute top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] overflow-hidden ${lang === 'ar' ? 'left-0' : 'right-0'}`}>
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 text-sm">{t.alerts || (lang === 'ar' ? 'التنبيهات' : 'Notifications')}</h3>
                                            <button onClick={handleClearNotifications} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">{lang === 'ar' ? 'مسح الكل' : 'Clear All'}</button>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {alerts.length > 0 ? alerts.map((a, i) => (
                                                <div key={i} onClick={() => {
                                                    if (a.data?.url) {
                                                        window.location.href = a.data.url;
                                                    } else {
                                                        setActive('bookings');
                                                    }
                                                    setShowNotifs(false);
                                                }} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer group ${a.data?.type === 'promotion' ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : ''}`}>
                                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${a.data?.type === 'promotion' ? 'bg-blue-600 ring-2 ring-blue-100' : (a.type === 'success' ? 'bg-emerald-500' : 'bg-gray-400')}`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 mb-1 font-bold">{a.data?.type === 'promotion' ? (lang === 'ar' ? 'تنبيه من المشرف' : 'Admin Alert') : (a.type === 'success' ? (lang === 'ar' ? 'حجز جديد' : 'New Booking') : (lang === 'ar' ? 'تنبيه' : 'Alert'))}</div>
                                                        <div className="text-sm text-gray-800 leading-snug">{a.msg}</div>
                                                        {a.created_at && <div className="text-[10px] text-gray-400 mt-1" dir="ltr">{new Date(a.created_at).toLocaleString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>}
                                                    </div>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleDeleteNotification(a.id); }}
                                                        className="p-1 text-gray-300 hover:text-red-500 rounded-lg flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                                                        title={lang === 'ar' ? 'حذف' : 'Delete'}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )) : <div className="p-8 text-center text-gray-400 text-sm">{lang === 'ar' ? 'لا توجد تنبيهات' : 'No notifications'}</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"><Globe size={18} />{lang === 'ar' ? 'En' : 'ع'}</button>
                            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold hidden md:flex">H</div>
                        </div>
                    </header>
                    <main className="p-4 md:p-6">
                        {seasonBanner && (
                            <div className="mb-6 rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg transition-shadow">
                                <div className="min-h-[8rem] md:min-h-[10rem] bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 flex flex-col items-center justify-center px-8 py-6 relative overflow-hidden text-center">
                                    {seasonBanner.image_url && <img src={seasonBanner.image_url} alt="season banner" className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay" />}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                                    <div className="relative z-10 text-white">
                                        <div className="text-xl md:text-2xl font-bold mb-2 drop-shadow">{seasonBanner.title}</div>
                                        {seasonBanner.description && <div className="text-sm md:text-base opacity-90 mb-4">{seasonBanner.description}</div>}
                                        {seasonBanner.link_url && (
                                            <a
                                                href={seasonBanner.link_url}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 text-white font-bold text-sm shadow-lg hover:bg-white/30 transition-all duration-300 relative overflow-hidden group/btn"
                                            >
                                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                                                <span>{lang === 'ar' ? 'اضغط هنا ✨' : 'Click Here ✨'}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {render()}
                    </main>
                </div>
            </div >
        </ErrorBoundary >
    );
}


