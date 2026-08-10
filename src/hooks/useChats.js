import { useQuery } from '@tanstack/react-query';
import { pilgrimService } from '../services/pilgrimService';

export const useChats = (userId, options = {}) => {
    return useQuery({
        queryKey: ['chats', userId],
        queryFn: () => pilgrimService.getChats(userId),
        enabled: !!userId && (options.enabled !== false),
        ...options
    });
};
