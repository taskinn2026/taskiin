import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';

/**
 * Hook to fetch verified guests (roommates) for an offer.
 * Used for restoring Avatars in Hotel Details.
 * @param {string} offerId - The ID of the offer.
 * @param {string} checkIn - Optional check-in date filter.
 * @param {string} checkOut - Optional check-out date filter.
 * @param {string} currentUserId - Optional ID to exclude current user.
 * @returns {Object} - Query result containing pilgrims list.
 */
export const useOfferPilgrims = (offerId, checkIn = null, checkOut = null, currentUserId = null, options = {}) => {
    const hasDates = checkIn && checkOut;

    return useQuery({
        queryKey: ['offer-pilgrims', offerId, checkIn, checkOut],
        queryFn: () => bookingService.getOfferPilgrims(offerId, checkIn, checkOut, currentUserId, hasDates ? null : 3),
        enabled: !!offerId && (options.enabled !== false),
        ...options
    });
};
