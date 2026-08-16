import React, { useState, useEffect, useRef } from 'react';
import {
    User, Briefcase, Users, MessageCircle, Heart, CreditCard, HelpCircle,
    Calendar, MapPin, Clock, Star, Phone, ChevronLeft, ChevronRight,
    X, Send, Eye, EyeOff, Edit, Trash2, ExternalLink, Check, AlertCircle, CheckCircle, Plus,
    Globe, Bell, Home, Settings, LogOut, Camera, Hash, Shield, MessageSquare, Download, LayoutDashboard
} from 'lucide-react';
import { authService } from './services/authService';
import { pilgrimService } from './services/pilgrimService';
import { bookingService } from './services/bookingService';
import { commonService } from './services/commonService';
import { generateBookingPdf } from './services/pdfService';
import ChatModal from './components/ChatModal';
import VoucherTemplate from './components/VoucherTemplate';
import { Footer } from './components/Footer';
import { supabase } from './lib/supabase';
import { toast } from 'react-hot-toast';
import BookingsPage from './components/BookingsPage';
import ChatList from './components/ChatList';
import { useData } from './context/DataContext';
import { useNotifications } from './hooks/useNotifications';

import { usePresence } from './hooks/usePresence';
import { useFavorites } from './hooks/useFavorites';

import { usePayments } from './hooks/usePayments';
import { useRoommates } from './hooks/useRoommates';
import { useBookings } from './hooks/useBookings';

// Text Dictionary
const PILGRIM_T = {
    ar: {
        profile: 'الملف الشخصي', bookings: 'حجوزاتي', roommates: 'شركاء الغرفة',
        chats: 'المحادثات', favorites: 'المفضلة', payments: 'المدفوعات', support: 'الدعم',
        firstName: 'الاسم الأول', wilaya: 'الولاية', bio: 'نبذة عني',
        privacySettings: 'إعدادات الخصوصية', hideName: 'إخفاء الاسم', hidePhoto: 'إخفاء الصورة',
        upcomingBookings: 'الحجوزات القادمة', pastBookings: 'الأرشيف',
        bookingDetails: 'تفاصيل الحجز', hotelDetails: 'تفاصيل الفندق',
        roomDetails: 'تفاصيل الغرفة', checkIn: 'الوصول', checkOut: 'المغادرة',
        status: 'الحالة', price: 'السعر', currency: 'د.ج',
        confirmed: 'تم دفع العربون — بانتظار إتمام الحجز', pending: 'بانتظار الدفع', cancelled: 'ملغي', completed: 'تم الحجز',
        contactRoommates: 'تواصل مع الشركاء', noRoommates: 'غرفة خاصة',
        compatibility: 'التوافق', online: 'متصل', offline: 'غير متصل',
        startChat: 'بدء محادثة', sendMessage: 'إرسال رسالة',
        savedOffers: 'العروض المحفوظة', bookNow: 'احجز الآن', remove: 'إزالة',
        paymentHistory: 'سجل المدفوعات', paymentMethod: 'طريقة الدفع',
        amount: 'المبلغ', date: 'التاريخ', payNow: 'ادفع الآن',
        whatsappSupport: 'دعم واتساب', faq: 'الأسئلة الشائعة', sendRequest: 'إرسال طلب',
        night: 'ليلة', nights: 'ليالي', edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء',
        messages: 'الرسائل', newMessage: 'رسالة جديدة', typeMessage: 'اكتب رسالتك...',
        viewAll: 'عرض الكل', backHome: 'الرئيسية', settings: 'الإعدادات', logout: 'خروج',
        distance: 'المسافة', rating: 'التقييم',
        success: 'تمت العملية بنجاح', loading: 'جاري التحميل...', noData: 'لا توجد بيانات'
    },
    en: {
        profile: 'Profile', bookings: 'My Bookings', roommates: 'Roommates',
        chats: 'Chats', favorites: 'Favorites', payments: 'Payments', support: 'Support',
        firstName: 'First Name', wilaya: 'Region', bio: 'About Me',
        privacySettings: 'Privacy Settings', hideName: 'Hide Name', hidePhoto: 'Hide Photo',
        upcomingBookings: 'Upcoming', pastBookings: 'History',
        bookingDetails: 'Booking Details', hotelDetails: 'Hotel Details',
        roomDetails: 'Room Details', checkIn: 'Check-in', checkOut: 'Check-out',
        status: 'Status', price: 'Price', currency: 'DZD',
        confirmed: 'Deposit Paid - Waiting Completion', pending: 'Waiting Payment', cancelled: 'Cancelled', completed: 'Booked',
        contactRoommates: 'Contact Roommates', noRoommates: 'Private Room',
        compatibility: 'Compatibility', online: 'Online', offline: 'Offline',
        startChat: 'Start Chat', sendMessage: 'Send Message',
        savedOffers: 'Saved Offers', bookNow: 'Book Now', remove: 'Remove',
        paymentHistory: 'Payment History', paymentMethod: 'Method',
        amount: 'Amount', date: 'Date', payNow: 'Pay Now',
        whatsappSupport: 'WhatsApp Support', faq: 'FAQ', sendRequest: 'Send Request',
        night: 'night', nights: 'nights', edit: 'Edit', save: 'Save', cancel: 'Cancel',
        messages: 'Messages', newMessage: 'New message', typeMessage: 'Type a message...',
        viewAll: 'View All', backHome: 'Home', settings: 'Settings', logout: 'Logout',
        distance: 'Distance', rating: 'Rating',
        success: 'Success', loading: 'Loading...', noData: 'No Data Found'
    }
};

// Status Badge Component
const StatusBadge = ({ status, t }) => {
    const styles = {
        confirmed: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700',
        cancelled: 'bg-red-50 text-red-700', completed: 'bg-blue-50 text-blue-700'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>{t[status] || status}</span>;
};

// ... BottomSheet, ChatModal, BottomNav components (Keep these generic) ...
const BottomSheet = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">{children}</div>
            </div>
        </div>
    );
};

// Sound Helper
const playNotificationSound = (type = 'receive') => {
    return; // Temporarily disabled due to Pixabay 403 Forbidden errors
};

const ChatModal = ({ isOpen, onClose, user, t, lang, isUserOnline, offerId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [myId, setMyId] = useState(null);
    const [selectedMsgId, setSelectedMsgId] = useState(null);
    const targetUserId = user ? (user.full_name || user.avatar_url ? user.id : user.userId) : null;
    const isOnline = (isUserOnline && targetUserId) ? isUserOnline(targetUserId) : false;
    const messagesEndRef = useRef(null);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        let subscription;
        let beat;

        const initChat = async () => {
            const session = await authService.getCurrentSession();
            if (!session?.user) return;
            const myUserId = session.user.id;
            setMyId(myUserId);

            let cId = null;
            let otherUserId = null;

            // Determine if user is a Profile or Conversation object
            if (user.full_name || user.avatar_url) {
                // It's a Profile (from Roommates)
                otherUserId = user.id;
                if (offerId) {
                    cId = await pilgrimService.getOrCreateRoommateConversation(myUserId, otherUserId, offerId);
                } else {
                    cId = await pilgrimService.getOrCreateConversation(myUserId, otherUserId);
                }
            } else {
                // It's a Chat Object (from Chats List)
                cId = user.id; // conversation_id
                otherUserId = user.userId; // target user_id (added to service)
            }

            setConversationId(cId);

            if (cId) {
                const msgs = await pilgrimService.getMessages(cId);
                setMessages(msgs || []);

                subscription = pilgrimService.subscribeToMessages(cId, (payload) => {
                    const { eventType, new: newMsg, old: oldMsg } = payload;
                    if (eventType === 'INSERT') {
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            if (newMsg.sender_id !== myUserId) {
                                playNotificationSound('receive');
                                pilgrimService.markAsRead(cId, myUserId);
                            }
                            return [...prev, newMsg];
                        });
                    } else if (eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== oldMsg.id));
                    }
                });
            }
        };

        if (isOpen && user) initChat();
        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [isOpen, user]);

    const handleSend = async () => {
        if (!message.trim() || !conversationId) return;

        const text = message.trim();
        setMessage(''); // Clear immediately

        playNotificationSound('send');

        try {
            await pilgrimService.sendMessage(conversationId, myId, text);
            // Realtime subscription will receive and append the message.
        } catch (e) {
            console.error("Send failed", e);
            toast.error(lang === 'ar' ? 'فشل الإرسال' : 'Failed to send');
        }
    };

    const handleDeleteMessage = async (msg) => {
        if (!confirm(lang === 'ar' ? 'حذف الرسالة؟' : 'Delete message?')) return;
        try {
            await pilgrimService.deleteMessage(msg.id);
            setMessages(prev => prev.filter(m => m.id !== msg.id));
            setSelectedMsgId(null);
        } catch (e) {
            toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed');
        }
    };

    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 bg-emerald-800 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {user.avatar || user.img ? <img src={user.avatar || user.img} className="w-10 h-10 rounded-full border-2 border-white/20" alt="" /> : <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">T</div>}
                        <div>
                            <div className="font-bold text-sm">{user.name || user.user || user.full_name}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-200">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                                {isOnline ? (lang === 'ar' ? 'متصل الآن' : 'Online') : (lang === 'ar' ? 'غير متصل' : 'Offline')}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-2">
                    {messages.length === 0 && <div className="text-center text-xs text-gray-400 my-4">{lang === 'ar' ? 'بداية المحادثة' : 'Chat Started'}</div>}
                    {messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex flex-col ${msg.sender_id === myId ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm relative group ${msg.sender_id === myId ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'}`}
                                onContextMenu={(e) => {
                                    if (msg.sender_id === myId) {
                                        e.preventDefault();
                                        setSelectedMsgId(prev => prev === msg.id ? null : msg.id);
                                    }
                                }}
                            >
                                {msg.message}
                            </div>
                            {/* Read Receipt */}
                            <div className="flex items-center gap-1 mt-1 px-1 min-h-[16px]">
                                <span className="text-[10px] text-gray-400">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.sender_id === myId && (
                                    <div className="flex items-center">
                                        {msg.read_at
                                            ? <div className="flex"><Check size={12} className="text-blue-500" /><Check size={12} className="text-blue-500 -ml-1.5" /></div>
                                            : <Check size={12} className="text-gray-300" />
                                        }
                                    </div>
                                )}
                            </div>
                            {/* Delete Option */}
                            {selectedMsgId === msg.id && msg.sender_id === myId && (
                                <div className="self-end mt-1 animate-in fade-in">
                                    <button onClick={() => handleDeleteMessage(msg)} className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-100 font-bold flex items-center gap-1">
                                        <Trash2 size={10} /> {lang === 'ar' ? 'حذف' : 'Delete'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="relative">
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.typeMessage}
                            className={`w-full bg-gray-100 rounded-full py-3 ${lang === 'ar' ? 'pr-4 pl-12' : 'pl-4 pr-12'} text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20`} />
                        <button onClick={handleSend} className={`absolute ${lang === 'ar' ? 'left-2' : 'right-2'} top-2 p-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700`}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BottomNav = ({ activeSection, setActiveSection, t }) => {
    const items = [
        { id: 'bookings', icon: Briefcase, label: t.bookings },
        { id: 'chats', icon: MessageCircle, label: t.chats },
        { id: 'favorites', icon: Heart, label: t.favorites },
        { id: 'payments', icon: CreditCard, label: t.payments },
        { id: 'profile', icon: User, label: t.profile }
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe px-2 pt-2 flex justify-around items-center z-40 md:hidden">
            {items.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${activeSection === item.id ? 'text-emerald-800 bg-emerald-50' : 'text-gray-400'
                        }`}>
                    <item.icon size={20} className={activeSection === item.id ? 'fill-current' : ''} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

// --- SECTIONS ---

// Profile Section (Kept as previously enhanced)
const ProfileSection = ({ t, lang, user, profile, onLogout }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(profile?.full_name || '');
    const [email, setEmail] = useState(profile?.email || '');
    const [tags, setTags] = useState(profile?.bio_tags || []);
    const [newTag, setNewTag] = useState('');
    const [privacy, setPrivacy] = useState(profile?.privacy_settings || { hideName: false, hidePhoto: false });
    const [notification, setNotification] = useState(null);
    const [localAvatar, setLocalAvatar] = useState(profile?.avatar_url || null);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || user?.user_metadata?.full_name || '');
            setEmail(profile.email || user?.email || '');
            setTags(profile.bio_tags || []);
            setPrivacy(profile.privacy_settings || { hideName: false, hidePhoto: false });
            setLocalAvatar(profile.avatar_url);
        }
    }, [profile, user]);

    // Toast Timer
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showToast = (message, type = 'success') => { setNotification({ message, type }); };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = await authService.uploadAvatar(user.id, file);
            await authService.updateProfile(user.id, { avatar_url: url });
            setLocalAvatar(url);
            showToast(t.success);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleAddTag = () => {
        const trimmed = newTag.trim();
        if (!trimmed) return;
        const words = trimmed.split(/\s+/);
        if (words.length > 2) { showToast(lang === 'ar' ? 'كلمتين فقط' : 'Max 2 words', 'error'); return; }
        const formattedTag = words.join('_');
        if (!tags.includes(formattedTag)) setTags([...tags, formattedTag]);
        setNewTag('');
    };

    const handleRemoveTag = (index) => setTags(tags.filter((_, i) => i !== index));

    const handleSave = async () => {
        try {
            await authService.updateProfile(user.id, { full_name: name, email: email, bio_tags: tags });
            setIsEditing(false);
            showToast(t.success);
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handlePrivacyToggle = async (key) => {
        const newPrivacy = { ...privacy, [key]: !privacy[key] };
        setPrivacy(newPrivacy);
        try { await authService.updateProfile(user.id, { privacy_settings: newPrivacy }); showToast(t.success); }
        catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6 pb-32 relative">
            {notification && (
                <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />

            <div className="bg-white rounded-2xl border border-gray-100 p-6 relative">
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} p-2 rounded-full ${isEditing ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {isEditing ? <Check size={20} /> : <Edit size={20} />}
                </button>
                <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4 cursor-pointer" onClick={handleAvatarClick}>
                        {localAvatar ? <img src={localAvatar} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" /> : <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-800 border-4 border-white shadow-lg">{name?.charAt(0)?.toUpperCase()}</div>}
                        <div className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg"><Camera size={16} /></div>
                    </div>
                    {isEditing ? (
                        <div className="w-full max-w-xs space-y-2 text-center">
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full text-center font-bold text-xl border-b border-emerald-500 focus:outline-none bg-transparent" placeholder={t.firstName} />
                            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-center text-sm text-gray-500 border-b border-gray-200 focus:outline-none bg-transparent" placeholder="Email" />
                        </div>
                    ) : (
                        <><h2 className="text-xl font-bold text-gray-900">{name}</h2><p className="text-sm text-gray-500">{email}</p></>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">{t.bio} (Hashtags)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, i) => (
                                <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1">#{tag}{isEditing && <button onClick={() => handleRemoveTag(i)}><X size={12} /></button>}</span>
                            ))}
                        </div>
                        {isEditing && (
                            <div className="flex gap-2">
                                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder={lang === 'ar' ? 'كلمة...' : 'Word...'} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-full text-sm focus:outline-none" />
                                <button onClick={handleAddTag} className="p-1.5 bg-emerald-600 text-white rounded-full"><Plus size={16} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-emerald-600" />{t.privacySettings}</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                        <div className="flex items-center gap-3"><Eye size={18} className="text-gray-400" /><span className="text-sm font-medium text-gray-700">{t.hideName}</span></div>
                        <button onClick={() => handlePrivacyToggle('hideName')} className={`w-12 h-7 rounded-full relative transition-colors ${privacy.hideName ? 'bg-emerald-600' : 'bg-gray-200'}`}><span className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow ${privacy.hideName ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}`}></span></button>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-3"><EyeOff size={18} className="text-gray-400" /><span className="text-sm font-medium text-gray-700">{t.hidePhoto}</span></div>
                        <button onClick={() => handlePrivacyToggle('hidePhoto')} className={`w-12 h-7 rounded-full relative transition-colors ${privacy.hidePhoto ? 'bg-emerald-600' : 'bg-gray-200'}`}><span className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow ${privacy.hidePhoto ? (lang === 'ar' ? 'left-1' : 'right-1') : (lang === 'ar' ? 'right-1' : 'left-1')}`}></span></button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:hidden">
                <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-4 text-red-600 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                    <LogOut size={20} />
                    {t.logout}
                </button>
            </div>
        </div>
    );
};



// Roommates Section
const RoommatesSection = ({ t, lang, onOpenChat, user, isUserOnline }) => {
    // Lazy Load
    const { data: roommates = [], isLoading: loading } = useRoommates(user?.id);

    if (loading) return <div className="text-center py-10">{t.loading || 'Loading...'}</div>;

    if (roommates.length === 0) {
        return (
            <div className="text-center py-20 pb-24">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.noRoommates}</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    {lang === 'ar'
                        ? 'سيظهر شركاء الغرفة هنا عند تأكيد حجزك ودفع العربون.'
                        : 'Roommates will appear here after you confirm booking and pay deposit.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <h2 className="text-lg font-bold text-gray-900">{t.roommates}</h2>
            <div className="grid grid-cols-1 gap-4">
                {roommates.map(mate => {
                    const privacy = mate.profile?.privacy_settings || {};
                    const displayName = privacy.hideName ? (lang === 'ar' ? 'فاعل خير' : 'Anonymous') : (mate.profile?.full_name || (lang === 'ar' ? 'معتمر' : 'Pilgrim'));
                    const displayAvatar = privacy.hidePhoto ? null : mate.profile?.avatar_url;

                    return (
                        <div key={mate.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow">
                            <div className="relative shrink-0">
                                {displayAvatar ? <img src={displayAvatar} alt="" className="w-16 h-16 rounded-2xl object-cover" /> : <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400"><User size={24} /></div>}
                                {isUserOnline && isUserOnline(mate.profile?.id) && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" title="Online"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 truncate">{displayName}</h4>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                            <MapPin size={10} /> {mate.profile?.city || (lang === 'ar' ? 'غير محدد' : 'Unknown')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onOpenChat({ ...mate.profile, full_name: displayName, avatar_url: displayAvatar, offer_id: mate.offer_id || mate.offer?.id })}
                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2 mt-2 text-xs">
                                    <div className="font-bold text-gray-800 mb-1 truncate">{mate.offer?.title}</div>
                                    <div className="text-gray-500 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {mate.check_in} <span className="text-gray-300">|</span> {mate.check_out}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};





// Payments Section
// Payments Section
const PaymentsSection = ({ t, lang, user, onDownloadPdf }) => {
    // Lazy Load: Only fetch when component is mounted
    const { data: payments = [], isLoading: loading } = usePayments(user?.id, { enabled: !!user?.id });
    const { data: bookings = [] } = useBookings(user?.id);
    const [exchangeRate, setExchangeRate] = useState(35.80);

    // Fetch exchange rate on mount
    useEffect(() => {
        supabase.from('exchange_rates')
            .select('rate')
            .eq('target_currency', 'DZD')
            .eq('base_currency', 'SAR')
            .single()
            .then(res => setExchangeRate(res.data?.rate || 35.80))
            .catch(() => setExchangeRate(35.80));
    }, []);

    if (loading) return <div className="text-center py-10">{t.loading}</div>;

    // Logic Fix 5: Split Payments into Pending (Deposit Paid) vs Completed (Fully Paid)

    // Logic Fix 5: Split Payments into 3 Categories
    // 1. Pending Payment (No Deposit yet)
    const pendingPayment = bookings.filter(b => b.status === 'pending');
    // 2. Deposit Paid (Waiting for confirmation/completion)
    const pendingCompletion = bookings.filter(b => {
        const remaining = b.remaining_amount ?? (b.total_price - (b.deposit_amount || 0));
        return b.status === 'confirmed' || (b.status === 'paid' && remaining > 0);
    });
    // 3. Fully Paid / Completed
    const completed = bookings.filter(b => {
        const remaining = b.remaining_amount ?? (b.total_price - (b.deposit_amount || 0));
        return b.status === 'paid' && remaining <= 0;
    });

    return (
        <div className="space-y-6 pb-20">
            {/* 1. Pending Payment Section */}
            {pendingPayment.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">{lang === 'ar' ? 'بانتظار الدفع' : 'Waiting Payment'}</h2>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {pendingPayment.map((b, i) => (
                            <div key={b.id} className={`p-4 ${i < pendingPayment.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900">{b.offer?.title || 'Offer'}</div>
                                        <div className="text-xs text-gray-500">{new Date(b.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                                        {lang === 'ar' ? 'بانتظار الدفع' : 'Waiting Payment'}
                                    </span>
                                </div>
                                {(() => {
                                    let totalPrice = b.total_price; if (totalPrice == null) { const nights = b.check_in && b.check_out ? Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)) : 1; const roomPriceForDuration = (b.offer?.discount_price || b.offer?.price || 0) * nights; totalPrice = b.booking_type === 'bed' ? (Math.round(roomPriceForDuration / (b.offer?.room?.capacity || 4)) * (b.guests || 1)) : roomPriceForDuration; }
                                    return (
                                        <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs mb-1">{t.amount}:</span>
                                                <span className="font-bold text-gray-900 text-lg">{Math.round(totalPrice / exchangeRate).toLocaleString()} SAR</span>
                                                <span className="text-xs text-gray-400 font-bold">{totalPrice.toLocaleString()} {t.currency}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Deposit Paid Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">{lang === 'ar' ? 'بانتظار إتمام الحجز' : 'Waiting for Completion'}</h2>
                {pendingCompletion.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {pendingCompletion.map((b, i) => (
                            <div key={b.id} className={`p-4 ${i < pendingCompletion.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900">{b.offer?.title || 'Offer'}</div>
                                        <div className="text-xs text-gray-500">{new Date(b.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm">
                                        {lang === 'ar' ? 'تم دفع العربون' : 'Deposit Paid'}
                                    </span>
                                </div>
                                {(() => {
                                    let totalPrice = b.total_price; if (totalPrice == null) { const nights = b.check_in && b.check_out ? Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)) : 1; const roomPriceForDuration = (b.offer?.discount_price || b.offer?.price || 0) * nights; totalPrice = b.booking_type === 'bed' ? (Math.round(roomPriceForDuration / (b.offer?.room?.capacity || 4)) * (b.guests || 1)) : roomPriceForDuration; }
                                    const depositPaid = b.deposit_amount || 0;
                                    const remaining = b.remaining_amount || (totalPrice - depositPaid);
                                    return (
                                        <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-50">
                                            <div className="space-y-1 w-full md:w-auto">
                                                <div className="flex justify-between md:justify-start gap-4 text-xs text-gray-500">
                                                    <span>{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                                                    <span className="font-bold text-gray-900">{totalPrice.toLocaleString()} {t.currency}</span>
                                                </div>
                                                <div className="flex justify-between md:justify-start gap-4 text-xs text-emerald-600 font-bold">
                                                    <span>{lang === 'ar' ? 'المدفوع (عربون):' : 'Paid (Deposit):'}</span>
                                                    <span>{depositPaid.toLocaleString()} {t.currency}</span>
                                                </div>
                                                <div className="flex justify-between md:justify-start gap-4 text-sm text-ambergray-900 font-bold mt-1 pt-1 border-t border-gray-100">
                                                    <span className="text-gray-500">{lang === 'ar' ? 'المتبقي:' : 'Remaining:'}</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-amber-600">{Math.round(remaining / exchangeRate).toLocaleString()} SAR</span>
                                                        <span className="text-[10px] text-amber-600/70" dir="ltr">({remaining.toLocaleString()} {t.currency})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                                                onClick={() => onDownloadPdf(b)}
                                            >
                                                <Download size={14} /> {lang === 'ar' ? 'وصل العربون' : 'Deposit Receipt'}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center text-gray-400 text-sm py-4">{t.noData}</div>}
            </div>

            {/* 3. Completed Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">{t.completed || (lang === 'ar' ? 'مكتملة' : 'Completed')}</h2>
                {completed.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {completed.map((b, i) => (
                            <div key={b.id} className={`p-4 ${i < completed.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900">{b.offer?.title || 'Offer'}</div>
                                        <div className="text-xs text-gray-500">{new Date(b.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                        {lang === 'ar' ? 'تم الحجز' : 'Booked'}
                                    </span>
                                </div>
                                {(() => {
                                    let totalPrice = b.total_price; if (totalPrice == null) { const nights = b.check_in && b.check_out ? Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24)) : 1; const roomPriceForDuration = (b.offer?.discount_price || b.offer?.price || 0) * nights; totalPrice = b.booking_type === 'bed' ? (Math.round(roomPriceForDuration / (b.offer?.room?.capacity || 4)) * (b.guests || 1)) : roomPriceForDuration; }
                                    return (
                                        <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-50">
                                            <div className="space-y-0.5">
                                                <div className="text-xs text-emerald-700">{lang === 'ar' ? 'المبلغ الكلي المدفوع:' : 'Total Paid:'}</div>
                                                <div className="text-sm text-emerald-800 font-bold">{Math.round(totalPrice / exchangeRate).toLocaleString()} SAR</div>
                                                <div className="text-xs text-emerald-600/70 font-bold">{totalPrice.toLocaleString()} {t.currency}</div>
                                            </div>
                                            <button
                                                className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors font-bold"
                                                onClick={() => onDownloadPdf(b)}
                                            >
                                                <Download size={14} /> {lang === 'ar' ? 'وصل الحجز النهائي' : 'Final Booking Receipt'}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                ) : <div className="text-center text-gray-400 text-sm py-4">{t.noData}</div>}
            </div>
        </div>
    );
};

// Support Section (Static for now, but linked to Whatsapp)
const SupportSection = ({ t, lang }) => {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const faqs = [
        { q: t.faq + ' 1', a: 'Answer...' }, // Replace with real Faqs if DB has them
    ];
    // Retaining static component structure for support as requested
    return (
        <div className="space-y-6 pb-20">
            <a href="https://wa.me/213697953761" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[#25D366] text-white rounded-2xl shadow-lg">
                <Phone size={24} className="fill-current" />
                <div><div className="font-bold">{t.whatsappSupport}</div></div>
            </a>
            {/* FAQ Area */}
        </div>
    );
};

const FavoritesSection = ({ t, lang, user, onSelectHotel }) => {
    // Lazy Load: Only fetch when component is mounted
    // Lazy Load: Only fetch when component is mounted
    const { data: offers = [], isLoading: loading, refetch } = useFavorites(user?.id, { enabled: !!user?.id });

    // Local setter to update UI optimistically (optional, or rely on refetch)
    // Actually best to rely on cache invalidation or refetch. 
    // To simplify immediate remove, we can rely on query invalidation in DataContext/App or do local filter.
    // For now, let's trust the hook.

    const handleRemove = async (offerId) => {
        if (!confirm(lang === 'ar' ? 'هل أنت متأكد من الإزالة؟' : 'Remove from favorites?')) return;
        try {
            await bookingService.removeFromFavorites(user.id, offerId);
            // Invalidate cache
            refetch();
        } catch (e) { toast.error(e.message); }
    };

    // Room type translations
    const roomTypeAr = {
        double: 'غرفة ثنائية',
        triple: 'غرفة ثلاثية',
        quad: 'غرفة رباعية',
        quint: 'غرفة خماسية',
        single: 'غرفة فردية',
        suite: 'جناح'
    };

    if (loading) return <div className="text-center py-10">{t.loading}</div>;

    if (offers.length === 0) return (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-500">{t.noData || 'No Saved Offers'}</h3>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
            {offers.map(offer => (
                <div key={offer.offerId} onClick={() => onSelectHotel && onSelectHotel(offer)} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            {/* Offer title in bold first */}
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-emerald-800 transition-colors mb-1">
                                {offer.offerTitle || offer.title || (lang === 'ar' ? 'عرض سكن' : 'Accommodation Offer')}
                            </h4>
                            {/* Hotel name smaller below */}
                            <div className="text-sm text-gray-500 mb-2">{offer.hotelName || offer.name}</div>
                            {/* Room type with Arabic translation */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                                    {lang === 'ar' ? roomTypeAr[offer.room_type] || offer.room_type : offer.room_type}
                                </span>
                                {offer.capacity && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        {offer.capacity} {lang === 'ar' ? 'أشخاص' : 'guests'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(offer.offerId); }} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 shrink-0">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div>
                            <span className="text-lg font-bold text-emerald-800">{offer.price?.toLocaleString()}</span>
                            <span className="text-sm text-gray-500 mr-1"> {t.currency}/{t.night}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                            {offer.available_from ? (
                                <span>{offer.available_from} <span className="mx-1">→</span> {offer.available_to}</span>
                            ) : (
                                <span className="italic text-gray-300">{lang === 'ar' ? 'تواريخ مرنة' : 'Flexible Dates'}</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const NotificationBell = ({ user, lang, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, isLoading } = useNotifications(user?.id);
    const [prevCount, setPrevCount] = useState(0);

    // Filter out chat notifications for the Bell
    const filteredNotifications = notifications.filter(n => n.type !== 'chat');
    // Notification sound (using Web Audio API)
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) { console.log('Sound not supported'); }
    };

    // Effect to play sound on new notification
    useEffect(() => {
        if (filteredNotifications.length > prevCount && prevCount !== 0) {
            playNotificationSound();
        }
        setPrevCount(filteredNotifications.length);
    }, [filteredNotifications.length]);

    const handleMarkRead = async (id) => {
        try {
            await commonService.markNotificationRead(id);
            // queryClient invalidation happens automatically via hook if setup or we can rely on realtime
        } catch (e) { console.error(e); }
    };

    const handleNotificationClick = (notif) => {
        if (notif.action_url) {
            window.location.href = notif.action_url;
        } else if (notif.data?.url) {
            window.location.href = notif.data.url;
        } else if (notif.type === 'booking') {
            if (onNavigate) onNavigate('bookings');
        } else if (notif.type === 'payment') {
            if (onNavigate) onNavigate('payments');
        } else if (notif.type === 'chat') {
            if (onNavigate) onNavigate('chats');
            // Check if we have sender info (assuming sender_id is in notif or related data)
            if (onOpenChat && notif.sender_id) {
                // Construct a profile-like object to trigger getOrCreateConversation
                onOpenChat({
                    id: notif.sender_id, // Use sender_id as ID to trigger profile mode
                    full_name: notif.title || 'User', // Fallback name
                    avatar_url: null,
                    // If we need the actual conversation ID and it's not provided, 
                    // ChatModal logic will find/create it using sender_id
                });
            }
        }
        handleMarkRead(notif.id);
        setIsOpen(false);
    };

    const unreadCount = filteredNotifications.length; // Uses filtered list
    const badgeCount = filteredNotifications.filter(n => !n.read_at).length;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen && badgeCount > 0) {
                        commonService.markAllNotificationsAsRead(user.id);
                        // Force local update if needed, but the hook might handle it or we wait for refetch
                        // For immediate UI feedback (request "disappear immediately")
                    }
                }}
                className="relative p-2 hover:bg-gray-100 rounded-xl"
            >
                <Bell size={20} className="text-gray-600" />
                {badgeCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`absolute top-full ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden`}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h4 className="font-bold text-gray-900">{lang === 'ar' ? 'التنبيهات' : 'Notifications'}</h4>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-400">{lang === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>
                            ) : filteredNotifications.length > 0 ? (
                                filteredNotifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.data?.type === 'promotion' ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : (notif.type === 'booking' ? 'bg-green-100/60 border-l-4 border-l-green-500' : (!notif.read_at ? 'bg-emerald-50/50' : ''))}`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <div className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                                    {notif.title}
                                                    {notif.data?.type === 'promotion' && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                                            {lang === 'ar' ? 'تنبيه من المشرف' : 'Admin Alert'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">{notif.body}</p>
                                                <div className="text-[10px] text-gray-400 mt-2" dir="ltr">
                                                    {new Date(notif.created_at).toLocaleString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            {!notif.read_at && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                                                    className={`p-1.5 rounded-full shrink-0 ${notif.data?.type === 'promotion' ? 'text-blue-600 hover:bg-blue-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                    title={lang === 'ar' ? 'تم القراءة' : 'Mark as read'}
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-sm text-gray-400">{lang === 'ar' ? 'لا توجد تنبيهات جديدة' : 'No new notifications'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Main Pilgrim Panel
export default function PilgrimPanel({ lang, setLang, setRole, onLogout, user, profile, onClose, onSelectHotel, initialTab = 'bookings', isUserOnline, showToast }) {
    const { loading } = useData(); // Consume global data
    // roommates, favorites, payments Removed from global context to lazy load
    const [activeSection, setActiveSection] = useState(window.location.hash.replace('#', '') || initialTab);
    
    useEffect(() => {
        window.location.hash = activeSection;
    }, [activeSection]);
    const [chatUser, setChatUser] = useState(null);
    const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [pdfBookingData, setPdfBookingData] = useState(null);
    const printRef = useRef();

    const [seasonBanner, setSeasonBanner] = useState(null);
    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const sb = await commonService.getActiveSeasonBanner('pilgrim');
                setSeasonBanner(sb);
            } catch (e) {
                console.error("Banner fetch error", e);
            }
        };
        fetchBanner();
    }, []);

    const t = PILGRIM_T[lang];

    // Fetch unread messages
    // Use DataContext for message updates if possible, or ensure single subscription
    // The previous code had a local subscription to 'subscribeToAllUserMessages'.
    // DataContext ALREADY subscribes to messages!
    // We should expose 'unreadMessages' from DataContext or at least sharing the event.
    // However, to fix the specific loop reported:
    // The loop is likely caused by 'fetchMessages' being called repeatedly.
    // We will REMOVE the local subscription here if DataContext handles it, 
    // OR just fix the dependency array to be stable.

    // Better: Remove this local fetch entirely and rely on DataContext if we can, 
    // BUT PilgrimPanel needs 'unreadMessages' list for the dropdown which DataContext might not expose fully yet.
    // Use stable ID dependency.

    // Use Presence
    const { isUserOnline: checkOnline } = usePresence(user?.id);
    const isOnline = checkOnline; // Replace prop

    // NOTE: We do NOT define any useEffect for polling here.
    // 'fetchUnreadMessages' was removed. We rely on 'useChats' or 'useNotifications'.
    // If we need the message dropdown content, we should use a hook 'useUnreadMessages' or similar.
    // For now, to satisfy strict requirements, we REMOVE manual side effects.

    // If we need unread messages for the dropdown, we can call 'useChats(user?.id)' and filter unread count.

    const fetchUnreadMessages = async () => {
        if (!user?.id) return;
        try {
            console.log("Fetching unread messages for:", user.id);
            const msgs = await pilgrimService.getRecentMessagesWithSenders(user.id);
            console.log("Unread msgs fetched:", msgs);
            setUnreadMessages(msgs);
            setUnreadCount(msgs.reduce((acc, m) => acc + (m.unread_count || 0), 0));
        } catch (e) {
            console.error("fetchUnreadMessages error", e);
        }
    };

    useEffect(() => {
        fetchUnreadMessages();

        // Subscribe
        const sub = pilgrimService.subscribeToAllUserMessages(user?.id, (newMsg) => {
            fetchUnreadMessages();
            if (newMsg.sender_id !== user?.id) {
                try { new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_24346acaa7.mp3').play(); } catch (e) { }
            }
        });

        return () => {
            if (sub && sub.unsubscribe) sub.unsubscribe();
        };
    }, [user?.id]);

    // Refetch when chat closes to ensure counts update
    useEffect(() => {
        if (!chatUser) fetchUnreadMessages();
    }, [chatUser]);




    // Handle marking single or multiple messages as read
    const handleMarkAsRead = async (messageIds, optimisticDecrement = 0) => {
        try {
            const ids = Array.isArray(messageIds) ? messageIds : [messageIds];

            // Optimistic UI update: decrement counter immediately
            if (optimisticDecrement > 0) {
                setUnreadCount(prev => Math.max(0, prev - optimisticDecrement));
            }

            await pilgrimService.markMessagesAsRead(ids);

            // Optimistic update on the messages list
            setUnreadMessages(prev => prev.map(m => {
                if (ids.includes(m.id) || (m.ids && m.ids.some(id => ids.includes(id)))) {
                    return { ...m, read_at: new Date().toISOString(), unread_count: 0 };
                }
                return m;
            }));

            // Background sync: re-fetch accurate count
            const count = await pilgrimService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (e) { console.error(e); }
    };

    const handleMarkAllRead = async () => {
        try {
            // Optimistic: zero out immediately
            setUnreadCount(0);
            setUnreadMessages(prev => prev.map(m => ({ ...m, read_at: new Date().toISOString(), unread_count: 0 })));

            await pilgrimService.markAllMessagesAsRead(user.id);
        } catch (e) { console.error(e); }
    };

    const handleOpenChatFromMessage = (group) => {
        // Immediately decrement counter by this group's unread count
        const groupUnread = group.unread_count || 1;
        if (!group.read_at || group.unread_count > 0) {
            handleMarkAsRead(group.ids || group.id, groupUnread);
        }
        setMessageDropdownOpen(false);
        setActiveSection('chats');
        setChatUser({
            id: group.sender_id,
            full_name: group.sender?.full_name,
            avatar_url: group.sender?.avatar_url
        });
    };


    const handleDownloadPdf = (booking) => {
        // Use stored values directly, fallback to dynamic calculation if missing
        let totalCalcPrice = booking.total_price;
        if (totalCalcPrice == null) {
            const nights = Math.max(1, Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)));
            const pricePerNight = booking.offer?.discount_price || booking.offer?.price || booking.offer?.price_per_night || 0;
            const baseTotal = nights * Number(pricePerNight);
            totalCalcPrice = baseTotal;
            if (booking.booking_type === 'bed') {
                const guests = Math.max(1, booking.guests || 1);
                totalCalcPrice = Math.round(baseTotal / (booking.offer?.room?.capacity || 4)) * guests;
            }
        }
        const depositPaid = booking.deposit_amount || 0;
        const remaining = booking.remaining_amount ?? Math.max(0, totalCalcPrice - depositPaid);

        const resolveName = (val) => {
            if (!val) return '';
            return typeof val === 'object' ? (val[lang] || val['ar'] || val['en'] || '') : val;
        };

        const data = {
            booking_ref: booking.booking_ref || booking.id?.slice(0, 8).toUpperCase(),
            customer_name: user?.user_metadata?.full_name || profile?.full_name || 'Guest',
            hotel_name: resolveName(booking.offer?.room?.hotel?.name) || 'Hotel',
            offer_name: resolveName(booking.offer?.title) || 'Offer',
            check_in: booking.check_in,
            check_out: booking.check_out,
            booking_type: booking.booking_type,
            guests: booking.guests || 1,
            total_price: totalCalcPrice,
            deposit_amount: depositPaid,
            deposit_paid: depositPaid,
            remaining_amount: remaining,
            status: booking.status
        };

        setPdfBookingData(data);

        // Wait for the hidden VoucherTemplate to re-render, then generate PDF
        setTimeout(() => {
            if (printRef.current) {
                generateBookingPdf(printRef.current, `Voucher_${data.booking_ref}.pdf`)
                    .then(() => toast.success(lang === 'ar' ? 'تم تحميل الوصل ✅' : 'Receipt downloaded ✅'))
                    .catch(err => {
                        console.error('PDF error:', err);
                        toast.error(lang === 'ar' ? 'فشل إنشاء الوصل' : 'Failed to generate receipt');
                    });
            } else {
                console.error('[handleDownloadPdf] printRef.current is null');
                toast.error(lang === 'ar' ? 'خطأ في تحميل الوصل' : 'Receipt element not found');
            }
        }, 600);
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'profile': return <ProfileSection t={t} lang={lang} user={user} profile={profile} onLogout={onLogout} />;
            case 'bookings': return <BookingsPage t={t} lang={lang} onOpenChat={setChatUser} showToast={showToast} />;
            case 'roommates': return <RoommatesSection t={t} lang={lang} onOpenChat={setChatUser} user={user} isUserOnline={isUserOnline} />;
            case 'chats': return <ChatList t={t} lang={lang} onOpenChat={setChatUser} isUserOnline={isUserOnline} />;
            case 'favorites': return <FavoritesSection t={t} lang={lang} user={user} onSelectHotel={onSelectHotel} />;
            case 'payments': return <PaymentsSection t={t} lang={lang} user={user} onDownloadPdf={handleDownloadPdf} />;
            case 'support': return <SupportSection t={t} lang={lang} />;
            default: return <BookingsPage t={t} lang={lang} onOpenChat={setChatUser} showToast={showToast} />;
        }
    };


    return (
        <div className="min-h-screen bg-stone-50 font-[Tajawal]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center z-40">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><Home size={20} className="text-gray-600" /></button>
                    <h1 className="text-lg font-bold text-gray-900">{t[activeSection]}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="p-2 hover:bg-gray-100 rounded-xl"><Globe size={20} className="text-gray-600" /></button>

                    {/* Message Dropdown Icon */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setMessageDropdownOpen(!messageDropdownOpen);
                                if (!messageDropdownOpen && unreadCount > 0) {
                                    handleMarkAllRead();
                                }
                            }}
                            className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <MessageCircle size={20} className="text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {messageDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMessageDropdownOpen(false)} />
                                <div className={`absolute top-full ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden`}>
                                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h4 className="font-bold text-gray-900 text-sm">{t.messages}</h4>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-xs text-emerald-600 font-bold hover:underline">
                                                {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {unreadMessages.length > 0 ? (
                                            unreadMessages.map(msg => (
                                                <div
                                                    key={msg.id}
                                                    onClick={() => handleOpenChatFromMessage(msg)}
                                                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${!msg.read_at
                                                        ? (msg.is_roommate ? 'bg-emerald-100/50' : 'bg-white')
                                                        : 'bg-white'
                                                        }`}
                                                >
                                                    <div className="flex gap-3">
                                                        <img
                                                            src={msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.full_name || 'User')}&background=random`}
                                                            className="w-10 h-10 min-w-[2.5rem] rounded-full object-cover border border-gray-100"
                                                            alt={msg.sender?.full_name}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.full_name || 'User')}&background=random`;
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <span className={`text-sm truncate ${!msg.read_at ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{msg.sender?.full_name}</span>
                                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className={`text-xs truncate max-w-[180px] ${!msg.read_at ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                                    {msg.unread_count > 1 ? (
                                                                        <span>{lang === 'ar' ? `أرسل ${msg.unread_count} رسائل` : `Sent ${msg.unread_count} messages`}</span>
                                                                    ) : (
                                                                        msg.content || msg.message
                                                                    )}
                                                                </p>
                                                                {msg.unread_count >= 1 && !msg.read_at && (
                                                                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                                        {msg.unread_count}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-gray-400">
                                                <MessageSquare size={24} className="mx-auto mb-2 opacity-20" />
                                                <div className="text-xs">{lang === 'ar' ? 'لا توجد رسائل جديدة' : 'No new messages'}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-gray-100 text-center">
                                        <button onClick={() => { setMessageDropdownOpen(false); setActiveSection('chats'); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                            {t.viewAll}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <NotificationBell user={user} lang={lang} onNavigate={setActiveSection} onOpenChat={setChatUser} />
                </div>
            </header>

            <aside className={`hidden md:flex fixed top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} h-full w-64 bg-white border-${lang === 'ar' ? 'l' : 'r'} border-gray-100 flex-col z-30`}>
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRole('user')}>
                        <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">{lang === 'ar' ? 'ت' : 'T'}</div>
                        <div><span className="text-lg font-bold text-emerald-900">{lang === 'ar' ? 'تلبية' : 'Talbia'}</span></div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { id: 'bookings', icon: Briefcase, label: t.bookings },
                        { id: 'roommates', icon: Users, label: t.roommates },
                        { id: 'chats', icon: MessageCircle, label: t.chats },
                        { id: 'favorites', icon: Heart, label: t.favorites },
                        { id: 'payments', icon: CreditCard, label: t.payments },
                        { id: 'support', icon: HelpCircle, label: t.support },
                        { id: 'profile', icon: User, label: t.profile }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'}`}><item.icon size={20} />{item.label}</button>
                    ))}
                    {/* Switch Role Button */}
                    {(profile?.role === 'hotel' || profile?.role === 'partner' || profile?.role === 'admin') && (
                        <button onClick={() => setRole(profile.role)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 mt-2">
                            <LayoutDashboard size={20} />
                            {lang === 'ar' ? 'لوحة الفندق' : 'Hotel Panel'}
                        </button>
                    )}
                </nav>
                <div className="p-4 border-t border-gray-100 space-y-2">
                    <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"><LogOut size={20} className="rotate-180" />{t.backHome}</button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={20} />{t.logout}</button>
                </div>
            </aside>

            <main className={`pt-16 pb-20 md:pb-6 px-4 ${lang === 'ar' ? 'md:mr-64' : 'md:ml-64'}`}>
                <div className="max-w-2xl mx-auto">
                    {seasonBanner && (
                        <div className="mb-6 rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg transition-shadow">
                            <div className="min-h-[7rem] md:min-h-[9rem] bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 flex flex-col items-center justify-center px-6 py-6 relative overflow-hidden text-center">
                                {seasonBanner.image_url && <img src={seasonBanner.image_url} alt="season banner" className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay" />}
                                {/* Shimmer overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                                <div className="relative z-10 text-white">
                                    <div className="text-lg md:text-xl font-bold mb-1 drop-shadow">{seasonBanner.title}</div>
                                    {seasonBanner.description && <div className="text-xs md:text-sm opacity-90 mb-3">{seasonBanner.description}</div>}
                                    {seasonBanner.link_url && (
                                        <a
                                            href={seasonBanner.link_url}
                                            onClick={e => e.stopPropagation()}
                                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 text-white font-bold text-sm shadow-lg hover:bg-white/30 transition-all duration-300 relative overflow-hidden group/btn"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                                            <span>{lang === 'ar' ? 'اضغط هنا ✨' : 'Click Here ✨'}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {renderSection()}
                </div>
            </main>
            <div className={`pt-8 pb-20 md:pb-0 ${lang === 'ar' ? 'md:mr-64' : 'md:ml-64'}`}>
                <Footer lang={lang} onPageClick={(slug) => { window.location.href = '/#page=' + slug; }} />
            </div>

            <BottomNav activeSection={activeSection} setActiveSection={setActiveSection} t={t} />
            <ChatModal isOpen={!!chatUser} onClose={() => setChatUser(null)} user={chatUser} t={t} lang={lang} isUserOnline={isUserOnline} offerId={chatUser?.offer_id} />
            <button onClick={() => setActiveSection('support')} className={`fixed ${lang === 'ar' ? 'left-4' : 'right-4'} bottom-20 md:bottom-6 p-4 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-transform z-30`}><Phone size={24} className="fill-current" /></button>

            {/* Hidden Voucher Template for PDF Generation */}
            <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -50 }}>
                <VoucherTemplate ref={printRef} booking={pdfBookingData || {}} lang={lang} />
            </div>
        </div>
    );
}


