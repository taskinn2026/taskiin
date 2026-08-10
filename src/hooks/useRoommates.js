import { useQuery } from '@tanstack/react-query';
import { pilgrimService } from '../services/pilgrimService';
import { useBookings } from './useBookings';

export const useRoommates = (userId) => {
    // 1. Reuse Bookings Cache to get Offer IDs & User Dates
    const { data: bookings } = useBookings(userId);

    // Filter: User must have a confirmed/paid status
    const validBookings = bookings
        ? bookings.filter(b => b.status === 'confirmed' || b.status === 'paid' || b.status === 'completed')
        : [];

    const offerIds = validBookings.map(b => b.offer_id);

    return useQuery({
        queryKey: ['roommates', userId, offerIds.join(',')],
        queryFn: async () => {
            if (offerIds.length === 0) return [];
            const candidates = await pilgrimService.getRoommates(userId, offerIds);

            // Filter: Intersecting Dates
            const validCandidates = candidates.filter(candidate => {
                const myBookingsForOffer = validBookings.filter(ub => ub.offer_id === candidate.offer_id);
                // Check overlap with ANY of my bookings for this offer
                return myBookingsForOffer.some(myB => {
                    const cIn = new Date(candidate.check_in).getTime();
                    const cOut = new Date(candidate.check_out).getTime();
                    const bIn = new Date(myB.check_in).getTime();
                    const bOut = new Date(myB.check_out).getTime();
                    return (cIn < bOut && cOut > bIn);
                });
            });

            // Deduplicate by user profile
            const uniqueMates = [];
            const seen = new Set();
            for (const mate of validCandidates) {
                if (mate.profile?.id && !seen.has(mate.profile.id)) {
                    seen.add(mate.profile.id);
                    uniqueMates.push(mate);
                }
            }
            return uniqueMates;
        },
        enabled: !!userId && offerIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });
};
