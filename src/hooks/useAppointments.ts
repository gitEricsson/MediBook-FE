import { useQuery } from '@tanstack/react-query'
import { SAMPLE_APPOINTMENTS } from '@/constants/sampleData'
import type { Appointment } from '@/types/domain'
import { logger } from '@/lib/logger'

async function fetchAppointments(patientId: string): Promise<Appointment[]> {
  logger.debug('fetchAppointments', { patientId })
  await new Promise((r) => setTimeout(r, 350))
  return SAMPLE_APPOINTMENTS
}

/**
 * Patient appointment list — TanStack Query backed, cached per patientId.
 */
export function useAppointments(patientId: string) {
  return useQuery<Appointment[], Error>({
    queryKey: ['appointments', patientId],
    queryFn: () => fetchAppointments(patientId),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    enabled: !!patientId,
  })
}
