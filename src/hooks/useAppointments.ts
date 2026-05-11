import { useQuery } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';

/**
 * useMyAppointments Hook
 * 
 * Production-grade patient appointment list.
 */
export const useMyAppointments = (tab: 'upcoming' | 'past' = 'upcoming') => {
  return useQuery({
    queryKey: ['appointments', 'my', tab],
    queryFn: () => BookingService.getMyAppointments(tab),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * useCancellationPolicy Hook
 */
export const useCancellationPolicy = () => {
  return useQuery({
    queryKey: ['policies', 'cancellation'],
    queryFn: BookingService.getCancellationPolicy,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
