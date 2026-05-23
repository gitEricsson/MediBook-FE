import { useQuery } from '@tanstack/react-query'
import { DoctorPortalService } from '@/services/doctor-portal.service'
import type {
  DailyScheduleDetails as ServiceDailyScheduleDetails,
  ScheduleAppt as ServiceScheduleAppt,
  FreeSlot as ServiceFreeSlot,
} from '@/services/doctor-portal.service'

// Re-export the canonical types from the service so downstream components
// only ever see one shape (was previously duplicated here with a narrower
// status union, which broke type-checking once new statuses were added).
export type FreeSlot = ServiceFreeSlot
export type ScheduleAppt = ServiceScheduleAppt
export type DailyScheduleDetails = ServiceDailyScheduleDetails

/**
 * useSchedule Hook - delegates to DoctorPortalService.
 */
export function useSchedule(doctorId: string, date: string) {
  return useQuery<DailyScheduleDetails, Error>({
    queryKey: ['schedule', doctorId, date],
    queryFn: async () => {
      try {
        return await DoctorPortalService.getDailySchedule(date)
      } catch (error) {
        throw error instanceof Error ? error : new Error('Unable to load schedule')
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
    staleTime: 1000 * 30,
  })
}

/**
 * usePatientSummary Hook
 */
export function usePatientSummary(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'summary'],
    queryFn: () => DoctorPortalService.getPatientSummary(patientId),
    enabled: !!patientId,
  })
}
