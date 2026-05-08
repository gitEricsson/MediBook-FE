import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export const LookupsService = {
  getSpecialisations: async () => {
    const response = await apiClient.get('/api/v1/specialisations');
    return unwrapApiResponse<string[]>(response.data);
  },

  getLanguages: async () => {
    const response = await apiClient.get('/api/v1/lookups/languages');
    return unwrapApiResponse<string[]>(response.data);
  },

  getTimezones: async () => {
    const response = await apiClient.get('/api/v1/lookups/timezones');
    return unwrapApiResponse<string[]>(response.data);
  },
};

