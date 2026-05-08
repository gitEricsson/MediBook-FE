import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'; // Assuming we'll use sonner for toasts

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Something went wrong';
        toast.error(message);
      },
    },
  },
});
