import React, { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';

const PaymentFailure = () => {
    const [bookingId, setBookingId] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setBookingId(params.get('booking_id'));
    }, []);

    const handleReturn = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} className="text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-500 mb-6">
                    We could not process your payment. Please try again.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleReturn}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleReturn}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;
