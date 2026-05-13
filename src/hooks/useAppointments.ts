import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';
import { AppointmentsService } from '@/services/appointments.service';
import type { Appointment } from '@/types/api';

// ── Offset-paginated (used by desktop table, small lists) ─────────────────────
export const useMyAppointments = (tab: 'upcoming' | 'past' = 'upcoming') => {
  return useQuery({
    queryKey: ['appointments', 'my', tab],
    queryFn: () => BookingService.getMyAppointments(tab),
    staleTime: 1000 * 60 * 5,
  });
};

// ── Cursor-paginated infinite scroll (used by mobile list) ────────────────────
export const useMyAppointmentsCursor = (tab: 'upcoming' | 'past' = 'upcoming') => {
  return useInfiniteQuery<
    { items: Appointment[]; nextCursor: string | null; hasMore: boolean },
    Error
  >({
    queryKey: ['appointments', 'my', 'cursor', tab],
    queryFn: ({ pageParam }) =>
      AppointmentsService.getMyAppointmentsCursor(tab, pageParam as string | undefined, 20),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 1000 * 60 * 3,
  });
};
