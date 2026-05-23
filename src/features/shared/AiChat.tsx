/**
 * AiChat — AI-assisted doctor-patient conversation screen.
 *
 * Roles:
 *   Patient  → can send messages, complete intake, grant/revoke AI consent, see urgency alerts
 *   Doctor   → can send messages, generate AI draft, approve/edit/reject draft, summarize chat
 *   Both     → AI messages appear with "AI-generated" label and distinct visual styling
 *
 * Safety UX requirements (enforced here):
 *   1. All AI messages labeled "(AI-generated)"
 *   2. AI appears as distinct visual participant
 *   3. Doctor drafts shown separately — must be explicitly approved before sending
 *   4. Urgency alerts shown prominently with emergency call-to-action
 *   5. Patient sees consent prompt before AI participates
 *   6. AI provider errors never exposed raw — generic fallback message shown
 */
import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { Skel } from '@/components/feedback/Skel'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChatService, MessageResponse, AiDraft, AiSummaryResponse, SenderRole } from '@/services/chat.service'
import { AppointmentsService } from '@/services/appointments.service'
import { TelemedicineService, type VideoCallSession } from '@/services/telemedicine.service'
import { useConsultationGating } from '@/hooks/useConsultationGating'
import { Client, type IMessage } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { env as appEnv } from '@/config/env'
import { useVideoCallStore } from '@/store/videoCallStore'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useViewport } from '@/hooks/useViewport'
// VideoRoomModal is now mounted globally in App.tsx

// ── Message bubble ─────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<SenderRole, { bg: string; color: string; name: string }> = {
  PATIENT:      { bg: MB.primary,  color: '#fff',         name: 'You'              },
  DOCTOR:       { bg: '#1E3A5F',   color: '#fff',         name: 'Doctor'           },
  AI_ASSISTANT: { bg: '#F0FDF4',   color: '#166534',      name: 'MediBook AI'      },
  SYSTEM:       { bg: MB.bg2,      color: MB.text3,       name: 'System'           },
}

function MessageBubble({ msg, currentUserId }: { msg: MessageResponse; currentUserId: string }) {
  const isOwn = msg.senderId != null && String(msg.senderId) === currentUserId
  const style = ROLE_STYLE[msg.senderRole] ?? ROLE_STYLE.SYSTEM
  const isAi  = msg.senderRole === 'AI_ASSISTANT'
  const isSystem = msg.senderRole === 'SYSTEM'
  const isUrgent = msg.body.includes('⚠') && isAi

  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
        <div style={{ maxWidth: '82%', padding: '6px 10px', borderRadius: 999, background: MB.bg2, border: `1px solid ${MB.line2}`, color: MB.text3, fontSize: 12, lineHeight: 1.4, textAlign: 'center' }}>
          {msg.body}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
      {!isOwn && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isAi ? '#DCFCE7' : '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: isAi ? '#166534' : '#4338CA' }}>
          {isAi ? '🤖' : style.name[0]}
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        {!isOwn && (
          <div style={{ fontSize: 11, color: MB.text3, marginBottom: 3, marginLeft: 2 }}>
            {style.name}
            {isAi && <span style={{ marginLeft: 6, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: 999, fontSize: 10, fontWeight: 600 }}>AI</span>}
          </div>
        )}
        <div style={{
          padding: '10px 14px', borderRadius: 14,
          background: isUrgent ? '#FEF2F2' : isAi ? style.bg : isOwn ? style.bg : MB.bg2,
          color: isUrgent ? '#991B1B' : isAi ? style.color : isOwn ? style.color : MB.text,
          border: isUrgent ? '1px solid #FECACA' : isAi ? '1px solid #BBF7D0' : 'none',
          borderBottomRightRadius: isOwn ? 4 : 14,
          borderBottomLeftRadius: isOwn ? 14 : 4,
          fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap',
        }}>
          {msg.body}
        </div>
        {isAi && (
          <div style={{ fontSize: 10, color: MB.text4, marginTop: 3, marginLeft: 2 }}>
            AI-generated · Not medical advice
          </div>
        )}
        <div style={{ fontSize: 10, color: MB.text4, marginTop: 2, textAlign: isOwn ? 'right' : 'left' }}>
          {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function CallBanner({ call }: { call: VideoCallSession }) {
  const isActive = call.status === 'ACTIVE'
  return (
    <div style={{ margin: '0 16px 10px', padding: '10px 12px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, animation: isActive ? undefined : 'pulse 1.5s ease-in-out infinite' }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{isActive ? 'Video call is active' : 'Incoming video call'}</div>
        <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>Use the buttons above to join.</div>
      </div>
    </div>
  )
}

function CallToolbar({ appointmentId, activeCall, medium }: { appointmentId?: number; activeCall?: VideoCallSession | null; medium?: string }) {
  const queryClient = useQueryClient()
  const startCall = useVideoCallStore((s) => s.startCall)
  const joinCall = useVideoCallStore((s) => s.joinCall)
  const isConnecting = useVideoCallStore((s) => s.isConnecting)
  const isInCall = useVideoCallStore((s) => s.isInCall)
  const hasActiveCall = Boolean(activeCall && ['CREATED', 'RINGING', 'WAITING', 'ACTIVE'].includes(activeCall.status))
  const isAudioMedium = medium === 'AUDIO'

  const refreshCallState = () => {
    if (appointmentId) {
      queryClient.invalidateQueries({ queryKey: ['telemedicine', 'active-call', appointmentId] })
    }
  }

  const handleStart = async (audioOnly: boolean) => {
    if (!appointmentId) return
    try {
      await startCall(appointmentId, audioOnly)
      refreshCallState()
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
    } catch (error) {
      toast.error(parseApiError(error).message || 'Could not start call')
    }
  }

  const handleJoin = async (audioOnly: boolean) => {
    if (!activeCall) return
    try {
      await joinCall(activeCall, audioOnly)
      refreshCallState()
    } catch (error) {
      toast.error(parseApiError(error).message || 'Could not join call')
    }
  }

  return (
    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${MB.line2}`, background: MB.bg, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink }}>Consultation chat</div>
        <div style={{ fontSize: 12, color: MB.text3 }}>
          {isAudioMedium ? 'Audio consultation — voice only.' : 'Video and audio stay inside this conversation.'}
        </div>
      </div>
      {hasActiveCall ? (
        <>
          {isAudioMedium ? (
            <Btn variant="primary" size="sm" icon="phone" loading={isConnecting} disabled={isInCall} onClick={() => handleJoin(true)}>
              Join call
            </Btn>
          ) : (
            <>
              <Btn variant="secondary" size="sm" icon="phone" loading={isConnecting} disabled={isInCall} onClick={() => handleJoin(true)}>
                Audio only
              </Btn>
              <Btn variant="primary" size="sm" icon="camera" loading={isConnecting} disabled={isInCall} onClick={() => handleJoin(false)}>
                Join call
              </Btn>
            </>
          )}
        </>
      ) : (
        <>
          {isAudioMedium ? (
            <Btn variant="primary" size="sm" icon="phone" loading={isConnecting} disabled={!appointmentId || isInCall} onClick={() => handleStart(true)}>
              Start call
            </Btn>
          ) : (
            <>
              <Btn variant="secondary" size="sm" icon="phone" loading={isConnecting} disabled={!appointmentId || isInCall} onClick={() => handleStart(true)}>
                Audio only
              </Btn>
              <Btn variant="primary" size="sm" icon="camera" loading={isConnecting} disabled={!appointmentId || isInCall} onClick={() => handleStart(false)}>
                Video call
              </Btn>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── AI Consent Dialog ─────────────────────────────────────────────────────────

function ConsentDialog({ conversationId, onGranted, onDeclined }: {
  conversationId: number; onGranted: () => void; onDeclined: () => void
}) {
  const mutation = useMutation({
    mutationFn: (granted: boolean) => ChatService.setConsent(conversationId, granted),
    onSuccess: (_, granted) => { if (granted) onGranted(); else onDeclined() },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to update consent'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: MB.bg, borderRadius: 16, padding: 24, maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: MB.ink }}>Enable AI assistant?</h3>
        </div>
        <p style={{ fontSize: 13, color: MB.text2, lineHeight: 1.7, margin: '0 0 16px' }}>
          "MediBook AI Assistant" can help you prepare for your appointment, answer general questions,
          and guide you through intake. It will always be clearly labeled <strong>"AI-generated"</strong>.
        </p>
        <ul style={{ fontSize: 13, color: MB.text2, margin: '0 0 16px', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>The AI will <strong>NOT</strong> diagnose or prescribe</li>
          <li>For emergencies, the AI will direct you to call 911</li>
          <li>Conversation data processed under HIPAA BAA</li>
          <li>You can revoke this consent at any time</li>
        </ul>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} loading={mutation.isPending} onClick={() => mutation.mutate(false)}>
            No thanks
          </Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={mutation.isPending} onClick={() => mutation.mutate(true)}>
            Enable AI
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Urgency Banner ───────────────────────────────────────────────────────────

function UrgencyBanner() {
  return (
    <div role="alert" style={{ margin: '0 0 12px', padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚠</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Medical Urgency Detected</div>
        <div style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5 }}>
          If you are experiencing a medical emergency, <strong>call 911 (or your local emergency number) now.</strong>
          {' '}Your doctor has been notified.
        </div>
      </div>
    </div>
  )
}

// ── Doctor Draft Panel ────────────────────────────────────────────────────────

function DraftPanel({ draft, conversationId, onDone }: {
  draft: AiDraft; conversationId: number; onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [editedBody, setEditedBody] = useState(draft.draftBody)
  const [isEditing, setIsEditing] = useState(false)

  const approveMutation = useMutation({
    mutationFn: () => ChatService.approveDraft(conversationId, draft.id, isEditing ? editedBody : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] })
      toast.success('Reply sent')
      onDone()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to send'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => ChatService.rejectDraft(conversationId, draft.id),
    onSuccess: () => { toast.success('Draft discarded'); onDone() },
  })

  return (
    <div style={{ margin: '8px 0', padding: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>AI Draft — requires your approval</div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3B82F6', fontWeight: 500 }}>Review before sending</span>
      </div>

      {isEditing ? (
        <textarea
          value={editedBody}
          onChange={(e) => setEditedBody(e.target.value)}
          rows={5}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #93C5FD', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
        />
      ) : (
        <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10 }}>
          {draft.draftBody}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Preview' : 'Edit draft'}
        </Btn>
        <Btn variant="dangerOutline" size="sm" loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
          Discard
        </Btn>
        <Btn variant="primary" size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
          {isEditing ? 'Send edited reply' : 'Approve & send'}
        </Btn>
      </div>
      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 8 }}>
        AI-generated draft · Model: {draft.modelUsed} · Prompt {draft.promptVersion} · Not sent until approved
      </div>
    </div>
  )
}

// ── Doctor toolbar ────────────────────────────────────────────────────────────

function DoctorToolbar({ conversationId, lastPatientMessage }: {
  conversationId: number; lastPatientMessage: string
}) {
  const queryClient = useQueryClient()
  const [summary, setSummary] = useState<AiSummaryResponse | null>(null)
  const [draft, setDraft] = useState<AiDraft | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const summaryMutation = useMutation({
    mutationFn: () => ChatService.generateSummary(conversationId),
    onSuccess: (s) => { setSummary(s); setShowSummary(true) },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not generate summary'),
  })

  const draftMutation = useMutation({
    mutationFn: () => ChatService.generateDraft(conversationId, lastPatientMessage),
    onSuccess: (d) => setDraft(d),
    onError: (err) => toast.error(parseApiError(err).message || 'Could not generate draft'),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn variant="secondary" size="sm" icon="sparkle" loading={draftMutation.isPending} onClick={() => draftMutation.mutate()}>
          AI draft reply
        </Btn>
        <Btn variant="secondary" size="sm" icon="edit" loading={summaryMutation.isPending} onClick={() => summaryMutation.mutate()}>
          Summarize chat
        </Btn>
      </div>

      {draft && draft.status === 'PENDING' && (
        <DraftPanel draft={draft} conversationId={conversationId} onDone={() => setDraft(null)} />
      )}

      {showSummary && summary && (
        <div style={{ padding: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>🤖 AI Conversation Summary (Doctor Only)</div>
            <button onClick={() => setShowSummary(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MB.text3 }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: '#166534', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{summary.summary}</div>
          <div style={{ fontSize: 10, color: '#22C55E', marginTop: 8 }}>AI-generated summary — for doctor review only, never shown to patient</div>
        </div>
      )}
    </div>
  )
}

// ── Main chat view ────────────────────────────────────────────────────────────

function ChatView({ conversationId }: { conversationId: number }) {
  const user = useAuthStore((s) => s.user)
  const isDoctor  = user?.role === 'doctor'
  const isPatient = user?.role === 'patient'
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [text, setText] = useState('')
  const [showConsent, setShowConsent] = useState(false)
  const [consentGranted, setConsentGranted] = useState(false)
  const [consentInitialized, setConsentInitialized] = useState(false)
  const [hasUrgent, setHasUrgent] = useState(false)

  const [liveMessages, setLiveMessages] = useState<MessageResponse[]>([])
  const stompClientRef = useRef<Client | null>(null)

  const { data: polledMessages = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => ChatService.getMessages(conversationId),
    refetchInterval: 10_000,  // fallback poll every 10s (STOMP handles real-time)
  })

  // Merge polled + live messages, dedup by id
  const messages = useMemo(() => {
    const seen = new Set<number>()
    const all = [...polledMessages, ...liveMessages]
    return all.filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [polledMessages, liveMessages])

  // STOMP real-time subscription for chat messages
  useEffect(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    const apiBase = appEnv.VITE_API_URL || `${window.location.protocol}//${window.location.host}`
    const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws'
    const host = apiBase.replace(/^https?:\/\//, '')
    const wsUrl = `${wsProtocol}://${host}/ws?token=${encodeURIComponent(token)}`

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/chat', (frame: IMessage) => {
          try {
            const msg = JSON.parse(frame.body) as MessageResponse
            if (msg.conversationId === conversationId) {
              setLiveMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev
                return [...prev, msg]
              })
            }
          } catch {}
        })
      },
    })
    stompClientRef.current = client
    client.activate()
    return () => { client.deactivate() }
  }, [conversationId])

  const { data: conversation } = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => ChatService.getConversation(conversationId),
  })

  const appointmentId = conversation?.appointmentId
  const { data: activeCall = null } = useQuery({
    queryKey: ['telemedicine', 'active-call', appointmentId],
    queryFn: () => TelemedicineService.getActiveCall(appointmentId as number),
    enabled: Boolean(appointmentId),
    refetchInterval: 5_000,
  })

  // Fetch the linked appointment so the chat composer can disable itself when
  // the consultation window is closed (≥10 min after end) or the appointment
  // has been COMPLETED. Historical messages stay visible either way.
  // Use role-appropriate endpoint: patients are forbidden from the generic
  // /appointments/{id} route; doctors are forbidden from /me/appointments/{id}.
  const { data: chatAppt } = useQuery({
    queryKey: ['appointment', 'for-chat', appointmentId],
    queryFn: () => isDoctor
      ? AppointmentsService.getById(String(appointmentId))
      : AppointmentsService.getMyAppointmentById(String(appointmentId)),
    enabled: Boolean(appointmentId),
    staleTime: 30_000,
  })
  const gating = useConsultationGating({
    scheduledAt: chatAppt?.scheduledAt,
    durationMins: chatAppt?.durationMins,
    status: chatAppt?.status,
    consultationType: chatAppt?.consultationType,
    consultationMedium: chatAppt?.consultationMedium,
    type: chatAppt?.type,
  })

  // Derive last patient message for AI draft context
  const lastPatientMsg = [...messages].reverse().find((m) => m.senderRole === 'PATIENT')?.body ?? ''

  // Detect urgency in messages
  useEffect(() => {
    const urgent = messages.some((m) => m.senderRole === 'AI_ASSISTANT' && m.body.includes('⚠'))
    setHasUrgent(urgent)
  }, [messages])

  // Seed consentGranted from the conversation's persisted aiEnabled flag so the
  // dialog doesn't re-appear every time the patient opens the chat.
  useEffect(() => {
    if (conversation && !consentInitialized) {
      setConsentGranted(conversation.aiEnabled)
      setConsentInitialized(true)
    }
  }, [conversation, consentInitialized])

  // Show consent dialog exactly once per conversation — never again after the
  // patient grants OR declines. We track "already prompted" in localStorage so
  // it survives page reloads / re-mounts.
  useEffect(() => {
    if (isPatient && consentInitialized && !consentGranted && messages.length > 0) {
      const prompted = localStorage.getItem(`mb_ai_prompted_${conversationId}`)
      if (prompted) return
      const hasAi = messages.some((m) => m.aiGenerated)
      if (!hasAi) setShowConsent(true)
    }
  }, [isPatient, consentInitialized, consentGranted, messages.length, conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const { isWide } = useViewport()

  const sendMutation = useMutation({
    mutationFn: (body: string) => ChatService.sendMessage(conversationId, body),
    onSuccess: (newMsg) => {
      setLiveMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg])
      setText('')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to send message'),
  })

  const handleSend = () => {
    if (text.trim()) sendMutation.mutate(text.trim())
  }

  if (isLoading) return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2, 3].map((i) => <Skel key={i} h={60} r={12} />)}
    </div>
  )
  if (isError) return <div style={{ padding: 24 }}><ErrorState title="Could not load chat" onRetry={() => refetch()} /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CallToolbar appointmentId={appointmentId} activeCall={activeCall} medium={chatAppt?.consultationMedium} />

      {/* Urgency banner */}
      {hasUrgent && (
        <div style={{ padding: '0 16px', paddingTop: 12 }}>
          <UrgencyBanner />
        </div>
      )}

      {activeCall && ['CREATED', 'RINGING', 'WAITING', 'ACTIVE'].includes(activeCall.status) && (
        <CallBanner call={activeCall} />
      )}

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: MB.text3, fontSize: 13, padding: '32px 0' }}>
            Start the conversation. AI assistant is{' '}
            {consentGranted ? 'enabled and ready to help.' : 'available — enable it above.'}
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} currentUserId={user?.id ?? ''} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Doctor AI toolbar */}
      {isDoctor && (
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${MB.line2}`, background: MB.bg }}>
          <DoctorToolbar conversationId={conversationId} lastPatientMessage={lastPatientMsg} />
        </div>
      )}

      {/* Patient AI consent toggle */}
      {isPatient && (
        <div style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, borderTop: `1px solid ${MB.line2}`, background: MB.bg }}>
          <span style={{ fontSize: 11, color: MB.text3 }}>
            {consentGranted ? '🤖 AI assistant active' : '🤖 AI assistant off'}
          </span>
          <Btn variant="secondary" size="sm" onClick={() => {
            if (consentGranted) {
              ChatService.setConsent(conversationId, false).then(() => setConsentGranted(false))
            } else {
              setShowConsent(true)
            }
          }}>
            {consentGranted ? 'Disable AI' : 'Enable AI'}
          </Btn>
          {isPatient && consentGranted && (
            <Btn variant="secondary" size="sm" onClick={() => ChatService.runIntake(conversationId).then(() => {
              queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] })
            })}>
              Intake questions
            </Btn>
          )}
        </div>
      )}

      {/* Message input — read-only when the consultation window has closed or
          the appointment is COMPLETED. Historical messages above remain visible. */}
      {chatAppt && !gating.chatWritable ? (
        <div style={{
          padding: '12px 16px', borderTop: `1px solid ${MB.line2}`, background: MB.bg2,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: MB.text3,
        }}>
          <Icon name="lock" size={14} color={MB.text3} />
          <span>
            {gating.isCompleted
              ? 'Consultation completed — this chat is read-only. You can scroll through history.'
              : !gating.isActionable
              ? 'Chat opens once the consultation is confirmed.'
              : `Chat is read-only · ${gating.label.toLowerCase()}`}
          </span>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${MB.line2}`, display: 'flex', gap: 8, background: MB.bg }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a message…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${MB.line}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: MB.text, background: MB.bg }}
          />
          <Btn variant="primary" size="sm" disabled={!text.trim()} loading={sendMutation.isPending} onClick={handleSend}>
            <Icon name="arrowRight" size={16} color="#fff" />
          </Btn>
        </div>
      )}

      {/* Consent dialog */}
      {showConsent && (
        <ConsentDialog
          conversationId={conversationId}
          onGranted={() => { setConsentGranted(true); setShowConsent(false); localStorage.setItem(`mb_ai_prompted_${conversationId}`, '1') }}
          onDeclined={() => { setShowConsent(false); localStorage.setItem(`mb_ai_prompted_${conversationId}`, '1') }}
        />
      )}
    </div>
  )
}

// ── Responsive shell ──────────────────────────────────────────────────────────

export default memo(function AiChat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { isWide } = useViewport()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  if (!conversationId) return null
  const id = Number(conversationId)

  if (isWide) {
    const shellActive = user?.role === 'doctor' ? 'schedule' : 'appts'
    return user?.role === 'doctor' ? (
      <DeskShell active={shellActive}>
        <DeskTopbar title="Patient conversation" />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatView conversationId={id} />
        </div>
      </DeskShell>
    ) : (
      <PatientShell title="Chat with your doctor">
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatView conversationId={id} />
        </div>
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Chat" back />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatView conversationId={id} />
      </div>
    </MobScreen>
  )
})
