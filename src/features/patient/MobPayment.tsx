import { memo, useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { PaymentLogo, PaymentProvider } from '@/components/primitives/PaymentLogo'
import { useViewport } from '@/hooks/useViewport'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PaymentsService } from '@/services/payments.service'
import { AppointmentsService, type FeeEstimate } from '@/services/appointments.service'
import { parseApiError } from '@/lib/api/contracts'
import { parseBackendDateTime } from '@/lib/date'
import { FeeBreakdown } from './FeeBreakdown'
import type { Appointment } from '@/types/api'

/**
 * In-app payment interstitial. Renders the appointment + canonical fee
 * breakdown, then hands the user off to the chosen gateway.
 */
export default memo(function MobPayment() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams()
  const location = useLocation()
  const { isWide } = useViewport()
  const appointmentId = params.appointmentId
  const state = (location.state || {}) as {
    appt?: Appointment
    fee?: number
    doctorName?: string
    doctorSpecialization?: string
    departmentName?: string
    estimate?: FeeEstimate
  }
  const passedAppt = state.appt
  const [appt, setAppt] = useState<Appointment | null>(passedAppt ?? null)
  const [loading, setLoading] = useState(!passedAppt)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (passedAppt || !appointmentId) return
    AppointmentsService.getMyAppointmentById(String(appointmentId))
      .then(setAppt)
      .catch(() => toast.error('Could not load appointment'))
      .finally(() => setLoading(false))
  }, [appointmentId, passedAppt])

  // If we don't have a breakdown in router state (e.g. user reloaded), refetch one
  // using whatever the appointment was actually booked with — otherwise we'd show
  // a misleading "first visit / in-person" total on a follow-up video booking.
  const fallbackType   = (appt?.consultationType   ?? 'FIRST_VISIT') as 'FIRST_VISIT' | 'FOLLOW_UP' | 'EMERGENCY'
  const fallbackMedium = (appt?.consultationMedium ?? 'PHYSICAL')    as 'PHYSICAL' | 'AUDIO' | 'VIDEO'
  const outstandingBalance = Number(appt?.outstandingBalance ?? 0)
  const hasOutstandingBalance = Number.isFinite(outstandingBalance) && outstandingBalance > 0
  const isPendingPayment = appt?.status === 'PENDING'
  const isEmergencySettlement = appt?.status === 'EMERGENCY_PENDING_SETTLEMENT'
  const owesPayment = !!appt && (isPendingPayment || hasOutstandingBalance || (isEmergencySettlement && appt.outstandingBalance == null))
  const { data: fetchedEstimate, isLoading: isEstimateLoading } = useQuery({
    queryKey: ['fee-estimate', appt?.doctorId, fallbackType, fallbackMedium],
    queryFn: () =>
      AppointmentsService.estimateFee(Number(appt!.doctorId), fallbackType, fallbackMedium),
    enabled: owesPayment && !state.estimate && !!appt?.doctorId,
    staleTime: 60_000,
  })
  const estimate = state.estimate ?? fetchedEstimate ?? null

  const fee = Number(hasOutstandingBalance ? outstandingBalance : estimate?.fee ?? state.fee ?? 0)
  const doctorName = state.doctorName ?? appt?.doctorName ?? 'your doctor'
  const departmentName = estimate?.departmentName ?? state.departmentName ?? appt?.departmentName ?? '—'

  // ── Stripe currency conversion ──────────────────────────────────────────
  // The appointment fee is denominated in NGN. Stripe-NG (test mode) bills in
  // USD, so we convert before sending. Without this, passing `5000` with
  // currency=USD made Stripe charge $5,000 instead of the ~$3 NGN equivalent.
  // Hardcoded rate is fine for demo; for prod, swap with a daily FX feed
  // (openexchangerates.org, frankfurter.app, etc.) or proxy via the backend.
  // Updated 2026-05-24; refresh when the rate drifts >5%.
  const NGN_PER_USD = 1650
  // Ceil to the cent so the patient never *underpays* due to rounding.
  const stripeUsdAmount = Math.ceil((fee / NGN_PER_USD) * 100) / 100

  // Ask the backend which gateways are actually wired up in this deployment so
  // we don't render a button that immediately 503s with PROVIDER_NOT_CONFIGURED.
  // Each provider class is `@ConditionalOnProperty`-gated server-side.
  //
  // Always fetch fresh — a 5-minute staleTime previously masked backend restarts:
  // when an admin flipped MONNIFY_ENABLED=true and restarted the BE, the FE
  // kept showing the prior cached list and Monnify never appeared. The list
  // is tiny (3-4 entries) and changes infrequently, so the extra fetch on
  // mount is well worth the freshness guarantee.
  const { data: enabledProviders } = useQuery({
    queryKey: ['payments', 'providers'],
    queryFn: PaymentsService.listProviders,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
  const providerEnabled = (p: PaymentProvider) =>
    enabledProviders === undefined || enabledProviders.includes(p)

  const handlePay = async (provider: PaymentProvider) => {
    if (!appt) return
    if (!owesPayment) {
      toast.info('This appointment has already been settled.')
      navigate(`/patient/appt/${appt.id}`)
      return
    }
    setPaying(true)
    try {
      const tmpCallback = `${window.location.origin}/patient/appts`
      // For Stripe, send the USD-converted amount; everyone else gets the
      // raw NGN fee. Previously we sent `fee` with currency=USD which made
      // Stripe charge ₦5,000 as $5,000 (~3,000% overcharge).
      const isStripe = provider === 'STRIPE'
      const payment = await PaymentsService.initiate({
        appointmentId: Number(appt.id),
        provider,
        amount: isStripe ? stripeUsdAmount : fee,
        currency: isStripe ? 'USD' : 'NGN',
        callbackUrl: tmpCallback,
      })
      if (payment.authorizationUrl) {
        try { sessionStorage.setItem('mb_pending_payment_id', String(payment.id)) } catch { /* private mode */ }
        // `window.location.assign` instead of mutating `.href` so the eslint
        // react-hooks/immutability rule (which sees the global as immutable) is happy.
        window.location.assign(payment.authorizationUrl)
        return
      }
      toast.warning('Gateway did not return a payment link. You can retry from My Visits.')
      navigate('/patient/appts')
    } catch (err) {
      // Surface the backend's specific error so the user knows *why* it failed.
      const code = (err as { errorCode?: string })?.errorCode
      const message = parseApiError(err).message
      if (code === 'PROVIDER_NOT_CONFIGURED') {
        toast.error(`${provider.charAt(0) + provider.slice(1).toLowerCase()} isn't enabled in this environment. Try another gateway.`)
      } else if (code === 'PAYMENT_ALREADY_COMPLETED' || code === 'APPOINTMENT_ALREADY_PAID' || /already (been )?paid/i.test(message)) {
        await queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] })
        await queryClient.invalidateQueries({ queryKey: ['appointments', 'detail'] })
        await queryClient.invalidateQueries({ queryKey: ['appointment'] })
        toast.success('Payment is already confirmed.')
        navigate(`/patient/appt/${appt.id}`)
      } else {
        toast.error(message || 'Payment could not be started. Please retry.')
      }
      setPaying(false)
    }
  }

  if (loading) {
    return isWide ? (
      <PatientShell title="Pay to confirm">
        <div style={{ padding: 48, textAlign: 'center', color: MB.text3 }}>Loading…</div>
      </PatientShell>
    ) : (
      <MobScreen>
        <MobTopBar title="Payment" back />
        <div style={{ padding: 24, textAlign: 'center', color: MB.text3 }}>Loading…</div>
      </MobScreen>
    )
  }

  if (!appt) {
    return isWide ? (
      <PatientShell title="Pay to confirm">
        <div style={{ padding: 48, textAlign: 'center', color: MB.text3 }}>Appointment not found.</div>
      </PatientShell>
    ) : (
      <MobScreen>
        <MobTopBar title="Payment" back />
        <div style={{ padding: 24, textAlign: 'center', color: MB.text3 }}>Appointment not found.</div>
      </MobScreen>
    )
  }

  const amountCard = (
    <Card padding={16} style={{ textAlign: 'center', marginBottom: 14, background: MB.primary50 }}>
      <div style={{ fontSize: 12, color: MB.primary700, fontWeight: 600, letterSpacing: '0.04em' }}>
        AMOUNT DUE
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: MB.primary, marginTop: 6, fontFamily: 'var(--mb-font-mono),monospace' }}>
        ₦{fee.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: MB.text3, marginTop: 4 }}>
        {hasOutstandingBalance
          ? 'Outstanding emergency balance.'
          : 'Booking is held but not confirmed until payment lands.'}
      </div>
    </Card>
  )

  const settledCard = (
    <Card padding={18} style={{ textAlign: 'center', marginBottom: 14, background: MB.successBg, border: `1px solid ${MB.success}` }}>
      <Icon name="check" size={24} color={MB.success} />
      <div style={{ fontSize: 15, fontWeight: 700, color: MB.success, marginTop: 8 }}>
        No outstanding balance
      </div>
      <div style={{ fontSize: 12, color: MB.text2, marginTop: 4, lineHeight: 1.5 }}>
        This appointment is already settled. You can return to the consultation card for the latest status.
      </div>
      <Btn variant="primary" size="sm" style={{ marginTop: 12 }} onClick={() => navigate(`/patient/appt/${appt.id}`)}>
        Back to consultation
      </Btn>
    </Card>
  )

  const summaryCard = (
    <Card padding={0} style={{ marginBottom: 14 }}>
      <Row label="Doctor"         value={`Dr. ${doctorName}`} />
      <Row label="Date"           value={appt.scheduledAt ? parseBackendDateTime(appt.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'} />
      <Row label="Time"           value={appt.scheduledAt ? parseBackendDateTime(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'} />
      <Row label="Department"     value={departmentName} />
      <Row label="Reference"      value={appt.confirmationCode || `#${appt.id}`} mono last />
    </Card>
  )

  const breakdownCard = (
    <>
      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Pricing breakdown</div>
      <Card padding={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
        <FeeBreakdown estimate={estimate} isLoading={isEstimateLoading} />
      </Card>
    </>
  )

  const providerButton = (provider: PaymentProvider, suffix?: string) => (
    <button
      key={provider}
      onClick={() => handlePay(provider)}
      disabled={paying}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: MB.bg,
        border: `1px solid ${MB.line}`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: paying ? 'not-allowed' : 'pointer',
        opacity: paying ? 0.6 : 1,
        fontFamily: 'inherit',
      }}
    >
      <PaymentLogo provider={provider} height={22} />
      <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: MB.text2, fontWeight: 500 }}>
        Pay with {LABEL[provider]}{suffix ? ` ${suffix}` : ''}
      </span>
      <Icon name="chevronRight" size={16} color={MB.text3} />
    </button>
  )

  const providerList = (
    <>
      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Pay with</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/*
          Paystack is temporarily disabled for the Monnify demo. The backend
          provider bean is still wired (PAYSTACK_ENABLED=true on the server),
          /payments/providers will still list it, and the rest of the code
          path is intact — we just hide the button so demo attendees route
          to Monnify. Re-enable by uncommenting the line below.
        */}
        {/* {providerEnabled('PAYSTACK') && providerButton('PAYSTACK')} */}
        {providerEnabled('MONNIFY')  && providerButton('MONNIFY')}
        {providerEnabled('STRIPE')   && providerButton('STRIPE', `(≈ $${stripeUsdAmount.toFixed(2)} USD)`)}
      </div>
      {enabledProviders && enabledProviders.length === 0 && (
        <div role="alert" style={{ marginTop: 10, padding: '10px 12px', background: MB.dangerBg, borderRadius: 8, fontSize: 12, color: MB.danger }}>
          No payment gateway is configured on this environment. Contact support to enable one.
        </div>
      )}
    </>
  )

  const warningBanner = (
    <div style={{ marginTop: 14, padding: '10px 12px', background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn, display: 'flex', gap: 8 }}>
      <Icon name="info" size={14} color={MB.warn} />
      <span>If you close this page without paying, the appointment will be auto-cancelled and the slot released.</span>
    </div>
  )

  // ── Desktop layout ──────────────────────────────────────────────────────
  if (isWide) {
    return (
      <PatientShell title="Pay to confirm" actions={
        <Btn variant="secondary" size="sm" icon="chevronLeft" onClick={() => navigate(-1)}>Back</Btn>
      }>
        <div style={{ flex: 1, padding: 28, display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>
            {/* Left column — summary + breakdown */}
            <div>
              {owesPayment ? amountCard : settledCard}
              {summaryCard}
              {owesPayment && breakdownCard}
            </div>
            {/* Right column — payment options */}
            <div>
              {owesPayment && (
                <>
                  {providerList}
                  {warningBanner}
                  <div style={{ marginTop: 16 }}>
                    <Btn variant="secondary" size="lg" full disabled={paying} onClick={() => navigate('/patient/appts')}>
                      Pay later · slot released after 30 min
                    </Btn>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PatientShell>
    )
  }

  // ── Mobile layout ───────────────────────────────────────────────────────
  return (
    <MobScreen>
      <MobTopBar title="Pay to confirm" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {owesPayment ? amountCard : settledCard}
        {summaryCard}
        {owesPayment && breakdownCard}
        {owesPayment && providerList}
        {owesPayment && warningBanner}
      </div>
      {owesPayment && (
        <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
          <Btn variant="secondary" size="lg" full disabled={paying} onClick={() => navigate('/patient/appts')}>
            Pay later · slot released after 30 min
          </Btn>
        </div>
      )}
    </MobScreen>
  )
})

const LABEL: Record<PaymentProvider, string> = {
  PAYSTACK: 'Paystack',
  MONNIFY: 'Monnify',
  STRIPE: 'Stripe',
  FLUTTERWAVE: 'Flutterwave',
}

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500, fontFamily: mono ? 'var(--mb-font-mono),monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}
