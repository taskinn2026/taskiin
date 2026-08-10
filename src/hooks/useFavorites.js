import { useQuery } from '@tanstack/react-query';
import { pilgrimService } from '../services/pilgrimService';

export const useFavorites = (userId, options = {}) => {
    return useQuery({
        queryKey: ['favorites', userId],
        queryFn: () => pilgrimService.getFavorites(userId),
        enabled: !!userId && (options.enabled !== false),
        ...options
    });
};
