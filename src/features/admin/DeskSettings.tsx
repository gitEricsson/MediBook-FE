import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Btn } from '@/components/primitives/Btn'
import { Badge } from '@/components/primitives/Badge'
import { Icon } from '@/components/primitives/Icon'
import { Toggle } from '@/components/forms/Toggle'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Skel } from '@/components/feedback/Skel'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminService, type PricingPolicy } from '@/services/admin.service'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line}` }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: MB.ink }}>{title}</h2>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </section>
  )
}

function ToggleRow({ label, hint, checked, onChange, disabled }: {
  label: string; hint?: string; checked: boolean; onChange?: () => void; disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange ?? (() => {})} label={label} />
      {disabled && <span style={{ fontSize: 11, color: MB.text4 }}>coming soon</span>}
    </div>
  )
}

// ── Pricing policy (RUD via /admin/pricing-policy) ───────────────────────────

interface PolicyForm {
  emergencyMultiplierPct: string
  followUpDiscountPct: string
  experiencePremiumPct: string
  experienceThresholdYears: string
  mediumSurchargePct: string
}

function policyToForm(p: PricingPolicy): PolicyForm {
  return {
    emergencyMultiplierPct:    String(p.emergencyMultiplierPct),
    followUpDiscountPct:       String(p.followUpDiscountPct),
    experiencePremiumPct:      String(p.experiencePremiumPct),
    experienceThresholdYears:  String(p.experienceThresholdYears),
    mediumSurchargePct:        String(p.mediumSurchargePct),
  }
}

function PricingPolicySection() {
  const queryClient = useQueryClient()
  const { data: policy, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'pricing-policy'],
    queryFn: AdminService.getPricingPolicy,
    staleTime: 30_000,
  })

  if (isLoading || !policy) {
    return (
      <Section title="Pricing policy">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => <Skel key={i} h={42} r={8} />)}
        </div>
      </Section>
    )
  }
  if (isError) {
    return (
      <Section title="Pricing policy">
        <ErrorState title="Couldn't load pricing policy" onRetry={() => refetch()} />
      </Section>
    )
  }
  // Re-mount the editor when the server-side policy's updatedAt changes (e.g. another
  // admin saved). This avoids a setState-in-effect and gives us a clean reset point.
  return (
    <PricingPolicyEditor key={policy.updatedAt} policy={policy} queryClient={queryClient} />
  )
}

function PricingPolicyEditor({
  policy, queryClient,
}: {
  policy: PricingPolicy
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [form, setForm] = useState<PolicyForm>(() => policyToForm(policy))

  const save = useMutation({
    mutationFn: () => {
      if (!form || !policy) throw new Error('policy not loaded')
      return AdminService.updatePricingPolicy({
        emergencyMultiplierPct:    Number(form.emergencyMultiplierPct),
        followUpDiscountPct:       Number(form.followUpDiscountPct),
        experiencePremiumPct:      Number(form.experiencePremiumPct),
        experienceThresholdYears:  Number(form.experienceThresholdYears),
        mediumSurchargePct:        Number(form.mediumSurchargePct),
        ifUnchangedSince:          policy.updatedAt,
      })
    },
    onSuccess: (updated: PricingPolicy) => {
      queryClient.setQueryData(['admin', 'pricing-policy'], updated)
      toast.success('Pricing policy saved')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to save pricing policy'),
  })

  const set = (k: keyof PolicyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const isDirty = (
    Number(form.emergencyMultiplierPct)   !== policy.emergencyMultiplierPct ||
    Number(form.followUpDiscountPct)      !== policy.followUpDiscountPct ||
    Number(form.experiencePremiumPct)     !== policy.experiencePremiumPct ||
    Number(form.experienceThresholdYears) !== policy.experienceThresholdYears ||
    Number(form.mediumSurchargePct)       !== policy.mediumSurchargePct
  )

  return (
    <Section title="Pricing policy">
      <div style={{ fontSize: 12, color: MB.text3, lineHeight: 1.5 }}>
        Hospital-wide modifiers applied on top of each department's base fee. Department fees
        are managed in <strong>Departments</strong>.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Emergency surcharge (%)" htmlFor="pp-emerg" hint="Added to base for EMERGENCY">
          <Input id="pp-emerg" type="number" min={0} max={500} value={form.emergencyMultiplierPct} onChange={set('emergencyMultiplierPct')} />
        </Field>
        <Field label="Follow-up discount (%)" htmlFor="pp-follow" hint="Subtracted from base for FOLLOW_UP">
          <Input id="pp-follow" type="number" min={0} max={100} value={form.followUpDiscountPct} onChange={set('followUpDiscountPct')} />
        </Field>
        <Field label="Senior surcharge (%)" htmlFor="pp-senior" hint="Applied above the threshold">
          <Input id="pp-senior" type="number" min={0} max={200} value={form.experiencePremiumPct} onChange={set('experiencePremiumPct')} />
        </Field>
        <Field label="Senior threshold (years)" htmlFor="pp-thresh" hint="Exclusive — &gt; this many years">
          <Input id="pp-thresh" type="number" min={0} max={60} value={form.experienceThresholdYears} onChange={set('experienceThresholdYears')} />
        </Field>
        <Field label="Medium surcharge (%)" htmlFor="pp-medium" hint="Telehealth / video on top of total">
          <Input id="pp-medium" type="number" min={0} max={100} value={form.mediumSurchargePct} onChange={set('mediumSurchargePct')} />
        </Field>
      </div>

      <div style={{ fontSize: 11, color: MB.text3 }}>
        Last updated {new Date(policy.updatedAt).toLocaleString()}
        {policy.updatedBy != null ? ` by user #${policy.updatedBy}` : ''}.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn
          variant="secondary"
          size="sm"
          disabled={!isDirty || save.isPending}
          onClick={() => setForm(policyToForm(policy))}
        >
          Revert
        </Btn>
        <Btn
          variant="primary"
          size="sm"
          loading={save.isPending}
          disabled={!isDirty}
          onClick={() => save.mutate()}
        >
          Save policy
        </Btn>
      </div>

      {/* Live preview — show how a ₦10k base fee would resolve under the current
          form values, helping admins sanity-check the math before saving. */}
      <PricingPreview form={form} />
    </Section>
  )
}

function PricingPreview({ form }: { form: PolicyForm }) {
  const base = 10_000
  const emerg = Number(form.emergencyMultiplierPct) || 0
  const follow = Number(form.followUpDiscountPct) || 0
  const senior = Number(form.experiencePremiumPct) || 0
  const medium = Number(form.mediumSurchargePct) || 0

  const round = (n: number) => Math.round(n * 100) / 100

  // Reproduce the BE math: base → type → senior → medium.
  const firstVisit = base
  const followUp   = round(base - base * (follow / 100))
  const emergency  = round(base + base * (emerg  / 100))
  const seniorVid  = round((firstVisit + firstVisit * (senior / 100)) * (1 + medium / 100))

  const cell = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  return (
    <div style={{ background: MB.bg2, borderRadius: 10, padding: 14, border: `1px solid ${MB.line2}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
        Preview · ₦10,000 department base
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, fontSize: 13 }}>
        <span style={{ color: MB.text2 }}>First visit, in-person</span>
        <span style={{ fontWeight: 500, color: MB.text }}>{cell(firstVisit)}</span>
        <span style={{ color: MB.text2 }}>Follow-up, in-person</span>
        <span style={{ fontWeight: 500, color: MB.text }}>{cell(followUp)}</span>
        <span style={{ color: MB.text2 }}>Emergency, in-person</span>
        <span style={{ fontWeight: 500, color: MB.text }}>{cell(emergency)}</span>
        <span style={{ color: MB.text2 }}>First visit, senior doctor, video</span>
        <span style={{ fontWeight: 500, color: MB.text }}>{cell(seniorVid)}</span>
      </div>
    </div>
  )
}

export default memo(function DeskSettings() {
  const { data: health } = useQuery({ queryKey: ['system', 'health'], queryFn: AdminService.getHealth })
  const { data: version } = useQuery({ queryKey: ['system', 'version'], queryFn: AdminService.getVersion })
  const role = useAuthStore((s) => s.user?.role)
  const isSuperAdmin = role === 'super_admin'

  // UI-only settings (no backend endpoint for org-level config in this API)
  const [smsReminders, setSmsReminders] = useState(true)
  const [emailConfirm, setEmailConfirm] = useState(true)
  const [selfBooking, setSelfBooking] = useState(true)
  const [sameDayCancel, setSameDayCancel] = useState(false)

  const isApiUp = health?.status === 'UP' || health?.status === 'ok'

  return (
    <DeskShell active="settings">
      <DeskTopbar title="Settings" />
      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 680 }}>

        <Section title="System status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>API Health</div>
                <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Backend service availability</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isApiUp ? MB.success : MB.warn, display: 'inline-block' }} />
                <Badge tone={isApiUp ? 'success' : 'neutral'} size="sm">
                  {isApiUp ? 'Operational' : 'Checking…'}
                </Badge>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: MB.text2 }}>Backend version</div>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: MB.text3 }}>
                {version?.build ?? version?.version ?? 'v1.x'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: MB.text2 }}>Region</div>
              <span style={{ fontSize: 12, color: MB.text3 }}>AWS us-east-1 (primary)</span>
            </div>
          </div>
        </Section>

        <Section title="Appointment settings">
          <ToggleRow label="Patient self-booking" hint="Patients can book directly without admin approval" checked={selfBooking} onChange={() => setSelfBooking((v) => !v)} />
          <ToggleRow label="SMS reminders" hint="Send automated SMS 24 hours before each visit" checked={smsReminders} onChange={() => setSmsReminders((v) => !v)} />
          <ToggleRow label="Email confirmations" hint="Send booking confirmation emails to patients" checked={emailConfirm} onChange={() => setEmailConfirm((v) => !v)} />
          <ToggleRow label="Allow same-day cancellations" hint="Disable to enforce the 24-hour cancellation fee policy" checked={sameDayCancel} onChange={() => setSameDayCancel((v) => !v)} />
          <div style={{ padding: '10px 12px', background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn, display: 'flex', gap: 8 }}>
            <span>⚠</span>
            <span>Appointment policy changes take effect for new bookings only. Contact support to apply retroactively.</span>
          </div>
        </Section>

        <PricingPolicySection />

        {isSuperAdmin ? (
          <Section title="Danger zone">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>Reset all platform data</div>
              <div style={{ fontSize: 12, color: MB.text3, marginTop: 2, marginBottom: 14, lineHeight: 1.5 }}>
                Permanently delete all appointments, patients, and doctor profiles. This cannot be undone.
              </div>
              <Btn variant="dangerOutline" size="sm" icon="trash">Delete all data…</Btn>
            </div>
          </Section>
        ) : (
          <div style={{ padding: '14px 16px', background: MB.bg2, borderRadius: 10, border: `1px solid ${MB.line2}`, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name="shield" size={16} color={MB.text3} />
            <span style={{ fontSize: 13, color: MB.text3 }}>Danger zone is restricted to Super Admins.</span>
          </div>
        )}

        <div style={{ padding: '12px 16px', background: MB.bg2, borderRadius: 10, fontSize: 12, color: MB.text3, border: `1px solid ${MB.line2}` }}>
          Organisation-level configuration (name, subdomain, contact) is managed through the backend API. Contact your system administrator to change these settings.
        </div>
      </div>
    </DeskShell>
  )
})
