/**
 * MobTelemedicine — full telemedicine session screen.
 *
 * Usage:
 *   navigate('/telemedicine/:sessionId', { state: { appointmentId } })
 *
 * - Patients: can join the video call, send chat, view session status
 * - Doctors:  can start/end the call, send chat, draft & approve call notes
 * - Polling:  session status re-fetches every 5 s while SCHEDULED/WAITING/ACTIVE
 */
import { memo, useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Btn } from '@/components/primitives/Btn'
import { Badge } from '@/components/primitives/Badge'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Skel } from '@/components/feedback/Skel'
import { ErrorState } from '@/components/feedback/ErrorState'
import {
  TelemedicineService,
  TelemedicineSession,
  ChatMessage,
  SessionStatus,
} from '@/services/telemedicine.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useViewport } from '@/hooks/useViewport'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<SessionStatus, 'neutral' | 'warn' | 'success' | 'primary' | 'danger'> = {
  CREATED:   'neutral',
  RINGING:   'warn',
  SCHEDULED: 'neutral',
  WAITING:   'warn',
  ACTIVE:    'success',
  ENDED:     'primary',
  MISSED:    'warn',
  COMPLETED: 'primary',
  CANCELLED: 'neutral',
  FAILED:    'danger',
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  CREATED:   'Created',
  RINGING:   'Ringing',
  SCHEDULED: 'Scheduled',
  WAITING:   'Waiting for doctor',
  ACTIVE:    'In session',
  ENDED:     'Ended',
  MISSED:    'Missed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED:    'Failed',
}

const POLL_INTERVAL_MS = 5_000
const LIVE_STATUSES: SessionStatus[] = ['SCHEDULED', 'WAITING', 'ACTIVE']

// ── Chat panel ────────────────────────────────────────────────────────────────

function ChatPanel({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const user = useAuthStore((s) => s.user)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['telemedicine', 'chat', sessionId],
    queryFn: () => TelemedicineService.getChatHistory(sessionId),
    refetchInterval: POLL_INTERVAL_MS,
    enabled: !disabled,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMutation = useMutation({
    mutationFn: (msg: string) => TelemedicineService.sendMessage(sessionId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine', 'chat', sessionId] })
      setText('')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not send message'),
  })

  const handleSend = () => {
    const trimmed = text.trim()
    if (trimmed) sendMutation.mutate(trimmed)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m) => {
          const isSelf = String(m.senderId) === user?.id
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: isSelf ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!isSelf && <Avatar name={m.senderName} size={24} tone="primary" />}
              <div style={{
                maxWidth: '75%', padding: '8px 12px', borderRadius: 12,
                background: isSelf ? MB.primary : MB.bg2,
                color: isSelf ? '#fff' : MB.text,
                fontSize: 13, lineHeight: 1.5,
                borderBottomRightRadius: isSelf ? 4 : 12,
                borderBottomLeftRadius: isSelf ? 12 : 4,
              }}>
                {!isSelf && <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>{m.senderName}</div>}
                {m.message}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                  {new Date(m.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {!disabled && (
        <div style={{ padding: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a message…"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${MB.line}`, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: MB.text, background: MB.bg }}
          />
          <Btn variant="primary" size="sm" disabled={!text.trim()} loading={sendMutation.isPending} onClick={handleSend}>
            <Icon name="arrowRight" size={16} color="#fff" />
          </Btn>
        </div>
      )}
    </div>
  )
}

// ── Doctor note draft panel ────────────────────────────────────────────────────

function NoteDraftPanel({ session, sessionId }: { session: TelemedicineSession; sessionId: string }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(session.callNoteDraft ?? '')

  const saveMutation = useMutation({
    mutationFn: () => TelemedicineService.saveCallNoteDraft(sessionId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine', 'session', sessionId] })
      toast.success('Draft saved')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not save draft'),
  })

  const approveMutation = useMutation({
    mutationFn: () => TelemedicineService.approveCallNote(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine', 'session', sessionId] })
      toast.success('Call note approved — session review complete')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not approve note'),
  })

  const isReviewed = session.doctorReviewed

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: MB.ink }}>Call note draft</div>
      {isReviewed ? (
        <div style={{ padding: '10px 12px', background: '#D1FAE5', borderRadius: 8, fontSize: 13, color: '#065F46', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="check" size={14} color="#065F46" />
          <span>Note approved and marked as reviewed.</span>
        </div>
      ) : (
        <>
          <div style={{ padding: '8px 10px', background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn }}>
            ⚠ This draft is NOT a finalized medical record. Doctor review is mandatory before it becomes clinical documentation.
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Summary of call, findings, and follow-up plan…"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${MB.line}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: MB.text, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save draft</Btn>
            <Btn variant="primary" size="sm" disabled={!draft.trim()} loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
              Approve &amp; mark reviewed
            </Btn>
          </div>
        </>
      )}
    </div>
  )
}

// ── Session core ───────────────────────────────────────────────────────────────

function SessionView({ sessionId }: { sessionId: string }) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const isDoctor = user?.role === 'doctor'

  const { data: session, isLoading, isError, refetch } = useQuery<TelemedicineSession>({
    queryKey: ['telemedicine', 'session', sessionId],
    queryFn: () => TelemedicineService.getSession(sessionId),
    refetchInterval: (query) => {
      const status = (query.state.data as TelemedicineSession | undefined)?.status
      return status && LIVE_STATUSES.includes(status) ? POLL_INTERVAL_MS : false
    },
  })

  const transitionMutation = useMutation({
    mutationFn: (status: SessionStatus) => TelemedicineService.transitionStatus(sessionId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['telemedicine', 'session', sessionId], updated)
      toast.success(`Session ${updated.status.toLowerCase()}`)
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Transition failed'),
  })

  if (isLoading) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skel h={120} r={12} />
      <Skel h={300} r={12} />
    </div>
  )

  if (isError || !session) return (
    <div style={{ padding: 24 }}>
      <ErrorState title="Couldn't load session" onRetry={() => refetch()} />
    </div>
  )

  const isLive = LIVE_STATUSES.includes(session.status)
  const isChatEnabled = session.status === 'ACTIVE'
  const canJoin = session.status === 'ACTIVE' && !!session.joinUrl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Session header card */}
      <div style={{ margin: 16, background: MB.bg, borderRadius: 14, border: `1px solid ${MB.line}`, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>
              {isDoctor ? 'Telemedicine session' : `Session with Dr. ${session.doctorName}`}
            </div>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Session #{session.id} · Appt #{session.appointmentId}</div>
          </div>
          <Badge tone={STATUS_TONE[session.status]} size="sm" dot>
            {STATUS_LABEL[session.status]}
          </Badge>
        </div>

        {/* Video join button */}
        {canJoin && (
          <Btn
            variant="primary"
            size="lg"
            full
            icon="phone"
            onClick={() => window.open(session.joinUrl!, '_blank', 'noopener,noreferrer')}
          >
            Join video call
          </Btn>
        )}

        {/* Doctor-only status controls */}
        {isDoctor && isLive && (
          <div style={{ display: 'flex', gap: 8, marginTop: canJoin ? 10 : 0 }}>
            {session.status === 'SCHEDULED' && (
              <Btn variant="primary" size="sm" style={{ flex: 1 }} loading={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate('WAITING')}>
                Open waiting room
              </Btn>
            )}
            {session.status === 'WAITING' && (
              <Btn variant="primary" size="sm" style={{ flex: 1 }} loading={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate('ACTIVE')}>
                Start session
              </Btn>
            )}
            {session.status === 'ACTIVE' && (
              <Btn variant="dangerOutline" size="sm" style={{ flex: 1 }} loading={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate('COMPLETED')}>
                End session
              </Btn>
            )}
          </div>
        )}

        {/* Session duration */}
        {session.startedAt && (
          <div style={{ marginTop: 12, fontSize: 12, color: MB.text3, display: 'flex', gap: 16 }}>
            {session.startedAt && <span>Started {new Date(session.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
            {session.endedAt && <span>Ended {new Date(session.endedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
            {session.durationSeconds && <span>Duration: {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>}
          </div>
        )}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, background: MB.bg, borderRadius: 14, border: `1px solid ${MB.line}`, margin: '0 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 240 }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${MB.line2}`, fontSize: 13, fontWeight: 600, color: MB.text2 }}>
          In-session chat {!isChatEnabled && <span style={{ fontSize: 11, color: MB.text4 }}>(available during active session)</span>}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ChatPanel sessionId={sessionId} disabled={!isChatEnabled} />
        </div>
      </div>

      {/* Doctor call note draft */}
      {isDoctor && session.status === 'COMPLETED' && (
        <div style={{ margin: '12px 16px 16px', background: MB.bg, borderRadius: 14, border: `1px solid ${MB.line}` }}>
          <NoteDraftPanel session={session} sessionId={sessionId} />
        </div>
      )}
    </div>
  )
}

// ── Responsive shell ──────────────────────────────────────────────────────────

export default memo(function MobTelemedicine() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { isWide } = useViewport()
  const user = useAuthStore((s) => s.user)

  if (!sessionId) return null

  if (isWide) {
    if (user?.role === 'doctor') {
      return (
        <DeskShell active="schedule">
          <DeskTopbar title="Telemedicine session" />
          <div style={{ flex: 1, overflow: 'auto' }}>
            <SessionView sessionId={sessionId} />
          </div>
        </DeskShell>
      )
    }
    return (
      <PatientShell title="Telemedicine session">
        <div style={{ flex: 1, overflow: 'auto', maxWidth: 720 }}>
          <SessionView sessionId={sessionId} />
        </div>
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Telemedicine" back />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <SessionView sessionId={sessionId} />
      </div>
    </MobScreen>
  )
})
