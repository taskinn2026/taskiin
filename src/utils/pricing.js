export const calculatePrice = (basePrice, roomPrices, startDate, endDate) => {
    if (!startDate || !endDate) return basePrice;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneDay = 24 * 60 * 60 * 1000;
    const nights = Math.round(Math.abs((end - start) / oneDay));

    // Safety check
    if (nights <= 0) return basePrice;

    let totalPrice = 0;
    for (let i = 0; i < nights; i++) {
        const current = new Date(start.getTime() + (i * oneDay));
        const currentStr = current.toISOString().split('T')[0];

        // Find custom price for this date
        // roomPrices: [{ id, start_date, end_date, price }]
        const custom = roomPrices?.find(p =>
            currentStr >= p.start_date && currentStr <= p.end_date
        );

        if (custom) {
            totalPrice += Number(custom.price);
        } else {
            totalPrice += Number(basePrice);
        }
    }

    return totalPrice;
};

/**
 * Returns the price for the first night only, respecting seasonal overrides.
 * Used to calculate the deposit amount (1-night deposit).
 */
export const calculateFirstNightPrice = (basePrice, roomPrices, startDate) => {
    if (!startDate) return Number(basePrice);
    const start = new Date(startDate);
    const currentStr = start.toISOString().split('T')[0];

    // Check if there's a custom seasonal price for the check-in date
    const custom = roomPrices?.find(p =>
        currentStr >= p.start_date && currentStr <= p.end_date
    );

    return custom ? Number(custom.price) : Number(basePrice);
};
