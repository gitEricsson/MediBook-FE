import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface ConsultationNoteRequest {
  diagnosis: string;
  treatmentPlan?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: string;
  followUpDate?: string;
}

export interface LegacyConsultationNoteRequest {
  appointmentId: string;
  diagnosis: string;
  treatment?: string;
  notes?: string;
  treatmentPlan?: string;
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
  createNote: async (payload: LegacyConsultationNoteRequest) => {
    const response = await apiClient.post('/api/v1/consultation-notes', payload);
    return unwrapApiResponse(response.data);
  },

  getNote: async (noteId: string) => {
    const response = await apiClient.get(`/api/v1/consultation-notes/${noteId}`);
    return unwrapApiResponse(response.data);
  },

  getByAppointment: async (appointmentId: string) => {
    const response = await apiClient.get(`/api/v1/consultation-notes/appointment/${appointmentId}`);
    return unwrapApiResponse<ConsultationNoteResponse>(response.data);
  },

  createForAppointment: async (appointmentId: string, payload: ConsultationNoteRequest) => {
    const response = await apiClient.post(`/api/v1/consultation-notes/appointment/${appointmentId}`, payload);
    return unwrapApiResponse<ConsultationNoteResponse>(response.data);
  },

  updateNote: async (noteId: string, payload: Partial<ConsultationNoteRequest>) => {
    const response = await apiClient.patch(`/api/v1/consultation-notes/${noteId}`, payload);
    return unwrapApiResponse<ConsultationNoteResponse>(response.data);
  },

  deleteNote: async (noteId: string) => {
    await apiClient.delete(`/api/v1/consultation-notes/${noteId}`);
  },

  getMyHistory: async () => {
    const response = await apiClient.get('/api/v1/consultation-notes/my-history');
    return unwrapApiResponse<ConsultationNoteResponse[]>(response.data);
  },

  getDoctorAccessNotes: async (patientId: number) => {
    const response = await apiClient.get(`/api/v1/consultation-notes/patient/${patientId}`);
    return unwrapApiResponse<ConsultationNoteResponse[]>(response.data);
  },
};
