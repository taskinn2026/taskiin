import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export const useUser = () => {
    const queryClient = useQueryClient();

    const { data: session, isLoading } = useQuery({
        queryKey: ['session'],
        queryFn: authService.getCurrentSession,
        staleTime: Infinity, // Session doesn't change unless explicit action
    });

    const user = session?.user || null;

    // Listen for auth changes to invalidate cache
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                queryClient.setQueryData(['session'], null);
                queryClient.removeQueries(); // Clear all data on logout
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                queryClient.setQueryData(['session'], { user: session?.user });
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    return { user, isLoading };
};
