import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export type SessionStatus = 'SCHEDULED' | 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface TelemedicineSession {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  status: SessionStatus;
  roomId?: string;
  joinUrl?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  patientConsent: boolean;
  doctorReviewed: boolean;
  callNoteDraft?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  sentAt: string;
  system: boolean;
}

export const TelemedicineService = {
  createSession: async (appointmentId: number, patientConsent = true): Promise<TelemedicineSession> => {
    const response = await apiClient.post('/api/v1/telemedicine/sessions', null, {
      params: { appointmentId, patientConsent },
    });
    return unwrapApiResponse<TelemedicineSession>(response.data);
  },

  getSession: async (id: string): Promise<TelemedicineSession> => {
    const response = await apiClient.get(`/api/v1/telemedicine/sessions/${id}`);
    return unwrapApiResponse<TelemedicineSession>(response.data);
  },

  transitionStatus: async (id: string, status: SessionStatus): Promise<TelemedicineSession> => {
    const response = await apiClient.patch(`/api/v1/telemedicine/sessions/${id}/status`, null, {
      params: { status },
    });
    return unwrapApiResponse<TelemedicineSession>(response.data);
  },

  getChatHistory: async (id: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/api/v1/telemedicine/sessions/${id}/chat`);
    return unwrapApiResponse<ChatMessage[]>(response.data);
  },

  sendMessage: async (id: string, message: string): Promise<ChatMessage> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/${id}/chat`, { message });
    return unwrapApiResponse<ChatMessage>(response.data);
  },

  saveCallNoteDraft: async (id: string, draft: string): Promise<TelemedicineSession> => {
    const response = await apiClient.put(`/api/v1/telemedicine/sessions/${id}/call-note-draft`, draft);
    return unwrapApiResponse<TelemedicineSession>(response.data);
  },

  approveCallNote: async (id: string): Promise<TelemedicineSession> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/${id}/call-note-draft/approve`);
    return unwrapApiResponse<TelemedicineSession>(response.data);
  },
};
