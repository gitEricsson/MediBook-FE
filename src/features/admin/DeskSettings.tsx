import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Btn } from '@/components/primitives/Btn'
import { Badge } from '@/components/primitives/Badge'
import { Icon } from '@/components/primitives/Icon'
import { Toggle } from '@/components/forms/Toggle'
import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/services/admin.service'
import { useAuthStore } from '@/store/authStore'

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
