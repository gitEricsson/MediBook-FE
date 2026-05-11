import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoctorPortalService } from '@/services/doctor-portal.service'

export interface FreeSlot { start: string; end: string; }

// Define the structure that getDailySchedule will now return
export interface DailyScheduleDetails {
  appointments: Record<string, ScheduleAppt>;
  workStart: string;
  workEnd: string;
  freeSlots: FreeSlot[];
}

export interface ScheduleAppt {
  id?: string
  name: string
  reason: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  tone: string
  dur?: number
  next?: boolean
  patientId?: string
}

/**
 * useSchedule Hook - Refactored to use DoctorPortalService with fallback
 */
export function useSchedule(doctorId: string, date: string) {
  return useQuery<DailyScheduleDetails, Error>({ // Changed return type
    queryKey: ['schedule', doctorId, date],
    queryFn: async () => {
      try {
        return DoctorPortalService.getDailySchedule(date);
      } catch (error) {
        throw error instanceof Error ? error : new Error('Unable to load schedule');
      }
    },
    staleTime: 1000 * 60 * 1,
    refetchOnWindowFocus: false,
    enabled: !!doctorId,
  })
}

/**
 * useUpNext Hook
 */
export function useUpNext() {
  return useQuery({
    queryKey: ['schedule', 'up-next'],
    queryFn: DoctorPortalService.getUpNext,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * usePatientSummary Hook
 */
export function usePatientSummary(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'summary'],
    queryFn: () => DoctorPortalService.getPatientSummary(patientId),
    enabled: !!patientId,
  });
}
