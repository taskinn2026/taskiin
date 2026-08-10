import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { dispatchNetworkEvent } from '../services/pilgrimService'; // Verify if exported or redeclare helper

export const useProfiles = (userIds) => {
    // Deduplicate IDs
    const uniqueIds = [...new Set(userIds || [])].filter(Boolean);
    const uniqueKey = uniqueIds.sort().join(',');

    return useQuery({
        queryKey: ['profiles', uniqueKey],
        queryFn: async () => {
            if (uniqueIds.length === 0) return [];

            // Dispatch event manually if needed, or rely on global fetch patch
            console.log('[Network] BATCH GET /profiles', uniqueIds.length);

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, privacy_settings')
                .in('id', uniqueIds);

            if (error) throw error;
            return data;
        },
        enabled: uniqueIds.length > 0,
        staleTime: 1000 * 60 * 60, // Profiles rarely change, cache for 1 hour
    });
};
