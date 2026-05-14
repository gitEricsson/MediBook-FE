import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export type SessionStatus = 'CREATED' | 'RINGING' | 'SCHEDULED' | 'WAITING' | 'ACTIVE' | 'ENDED' | 'MISSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface TelemedicineSession {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  conversationId?: number;
  doctorName: string;
  status: SessionStatus;
  roomId?: string;
  twilioRoomSid?: string;
  twilioRoomName?: string;
  joinUrl?: string;
  startedAt?: string;
  acceptedAt?: string;
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

export interface VideoCallSession {
  sessionId: number;
  appointmentId: number;
  conversationId: number;
  patientId: number;
  doctorId: number;
  status: SessionStatus;
  twilioRoomSid?: string;
  roomName: string;
  token?: string;
  identity?: string;
  tokenExpiresAt?: string;
  startedAt?: string;
  acceptedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface VideoTokenResponse {
  token: string;
  roomName: string;
  identity: string;
  expiresAt: string;
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

  startVideoCall: async (appointmentId: number): Promise<VideoCallSession> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/appointment/${appointmentId}/start-video-call`);
    return unwrapApiResponse<VideoCallSession>(response.data);
  },

  getActiveCall: async (appointmentId: number): Promise<VideoCallSession | null> => {
    const response = await apiClient.get(`/api/v1/telemedicine/sessions/appointment/${appointmentId}/active-call`);
    return unwrapApiResponse<VideoCallSession | null>(response.data);
  },

  getVideoToken: async (sessionId: number): Promise<VideoTokenResponse> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/${sessionId}/token`);
    return unwrapApiResponse<VideoTokenResponse>(response.data);
  },

  joinCall: async (sessionId: number, cameraEnabled = true, microphoneEnabled = true): Promise<VideoCallSession> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/${sessionId}/join`, {
      cameraEnabled,
      microphoneEnabled,
    });
    return unwrapApiResponse<VideoCallSession>(response.data);
  },

  leaveCall: async (sessionId: number, cameraEnabled = false, microphoneEnabled = true): Promise<VideoCallSession> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/${sessionId}/leave`, {
      cameraEnabled,
      microphoneEnabled,
    });
    return unwrapApiResponse<VideoCallSession>(response.data);
  },

  endCall: async (sessionId: number, reason?: string): Promise<VideoCallSession> => {
    const response = await apiClient.post(`/api/v1/telemedicine/sessions/${sessionId}/end-call`, { reason });
    return unwrapApiResponse<VideoCallSession>(response.data);
  },

  getCallSession: async (sessionId: number): Promise<VideoCallSession> => {
    const response = await apiClient.get(`/api/v1/telemedicine/sessions/${sessionId}`);
    const session = unwrapApiResponse<TelemedicineSession>(response.data);
    return {
      sessionId: session.id,
      appointmentId: session.appointmentId,
      conversationId: session.conversationId ?? 0,
      patientId: session.patientId,
      doctorId: session.doctorId,
      status: session.status,
      twilioRoomSid: session.twilioRoomSid,
      roomName: session.twilioRoomName ?? session.roomId ?? '',
      startedAt: session.startedAt,
      acceptedAt: session.acceptedAt,
      endedAt: session.endedAt,
      durationSeconds: session.durationSeconds,
    };
  },
};
