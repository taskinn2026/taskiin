const fs = require('fs');

const file = 'c:/Users/AMER/Desktop/projects Antigravity/ttaskinn/src/services/bookingService.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `
        // Calculate Deposit (1 Night)
        const pricePerNight = booking.offer.discount_price || booking.offer.price_per_night;
        // Basic calc: 1 Night * Guests (if per person) or just 1 Night (if per room).
        // Assuming offer price is per person/bed or room based on context, but user just wants "Deposit Amount".
        // Rule from Task 2: "Deposit Rule: 1 Night Price".
        const amount = pricePerNight;

        if (amount <= 0) throw new Error('Invalid amount');
`;

const replacementStr = `
        // Calculate Deposit type based on numberOfNights being 1 or more
        const cIn = new Date(booking.check_in);
        const cOut = new Date(booking.check_out);
        const nights = Math.max(1, Math.round(Math.abs(cOut - cIn) / (1000 * 60 * 60 * 24)));

        // Use deposit_amount calculated securely from the frontend App.jsx CheckoutFlow
        const amount = booking.deposit_amount || (booking.offer.discount_price || booking.offer.price_per_night);
        const paymentType = nights === 1 ? 'full' : 'deposit';

        if (amount <= 0) throw new Error('Invalid amount');
`;

// Fixing the metadata part
const metadataTarget = `
            metadata: {
                booking_id: bookingId,
                booking_ref: bookingRef,
                user_id: userId,
                amount_expected: amount,
                type: 'deposit'
            }
`;

const metadataReplacement = `
            metadata: {
                booking_id: bookingId,
                booking_ref: bookingRef,
                user_id: userId,
                amount_expected: amount,
                type: paymentType
            }
`;

// Also update the select statement to fetch deposit_amount
const selectTarget = `select('offer:offers(price_per_night, discount_price), guests, check_in, check_out')`;
const selectReplacement = `select('offer:offers(price_per_night, discount_price), guests, check_in, check_out, deposit_amount')`;

content = content.replace(targetStr.trim(), replacementStr.trim());
content = content.replace(metadataTarget.trim(), metadataReplacement.trim());
content = content.replace(selectTarget.trim(), selectReplacement.trim());

fs.writeFileSync(file, content);
console.log('bookingService.js updated successfully');
