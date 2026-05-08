import { useQuery } from '@tanstack/react-query';
import { DoctorService, DoctorSearchParams } from '@/services/doctor.service';

/**
 * useDoctorDetail Hook
 */
export const useDoctorDetail = (id: string) => {
  return useQuery({
    queryKey: ['doctors', 'detail', id],
    queryFn: () => DoctorService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * useDoctorAvailability Hook
 * 
 * Fetches real-time slot availability for a specific doctor.
 */
export const useDoctorAvailability = (id: string, date?: string) => {
  return useQuery({
    queryKey: ['doctors', 'availability', id, date],
    queryFn: () => DoctorService.getAvailability(id, date),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds (high turnover)
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
