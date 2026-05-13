import { apiClient } from '@/lib/api/client';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

export interface ReviewResponse {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  rating: number;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ReviewRequest {
  appointmentId: number;
  rating: number; // 1–5
  comment?: string;
}

export const ReviewsService = {
  submit: async (payload: ReviewRequest): Promise<ReviewResponse> => {
    const response = await apiClient.post('/api/v1/reviews', payload);
    return unwrapApiResponse<ReviewResponse>(response.data);
  },

  getDoctorReviews: async (doctorId: string, page = 0, size = 10) => {
    const response = await apiClient.get(`/api/v1/reviews/doctors/${doctorId}`, {
      params: toPageableParams({ page, size }),
    });
    return unwrapApiResponse<PageResponse<ReviewResponse>>(response.data);
  },

  getMyReviews: async (page = 0, size = 20) => {
    const response = await apiClient.get('/api/v1/reviews/my', {
      params: toPageableParams({ page, size }),
    });
    return unwrapApiResponse<PageResponse<ReviewResponse>>(response.data);
  },

  getPendingReviews: async (page = 0, size = 20) => {
    const response = await apiClient.get('/api/v1/reviews/admin/pending', {
      params: toPageableParams({ page, size }),
    });
    return unwrapApiResponse<PageResponse<ReviewResponse>>(response.data);
  },

  moderate: async (id: string, action: 'approve' | 'reject') => {
    const response = await apiClient.patch(`/api/v1/reviews/${id}/moderate`, null, {
      params: { action },
    });
    return unwrapApiResponse<ReviewResponse>(response.data);
  },
};
