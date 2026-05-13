import { apiClient } from '@/lib/api/client';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export interface WaitlistResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId?: number;
  doctorName?: string;
  departmentId?: number;
  departmentName?: string;
  specialization?: string;
  preferredDate?: string;
  status: string;
  promotedAt?: string;
  promotedAppointmentId?: number;
  createdAt: string;
}

export interface WaitlistRequest {
  doctorId?: number;
  departmentId?: number;
  specialization?: string;
  preferredDate?: string;
}

export const WaitlistService = {
  join: async (payload: WaitlistRequest): Promise<WaitlistResponse> => {
    const response = await apiClient.post('/api/v1/waitlist', payload);
    return unwrapApiResponse<WaitlistResponse>(response.data);
  },

  getMyEntries: async (page = 0, size = 20) => {
    const response = await apiClient.get('/api/v1/waitlist/my', {
      params: toPageableParams({ page, size }),
    });
    return unwrapApiResponse<PageResponse<WaitlistResponse>>(response.data);
  },

  leave: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/waitlist/${id}`);
  },
};
