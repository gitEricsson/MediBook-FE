import { useQuery } from '@tanstack/react-query'
import { SAMPLE_DOCS } from '@/constants/sampleData'
import type { Doctor } from '@/types/domain'
import { DoctorService } from '@/services/doctor.service'

interface SearchParams {
  query?: string
  department?: string
  availability?: string
}

/**
 * useDoctors Hook - Refactored to use DoctorService while maintaining compatibility
 * with existing components and providing fallback to SAMPLE_DOCS.
 */
export function useDoctors(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: async (): Promise<Doctor[]> => {
      try {
        const results = await DoctorService.search(params);
        return results.length > 0 ? results : SAMPLE_DOCS;
      } catch (error) {
        console.error('DoctorService.search failed, falling back to sample data', error);
        return SAMPLE_DOCS;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
