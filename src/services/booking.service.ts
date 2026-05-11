import { apiClient } from '@/lib/api/client';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';
import {
  AppointmentHoldRequest,
  AppointmentHoldResponse,
  AppointmentConfirmRequest,
  Appointment,
} from '@/types/api';

export const BookingService = {
  holdSlot: async (data: AppointmentHoldRequest) => {
    const response = await apiClient.post('/api/v1/appointments/holds', data);
    return unwrapApiResponse<AppointmentHoldResponse>(response.data);
  },

  confirmBooking: async (data: AppointmentConfirmRequest) => {
    const response = await apiClient.post('/api/v1/appointments', data);
    return unwrapApiResponse<Appointment>(response.data);
  },

  getMyAppointments: async (tab: 'upcoming' | 'past' = 'upcoming') => {
    const response = await apiClient.get('/api/v1/me/appointments', {
      params: {
        tab,
        ...toPageableParams({ page: 0, size: 20 }),
      },
    });
    const page = unwrapApiResponse<PageResponse<Appointment>>(response.data);
    return page.content;
  },

  reschedule: async (id: string, newStart: string, newEnd: string, holdId?: string) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/reschedule`, {
      newStart,
      newEnd,
      holdId,
    });
    return unwrapApiResponse<Appointment>(response.data);
  },

  cancel: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/cancel`, { reason });
    return unwrapApiResponse<Appointment>(response.data);
  },
};
