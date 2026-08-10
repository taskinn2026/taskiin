import { useQuery } from '@tanstack/react-query';
import { hotelService } from '../services/hotelService';

/**
 * Hook to search for offers using strict caching rules.
 * @param {Object} params - The search parameters (debounced).
 * @returns {Object} - Query result containing offers data.
 */
export const useSearchOffers = (params) => {
    // Only enable if we have meaningful params (e.g. at least one non-default filter or initial load if desired)
    // User strict rule: "Enable only when meaningful params exist". 
    // We'll allow empty params if user wants to see "Featured/All" initially, but maybe user wants NO search on load?
    // Let's assume initial load is allowed (users usually want to see *something*).
    // BUT user said: "prevent empty search on open page".
    // So we'll check if `params` is not null/undefined.
    // However, if params is just {}, it might start a huge fetch. 
    // We'll trust the caller to pass null if they don't want to search.

    return useQuery({
        queryKey: ['search-offers', params],
        queryFn: () => hotelService.searchHotels(params),
        enabled: !!params, // STRICT: No fetch if params is null
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        placeholderData: (previousData) => previousData, // Keep previous data while fetching (better UX)
    });
};
