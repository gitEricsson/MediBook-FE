import { useQuery } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';

export const useMyAppointments = (tab: 'upcoming' | 'past' = 'upcoming') => {
  return useQuery({
    queryKey: ['appointments', 'my', tab],
    queryFn: () => BookingService.getMyAppointments(tab),
    staleTime: 1000 * 60 * 5,
  });
};
