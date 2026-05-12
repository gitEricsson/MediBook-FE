/**
 * MediBook Assistant — support chat service.
 *
 * IMPORTANT: This service calls the MediBook backend at /api/v1/ai/chat.
 * The frontend NEVER calls Ollama, Anthropic, OpenAI, or any AI provider directly.
 * All AI processing happens server-side through MediBook's safety and compliance layer.
 */
import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MessageClassification =
  | 'SUPPORT'
  | 'APP_NAVIGATION'
  | 'BOOKING_HELP'
  | 'PAYMENT_HELP'
  | 'GENERAL_HEALTH_EDUCATION'
  | 'MEDICAL_SYMPTOM'
  | 'MEDICAL_EMERGENCY'
  | 'PHI_DETECTED'
  | 'ABUSE_OR_SPAM'
  | 'UNKNOWN';

export interface SupportChatRequest {
  message: string;
  context?: string;
  sessionId?: string;
}

export interface SupportChatResponse {
  reply: string;
  classification: MessageClassification;
  requiresHumanSupport: boolean;
  sessionId: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const AiChatService = {
  async sendMessage(request: SupportChatRequest): Promise<SupportChatResponse> {
    const response = await apiClient.post('/api/v1/ai/chat', request);
    return unwrapApiResponse<SupportChatResponse>(response.data);
  },
};
