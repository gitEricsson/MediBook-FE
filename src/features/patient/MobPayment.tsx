import { memo, useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { toast } from 'sonner'
import { PaymentsService } from '@/services/payments.service'
import { AppointmentsService } from '@/services/appointments.service'
import type { Appointment } from '@/types/api'

/**
 * In-app payment interstitial. Renders the appointment + canonical fee, then hands the
 * user off to the chosen gateway. We never leave the FE without first showing the user
 * what they are about to be charged.
 */
export default memo(function MobPayment() {
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()
  const appointmentId = params.appointmentId
  const state = (location.state || {}) as {
    appt?: Appointment
    fee?: number
    doctorName?: string
    doctorSpecialization?: string
    departmentName?: string
  }
  const passedAppt = state.appt
  const [appt, setAppt] = useState<Appointment | null>(passedAppt ?? null)
  const [loading, setLoading] = useState(!passedAppt)
  const [paying, setPaying] = useState(false)
  const [serverFee, setServerFee] = useState<number | null>(null)

  useEffect(() => {
    if (passedAppt || !appointmentId) return
    AppointmentsService.getById(String(appointmentId))
      .then(setAppt)
      .catch(() => toast.error('Could not load appointment'))
      .finally(() => setLoading(false))
  }, [appointmentId, passedAppt])

  // If we arrived without a fee in state (e.g. user reloaded), re-fetch the doctor
  // so we display and submit the canonical amount.
  useEffect(() => {
    if (state.fee || !appt?.doctorId) return
    import('@/services/doctor.service').then(({ DoctorService }) => {
      DoctorService.getById(String(appt.doctorId))
        .then((d) => setServerFee(Number((d as { consultationFee?: number }).consultationFee ?? 0)))
        .catch(() => { /* fee stays null, we'll error before initiate */ })
    })
  }, [appt?.doctorId, state.fee])

  const fee = Number(state.fee ?? serverFee ?? 0)
  const doctorName = state.doctorName ?? appt?.doctorName ?? 'your doctor'
  const departmentName = state.departmentName ?? appt?.departmentName ?? '—'

  const handlePay = async (provider: 'PAYSTACK' | 'MONNIFY' | 'FLUTTERWAVE' | 'STRIPE') => {
    if (!appt) return
    setPaying(true)
    try {
      // We initiate first so we have a paymentId to verify when the user comes back.
      // Verify is needed because webhooks can't reach localhost; even in prod the
      // verify-on-return path acts as a safety net if a webhook is dropped.
      const tmpCallback = `${window.location.origin}/patient/appts`
      // Stripe test accounts typically don't enable NGN — quote in USD for Stripe only.
      const payment = await PaymentsService.initiate({
        appointmentId: Number(appt.id),
        provider,
        amount: fee,
        currency: provider === 'STRIPE' ? 'USD' : 'NGN',
        callbackUrl: tmpCallback, // overridden below with payment id
      })
      if (payment.authorizationUrl) {
        // Stash paymentId so /patient/appts can verify on return.
        try { sessionStorage.setItem('mb_pending_payment_id', String(payment.id)) } catch { /* private mode */ }
        window.location.href = payment.authorizationUrl
        return
      }
      toast.warning('Gateway did not return a payment link. You can retry from My Visits.')
      navigate('/patient/appts')
    } catch {
      toast.error('Payment could not be started. Please retry.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <MobScreen>
        <MobTopBar title="Payment" back />
        <div style={{ padding: 24, textAlign: 'center', color: MB.text3 }}>Loading…</div>
      </MobScreen>
    )
  }

  if (!appt) {
    return (
      <MobScreen>
        <MobTopBar title="Payment" back />
        <div style={{ padding: 24, textAlign: 'center', color: MB.text3 }}>
          Appointment not found.
        </div>
      </MobScreen>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Pay to confirm" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Big amount */}
        <Card padding={16} style={{ textAlign: 'center', marginBottom: 14, background: MB.primary50 }}>
          <div style={{ fontSize: 12, color: MB.primary700, fontWeight: 600, letterSpacing: '0.04em' }}>
            AMOUNT DUE
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: MB.primary, marginTop: 6, fontFamily: 'var(--mb-font-mono),monospace' }}>
            ₦{fee.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 4 }}>
            Booking is held but not confirmed until payment lands.
          </div>
        </Card>

        {/* Summary */}
        <Card padding={0} style={{ marginBottom: 14 }}>
          <Row label="Doctor"        value={`Dr. ${doctorName}`} />
          <Row label="Date"          value={appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'} />
          <Row label="Time"          value={appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'} />
          <Row label="Specialization" value={appt.departmentName || '—'} />
          <Row label="Reference"     value={appt.confirmationCode || `#${appt.id}`} mono last />
        </Card>

        {/* Provider choices */}
        <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Pay with</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="secondary" size="lg" full loading={paying} onClick={() => handlePay('PAYSTACK')}>
            <Icon name="creditCard" size={16} /> Pay with Paystack
          </Btn>
          <Btn variant="secondary" size="lg" full disabled={paying} onClick={() => handlePay('MONNIFY')}>
            <Icon name="creditCard" size={16} /> Pay with Monnify
          </Btn>
          <Btn variant="secondary" size="lg" full disabled={paying} onClick={() => handlePay('STRIPE')}>
            <Icon name="creditCard" size={16} /> Pay with Stripe (USD)
          </Btn>
        </div>

        <div style={{ marginTop: 14, padding: '10px 12px', background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn, display: 'flex', gap: 8 }}>
          <Icon name="info" size={14} color={MB.warn} />
          <span>
            If you close this page without paying, the appointment will be auto-cancelled and the slot released.
          </span>
        </div>
      </div>

      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
        <Btn variant="secondary" size="lg" full disabled={paying} onClick={() => navigate('/patient/appts')}>
          Pay later · slot released after 30 min
        </Btn>
      </div>
    </MobScreen>
  )
})

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500, fontFamily: mono ? 'var(--mb-font-mono),monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}
