import { useQuery } from '@tanstack/react-query'
import { logger } from '@/lib/logger'

export interface ScheduleSlot {
  time: string
  hour: number
  min: number
}

export interface ScheduleAppt {
  name: string
  reason: string
  status: 'COMPLETED' | 'SCHEDULED' | 'NO_SHOW' | 'CANCELLED'
  tone: string
  dur?: number
  next?: boolean
}

async function fetchSchedule(doctorId: string, date: string): Promise<Record<string, ScheduleAppt>> {
  logger.debug('fetchSchedule', { doctorId, date })
  await new Promise((r) => setTimeout(r, 300))
  return {
    '9:00 AM':  { name: 'Eleanor Park',    reason: 'Follow-up · Hypertension',    status: 'COMPLETED', tone: 'rose' },
    '9:30 AM':  { name: 'James Whitfield', reason: 'Annual physical',              status: 'COMPLETED', tone: 'indigo' },
    '10:00 AM': { name: 'Marcus Lee',      reason: 'Chest pain consult',           status: 'SCHEDULED', tone: 'primary', dur: 2, next: true },
    '11:00 AM': { name: 'Aisha Ndlovu',    reason: 'Echocardiogram review',        status: 'SCHEDULED', tone: 'amber' },
    '2:00 PM':  { name: 'Robert Tanaka',   reason: 'New patient consult',          status: 'SCHEDULED', tone: 'teal' },
    '2:30 PM':  { name: 'Maria Santos',    reason: 'Med review',                   status: 'SCHEDULED', tone: 'slate' },
    '3:00 PM':  { name: 'Daniel Kim',      reason: 'Follow-up · Arrhythmia',       status: 'NO_SHOW',   tone: 'rose' },
    '4:00 PM':  { name: 'Hannah Bergstrom',reason: 'Initial consult',              status: 'SCHEDULED', tone: 'indigo' },
  }
}

export function useSchedule(doctorId: string, date: string) {
  return useQuery<Record<string, ScheduleAppt>, Error>({
    queryKey: ['schedule', doctorId, date],
    queryFn: () => fetchSchedule(doctorId, date),
    staleTime: 1000 * 60 * 1,
    refetchOnWindowFocus: false,
    enabled: !!doctorId,
  })
}
