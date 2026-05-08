import { apiClient } from '@/lib/api/client';

export const SystemService = {
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data as Record<string, string>;
  },

  version: async () => {
    const response = await apiClient.get('/version');
    return response.data as Record<string, string>;
  },
};

