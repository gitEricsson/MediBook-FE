import { useQuery } from '@tanstack/react-query'
import type { Doctor } from '@/types/domain'
import { DoctorService } from '@/services/doctor.service'

interface SearchParams {
  query?: string
  departmentId?: number[]
  specialisation?: string[]
  availability?: string
}

/**
 * Backend-backed doctor search. Empty results stay empty; we do not inject demo doctors.
 */
export function useDoctors(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: async (): Promise<Doctor[]> => {
      return DoctorService.search({ q: params.query, departmentId: params.departmentId, specialisation: params.specialisation, availability: params.availability });
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
