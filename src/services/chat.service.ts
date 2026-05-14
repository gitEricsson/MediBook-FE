/**
 * AI Chat Service — calls MediBook backend chat endpoints.
 *
 * ⚠  IMPORTANT: All AI calls go through the MediBook backend.
 * The frontend NEVER calls OpenAI, Anthropic, or any AI provider directly.
 */
import { apiClient } from '@/lib/api/client';
import { PageResponse, toPageableParams, unwrapApiResponse } from '@/lib/api/contracts';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SenderRole = 'PATIENT' | 'DOCTOR' | 'AI_ASSISTANT' | 'SYSTEM';
export type DraftStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT';
export type ConversationStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface ConversationResponse {
  id: number;
  twilioConversationSid: string;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  status: ConversationStatus;
  aiEnabled: boolean;
  createdAt: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  twilioMessageSid: string;
  senderId: number | null;
  senderRole: SenderRole;
  body: string;
  aiGenerated: boolean;
  safetyLabel: string | null;
  createdAt: string;
}

export interface AiDraft {
  id: number;
  conversationId: number;
  doctorId: number;
  draftBody: string;
  editedBody: string | null;
  status: DraftStatus;
  promptVersion: string;
  modelUsed: string;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  /** Backend-computed: editedBody if present, else draftBody */
  effectiveBody: string;
}

export interface AiSummaryResponse {
  conversationId: number;
  summary: string;
  generatedAt: string;
}

export interface AiAuditEntry {
  id: number;
  eventId: string;
  conversationId: number;
  actorId: number;
  actorRole: string;
  operation: string;
  modelUsed: string;
  promptVersion: string;
  safetyLabel: string;
  escalationTriggered: boolean;
  latencyMs: number;
  createdAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const ChatService = {
  /** Create a conversation for an appointment (idempotent) */
  createConversation: async (appointmentId: number): Promise<ConversationResponse> => {
    const response = await apiClient.post('/api/v1/chat/conversations', { appointmentId });
    return unwrapApiResponse<ConversationResponse>(response.data);
  },

  /** Get all messages for a conversation */
  getMessages: async (conversationId: number): Promise<MessageResponse[]> => {
    const response = await apiClient.get(`/api/v1/chat/conversations/${conversationId}/messages`);
    return unwrapApiResponse<MessageResponse[]>(response.data);
  },

  /** Get conversation metadata */
  getConversation: async (conversationId: number): Promise<ConversationResponse> => {
    const response = await apiClient.get(`/api/v1/chat/conversations/${conversationId}`);
    return unwrapApiResponse<ConversationResponse>(response.data);
  },

  // ── Doctor AI operations ─────────────────────────────────────────────────

  /** Generate AI conversation summary — doctor/admin only */
  generateSummary: async (conversationId: number): Promise<AiSummaryResponse> => {
    const response = await apiClient.post(`/api/v1/chat/${conversationId}/ai/summary`);
    return unwrapApiResponse<AiSummaryResponse>(response.data);
  },

  /** Generate AI draft reply for doctor review — never auto-sent */
  generateDraft: async (conversationId: number, patientMessage: string): Promise<AiDraft> => {
    const response = await apiClient.post(`/api/v1/chat/${conversationId}/ai/draft`, { patientMessage });
    return unwrapApiResponse<AiDraft>(response.data);
  },

  /** Approve draft (optionally with doctor edits) and send to conversation */
  approveDraft: async (conversationId: number, draftId: number, editedBody?: string): Promise<AiDraft> => {
    const response = await apiClient.post(
      `/api/v1/chat/${conversationId}/ai/draft/${draftId}/approve`,
      editedBody ? { editedBody } : undefined,
    );
    return unwrapApiResponse<AiDraft>(response.data);
  },

  /** Reject draft — it will not be sent */
  rejectDraft: async (conversationId: number, draftId: number): Promise<AiDraft> => {
    const response = await apiClient.post(`/api/v1/chat/${conversationId}/ai/draft/${draftId}/reject`);
    return unwrapApiResponse<AiDraft>(response.data);
  },

  // ── Patient AI operations ────────────────────────────────────────────────

  /** Start or continue AI-guided intake questionnaire */
  runIntake: async (conversationId: number): Promise<AiSummaryResponse> => {
    const response = await apiClient.post(`/api/v1/chat/${conversationId}/ai/intake`);
    return unwrapApiResponse<AiSummaryResponse>(response.data);
  },

  /** Grant or revoke AI participation consent */
  setConsent: async (conversationId: number, granted: boolean): Promise<void> => {
    await apiClient.post(`/api/v1/chat/${conversationId}/ai/consent`, { granted });
  },

  // ── Urgency ──────────────────────────────────────────────────────────────

  /** Acknowledge a medical urgency alert (doctor/admin) */
  acknowledgeUrgency: async (conversationId: number, alertId: number): Promise<void> => {
    await apiClient.post(`/api/v1/chat/${conversationId}/urgency/${alertId}/acknowledge`);
  },

  // ── Audit ─────────────────────────────────────────────────────────────────

  /** Get AI audit trail for a conversation (doctor/admin) */
  getAuditTrail: async (conversationId: number): Promise<AiAuditEntry[]> => {
    const response = await apiClient.get(`/api/v1/chat/${conversationId}/ai/audit`);
    return unwrapApiResponse<AiAuditEntry[]>(response.data);
  },
};
