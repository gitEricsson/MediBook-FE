import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/api/contracts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error: unknown) => {
        if ((error as { response?: { status?: number } })?.response?.status === 401) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = parseApiError(error).message || 'Something went wrong';
        toast.error(message);
      },
    },
  },
});
