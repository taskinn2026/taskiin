import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const usePresence = (currentUserId) => {
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase.channel('online_users', {
            config: {
                presence: {
                    key: currentUserId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = new Set(Object.keys(state));
                setOnlineUsers(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: currentUserId,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [currentUserId]);

    const isUserOnline = (userId) => onlineUsers.has(userId);

    return { onlineUsers, isUserOnline };
};
