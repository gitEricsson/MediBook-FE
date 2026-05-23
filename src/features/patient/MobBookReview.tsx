import { memo, useState, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { Checkbox } from '@/components/forms/Checkbox'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBooking } from '@/hooks/useBooking'
import { useViewport } from '@/hooks/useViewport'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Appointment } from '@/types/api'
import {
  AppointmentsService,
  type ConsultationType,
  type ConsultationMedium,
} from '@/services/appointments.service'
import { FeeBreakdown } from './FeeBreakdown'

type MediumChoice = Exclude<ConsultationMedium, 'EMERGENCY'>
type TypeChoice = Extract<ConsultationType, 'FIRST_VISIT' | 'FOLLOW_UP'>

function ReviewRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500, fontFamily: mono ? 'var(--mb-font-mono),monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Segmented control used for medium + type picks — three or two options laid out as pills. */
function Segmented<T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: { value: T; label: string; sub?: string; icon?: 'building' | 'phone' | 'video' }[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 8 }}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${active ? MB.primary : MB.line}`,
              background: active ? MB.primary50 : MB.bg,
              color: active ? MB.primary600 : MB.text,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {opt.icon && <Icon name={opt.icon} size={16} color={active ? MB.primary600 : MB.text3} />}
            <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
            {opt.sub && <span style={{ fontSize: 11, color: active ? MB.primary700 : MB.text3 }}>{opt.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default memo(function MobBookReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isWide } = useViewport()
  const { hold, doctor, scheduledAt, durationMins } = location.state || {}
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState(false)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [holdTimer, setHoldTimer] = useState<number | null>(null)

  // Patient-controlled inputs that drive pricing + record-sharing consent.
  // Emergency consultations have their own flow at /patient/emergency, so this
  // page only handles FIRST_VISIT / FOLLOW_UP × PHYSICAL / AUDIO / VIDEO.
  const [medium, setMedium]               = useState<MediumChoice>('PHYSICAL')
  const [consultationType, setType]       = useState<TypeChoice>('FIRST_VISIT')
  const [followUpConsent, setFollowUpConsent] = useState(false)

  const { confirmBooking, isConfirming, cancelHold } = useBooking()

  // Pricing breakdown re-keyed by the live selections so it updates whenever the
  // patient toggles medium or type.
  const { data: estimate, isLoading: isEstimateLoading } = useQuery({
    queryKey: ['fee-estimate', doctor?.id, consultationType, medium],
    queryFn: () => AppointmentsService.estimateFee(Number(doctor.id), consultationType, medium),
    enabled: !!doctor?.id,
    staleTime: 30_000,
  })

  useEffect(() => { if (!hold) navigate('/patient/search') }, [hold, navigate])

  // Derived consent: a checked box only counts when we're actually in FOLLOW_UP.
  // This avoids a setState-in-effect to "clear" the box when the user toggles
  // back to FIRST_VISIT — the visual checkbox is hidden, and the value below
  // is what gets sent / gates submit.
  const effectiveConsent = consultationType === 'FOLLOW_UP' && followUpConsent

  useEffect(() => {
    if (!hold?.expiresAt) return
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000))
      setHoldTimer(remaining)
    }
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [hold?.expiresAt])

  const canConfirm = !!holdTimer && (consultationType !== 'FOLLOW_UP' || effectiveConsent)

  const handleConfirm = async () => {
    let appt
    try {
      appt = await confirmBooking({
        holdId: hold.holdId,
        doctorId: Number(doctor.id),
        scheduledAt,
        durationMins,
        type: medium === 'PHYSICAL' ? 'IN_PERSON' : 'TELEMEDICINE',
        consultationMedium: medium,
        consultationType,
        followUpConsentGiven: effectiveConsent,
        reason,
      })
      setAppointment(appt)
    } catch (err) {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'FOLLOW_UP_CONSENT_REQUIRED') {
        toast.error('Please tick the consent box to share your records for this follow-up.')
      } else {
        toast.error('Booking failed. Please try again.')
      }
      return
    }

    const amount = Number(estimate?.fee ?? 0)
    if (amount <= 0) {
      setSuccess(true)
      return
    }
    navigate(`/patient/pay/${appt.id}`, {
      state: {
        appt,
        fee: amount,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        departmentName: doctor.department,
        estimate,
      },
    })
  }

  const handleAddToCalendar = async () => {
    if (!appointment) return
    try {
      const blob = await AppointmentsService.getCalendarIcs(String(appointment.id))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appointment-${appointment.id}.ics`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Could not download calendar file.')
    }
  }

  if (!hold || !doctor) return null

  const timerMins = Math.floor((holdTimer ?? 0) / 60)
  const timerSecs = (holdTimer ?? 0) % 60
  const timerStr = `${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`

  // ── Shared body ──────────────────────────────────────────────────────────
  const successBody = (
    <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={32} color={MB.success} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="mb-h2" style={{ fontSize: 20 }}>You're booked!</h2>
        <div className="mb-small" style={{ marginTop: 4 }}>A confirmation has been sent to your email.</div>
      </div>
      <Card padding={0} style={{ width: '100%', maxWidth: 480, textAlign: 'left', background: MB.bg2 }}>
        <ReviewRow label="Doctor"       value={`Dr. ${doctor.name}`} />
        <ReviewRow label="Date"         value={appointment?.scheduledAt ? formatDate(appointment.scheduledAt) : '—'} />
        <ReviewRow label="Time"         value={appointment?.scheduledAt ? formatTime(appointment.scheduledAt) : '—'} />
        <ReviewRow label="Department"   value={doctor.department || doctor.dept || '—'} />
        {estimate?.fee != null && <ReviewRow label="Fee paid" value={`₦${Number(estimate.fee).toLocaleString()}`} />}
        <ReviewRow label="Reference"    value={appointment?.confirmationCode || `#${appointment?.id ?? ''}`} mono last />
      </Card>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Btn variant="primary" size="lg" full onClick={() => navigate('/patient/appts')}>
          View in My visits
        </Btn>
        <Btn variant="secondary" size="md" full onClick={handleAddToCalendar}>
          <Icon name="download" size={15} /> Add to calendar
        </Btn>
      </div>
    </div>
  )

  const reviewBody = (
    <>
      {/* Hold countdown */}
      <div style={{ background: MB.primary50, padding: '10px 14px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: MB.primary700, fontSize: 13, fontWeight: 600 }}>
          <Icon name="clock" size={14} color={MB.primary} />
          Slot held · expires in
        </div>
        <div style={{ color: MB.primary, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{timerStr}</div>
      </div>

      {/* Doctor summary */}
      <Card padding={12} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PhotoBlock w={48} h={48} label={`DR · ${doctor.name.split(' ')[1]?.toUpperCase()}`} tone="primary" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. {doctor.name}</div>
            <div style={{ fontSize: 12, color: MB.text3 }}>{doctor.specialization} · {doctor.department}</div>
          </div>
        </div>
      </Card>

      {/* Appointment details */}
      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Appointment details</div>
      <Card padding={0} style={{ marginBottom: 14 }}>
        <ReviewRow label="Date" value={scheduledAt ? formatDate(scheduledAt) : '—'} last />
      </Card>

      {/* Consultation type picker */}
      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Consultation type</div>
      <div style={{ marginBottom: 14 }}>
        <Segmented<TypeChoice>
          ariaLabel="Consultation type"
          value={consultationType}
          onChange={setType}
          options={[
            { value: 'FIRST_VISIT', label: 'First visit', sub: 'New issue' },
            { value: 'FOLLOW_UP',   label: 'Follow-up',   sub: 'Continuing care' },
          ]}
        />
      </div>

      {/* Medium picker */}
      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Consultation medium</div>
      <div style={{ marginBottom: 14 }}>
        <Segmented<MediumChoice>
          ariaLabel="Consultation medium"
          value={medium}
          onChange={setMedium}
          options={[
            { value: 'PHYSICAL', label: 'In-person', icon: 'building' },
            { value: 'AUDIO',    label: 'Audio',     icon: 'phone'    },
            { value: 'VIDEO',    label: 'Video',     icon: 'video'    },
          ]}
        />
      </div>

      {/* Follow-up consent. Required by the backend ('FOLLOW_UP_CONSENT_REQUIRED' on submit) */}
      {consultationType === 'FOLLOW_UP' && (
        <div style={{ marginBottom: 14, padding: 14, background: MB.primary50, border: `1px solid ${MB.primary100}`, borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: MB.primary700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="shield" size={14} color={MB.primary} />
            Records sharing consent
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: MB.text2, lineHeight: 1.5 }}>
            For a follow-up, Dr. {doctor.name} needs to see your earlier consultation notes and records.
            Ticking the box below grants <strong>read-only</strong> access to records dated on or before{' '}
            {scheduledAt ? formatDate(scheduledAt) : 'this appointment'}. You can revoke it anytime from <em>Manage Doctor Access</em>.
          </p>
          <Checkbox
            checked={followUpConsent}
            onChange={() => setFollowUpConsent((v) => !v)}
            label={`I agree to share my consultation history up to ${scheduledAt ? new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'this date'} with Dr. ${doctor.name}.`}
          />
        </div>
      )}

      {/* Pricing breakdown — updates live from selections */}
      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Pricing breakdown</div>
      <Card padding={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
        <FeeBreakdown estimate={estimate} isLoading={isEstimateLoading} />
      </Card>

      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Reason for visit</div>
      <Field>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe your reason for the visit…"
          rows={3}
        />
      </Field>

      <div style={{ marginTop: 14, padding: '10px 12px', background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn, display: 'flex', gap: 8 }}>
        <Icon name="info" size={14} color={MB.warn} />
        <span>Cancellations are free up to 24 hours before your appointment.</span>
      </div>

      {holdTimer === 0 && (
        <div role="alert" style={{ marginTop: 10, padding: '10px 12px', background: MB.dangerBg, borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8 }}>
          <Icon name="alert" size={16} color={MB.danger} />
          <div><strong>Hold expired.</strong> Please go back and pick another time slot.</div>
        </div>
      )}
    </>
  )

  const actionBar = !success && (
    <div style={{ display: 'flex', gap: 10 }}>
      <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => { cancelHold(); navigate(-1) }}>Back</Btn>
      <Btn
        variant="primary"
        size="lg"
        style={{ flex: 1.6 }}
        loading={isConfirming}
        disabled={!canConfirm}
        onClick={handleConfirm}
      >
        Confirm booking
      </Btn>
    </div>
  )

  if (isWide) {
    return (
      <PatientShell title={success ? 'Confirmed' : 'Review & confirm'} actions={
        !success ? <Btn variant="secondary" size="sm" icon="chevronLeft" onClick={() => { cancelHold(); navigate(-1) }}>Back</Btn> : undefined
      }>
        <div style={{ flex: 1, padding: 28, display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 720 }}>
            {success ? successBody : (
              <>
                {reviewBody}
                <div style={{ marginTop: 20 }}>{actionBar}</div>
              </>
            )}
          </div>
        </div>
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title={success ? 'Confirmed' : 'Review & confirm'} back={!success} />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {success ? successBody : reviewBody}
      </div>
      {!success && (
        <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
          {actionBar}
        </div>
      )}
    </MobScreen>
  )
})
