import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export type ConsentType = 'TELEMEDICINE' | 'DATA_PROCESSING' | 'MARKETING' | 'PHI_SHARING';

export interface UserConsent {
  id: number;
  consentType: ConsentType;
  granted: boolean;
  ipAddress?: string;
  grantedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export const ConsentsService = {
  getAll: async (): Promise<UserConsent[]> => {
    const response = await apiClient.get('/api/v1/consents');
    return unwrapApiResponse<UserConsent[]>(response.data);
  },

  update: async (consentType: ConsentType, granted: boolean): Promise<UserConsent> => {
    const response = await apiClient.put('/api/v1/consents', { consentType, granted });
    return unwrapApiResponse<UserConsent>(response.data);
  },
};
