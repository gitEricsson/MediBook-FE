import { useQuery } from '@tanstack/react-query';
import { DoctorService } from '@/services/doctor.service';
import { useAuthStore } from '@/store/authStore';

/**
 * useDoctorDetail Hook
 *
 * Gated on authenticated status so a hard-refresh doesn't fire the query before
 * the auth bootstrap finishes — without the gate, the first request goes out with
 * no Bearer header, gets a 401, caches an error, and the page shows "Doctor not
 * found" even after the session rehydrates.
 */
export const useDoctorDetail = (id: string) => {
  const authStatus = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ['doctors', 'detail', id],
    queryFn: () => DoctorService.getById(id),
    enabled: !!id && authStatus === 'authenticated',
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
};

/**
 * useDoctorAvailability Hook
 *
 * Fetches real-time slot availability for a specific doctor.
 */
export const useDoctorAvailability = (id: string, date?: string) => {
  const authStatus = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ['doctors', 'availability', id, date],
    queryFn: () => DoctorService.getAvailability(id, date),
    enabled: !!id && authStatus === 'authenticated',
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * useSpecializations Hook
 */
export const useSpecializations = () => {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: DoctorService.getSpecializations,
    staleTime: 1000 * 60 * 60, // 1 hour (relatively static)
  });
};
