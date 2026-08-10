import { useQuery } from '@tanstack/react-query';
import { hotelService } from '../services/hotelService';

export const useFeaturedOffers = () => {
    return useQuery({
        queryKey: ['featured-offers'],
        queryFn: () => hotelService.getFeaturedOffers(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
    });
};
