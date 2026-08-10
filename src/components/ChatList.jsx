import React from 'react';
import { MessageCircle, User, Check, Clock } from 'lucide-react';
import { useChats } from '../hooks/useChats';
import { useData } from '../context/DataContext';

const ChatList = ({ t, lang, onOpenChat, isUserOnline }) => {
    // Consume Global Data for user only
    const { user } = useData();
    // Lazy load chats locally
    const { data: globalChats = [], isLoading: globalLoading } = useChats(user?.id);

    if (globalLoading && globalChats.length === 0) return <div className="text-center py-10 text-gray-400">{t.loading}</div>;

    if (globalChats.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-300">
                    <MessageCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noResults}</h3>
                <p className="text-sm text-gray-500">{lang === 'ar' ? 'لا توجد محادثات نشطة' : 'No active conversations'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <h2 className="text-lg font-bold text-gray-900">{t.chats}</h2>
            <div className="grid grid-cols-1 gap-2">
                {globalChats.map(chat => {
                    const isOnline = isUserOnline && chat.userId ? isUserOnline(chat.userId) : false;
                    return (
                        <div key={chat.id} onClick={() => onOpenChat(chat)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden"
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        >
                            {/* Hover effect highlight */}
                            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="relative">
                                {chat.img ? (
                                    <img src={chat.img} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-lg border-2 border-white shadow-sm">
                                        {chat.user?.charAt(0) || <User />}
                                    </div>
                                )}
                                {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                                )}
                            </div>

                            <div className="flex-1 relative z-10 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="font-bold text-gray-900 truncate pr-2">{chat.user}</h4>
                                    {chat.time && (
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate max-w-[85%] group-hover:text-emerald-700 transition-colors">
                                        {chat.lastMsg || (lang === 'ar' ? 'رسالة صوتية / صورة' : 'Attachment')}
                                    </p>
                                    {chat.unread > 0 ? (
                                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm animate-bounce">
                                            {chat.unread}
                                        </span>
                                    ) : (
                                        <Check size={14} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatList;
