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
      params: { tab, ...toPageableParams({ page: 0, size: 20 }) },
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

  createRecurringSeries: async (payload: {
    doctorId: number;
    recurrenceType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recurrenceInterval?: number;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
    timeOfDay: { hour: number; minute: number };
    durationMins?: number;
    appointmentType: 'IN_PERSON' | 'TELEHEALTH' | 'TELEMEDICINE';
    reason?: string;
  }) => {
    const response = await apiClient.post('/api/v1/appointments/recurring', payload);
    return unwrapApiResponse(response.data);
  },

  getMySeries: async (page = 0, size = 20) => {
    const response = await apiClient.get('/api/v1/appointments/recurring/my', {
      params: toPageableParams({ page, size }),
    });
    return unwrapApiResponse<PageResponse<{ id: number; doctorName: string; recurrenceType: string; startDate: string; endDate?: string; status: string; appointmentType: string; reason?: string }>>(response.data);
  },

  cancelSeries: async (id: string) => {
    await apiClient.delete(`/api/v1/appointments/recurring/${id}`);
  },

  cancel: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/api/v1/appointments/${id}/cancel`, { reason });
    return unwrapApiResponse<Appointment>(response.data);
  },
};
