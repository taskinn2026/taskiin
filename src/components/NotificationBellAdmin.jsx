import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info, DollarSign, MessageSquare, Briefcase, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function NotificationBellAdmin() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const audioRef = useRef(typeof window !== 'undefined' ? new Audio('/sounds/notification.mp3') : null);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('receiver_role', 'admin')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read)?.length || 0);
        } catch (err) {
            console.error('Error fetching admin notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const subscription = supabase.channel('admin_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `receiver_role=eq.admin`
                },
                (payload) => {
                    const newNotif = payload.new;
                    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);

                    if (audioRef.current) {
                        audioRef.current.play().catch(e => console.error("Audio play blocked", e));
                    }

                    toast.success(`إشعار إداري جديد: ${newNotif.title}`);
                }
            )
            .subscribe();

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            supabase.removeChannel(subscription);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('receiver_role', 'admin')
                .eq('is_read', false);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Error marking admin notifications read:', err);
        }
    };

    const toggleDropdown = () => {
        if (!isOpen) {
            markAsRead();
        }
        setIsOpen(!isOpen);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'payment': return <DollarSign size={16} className="text-green-600" />;
            case 'booking': return <Briefcase size={16} className="text-blue-600" />;
            case 'chat': return <MessageSquare size={16} className="text-purple-600" />;
            case 'admin': return <Calendar size={16} className="text-amber-600" />;
            default: return <Info size={16} className="text-gray-600" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="p-2 rounded-full hover:bg-gray-100 relative transition-colors focus:outline-none"
                aria-label="Admin Notifications"
            >
                <Bell size={24} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center translate-x-1 -translate-y-1 shadow-sm border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">التنبيهات الإدارية</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                                {unreadCount} جديد
                            </span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <CheckCircle size={32} className="text-gray-300 mb-3" />
                                <p>لا توجد تنبيهات حالياً</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 transition-colors hover:bg-gray-50 flex gap-3 items-start ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100 mt-1">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm text-gray-900 truncate pr-2">{notif.title}</h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap pt-0.5" dir="ltr">
                                                    {new Date(notif.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{notif.body}</p>

                                            {notif.data?.booking_id && (
                                                <a
                                                    href={`/booking/${notif.data.booking_id}`}
                                                    className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                                >
                                                    <ExternalLink size={12} />
                                                    عرض الحجز
                                                </a>
                                            )}
                                            {notif.data?.url && (
                                                <a
                                                    href={notif.data.url}
                                                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    <ExternalLink size={12} />
                                                    عرض الرابط
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
