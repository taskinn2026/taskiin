
import React, { forwardRef } from 'react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

const VoucherTemplate = forwardRef(({ booking, lang = 'ar' }, ref) => {
    const isRTL = lang === 'ar';
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        if (booking?.booking_ref) {
            QRCode.toDataURL(window.location.origin + '/bookings/' + booking.booking_ref)
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error(err));
        }
    }, [booking]);

    const depositPaidAmount = (booking.deposit_amount ?? booking.deposit_paid) || 0;
    const totalAmount = booking.total_price || depositPaidAmount;
    const remainingCalc = booking.remaining_amount ?? Math.max(0, totalAmount - depositPaidAmount);
    
    const isPaid = booking.status === 'paid' || remainingCalc === 0;

    const t = {
        title: isRTL ? 'تلبية تسكين' : 'Talbiyah Taskin',
        subtitle: isRTL
            ? (isPaid ? 'وصل إتمام الحجز' : 'وصل العربون')
            : (isPaid ? 'Final Booking Receipt' : 'Deposit Receipt'),
        ref: isRTL ? 'رقم الحجز' : 'Booking Reference',
        details: isRTL ? 'تفاصيل الحجز' : 'Booking Details',
        customer: isRTL ? 'اسم العميل' : 'Customer Name',
        hotel: isRTL ? 'الفندق' : 'Hotel',
        offer: isRTL ? 'اسم العرض' : 'Offer Name',
        checkIn: isRTL ? 'الوصول' : 'Check-in',
        checkOut: isRTL ? 'المغادرة' : 'Check-out',
        payment: isRTL ? 'تفاصيل الدفع' : 'Payment Details',
        total: isRTL ? 'الإجمالي' : 'Total Price',
        deposit: isRTL ? 'العربون (مدفوع)' : 'Deposit (Paid)',
        remaining: isRTL
            ? (isPaid ? 'المتبقي (تم الدفع كلياً)' : 'المتبقي (للدفع في الفندق)')
            : (isPaid ? 'Remaining (Fully Paid)' : 'Remaining (Pay at Hotel)'),
        currency: isRTL ? 'د.ج' : 'DZD',
        footer: isRTL ? 'شكراً لاختياركم تلبية تسكين' : 'Thank you for choosing Talbiyah Taskin',
        scan: isRTL ? 'امسح للتحقق' : 'Scan to Verify',
        date: isRTL ? 'تاريخ الإصدار' : 'Issue Date'
    };

    return (
        <div ref={ref} className="bg-[#ffffff] text-[#111827] p-8 w-[210mm] min-h-[297mm] mx-auto relative font-sans" dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#065f46] pb-6 mb-8">
                {/* Logo Section */}
                <div className="w-24 h-24 flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-[#065f46] mb-1">{t.title}</h1>
                    <p className="text-[#6b7280] text-sm">{t.subtitle}</p>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-8">

                {/* Reference Box */}
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-6 text-center">
                    <p className="text-[#6b7280] text-sm mb-2">{t.ref}</p>
                    <p className="text-4xl font-mono font-bold text-[#064e3b] tracking-wider">{booking.booking_ref}</p>
                </div>

                {/* Booking Details */}
                <div>
                    <h3 className="text-xl font-bold text-[#065f46] mb-4 border-b border-[#f3f4f6] pb-2">{t.details}</h3>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div className="text-[#6b7280]">{t.customer}</div>
                        <div className="font-bold text-[#111827]">{booking.customer_name}</div>

                        <div className="text-[#6b7280]">{t.hotel}</div>
                        <div className="font-bold text-[#111827]">{booking.hotel_name}</div>

                        <div className="text-[#6b7280]">{t.offer}</div>
                        <div className="font-bold text-[#111827]">{booking.offer_name}</div>

                        <div className="text-[#6b7280]">{t.checkIn}</div>
                        <div className="font-bold text-[#111827]">{booking.check_in}</div>

                        <div className="text-[#6b7280]">{t.checkOut}</div>
                        <div className="font-bold text-[#111827]">{booking.check_out}</div>

                        {/* NEW: Booking Type & Guests in PDF */}
                        <div className="text-[#6b7280]">{isRTL ? 'نوع الحجز' : 'Booking Type'}</div>
                        <div className="font-bold text-[#111827]">
                            {booking.booking_type === 'room' || booking.booking_type === 'full'
                                ? (isRTL ? 'غرفة كاملة' : 'Full Room')
                                : (isRTL ? 'حجز سرير' : 'Bed Booking')}
                        </div>

                        <div className="text-[#6b7280]">{isRTL ? 'العدد' : 'Count'}</div>
                        <div className="font-bold text-[#111827]">
                            {booking.booking_type === 'room' || booking.booking_type === 'full'
                                ? (isRTL ? '1 غرفة' : '1 Room')
                                : `${booking.guests || 1} ${isRTL ? 'سرير' : 'Bed(s)'}`}
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div>
                    <h3 className="text-xl font-bold text-[#065f46] mb-4 border-b border-[#f3f4f6] pb-2">{t.payment}</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-[#ecfdf5] text-[#064e3b]">
                            <tr>
                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'البند' : 'Item'}</th>
                                <th className={`p-3 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'المبلغ' : 'Amount'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            <tr>
                                <td className="p-3 text-[#111827]">{t.total}</td>
                                <td className={`p-3 font-bold text-[#111827] ${isRTL ? 'text-left' : 'text-right'}`}>
                                    <div className="flex flex-col">
                                        <span>{Math.round(totalAmount / (booking.exchange_rate || 35.80)).toLocaleString()} SAR</span>
                                        <span className="text-xs opacity-70" dir="ltr">({totalAmount.toLocaleString()} {t.currency})</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-3 text-[#047857]">{t.deposit}</td>
                                <td className={`p-3 font-bold text-[#047857] ${isRTL ? 'text-left' : 'text-right'}`}>
                                    <div className="flex flex-col">
                                        <span>{Math.round(depositPaidAmount / (booking.exchange_rate || 35.80)).toLocaleString()} SAR</span>
                                        <span className="text-xs opacity-70" dir="ltr">({depositPaidAmount.toLocaleString()} {t.currency})</span>
                                    </div>
                                </td>
                            </tr>
                            <tr className={isPaid ? "bg-[#ecfdf5]" : "bg-[#fef2f2]"}>
                                <td className={`p-3 font-bold ${isPaid ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>{t.remaining}</td>
                                <td className={`p-3 font-bold ${isPaid ? 'text-[#047857]' : 'text-[#b91c1c]'} text-lg ${isRTL ? 'text-left' : 'text-right'}`}>
                                    <div className="flex flex-col">
                                        <span>{Math.round(remainingCalc / (booking.exchange_rate || 35.80)).toLocaleString()} SAR</span>
                                        <span className={`text-xs ${isPaid ? 'opacity-70' : 'opacity-80'}`} dir="ltr">({remainingCalc.toLocaleString()} {t.currency})</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Footer */}
            <div className="absolute bottom-12 left-0 right-0 px-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {qrCodeUrl && (
                        <div className="bg-[#ffffff] p-2 rounded-lg border border-[#e5e7eb]">
                            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                        </div>
                    )}
                    <p className="text-xs text-center text-[#6b7280]">{t.scan}</p>

                    <div className="w-full border-t border-[#e5e7eb] pt-4 flex justify-between text-xs text-[#9ca3af] mt-4">
                        <span>{t.date}: {new Date().toLocaleDateString()}</span>
                        <span>{t.footer}</span>
                    </div>
                </div>
            </div>

        </div>
    );
});

export default VoucherTemplate;
