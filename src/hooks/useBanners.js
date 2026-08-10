import { useQuery } from '@tanstack/react-query';
import { commonService } from '../services/commonService';

// useBanners hook - Fetch banners with caching
export const useBanners = () => {
    return useQuery({
        queryKey: ['banners'],
        queryFn: () => commonService.getBanners(),
        staleTime: 5 * 60_000, // 5 minutes - banners rarely change
        gcTime: 10 * 60_000,
    });
};
