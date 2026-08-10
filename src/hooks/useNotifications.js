import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { commonService } from '../services/commonService';

export const useNotifications = (userId) => {
    const queryClient = useQueryClient();
    const queryKey = ['notifications', userId];

    // 1. Initial Fetch (Cached)
    const { data: notifications = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => commonService.getNotifications(userId),
        enabled: !!userId,
        staleTime: 60_000,
    });

    // 2. Realtime Subscription (No Polling)
    useEffect(() => {
        if (!userId) return;

        const subscription = commonService.subscribeToNotifications(userId, (newNotif) => {
            // Optimistic Update
            queryClient.setQueryData(queryKey, (old) => [newNotif, ...(old || [])]);

            // Play Audio
            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.error("Audio play blocked", e));
            } catch (err) {
                console.error("Audio playback error:", err);
            }
            // Optional: Invalidate to be sure
            // queryClient.invalidateQueries(queryKey);
        });

        return () => {
            if (subscription?.unsubscribe) subscription.unsubscribe();
        };
    }, [userId, queryClient]);

    return { notifications, isLoading };
};
