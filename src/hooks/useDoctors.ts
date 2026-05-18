import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Doctor } from '@/types/domain'
import { DoctorService } from '@/services/doctor.service'
import { useAuthStore } from '@/store/authStore'

interface SearchParams {
  query?: string
  departmentIds?: number[]
  specialisations?: string[]
  acceptingNew?: boolean
}

export function useDoctors(params: SearchParams = {}) {
  // Gate on auth bootstrap completion — without it, a hard refresh fires the
  // search before the access token is restored, the request 401s, React Query
  // caches an empty list, and the page shows "No doctors match" until refresh.
  const authReady = useAuthStore((s) => s.status === 'authenticated')
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: (): Promise<Doctor[]> =>
      DoctorService.search({
        q: params.query,
        departmentIds: params.departmentIds,
        specialisations: params.specialisations,
        acceptingNew: params.acceptingNew,
      }),
    enabled: authReady,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
