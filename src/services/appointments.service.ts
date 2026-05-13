import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';
import type { Appointment } from '@/types/api';

export interface TransitionRequest {
  to: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  reason?: string;
}

export interface RescheduleRequest {
  newStart: string;
  newEnd: string;
  holdId?: string;
}

export interface CancelRequest {
  reason?: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export const AppointmentsService = {
  getById: async (id: string) => {
    const response = await apiClient.get(`/api/v1/appointments/${id}`);
    return unwrapApiResponse<Appointment>(response.data);
  },

  getMyAppointmentById: async (id: string) => {
    const response = await apiClient.get(`/api/v1/me/appointments/${id}`);
    return unwrapApiResponse<Appointment>(response.data);
  },

  transition: async (id: string, payload: TransitionRequest) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/transition`, payload);
    return unwrapApiResponse<Appointment>(response.data);
  },

  reschedule: async (id: string, payload: RescheduleRequest) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/reschedule`, payload);
    return unwrapApiResponse<Appointment>(response.data);
  },

  cancel: async (id: string, payload: CancelRequest) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/cancel`, payload);
    return unwrapApiResponse<Appointment>(response.data);
  },

  callPatient: async (id: string) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/call`);
    return unwrapApiResponse<string>(response.data);
  },

  getCalendarIcs: async (id: string) => {
    const response = await apiClient.get(`/api/v1/appointments/${id}/ics`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /** Cursor-based paginated appointments — more efficient for infinite scroll */
  getMyAppointmentsCursor: async (tab: 'upcoming' | 'past' = 'upcoming', cursor?: string, limit = 20) => {
    const response = await apiClient.get('/api/v1/me/appointments/cursor', {
      params: { tab, ...(cursor && { cursor }), limit },
    });
    return unwrapApiResponse<CursorPage<Appointment>>(response.data);
  },

  releaseHold: async (holdId: string, doctorId: number, scheduledAt: string) => {
    await apiClient.delete(`/api/v1/appointments/holds/${holdId}`, {
      params: {
        doctorId,
        scheduledAt,
      },
    });
  },
};
