import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { commonService } from '../services/commonService';

const PaymentSuccess = () => {
    const [bookingId, setBookingId] = useState('');
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('booking_id');
        setBookingId(id);

        if (id) {
            // Fetch booking to get the deposit amount and update status/payments
            bookingService.getBookingById(id)
                .then(booking => {
                    if (booking && booking.status !== 'confirmed' && booking.status !== 'paid') {
                        return Promise.all([
                            bookingService.updateBookingStatus(id, 'confirmed', { deposit_paid: true }),
                            bookingService.createPayment(id, booking.deposit_amount || 0, 'chargily'),
                            // Frontend Notification sending removed. Database handles 'deposit paid' booking notifications directly.
                        ]);
                    }
                    return Promise.resolve();
                })
                .then(() => setStatus('success'))
                .catch(err => {
                    console.error("Error confirming booking:", err);
                    setStatus('error');
                });
        }
    }, []);

    const handleReturn = () => {
        window.location.href = '/'; // Go back to home/dashboard
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                {status === 'processing' ? (
                    <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                ) : status === 'error' ? (
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-red-600 font-bold text-3xl">!</span>
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {status === 'processing' ? 'Processing Payment...' : status === 'error' ? 'Payment Verified, Error Updating Status' : 'Payment Successful!'}
                </h1>
                <p className="text-gray-500 mb-6">
                    {status === 'processing' ? 'Please wait while we confirm your booking.' : 'Your deposit has been received. Your booking is confirmed.'}
                    <br />
                    <span className="text-xs text-gray-400">Ref: {bookingId}</span>
                </p>
                <button
                    onClick={handleReturn}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                    Return to Home
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccess;
