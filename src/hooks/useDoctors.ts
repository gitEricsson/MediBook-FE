import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Doctor } from '@/types/domain'
import { DoctorService } from '@/services/doctor.service'

interface SearchParams {
  query?: string
  departmentIds?: number[]
  specialisations?: string[]
  acceptingNew?: boolean
}

export function useDoctors(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: (): Promise<Doctor[]> =>
      DoctorService.search({
        q: params.query,
        departmentIds: params.departmentIds,
        specialisations: params.specialisations,
        acceptingNew: params.acceptingNew,
      }),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}
