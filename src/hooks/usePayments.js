import { useQuery } from '@tanstack/react-query';
import { pilgrimService } from '../services/pilgrimService';

export const usePayments = (userId, options = {}) => {
    return useQuery({
        queryKey: ['payments', userId],
        queryFn: () => pilgrimService.getPayments(userId),
        enabled: !!userId && (options.enabled !== false),
        ...options
    });
};
