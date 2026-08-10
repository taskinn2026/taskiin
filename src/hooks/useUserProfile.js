import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Fetch profile specifically from the 'profiles' table
export const useUserProfile = (userId) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: Infinity, // Profiles rarely change
    });
};
