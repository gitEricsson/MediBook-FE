import { useQuery } from '@tanstack/react-query'
import { SAMPLE_DOCS } from '@/constants/sampleData'
import type { Doctor } from '@/types/domain'
import { logger } from '@/lib/logger'

interface SearchParams {
  query?: string
  department?: string
  availability?: string
}

async function fetchDoctors(params: SearchParams): Promise<Doctor[]> {
  logger.debug('fetchDoctors', params as unknown as Record<string, unknown>)
  await new Promise((r) => setTimeout(r, 400))
  const q = (params.query ?? '').toLowerCase()
  return SAMPLE_DOCS.filter((d) => {
    const matchesQuery = !q || d.name.toLowerCase().includes(q) || d.spec.toLowerCase().includes(q)
    const matchesDept = !params.department || d.dept === params.department
    return matchesQuery && matchesDept
  })
}

/**
 * TanStack Query-backed doctor search.
 */
export function useDoctors(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => fetchDoctors(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}
