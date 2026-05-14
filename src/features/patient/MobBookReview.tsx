import { memo, useState, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBooking } from '@/hooks/useBooking'
import { toast } from 'sonner'
import type { Appointment } from '@/types/api'
import { AppointmentsService } from '@/services/appointments.service'

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

export default memo(function MobBookReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hold, doctor, scheduledAt } = location.state || {}
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState(false)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [holdTimer, setHoldTimer] = useState<number | null>(null)

  const { confirmBooking, isConfirming, cancelHold } = useBooking()

  useEffect(() => { if (!hold) navigate('/patient/search') }, [hold, navigate])

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

  const handleConfirm = async () => {
    try {
      const appt = await confirmBooking({
        holdId: hold.holdId,
        doctorId: Number(doctor.id),
        scheduledAt,
        type: 'IN_PERSON',
        reason,
      })
      setAppointment(appt)
      setSuccess(true)
    } catch {
      toast.error('Booking failed. Please try again.')
    }
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

  const fee = doctor.consultationFee
  const isSenior = doctor.seniorConsultant

  const timerMins = Math.floor((holdTimer ?? 0) / 60)
  const timerSecs = (holdTimer ?? 0) % 60
  const timerStr = `${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`

  return (
    <MobScreen>
      <MobTopBar title={success ? 'Confirmed' : 'Review & confirm'} back={!success} />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {success ? (
          <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={32} color={MB.success} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="mb-h2" style={{ fontSize: 20 }}>You're booked!</h2>
              <div className="mb-small" style={{ marginTop: 4 }}>A confirmation has been sent to your email.</div>
            </div>
            <Card padding={0} style={{ width: '100%', textAlign: 'left', background: MB.bg2 }}>
              <ReviewRow label="Doctor"       value={`Dr. ${doctor.name}`} />
              <ReviewRow label="Date"         value={appointment?.scheduledAt ? formatDate(appointment.scheduledAt) : '—'} />
              <ReviewRow label="Time"         value={appointment?.scheduledAt ? formatTime(appointment.scheduledAt) : '—'} />
              <ReviewRow label="Department"   value={doctor.department || doctor.dept || '—'} />
              {fee && <ReviewRow label={isSenior ? 'Fee paid (Senior)' : 'Fee paid'} value={`₦${fee.toLocaleString()}`} />}
              <ReviewRow label="Reference"    value={appointment?.confirmationCode || `#${appointment?.id ?? ''}`} mono last />
            </Card>
            <Btn variant="primary" size="lg" full style={{ marginTop: 8 }} onClick={() => navigate('/patient/appts')}>
              View in My visits
            </Btn>
            <Btn variant="secondary" size="md" full onClick={handleAddToCalendar}>
              <Icon name="download" size={15} /> Add to calendar
            </Btn>
          </div>
        ) : (
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
              <ReviewRow label="Date"     value={scheduledAt ? formatDate(scheduledAt) : '—'} />
              <ReviewRow label="Time"     value={scheduledAt ? formatTime(scheduledAt) : '—'} />
              <ReviewRow label="Type"     value="In-person consultation" />
              {fee && <ReviewRow label={isSenior ? 'Consultation fee (Senior)' : 'Consultation fee'} value={`₦${fee.toLocaleString()}`} last />}
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
        )}
      </div>

      {!success && (
        <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', gap: 10 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => { cancelHold(); navigate(-1) }}>Back</Btn>
          <Btn
            variant="primary"
            size="lg"
            style={{ flex: 1.6 }}
            loading={isConfirming}
            disabled={!holdTimer}
            onClick={handleConfirm}
          >
            Confirm booking
          </Btn>
        </div>
      )}
    </MobScreen>
  )
})
