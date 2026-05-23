import { memo, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { AiChatService } from '@/services/aiChat.service'
import {
  useAiAssistantStore,
  type AssistantMessage,
} from '@/store/aiAssistantStore'
import type { MessageClassification } from '@/services/aiChat.service'

// ── Constants ──────────────────────────────────────────────────────────────────

const DISCLAIMER =
  'For support and general information only. Not medical advice. In a medical emergency, call your local emergency services.'

const EMERGENCY_CLASSIFICATIONS: MessageClassification[] = [
  'MEDICAL_EMERGENCY',
  'MEDICAL_SYMPTOM',
]

const QUICK_SUGGESTIONS = [
  'How do I book an appointment?',
  'How do I cancel an appointment?',
  'How do I find a doctor?',
  'How do I pay for my consultation?',
]

// ── Sub-components ─────────────────────────────────────────────────────────────

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="Assistant is typing"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px',
        background: MB.bg3,
        borderRadius: '14px 14px 14px 4px',
        width: 'fit-content',
        maxWidth: '75%',
      }}
    >
      {([0, 1, 2] as const).map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: MB.text3,
            animation: `mb-dot-pulse 1.2s ${i * 0.18}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  )
})

function classificationBadge(cls: MessageClassification | undefined): {
  label: string
  color: string
  bg: string
} | null {
  if (!cls) return null
  if (cls === 'MEDICAL_EMERGENCY') return { label: '⚠ Emergency', color: MB.danger, bg: '#FEE4E2' }
  if (cls === 'MEDICAL_SYMPTOM') return { label: 'Talk to a Doctor', color: MB.warn, bg: MB.warnBg }
  return null
}

const MessageBubble = memo(function MessageBubble({ msg }: { msg: AssistantMessage }) {
  const isUser = msg.role === 'user'
  const badge = !isUser ? classificationBadge(msg.classification) : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 4,
      }}
    >
      {badge && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: badge.color,
            background: badge.bg,
            borderRadius: 8,
            padding: '2px 8px',
            alignSelf: 'flex-start',
          }}
        >
          {badge.label}
        </span>
      )}
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser
            ? '14px 14px 4px 14px'
            : '14px 14px 14px 4px',
          background: isUser ? MB.primary : msg.isError ? '#FEE4E2' : MB.bg3,
          color: isUser ? '#fff' : msg.isError ? MB.danger : MB.text,
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.content}
      </div>
      {!isUser && (
        <span style={{ fontSize: 10, color: MB.text4, paddingLeft: 4 }}>
          AI-generated · MediBook Assistant
        </span>
      )}
    </div>
  )
})

// ── Main Widget ────────────────────────────────────────────────────────────────

export const MediBookAssistantWidget = memo(function MediBookAssistantWidget() {
  const {
    open,
    messages,
    isLoading,
    sessionId,
    openWidget,
    closeWidget,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    setLoading,
    clearMessages,
  } = useAiAssistantStore()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open])

  const sendMessage = useCallback(async () => {
    const textarea = inputRef.current
    if (!textarea) return
    const text = textarea.value.trim()
    if (!text || isLoading) return

    textarea.value = ''
    textarea.style.height = 'auto'
    addUserMessage(text)
    setLoading(true)

    try {
      const response = await AiChatService.sendMessage({
        message: text,
        context: 'support',
        sessionId: sessionId ?? undefined,
      })
      addAssistantMessage(response.reply, {
        classification: response.classification,
        requiresHumanSupport: response.requiresHumanSupport,
        sessionId: response.sessionId,
      })
    } catch (err) {
      // Log the underlying cause for diagnostics — the generic "Something
      // went wrong" UI message hides real signal (rate limit, BE 5xx, CORS,
      // network failure). The BE service catches everything and returns a
      // 200 OK with a `serviceUnavailable` reply, so reaching this branch
      // means a true transport-layer failure rather than a model outage.
      console.warn('AiChatService.sendMessage failed:', err)
      addErrorMessage()
    } finally {
      setLoading(false)
    }
  }, [isLoading, sessionId, addUserMessage, addAssistantMessage, addErrorMessage, setLoading])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage],
  )

  const handleSuggestion = useCallback(
    (text: string) => {
      if (!inputRef.current) return
      inputRef.current.value = text
      sendMessage()
    },
    [sendMessage],
  )

  const handleTextareaInput = useCallback(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [])

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={open ? closeWidget : openWidget}
        aria-label={open ? 'Close MediBook Assistant' : 'Open MediBook Assistant'}
        aria-expanded={open}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9998,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: MB.primary,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(14,138,95,0.35)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 6px 20px rgba(14,138,95,0.45)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 4px 16px rgba(14,138,95,0.35)'
        }}
      >
        {open ? (
          <Icon name="x" size={22} color="#fff" />
        ) : (
          <Icon name="sparkle" size={22} color="#fff" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="MediBook Assistant"
          aria-modal="false"
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            zIndex: 9999,
            width: 'min(400px, calc(100vw - 32px))',
            height: 'min(560px, calc(100dvh - 120px))',
            background: MB.bg,
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
            border: `1px solid ${MB.line}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'mb-assistant-slide-up 0.22s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${MB.line2}`,
              background: MB.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="sparkle" size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                MediBook Assistant
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                Support · Not medical advice
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Icon name="trash" size={14} color="#fff" />
                </button>
              )}
              <button
                onClick={closeWidget}
                aria-label="Close assistant"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="x" size={14} color="#fff" />
              </button>
            </div>
          </div>

          {/* Disclaimer banner */}
          <div
            role="note"
            style={{
              padding: '8px 14px',
              background: MB.bg2,
              borderBottom: `1px solid ${MB.line2}`,
              fontSize: 11,
              color: MB.text3,
              lineHeight: 1.4,
              flexShrink: 0,
            }}
          >
            {DISCLAIMER}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {isEmpty && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Welcome */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      background: MB.bg3,
                      borderRadius: '14px 14px 14px 4px',
                      fontSize: 14,
                      color: MB.text,
                      lineHeight: 1.55,
                      maxWidth: '85%',
                    }}
                  >
                    👋 Hi! I'm MediBook Assistant. I can help you book appointments, find doctors,
                    understand payments, and navigate the app.
                    <br />
                    <br />
                    What can I help you with today?
                  </div>
                  <span style={{ fontSize: 10, color: MB.text4, paddingLeft: 4 }}>
                    AI-generated · MediBook Assistant
                  </span>
                </div>

                {/* Quick suggestions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, color: MB.text4, paddingLeft: 2 }}>
                    Quick questions
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        disabled={isLoading}
                        style={{
                          background: MB.bg,
                          border: `1px solid ${MB.line}`,
                          borderRadius: 10,
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: 13,
                          color: MB.primary,
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background = MB.primary50)
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.background = MB.bg)
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {isLoading && <TypingIndicator />}
          </div>

          {/* Input area */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: `1px solid ${MB.line2}`,
              background: MB.bg,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask something…"
              aria-label="Message to MediBook Assistant"
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              onInput={handleTextareaInput}
              style={{
                flex: 1,
                resize: 'none',
                border: `1px solid ${MB.line}`,
                borderRadius: 10,
                padding: '9px 12px',
                fontSize: 14,
                color: MB.text,
                background: MB.bg2,
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = MB.primary
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLTextAreaElement).style.borderColor = MB.line
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              aria-label="Send message"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isLoading ? MB.bg3 : MB.primary,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <Icon name="arrowRight" size={16} color={isLoading ? MB.text4 : '#fff'} />
            </button>
          </div>
        </div>
      )}

      {/* Slide-up animation + bounce keyframes */}
      <style>{`
        @keyframes mb-assistant-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mb-dot-pulse {
          0%, 100% { transform: scale(0.65); opacity: 0.35; }
          50%       { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  )
})
