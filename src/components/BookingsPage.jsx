import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Briefcase, MapPin, Calendar, Download, AlertCircle,
    Check, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { pilgrimService } from '../services/pilgrimService';
import { generateBookingPdf } from '../services/pdfService';
import VoucherTemplate from './VoucherTemplate';
import { supabase } from '../lib/supabase';
import { bookingService } from '../services/bookingService';
import { commonService } from '../services/commonService';

// Status Badge Component (reused locally or imported if shared)
const StatusBadge = ({ status, deposit_paid, t, lang, booking }) => {
    let effectiveStatus = status;
    if (booking && (status === 'paid' || status === 'confirmed')) {
        const remaining = booking.remaining_amount ?? ((booking.total_price || 0) - (booking.deposit_amount || 0));
        if (remaining > 0) effectiveStatus = 'confirmed';
        else effectiveStatus = 'paid';
    }

    if (effectiveStatus === 'paid') {
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">{lang === 'ar' ? 'تم الحجز' : 'Booked'}</span>;
    }
    if (effectiveStatus === 'confirmed') {
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm">{lang === 'ar' ? 'العربون مدفوع بانتظار إتمام الدفع' : 'Deposit Paid, Waiting Completion'}</span>;
    }
    if (effectiveStatus === 'pending') {
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">{lang === 'ar' ? 'بانتظار الدفع' : 'Waiting Payment'}</span>;
    }

    const styles = {
        confirmed: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700',
        cancelled: 'bg-red-50 text-red-700', completed: 'bg-blue-50 text-blue-700'
    };
    const labels = {
        confirmed: lang === 'ar' ? 'مؤكد' : 'Confirmed',
        pending: lang === 'ar' ? 'بانتظار التأكيد' : 'Pending',
        cancelled: lang === 'ar' ? 'ملغي' : 'Cancelled',
        completed: lang === 'ar' ? 'مكتمل' : 'Completed'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[effectiveStatus] || 'bg-gray-100'}`}>{labels[effectiveStatus] || effectiveStatus}</span>;
};

// BottomSheet Component (reused locally or imported if shared)
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

import { useBookings } from '../hooks/useBookings';

const BookingsPage = ({ t, lang, onOpenChat, showToast }) => {
    // Consume Global Data (User only)
    const { user } = useData();

    // Lazy Load Bookings
    const { data: globalBookings = [], isLoading: globalLoading, refetch: refreshBookings } = useBookings(user?.id);

    // Local State for UI only
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelModal, setCancelModal] = useState({ open: false, booking: null });

    // PDF Generation State
    const [pdfBookingData, setPdfBookingData] = useState(null);
    const printRef = useRef();

    const [exchangeRate, setExchangeRate] = useState(35.80);
    useEffect(() => {
        supabase.from('exchange_rates')
            .select('rate')
            .eq('target_currency', 'DZD')
            .eq('base_currency', 'SAR')
            .single()
            .then(res => setExchangeRate(res.data?.rate || 35.80))
            .catch(() => setExchangeRate(35.80));
    }, []);

    useEffect(() => {
        if (pdfBookingData && printRef.current) {
            // Wait for render cycle to update the hidden template
            const timer = setTimeout(async () => {
                try {
                    await generateBookingPdf(printRef.current, `Voucher-${pdfBookingData.booking_ref}.pdf`);
                } catch (e) {
                    console.error(e);
                    if (showToast) showToast(lang === 'ar' ? 'حدث خطأ' : 'Error');
                } finally {
                    setPdfBookingData(null); // Reset
                }
            }, 500); // 500ms delay to ensure images load
            return () => clearTimeout(timer);
        }
    }, [pdfBookingData]);

    const handleCancelConfirm = async () => {
        if (!cancelModal.booking) return;
        try {
            await pilgrimService.cancelBooking(cancelModal.booking.id);
            // Refresh global data
            await refreshBookings();
            setCancelModal({ open: false, booking: null });
        } catch (e) { if (showToast) showToast(e.message); }
    };

    // Room type translations
    const roomTypeAr = { double: 'غرفة ثنائية', triple: 'غرفة ثلاثية', quad: 'غرفة رباعية', quint: 'غرفة خماسية' };

    if (globalLoading && globalBookings.length === 0) return <div className="text-center py-10 text-gray-400">{t.loading}</div>;

    // Note: accessing properties of undefined objects is safe in optional chaining, but globalBookings default is []
    if (globalBookings.length === 0) return <div className="text-center py-10 bg-white rounded-2xl"><Briefcase className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500">{t.noData}</p></div>;

    return (
        <div className="space-y-4 pb-20">
            <h2 className="text-lg font-bold text-gray-900">{t.upcomingBookings}</h2>
            {globalBookings.map(booking => {
                // Correct data path: offer -> room -> hotel
                const offer = booking.offer || {};
                const room = offer.room || {};
                const hotel = room.hotel || {};
                const price = offer.discount_price || offer.price_per_night || 0;
                const nights = booking.check_in && booking.check_out ? Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)) : 1;
                const roomPriceForDuration = price * nights;
                const totalPrice = booking.booking_type === 'bed' ? (Math.round(roomPriceForDuration / (room?.capacity || 4)) * (booking.guests || 1)) : roomPriceForDuration;

                return (
                    <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="relative h-36">
                            <img src={room.images?.[0] || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'} alt="" className="w-full h-full object-cover" />
                            <div className={`absolute top-3 ${lang === 'ar' ? 'left-3' : 'right-3'}`}>
                                <StatusBadge booking={booking} status={booking.status} deposit_paid={booking.deposit_paid} t={t} lang={lang} />
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{offer.title || (lang === 'ar' ? 'عرض' : 'Offer')}</h3>
                            <div className="text-sm text-gray-500 mb-1">{hotel.name}</div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1"><MapPin size={14} />{hotel.distance_to_haram_meters ? `${hotel.distance_to_haram_meters}م` : hotel.city}</span>
                                <span>{lang === 'ar' ? roomTypeAr[room.room_type] || room.room_type : room.room_type}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                <span className="flex items-center gap-1"><Calendar size={12} />{booking.check_in}</span>
                                <span>→</span>
                                <span>{booking.check_out}</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{nights} {nights > 1 ? t.nights : t.night}</span>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                <div><span className="text-xl font-bold text-emerald-800">{totalPrice.toLocaleString()}</span><span className="text-sm text-gray-500 mr-1"> {t.currency}</span></div>
                                <div className="flex gap-2">
                                    {/* Logic Fix 3: Strict Status Display Logic */}
                                    {/* We use StatusBadge in the image area, but we can also show action buttons here */}
                                    {(() => {
                                        let effStatus = booking.status;
                                        if (booking.status === 'paid' || booking.status === 'confirmed') {
                                            const remaining = booking.remaining_amount ?? (totalPrice - (booking.deposit_amount || 0));
                                            effStatus = remaining > 0 ? 'confirmed' : 'paid';
                                        }
                                        if (booking.status === 'completed') effStatus = 'completed';
                                        return (
                                            <>
                                                {effStatus === 'confirmed' && (
                                                    <button className="px-3 py-1 text-xs font-bold text-cyan-700 bg-cyan-50 rounded-lg flex items-center gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const data = {
                                                                booking_ref: booking.booking_ref || booking.id.slice(0, 8).toUpperCase(),
                                                                customer_name: user?.user_metadata?.full_name || 'Guest',
                                                                hotel_name: hotel.name ? (typeof hotel.name === 'object' ? (hotel.name[lang] || hotel.name['en']) : hotel.name) : 'Hotel',
                                                                offer_name: offer.title ? (typeof offer.title === 'object' ? (offer.title[lang] || offer.title['en']) : offer.title) : 'Offer',
                                                                check_in: booking.check_in,
                                                                check_out: booking.check_out,
                                                                total_price: totalPrice || offer.price || 0,
                                                                deposit_paid: booking.deposit_amount || 0,
                                                                remaining_amount: booking.remaining_amount || (totalPrice - (booking.deposit_amount || 0)),
                                                                status: booking.status,
                                                                booking_type: booking.booking_type,
                                                                guests: booking.guests || 1,
                                                                exchange_rate: exchangeRate
                                                            };
                                                            setPdfBookingData(data);
                                                            if (showToast) showToast(lang === 'ar' ? 'جاري تحميل الوصل...' : 'Downloading Receipt...');
                                                        }}
                                                    >
                                                        <Download size={14} /> {lang === 'ar' ? 'وصل العربون' : 'Deposit Receipt'}
                                                    </button>
                                                )}
                                                {(effStatus === 'paid' || effStatus === 'completed') && (
                                                    <button className="px-3 py-1 text-xs font-bold text-green-700 bg-green-50 rounded-lg flex items-center gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const data = {
                                                                booking_ref: booking.booking_ref || booking.id.slice(0, 8).toUpperCase(),
                                                                customer_name: user?.user_metadata?.full_name || 'Guest',
                                                                hotel_name: hotel.name ? (typeof hotel.name === 'object' ? (hotel.name[lang] || hotel.name['en']) : hotel.name) : 'Hotel',
                                                                offer_name: offer.title ? (typeof offer.title === 'object' ? (offer.title[lang] || offer.title['en']) : offer.title) : 'Offer',
                                                                check_in: booking.check_in,
                                                                check_out: booking.check_out,
                                                                total_price: totalPrice || offer.price || 0,
                                                                deposit_paid: booking.deposit_amount || 0,
                                                                remaining_amount: booking.remaining_amount || (totalPrice - (booking.deposit_amount || 0)),
                                                                status: booking.status,
                                                                booking_type: booking.booking_type,
                                                                guests: booking.guests || 1,
                                                                exchange_rate: exchangeRate
                                                            };
                                                            setPdfBookingData(data);
                                                            if (showToast) showToast(lang === 'ar' ? 'جاري تحميل الوصل...' : 'Downloading Receipt...');
                                                        }}
                                                    >
                                                        <Download size={14} /> {lang === 'ar' ? (effStatus === 'completed' ? 'وصل الحجز النهائي' : 'تحميل الوصل') : (effStatus === 'completed' ? 'Final Receipt' : 'Receipt')}
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                    {/* Default confirmed badge handled by StatusBadge */}

                                    {booking.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            {booking.payments?.some(p => p.status === 'failed') && (
                                                <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                                                    ❌ {lang === 'ar' ? 'فشل دفع العربون' : 'Payment Failed'}
                                                </span>
                                            )}
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        if (showToast) showToast(lang === 'ar' ? 'جاري تحويلك للدفع...' : 'Redirecting to payment...');
                                                        console.log('[Payment Debug] Button Clicked', { bookingId: booking?.id, userId: user?.id });

                                                        if (!booking?.id) throw new Error('Booking ID is missing');
                                                        if (!user?.id) throw new Error('User ID is missing'); // Optional: Allow paying without user ID? No, logic requires it.

                                                        const customChargilyLink = await commonService.getAppSettings('chargily_link');
                                                        if (customChargilyLink && customChargilyLink.trim() !== '') {
                                                            window.location.href = customChargilyLink;
                                                            return;
                                                        }

                                                        const session = await bookingService.createCheckoutSession(
                                                            booking.id,
                                                            user?.id,
                                                            booking.booking_ref || booking.id.toString().slice(0, 8).toUpperCase()
                                                        );

                                                        // Fix: createCheckoutSession now returns an object { checkout_url: ... }
                                                        const checkoutUrl = session.checkout_url || session.url || (session.data && session.data.checkout_url);

                                                        if (!checkoutUrl) throw new Error('No checkout URL returned');
                                                        window.location.href = checkoutUrl;
                                                    } catch (err) {
                                                        console.error(err);
                                                        if (showToast) showToast(lang === 'ar' ? 'خطأ في بدء الدفع' : 'Payment Error');
                                                    }
                                                }}
                                                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm shadow-emerald-200"
                                            >
                                                {booking.payments?.some(p => p.status === 'failed')
                                                    ? (lang === 'ar' ? 'إعادة المحاولة' : 'Retry Payment')
                                                    : (lang === 'ar' ? 'دفع العربون' : 'Pay Deposit')}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setCancelModal({ open: true, booking }); }} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">{t.cancel}</button>
                                        </div>
                                    )}
                                    <button onClick={() => setSelectedBooking({ ...booking, offer, room, hotel, totalPrice, nights })} className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">{t.bookingDetails}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Booking Details Modal */}
            <BottomSheet isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title={t.bookingDetails}>
                {selectedBooking && (
                    <div className="space-y-4">
                        <img src={selectedBooking.room?.images?.[0] || selectedBooking.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'} alt="" className="w-full h-40 object-cover rounded-xl" />

                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">{selectedBooking.hotel?.name || selectedBooking.offer?.room?.hotel?.name}</h4>
                            <p className="text-sm font-medium text-emerald-800 mb-1">{selectedBooking.offer?.title}</p>
                            <p className="text-sm text-gray-500">{selectedBooking.hotel?.city || selectedBooking.offer?.room?.hotel?.city}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 mb-1">{t.checkIn}</div>
                                <div className="font-bold text-gray-900">{selectedBooking.check_in}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <div className="text-xs text-gray-500 mb-1">{t.checkOut}</div>
                                <div className="font-bold text-gray-900">{selectedBooking.check_out}</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl">
                            <div className="text-xs text-gray-500 mb-1">{t.roomDetails}</div>
                            <div className="font-medium text-gray-900 mb-2">
                                {lang === 'ar' ? roomTypeAr[selectedBooking.room?.room_type] || selectedBooking.room?.room_type : selectedBooking.room?.room_type}
                            </div>

                            {/* Detailed Booking Info */}
                            <div className="flex gap-4 border-t border-gray-200 pt-2">
                                <div>
                                    <span className="text-xs text-gray-500 block">{lang === 'ar' ? 'نوع الحجز' : 'Booking Type'}</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {selectedBooking.booking_type === 'room' || selectedBooking.booking_type === 'full'
                                            ? (lang === 'ar' ? 'غرفة كاملة' : 'Full Room')
                                            : (lang === 'ar' ? 'حجز سرير' : 'Bed Booking')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block">{lang === 'ar' ? 'العدد' : 'Count'}</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {selectedBooking.booking_type === 'room' || selectedBooking.booking_type === 'full'
                                            ? (lang === 'ar' ? '1 غرفة' : '1 Room')
                                            : `${selectedBooking.guests || 1} ${lang === 'ar' ? 'سرير' : 'Bed(s)'}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">{t.price} × {selectedBooking.nights} {selectedBooking.nights > 1 ? t.nights : t.night}</span>
                                <span className="font-medium">{(selectedBooking.offer?.discount_price || selectedBooking.offer?.price_per_night || 0).toLocaleString()} {t.currency}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                                <span className="font-bold text-gray-900">{lang === 'ar' ? 'المجموع' : 'Total'}</span>
                                <span className="text-xl font-bold text-emerald-800">{selectedBooking.totalPrice?.toLocaleString()} {t.currency}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-600">{t.status}</span>
                            <StatusBadge status={selectedBooking.status} t={t} />
                        </div>

                        {selectedBooking.booking_ref && (
                            <div className="text-center text-xs text-gray-400">
                                {lang === 'ar' ? 'رقم الحجز:' : 'Booking Ref:'} <span className="font-mono font-bold">{selectedBooking.booking_ref}</span>
                            </div>
                        )}

                        {/* PDF Download Button - Only show if actually paid something */}
                        {(selectedBooking.status === 'paid' || selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') && (
                            <button
                                onClick={() => {
                                    const data = {
                                        booking_ref: selectedBooking.booking_ref || selectedBooking.id.slice(0, 8).toUpperCase(),
                                        customer_name: user?.user_metadata?.full_name || 'Guest',
                                        hotel_name: selectedBooking.hotel.name ? (typeof selectedBooking.hotel.name === 'object' ? (selectedBooking.hotel.name[lang] || selectedBooking.hotel.name['en']) : selectedBooking.hotel.name) : 'Hotel',
                                        offer_name: selectedBooking.offer.title ? (typeof selectedBooking.offer.title === 'object' ? (selectedBooking.offer.title[lang] || selectedBooking.offer.title['en']) : selectedBooking.offer.title) : 'Offer',
                                        check_in: selectedBooking.check_in || selectedBooking.checkIn,
                                        check_out: selectedBooking.check_out || selectedBooking.checkOut,
                                        booking_type: selectedBooking.type,
                                        guests: selectedBooking.guests || 1,
                                        // Calculate total on the fly for Modal
                                        deposit_paid: selectedBooking.deposit_amount || 0,
                                        total_price: selectedBooking.totalPrice || selectedBooking.total_price || 0,
                                        remaining_amount: selectedBooking.remaining_amount || ((selectedBooking.totalPrice || 0) - (selectedBooking.deposit_amount || 0)),
                                        status: selectedBooking.status,
                                        exchange_rate: exchangeRate
                                    };
                                    setPdfBookingData(data);
                                    // Show loading feedback
                                    if (showToast) showToast(lang === 'ar' ? 'جاري تحميل الوصل...' : 'Downloading Receipt...');
                                    // Delay handled by effect now (or keep simple)
                                }}
                                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={18} />
                                {lang === 'ar'
                                    ? (selectedBooking.status === 'completed' ? 'تحميل وصل الحجز النهائي (PDF)' : 'تحميل وصل العربون (PDF)')
                                    : (selectedBooking.status === 'completed' ? 'Download Final Booking Receipt (PDF)' : 'Download Deposit Voucher (PDF)')
                                }
                            </button>
                        )}
                    </div>
                )}
            </BottomSheet>

            {/* Hidden Voucher Template */}
            <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -50 }}>
                <VoucherTemplate ref={printRef} booking={pdfBookingData || {}} lang={lang} />
            </div>

            {/* Cancel Confirmation Modal */}
            {cancelModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCancelModal({ open: false, booking: null })}>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{lang === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}</h3>
                            <p className="text-sm text-gray-500">{lang === 'ar' ? 'هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to cancel this booking? This action cannot be undone.'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl mb-4">
                            <div className="font-bold text-gray-900">{cancelModal.booking?.offer?.title || cancelModal.booking?.offer?.room?.hotel?.name}</div>
                            <div className="text-xs text-gray-500">{cancelModal.booking?.check_in} → {cancelModal.booking?.check_out}</div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setCancelModal({ open: false, booking: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                {lang === 'ar' ? 'تراجع' : 'Go Back'}
                            </button>
                            <button onClick={handleCancelConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
                                {lang === 'ar' ? 'تأكيد الإلغاء' : 'Cancel Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingsPage;
