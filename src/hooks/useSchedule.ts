import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoctorPortalService } from '@/services/doctor-portal.service'

export interface ScheduleAppt {
  id?: string
  name: string
  reason: string
  status: 'COMPLETED' | 'SCHEDULED' | 'NO_SHOW' | 'CANCELLED'
  tone: string
  dur?: number
  next?: boolean
  patientId?: string
}

const FALLBACK_SCHEDULE: Record<string, ScheduleAppt> = {
  '9:00 AM':  { name: 'Eleanor Park',    reason: 'Follow-up · Hypertension',    status: 'COMPLETED', tone: 'rose' },
  '9:30 AM':  { name: 'James Whitfield', reason: 'Annual physical',              status: 'COMPLETED', tone: 'indigo' },
  '10:00 AM': { name: 'Marcus Lee',      reason: 'Chest pain consult',           status: 'SCHEDULED', tone: 'primary', dur: 2, next: true },
  '11:00 AM': { name: 'Aisha Ndlovu',    reason: 'Echocardiogram review',        status: 'SCHEDULED', tone: 'amber' },
  '2:00 PM':  { name: 'Robert Tanaka',   reason: 'New patient consult',          status: 'SCHEDULED', tone: 'teal' },
  '2:30 PM':  { name: 'Maria Santos',    reason: 'Med review',                   status: 'SCHEDULED', tone: 'slate' },
  '3:00 PM':  { name: 'Daniel Kim',      reason: 'Follow-up · Arrhythmia',       status: 'NO_SHOW',   tone: 'rose' },
  '4:00 PM':  { name: 'Hannah Bergstrom',reason: 'Initial consult',              status: 'SCHEDULED', tone: 'indigo' },
}

/**
 * useSchedule Hook - Refactored to use DoctorPortalService with fallback
 */
export function useSchedule(doctorId: string, date: string) {
  return useQuery<Record<string, ScheduleAppt>, Error>({
    queryKey: ['schedule', doctorId, date],
    queryFn: async () => {
      try {
        const data = await DoctorPortalService.getDailySchedule(date);
        return Object.keys(data).length > 0 ? data : FALLBACK_SCHEDULE;
      } catch (error) {
        console.error('DoctorPortalService.getDailySchedule failed, falling back', error);
        return FALLBACK_SCHEDULE;
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
