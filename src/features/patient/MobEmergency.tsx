import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Btn } from '@/components/primitives/Btn'
import { Card } from '@/components/primitives/Card'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { useViewport } from '@/hooks/useViewport'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EmergencyService,
  type EmergencyMedium,
  type EmergencyResponse,
} from '@/services/emergency.service'
import { DepartmentsService } from '@/services/departments.service'
import { parseApiError } from '@/lib/api/contracts'
import { Skel } from '@/components/feedback/Skel'

const MEDIUM_OPTIONS: { value: EmergencyMedium; label: string; sub: string; icon: 'building' | 'phone' | 'video' }[] = [
  { value: 'PHYSICAL', label: 'In-person', sub: 'Visit hospital ASAP', icon: 'building' },
  { value: 'AUDIO', label: 'Audio call', sub: 'Voice consultation', icon: 'phone' },
  { value: 'VIDEO', label: 'Video call', sub: 'Recommended', icon: 'video' },
]

/**
 * Emergency consultation request screen.
 *
 * Skips the slot picker entirely — the backend's `/api/v1/emergency/request`
 * endpoint immediately assigns the least-loaded eligible doctor and locks them
 * out of normal bookings for the next ~60 minutes. Payment is settled
 * post-consultation (status: EMERGENCY_PENDING_SETTLEMENT).
 */
export default memo(function MobEmergency() {
  const { isWide } = useViewport()
  const authReady = useAuthStore((s) => s.status === 'authenticated')
  const navigate = useNavigate()
  const [medium, setMedium] = useState<EmergencyMedium>('VIDEO')
  const [symptoms, setSymptoms] = useState('')
  const [departmentId, setDepartmentId] = useState<string>('')
  // criticalOverride UI is currently disabled (commented out below) — keep the
  // field as a constant so the request payload stays compatible without lint noise.
  const criticalOverride = false
  const [result, setResult] = useState<EmergencyResponse | null>(null)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'public'],
    queryFn: DepartmentsService.getActiveDepartments,
    enabled: authReady,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  // Live fee preview — re-keyed on medium + department so the breakdown
  // updates the moment the patient changes either selection. The estimate
  // assumes a non-senior doctor; the senior premium is shown separately as a
  // disclaimer because the doctor isn't assigned until submit.
  const { data: feeEstimate, isLoading: isFeeLoading } = useQuery({
    queryKey: ['emergency', 'fee-estimate', medium, departmentId],
    queryFn: () => EmergencyService.estimateFee(medium, departmentId ? Number(departmentId) : undefined),
    enabled: authReady,
    staleTime: 30_000,
  })

  const request = useMutation({
    mutationFn: () => EmergencyService.request({
      medium,
      symptoms: symptoms.trim(),
      departmentId: departmentId ? Number(departmentId) : undefined,
      criticalOverride,
    }),
    onSuccess: (res) => {
      setResult(res)
      toast.success(`Doctor assigned — ${res.doctorName}`)
    },
    onError: (err) => {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'OUTSTANDING_EMERGENCY_DEBT') {
        toast.error('Settle your previous emergency bill before requesting another.')
      } else if (code === 'NO_AVAILABLE_DOCTOR') {
        toast.error('No doctor is free right now. Try again in a moment or call emergency services.')
      } else {
        toast.error(parseApiError(err).message || 'Could not request an emergency consultation.')
      }
    },
  })

  const canSubmit = symptoms.trim().length >= 5 && !request.isPending

  // ── Result screen ─────────────────────────────────────────────────────
  const successBody = result && (
    <Card padding={20} style={{ background: MB.successBg, border: `1px solid ${MB.success}`, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: MB.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>Doctor on the way</div>
          <div style={{ fontSize: 12, color: MB.text2 }}>{result.message}</div>
        </div>
      </div>
      <div style={{ background: MB.bg, borderRadius: 10, padding: 14 }}>
        <Row label="Doctor" value={`Dr. ${result.doctorName}`} />
        <Row label="Department" value={result.departmentName} />
        <Row label="Medium" value={result.medium.toLowerCase()} />
        <Row label="Reference" value={result.confirmationCode} mono />
        <Row label="Estimated fee" value={`₦${Number(result.consultationFee).toLocaleString()}`} hint="Settled after consultation" last />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {result.sessionId != null && result.medium !== 'PHYSICAL' && (
          <Btn variant="primary" size="lg" style={{ flex: 1 }} icon="video"
            onClick={() => navigate(`/patient/telemedicine/${result.sessionId}`)}>
            Join call now
          </Btn>
        )}
        <Btn variant="secondary" size="lg" style={{ flex: 1 }}
          onClick={() => navigate('/patient/appts')}>
          Open in My visits
        </Btn>
      </div>
    </Card>
  )

  // ── Request form ──────────────────────────────────────────────────────
  const formBody = !result && (
    <>
      <Card padding={16} style={{ background: MB.dangerBg, border: `1px solid ${MB.danger}`, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Icon name="alert" size={20} color={MB.danger} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: MB.danger, marginBottom: 4 }}>
              For life-threatening emergencies, call your local emergency number first.
            </div>
            <div style={{ fontSize: 12, color: MB.text2, lineHeight: 1.5 }}>
              This will immediately assign a free doctor. The doctor is reserved for you for
              about an hour — no slot picker, no waiting. Payment is collected after the call.
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Symptoms</div>
      <Field hint="Describe what's happening — keep it short but specific.">
        <Textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. severe chest pain radiating to left arm, started 20 minutes ago"
          rows={4}
        />
      </Field>

      <div className="mb-eyebrow" style={{ margin: '16px 0 8px' }}>Consultation medium</div>
      <div role="radiogroup" aria-label="Emergency medium"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {MEDIUM_OPTIONS.map((opt) => {
          const active = opt.value === medium
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => setMedium(opt.value)}
              style={{
                padding: '12px 10px',
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
              <Icon name={opt.icon} size={18} color={active ? MB.primary600 : MB.text3} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
              <span style={{ fontSize: 11, color: active ? MB.primary700 : MB.text3 }}>{opt.sub}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-eyebrow" style={{ margin: '16px 0 8px' }}>Preferred department (optional)</div>
      <select
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        style={{
          width: '100%', height: 42, borderRadius: 10, border: `1px solid ${MB.line}`,
          background: MB.bg, padding: '0 12px', fontSize: 14, color: MB.text,
          fontFamily: 'inherit', outline: 'none',
        }}
      >
        <option value="">Any available doctor</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      {/* Estimated cost preview — settled after consultation, not at request time. */}
      <div className="mb-eyebrow" style={{ margin: '16px 0 8px' }}>Estimated cost</div>
      <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 10, overflow: 'hidden' }}>
        {isFeeLoading || !feeEstimate ? (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map((i) => <Skel key={i} h={14} w="60%" />)}
          </div>
        ) : (
          <FeePreviewRows estimate={feeEstimate} />
        )}
      </div>
      <div style={{ marginTop: 8, padding: '8px 12px', background: MB.bg2, borderRadius: 8, fontSize: 11, color: MB.text3, lineHeight: 1.5 }}>
        {feeEstimate?.seniorSurchargeIfApplicable && feeEstimate.seniorSurchargeIfApplicable > 0
          ? `If the assigned doctor is a senior consultant, an additional ₦${Number(feeEstimate.seniorSurchargeIfApplicable).toLocaleString()} senior premium applies. `
          : ''}
        Final amount is settled after the consultation — you won't be charged at request time.
      </div>

      {/* <div style={{ marginTop: 16, padding: 14, background: MB.bg2, borderRadius: 10, border: `1px solid ${MB.line2}` }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={criticalOverride}
            onChange={(e) => setCriticalOverride(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>
              Critical override
            </div>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2, lineHeight: 1.4 }}>
              Tick this only for life-threatening situations. Bypasses outstanding-balance
              checks; will be reviewed in post-consultation settlement.
            </div>
          </div>
        </label>
      </div> */}
    </>
  )

  const actionBar = !result && (
    <Btn
      variant="primary"
      size="lg"
      full
      icon="alert"
      danger
      loading={request.isPending}
      disabled={!canSubmit}
      onClick={() => request.mutate()}
    >
      Request emergency doctor
    </Btn>
  )

  if (isWide) {
    return (
      <PatientShell title="Emergency consultation">
        <div style={{ flex: 1, padding: 28, display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 640 }}>
            {successBody}
            {formBody}
            {!result && (
              <div style={{ marginTop: 20 }}>{actionBar}</div>
            )}
          </div>
        </div>
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Emergency" />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {successBody}
        {formBody}
      </div>
      {!result && (
        <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
          {actionBar}
        </div>
      )}
      <MobTabBar active="emergency" />
    </MobScreen>
  )
})

/** Renders the emergency fee breakdown returned by /emergency/fee-estimate. */
function FeePreviewRows({ estimate }: { estimate: import('@/services/emergency.service').EmergencyFeeEstimate }) {
  const symbol = estimate.currency === 'USD' ? '$' : '₦'
  const fmt = (n: number) =>
    `${symbol}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  const lines: { key: string; label: string; value: number; muted?: boolean }[] = [
    { key: 'base', label: estimate.departmentName ? `${estimate.departmentName} base fee` : 'Department base fee', value: estimate.baseFee },
    { key: 'emerg', label: 'Emergency surcharge', value: estimate.emergencySurcharge },
  ]
  if (estimate.mediumSurchargeApplied) {
    lines.push({ key: 'medium', label: `${estimate.mediumLabel} surcharge`, value: estimate.mediumSurcharge })
  }

  return (
    <div>
      {lines.map((l) => (
        <div key={l.key} style={{
          display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
          fontSize: 13, borderBottom: `1px solid ${MB.line2}`,
        }}>
          <span style={{ color: l.muted ? MB.text3 : MB.text2 }}>{l.label}</span>
          <span style={{ color: MB.text, fontWeight: 500 }}>{fmt(l.value)}</span>
        </div>
      ))}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', background: MB.primary50,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: MB.primary700 }}>Estimated total</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: MB.primary, fontFamily: 'var(--mb-font-mono),monospace' }}>
          {fmt(estimate.fee)}
        </span>
      </div>
    </div>
  )
}

function Row({ label, value, mono, hint, last }: { label: string; value: string; mono?: boolean; hint?: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13,
    }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: MB.text, fontWeight: 500, textTransform: mono ? undefined : 'capitalize', fontFamily: mono ? 'var(--mb-font-mono),monospace' : 'inherit' }}>
          {value}
        </div>
        {hint && <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  )
}
