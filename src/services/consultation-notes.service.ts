import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface ConsultationNoteRequest {
  diagnosis: string;
  treatmentPlan: string;
  prescriptions?: string;
  followUpDate?: string;
}

export interface ConsultationNoteResponse {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  treatmentPlan: string;
  prescriptions?: string;
  followUpDate?: string;
  createdAt: string;
}

export const ConsultationNotesService = {
  getByAppointment: async (appointmentId: string) => {
    const response = await apiClient.get(`/api/v1/consultations/${appointmentId}/notes`);
    return unwrapApiResponse<ConsultationNoteResponse>(response.data);
  },

  createForAppointment: async (appointmentId: string, payload: ConsultationNoteRequest) => {
    const response = await apiClient.post(`/api/v1/consultations/${appointmentId}/notes`, payload);
    return unwrapApiResponse<ConsultationNoteResponse>(response.data);
  },

  getMyHistory: async () => {
    const response = await apiClient.get('/api/v1/consultation-notes/my-history');
    return unwrapApiResponse<ConsultationNoteResponse[]>(response.data);
  },
};
