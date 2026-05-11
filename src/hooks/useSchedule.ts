import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoctorPortalService } from '@/services/doctor-portal.service'

// Define Time and FreeSlot interfaces to match the service's expected structure
export interface Time { hour: number; minute: number; }
export interface FreeSlot { start: Time; end: Time; }

// Define the structure that getDailySchedule will now return
export interface DailyScheduleDetails {
  appointments: Record<string, ScheduleAppt>;
  workStart: Time;
  workEnd: Time;
  freeSlots: FreeSlot[];
}

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

// Fallback for appointments
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

// Define default values for work hours and free slots for fallbacks
const DEFAULT_WORK_START: Time = { hour: 9, minute: 0 };
const DEFAULT_WORK_END: Time = { hour: 17, minute: 0 };
const DEFAULT_FREE_SLOTS: FreeSlot[] = [];

/**
 * useSchedule Hook - Refactored to use DoctorPortalService with fallback
 */
export function useSchedule(doctorId: string, date: string) {
  return useQuery<DailyScheduleDetails, Error>({ // Changed return type
    queryKey: ['schedule', doctorId, date],
    queryFn: async () => {
      try {
        const data = await DoctorPortalService.getDailySchedule(date);
        // If appointments are empty, provide fallback appointments and default hours/slots
        if (Object.keys(data.appointments).length === 0) {
          return {
            appointments: FALLBACK_SCHEDULE,
            workStart: data.workStart ?? DEFAULT_WORK_START, // Use actual data if available, else default
            workEnd: data.workEnd ?? DEFAULT_WORK_END,
            freeSlots: data.freeSlots ?? DEFAULT_FREE_SLOTS,
          };
        }
        // Return the fetched data which now includes work hours and free slots
        return data;
      } catch (error) {
        console.error('DoctorPortalService.getDailySchedule failed, falling back', error);
        // Provide a complete fallback structure including default hours and slots
        return {
          appointments: FALLBACK_SCHEDULE,
          workStart: DEFAULT_WORK_START,
          workEnd: DEFAULT_WORK_END,
          freeSlots: DEFAULT_FREE_SLOTS,
        };
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
