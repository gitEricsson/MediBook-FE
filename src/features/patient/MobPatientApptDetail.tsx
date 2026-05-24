import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Card } from '@/components/primitives/Card'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { Skel } from '@/components/feedback/Skel'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useViewport } from '@/hooks/useViewport'
import { useConsultationGating, type ConsultationGating } from '@/hooks/useConsultationGating'
import { AppointmentsService } from '@/services/appointments.service'
import { ChatService } from '@/services/chat.service'
import { useVideoCallStore } from '@/store/videoCallStore'
import { ReviewsService, type ReviewResponse } from '@/services/reviews.service'
import { BookingService } from '@/services/booking.service'
import { ConsultationNotesService, type ConsultationNoteResponse } from '@/services/consultation-notes.service'
import { Textarea } from '@/components/forms/Textarea'
import { parseApiError } from '@/lib/api/contracts'
import { parseBackendDateTime } from '@/lib/date'
import type { Appointment } from '@/types/api'
import type { IconName } from '@/types/ui'

/**
 * Patient-facing consultation detail screen.
 *
 *   • Bookable affordances are time-gated by {@link useConsultationGating}:
 *       chat + video become live 10 min before scheduled start; chat is
 *       read-only after the consultation completes (history stays viewable).
 *   • For PENDING (unpaid) appointments the primary CTA is "Complete payment".
 *   • For COMPLETED appointments the rate-visit affordance appears at the
 *       bottom (uneditable once submitted).
 */

// ── Rate-visit card (only shown for COMPLETED appointments) ─────────────────

function RateVisitCard({ appt, existingReview, onSubmitted }: {
  appt: Appointment
  existingReview: ReviewResponse | null
  onSubmitted: () => void
}) {
  const [open, setOpen]       = useState(false)
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')

  const submit = useMutation({
    mutationFn: () => ReviewsService.submit({
      appointmentId: Number(appt.id),
      rating,
      comment: comment.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Thanks — your review was submitted')
      onSubmitted()
      setOpen(false)
    },
    onError: (err) => {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'REVIEW_EXISTS') {
        toast.error('You\'ve already reviewed this visit')
        onSubmitted()
        setOpen(false)
      } else {
        toast.error(parseApiError(err).message || 'Could not submit review')
      }
    },
  })

  if (existingReview) {
    return (
      <Card padding={16}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink, marginBottom: 6 }}>Your review</div>
        <div style={{ fontSize: 18, color: '#F59E0B' }}>
          {'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}
        </div>
        {existingReview.comment && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: MB.text2, lineHeight: 1.5 }}>
            "{existingReview.comment}"
          </p>
        )}
        <div style={{ fontSize: 11, color: MB.text3, marginTop: 8 }}>Reviews are final once submitted.</div>
      </Card>
    )
  }

  return (
    <>
      <Card padding={16}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink, marginBottom: 6 }}>Rate your visit</div>
        <div style={{ fontSize: 12, color: MB.text2, marginBottom: 10, lineHeight: 1.5 }}>
          Your rating helps other patients and goes through moderation before it appears publicly.
          Submission is one-time.
        </div>
        <Btn variant="primary" size="sm" icon="sparkle" onClick={() => setOpen(true)}>
          Rate visit
        </Btn>
      </Card>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => { if (!submit.isPending) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(11,18,32,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: MB.bg, borderRadius: 16, padding: 24,
              width: '100%', maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: MB.ink }}>Rate your visit</h3>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: MB.text3 }}>Dr. {appt.doctorName}</p>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: MB.text3, lineHeight: 1.5 }}>
              Once submitted, your review can't be changed. Reviews are moderated before
              they appear on the doctor's public profile.
            </p>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                  style={{
                    fontSize: 30, background: 'transparent', border: 'none',
                    cursor: 'pointer', color: star <= rating ? '#F59E0B' : MB.line, padding: 0,
                  }}
                >★</button>
              ))}
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what stood out — optional"
              rows={3}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn variant="secondary" size="lg" style={{ flex: 1 }}
                onClick={() => setOpen(false)} disabled={submit.isPending}>
                Skip
              </Btn>
              <Btn variant="primary" size="lg" style={{ flex: 1.5 }}
                disabled={rating === 0 || submit.isPending}
                loading={submit.isPending}
                onClick={() => submit.mutate()}>
                Submit review
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function fmtFullDate(iso: string | undefined) {
  if (!iso) return '—'
  return parseBackendDateTime(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtTimeRange(start: string, durationMins: number) {
  const s = parseBackendDateTime(start)
  const e = new Date(s.getTime() + durationMins * 60_000)
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(s)} – ${fmt(e)}`
}

// ── Communication icon button ────────────────────────────────────────────────

function CommIconBtn({ icon, label, enabled, loading, onClick }: {
  icon: IconName; label: string; enabled: boolean; loading?: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={!enabled || loading}
      onClick={enabled && !loading ? onClick : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        background: 'transparent', border: 'none', fontFamily: 'inherit',
        cursor: enabled && !loading ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.35, padding: '8px 14px', borderRadius: 10,
        transition: 'opacity .15s',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
        background: enabled ? MB.primary50 : MB.bg3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s',
      }}>
        <Icon name={icon} size={22} color={enabled ? MB.primary : MB.text4} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: enabled ? MB.text2 : MB.text4 }}>{label}</span>
    </button>
  )
}

// ── Body ────────────────────────────────────────────────────────────────────

function ConsultationBody({ appt }: { appt: Appointment }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const gating = useConsultationGating({
    scheduledAt: appt.scheduledAt,
    durationMins: appt.durationMins,
    status: appt.status,
    consultationType: appt.consultationType,
    consultationMedium: appt.consultationMedium,
    type: appt.type,
  })

  // Two distinct "money owed" states surface the same outstanding-payment CTA:
  //   • PENDING                       — booking is held but not yet paid (pre-consultation)
  //   • EMERGENCY_PENDING_SETTLEMENT  — emergency consult happened, payment due after
  // Both route through /patient/pay/:id which already drives the gateway hand-off.
  //
  // We also key off `outstandingBalance` so post-consult emergency settlements
  // (status already flipped to COMPLETED, invoice still UNPAID) still surface
  // the CTA on the consultation card.
  const outstandingBalance = Number(appt.outstandingBalance ?? 0)
  const hasOutstandingBalance = Number.isFinite(outstandingBalance) && outstandingBalance > 0
  const balanceKnownSettled = appt.outstandingBalance != null && !hasOutstandingBalance
  const isPending = appt.status === 'PENDING'
  const isEmergencyDue = !balanceKnownSettled && (
    appt.status === 'EMERGENCY_PENDING_SETTLEMENT'
    || (appt.consultationType === 'EMERGENCY' && hasOutstandingBalance)
  )
  const owesPayment = isPending || isEmergencyDue || hasOutstandingBalance

  const medium = appt.consultationMedium
  const isPhysical = medium === 'PHYSICAL' || (!medium && appt.type === 'IN_PERSON')
  // Audio and video availability driven strictly by what the patient paid for.
  // When consultationMedium is set, it takes priority over legacy type.
  const hasAudio = medium === 'AUDIO' || medium === 'VIDEO'
    || (!medium && (appt.type === 'TELEMEDICINE' || appt.type === 'TELEHEALTH'))
  const hasVideo = medium === 'VIDEO'
    || (!medium && (appt.type === 'TELEMEDICINE' || appt.type === 'TELEHEALTH'))

  // Existing review for this appointment — used to render the rate-visit affordance.
  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'my'],
    queryFn: () => ReviewsService.getMyReviews(0, 100).then((p) => p.content),
    enabled: appt.status === 'COMPLETED',
    staleTime: 30_000,
  })
  const existingReview = reviews?.find((r) => r.appointmentId === Number(appt.id))

  // Consultation note — only available once the doctor has written one.
  // 204 No Content → null (no note yet); silently suppressed so no error state
  // is shown when the doctor hasn't written notes yet.
  const { data: consultationNote } = useQuery<ConsultationNoteResponse | null>({
    queryKey: ['consultation-note', appt.id],
    queryFn: () => ConsultationNotesService.getMyNoteForAppointment(appt.id),
    enabled: appt.status === 'COMPLETED',
    staleTime: 60_000,
    retry: false,
  })

  // Open chat — creates the conversation if it doesn't already exist.
  const openChat = useMutation({
    mutationFn: () => ChatService.createConversation(Number(appt.id)),
    onSuccess: (c) => navigate(`/patient/chat/${c.id}`),
    onError: (err) => {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'APPOINTMENT_NOT_CONFIRMED') {
        toast.error('Chat opens once the consultation is confirmed.')
      } else {
        toast.error(parseApiError(err).message || 'Unable to open chat right now.')
      }
    },
  })

  // Start / join telemedicine call — opens Twilio overlay directly.
  const videoStartCall = useVideoCallStore((s) => s.startCall)
  const isConnectingCall = useVideoCallStore((s) => s.isConnecting)

  const cancelMutation = useMutation({
    mutationFn: () => BookingService.cancel(String(appt.id), 'Cancelled by patient'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] })
      toast.success('Appointment cancelled')
      navigate('/patient/appts')
    },
    onError: () => toast.error('Could not cancel — please try again'),
  })

  const downloadIcs = async () => {
    try {
      const blob = await AppointmentsService.getCalendarIcs(String(appt.id))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `appointment-${appt.id}.ics`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Could not download calendar file.') }
  }

  const isReschedulable = (appt.status === 'CONFIRMED' || appt.status === 'PENDING') &&
    parseBackendDateTime(appt.scheduledAt).getTime() - Date.now() > 20 * 60 * 1000

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <Card padding={18}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={appt.doctorName ?? 'Doctor'} size={48} tone="primary" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>Dr. {appt.doctorName}</div>
            <div style={{ fontSize: 12, color: MB.text3 }}>{appt.departmentName ?? '—'}</div>
          </div>
          <StatusPill status={appt.status} />
        </div>
        <div style={{ marginTop: 14, padding: 12, background: MB.bg2, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{fmtFullDate(appt.scheduledAt)}</div>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{fmtTimeRange(appt.scheduledAt, appt.durationMins)}</div>
          </div>
          <GatingPill gating={gating} />
        </div>
        {!isPhysical && (hasAudio || hasVideo) && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <Badge tone="primary" size="sm">
              {medium === 'VIDEO' ? 'Video call' : medium === 'AUDIO' ? 'Audio call' : 'Telemedicine'}
            </Badge>
          </div>
        )}
      </Card>

      {/* Outstanding payment banner — same CTA for both pre-consult (PENDING)
          and post-emergency (EMERGENCY_PENDING_SETTLEMENT). Copy differs so
          the patient knows which they're settling. */}
      {owesPayment && (
        <Card padding={16} style={{ background: MB.warnBg, border: `1px solid ${MB.warn}` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="alert" size={18} color={MB.warn} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: MB.warn }}>
                {isEmergencyDue ? 'Emergency consultation owed' : 'Payment outstanding'}
              </div>
              <div style={{ fontSize: 12, color: MB.text2, marginTop: 2, lineHeight: 1.5 }}>
                {isEmergencyDue
                  ? "Your emergency consultation has happened. Settle the bill now so future emergency requests aren't blocked."
                  : 'Your slot is held but not confirmed yet. Complete the payment to lock it in — unpaid bookings are released after 30 minutes.'}
              </div>
              <Btn variant="primary" size="sm" icon="creditCard" style={{ marginTop: 10 }}
                onClick={() => navigate(`/patient/pay/${appt.id}`)}>
                {isEmergencyDue ? 'Pay outstanding bill' : 'Complete payment to confirm'}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Communication icons — hidden entirely for PHYSICAL consultations.
          Only icons for media the patient actually paid for are shown;
          all icons are faded + unclickable when the gating window is closed. */}
      {!isPhysical && (
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MB.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Communication
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <CommIconBtn
              icon="mail"
              label="Chat"
              enabled={gating.chatReadable && !isPending}
              loading={openChat.isPending}
              onClick={() => openChat.mutate()}
            />
            {hasAudio && (
              <CommIconBtn
                icon="phone"
                label="Audio call"
                enabled={gating.telemedicineAvailable && !isPending}
                loading={isConnectingCall}
                onClick={() => videoStartCall(Number(appt.id), true)}
              />
            )}
            {hasVideo && (
              <CommIconBtn
                icon="video"
                label="Video call"
                enabled={gating.telemedicineAvailable && !isPending}
                loading={isConnectingCall}
                onClick={() => videoStartCall(Number(appt.id), false)}
              />
            )}
          </div>
          <div style={{ fontSize: 11, color: MB.text3, marginTop: 10 }}>
            {gating.isCompleted
              ? 'Chat is read-only — history stays accessible'
              : !gating.isActionable
              ? 'Available once the consultation is confirmed'
              : gating.windowOpen
              ? 'Live · closes 10 min after scheduled end'
              : gating.label}
          </div>
        </Card>
      )}

      {/* Reason */}
      {appt.reason && (
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.04 }}>
            Reason for visit
          </div>
          <div style={{ fontSize: 13, color: MB.text2, marginTop: 6, lineHeight: 1.5 }}>{appt.reason}</div>
        </Card>
      )}

      {/* Consultation note — only shown when the doctor has written one */}
      {consultationNote && (
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MB.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            Consultation notes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Diagnosis */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Diagnosis
              </div>
              <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.6 }}>{consultationNote.diagnosis}</div>
            </div>
            {/* Treatment plan */}
            <div style={{ paddingTop: 12, borderTop: `1px solid ${MB.line2}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Treatment plan
              </div>
              <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.6 }}>{consultationNote.treatmentPlan}</div>
            </div>
            {/* Prescriptions — only shown if the doctor entered any */}
            {consultationNote.prescriptions && (
              <div style={{ paddingTop: 12, borderTop: `1px solid ${MB.line2}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                  Prescriptions
                </div>
                <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.6 }}>{consultationNote.prescriptions}</div>
              </div>
            )}
            {/* Follow-up date — only shown if set */}
            {consultationNote.followUpDate && (
              <div style={{ paddingTop: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={14} color={MB.primary} />
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Follow-up &nbsp;
                  </span>
                  <span style={{ fontSize: 13, color: MB.primary, fontWeight: 600 }}>
                    {new Date(consultationNote.followUpDate).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Misc actions */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="secondary" size="sm" icon="download" onClick={downloadIcs}>Calendar</Btn>
          {(appt.status === 'CONFIRMED' || appt.status === 'PENDING') && (
            <>
              {isReschedulable && (
                <Btn variant="secondary" size="sm" onClick={() => navigate(`/patient/doctor/${appt.doctorId}`, { state: { reschedule: true, appointmentId: appt.id } })}>
                  Reschedule
                </Btn>
              )}
              <Btn variant="dangerOutline" size="sm" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                Cancel
              </Btn>
            </>
          )}
          {appt.confirmationCode && (
            <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 11, color: MB.text3, fontFamily: 'var(--mb-font-mono),monospace' }}>
              {appt.confirmationCode}
            </span>
          )}
        </div>
      </Card>

      {/* Completed → invite to rate */}
      {appt.status === 'COMPLETED' && (
        <RateVisitCard appt={appt} existingReview={existingReview ?? null}
          onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['reviews', 'my'] })} />
      )}
    </div>
  )
}


function GatingPill({ gating }: { gating: ConsultationGating }) {
  if (gating.isCompleted) return <Badge tone="neutral" size="sm">Completed</Badge>
  if (!gating.isActionable) return <Badge tone="warn" size="sm">Not confirmed</Badge>
  if (gating.windowOpen) {
    return <Badge tone="success" size="sm">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: MB.success }} /> Live now
      </span>
    </Badge>
  }
  return <Badge tone="primary" size="sm">{gating.label}</Badge>
}

// ── Container ──────────────────────────────────────────────────────────────

export default memo(function MobPatientApptDetail() {
  const { id } = useParams<{ id: string }>()
  const { isWide } = useViewport()
  const navigate = useNavigate()

  const { data: appt, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: () => AppointmentsService.getMyAppointmentById(String(id)),
    enabled: !!id,
  })

  const content = isLoading ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, maxWidth: 720, margin: '0 auto', width: '100%' }}>
      {[0, 1, 2].map((i) => <Skel key={i} h={120} r={12} />)}
    </div>
  ) : isError || !appt ? (
    <div style={{ padding: 24 }}><ErrorState title="Couldn't load consultation" onRetry={() => refetch()} /></div>
  ) : (
    <ConsultationBody appt={appt} />
  )

  if (isWide) {
    return (
      <PatientShell title="Consultation" actions={
        <Btn variant="secondary" size="sm" icon="chevronLeft" onClick={() => navigate(-1)}>Back</Btn>
      }>
        <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>{content}</div>
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Consultation" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{content}</div>
    </MobScreen>
  )
})
