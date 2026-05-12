import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MessageClassification } from '@/services/aiChat.service';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  classification?: MessageClassification;
  requiresHumanSupport?: boolean;
  timestamp: Date;
  isError?: boolean;
}

interface AiAssistantState {
  open: boolean;
  messages: AssistantMessage[];
  /** Session ID shared with backend for conversation continuity */
  sessionId: string | null;
  isLoading: boolean;

  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;

  addUserMessage: (content: string) => AssistantMessage;
  addAssistantMessage: (
    content: string,
    meta?: {
      classification?: MessageClassification;
      requiresHumanSupport?: boolean;
      sessionId?: string;
    }
  ) => void;
  addErrorMessage: () => void;

  setLoading: (loading: boolean) => void;
  setSessionId: (id: string) => void;
  clearMessages: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${++idCounter}`;

export const useAiAssistantStore = create<AiAssistantState>()(
  devtools(
    (set) => ({
      open: false,
      messages: [],
      sessionId: null,
      isLoading: false,

      openWidget: () => set({ open: true }, false, 'assistant/open'),
      closeWidget: () => set({ open: false }, false, 'assistant/close'),
      toggleWidget: () => set((s) => ({ open: !s.open }), false, 'assistant/toggle'),

      addUserMessage: (content) => {
        const msg: AssistantMessage = {
          id: nextId(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        set((s) => ({ messages: [...s.messages, msg] }), false, 'assistant/addUser');
        return msg;
      },

      addAssistantMessage: (content, meta) => {
        const msg: AssistantMessage = {
          id: nextId(),
          role: 'assistant',
          content,
          classification: meta?.classification,
          requiresHumanSupport: meta?.requiresHumanSupport,
          timestamp: new Date(),
        };
        set(
          (s) => ({
            messages: [...s.messages, msg],
            sessionId: meta?.sessionId ?? s.sessionId,
          }),
          false,
          'assistant/addAssistant',
        );
      },

      addErrorMessage: () => {
        const msg: AssistantMessage = {
          id: nextId(),
          role: 'assistant',
          content: 'Something went wrong. Please try again or contact MediBook support.',
          timestamp: new Date(),
          isError: true,
        };
        set((s) => ({ messages: [...s.messages, msg] }), false, 'assistant/addError');
      },

      setLoading: (loading) => set({ isLoading: loading }, false, 'assistant/setLoading'),
      setSessionId: (id) => set({ sessionId: id }, false, 'assistant/setSession'),
      clearMessages: () =>
        set({ messages: [], sessionId: null }, false, 'assistant/clear'),
    }),
    { name: 'MediBook AI Assistant Store' },
  ),
);
