import { useQuery } from '@tanstack/react-query';
import { pilgrimService } from '../services/pilgrimService';

export const useBookings = (userId) => {
    return useQuery({
        queryKey: ['bookings', userId],
        queryFn: () => pilgrimService.getBookings(userId),
        enabled: !!userId,
    });
};
