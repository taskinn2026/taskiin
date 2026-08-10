import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 1 minute stale time as requested (60_000ms)
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            // Aggressive deduplication & NO Refetching 
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: false,
        },
    },
});
