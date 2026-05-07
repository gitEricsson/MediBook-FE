import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Btn } from '@/components/primitives/Btn'
import { Toggle } from '@/components/forms/Toggle'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'

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

function ToggleRow({ label, hint, checked }: { label: string; hint?: string; checked: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{hint}</div>}
      </div>
      <Toggle checked={checked} label={label} />
    </div>
  )
}

export default memo(function DeskSettings() {
  return (
    <DeskShell active="settings">
      <DeskTopbar title="Settings"
        actions={<Btn variant="primary" size="sm">Save changes</Btn>} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 680 }}>
        <Section title="Organisation">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Organisation name" htmlFor="org-name">
              <Input id="org-name" value="Bay General Medical Center" />
            </Field>
            <Field label="Subdomain" htmlFor="org-slug">
              <Input id="org-slug" value="baygeneral" suffix=".medibook.health" />
            </Field>
          </div>
          <Field label="Contact email" htmlFor="org-email">
            <Input id="org-email" value="admin@baygeneral.org" icon="mail" />
          </Field>
        </Section>
        <Section title="Appointments">
          <ToggleRow label="Patient self-booking"         hint="Patients can book directly without admin approval" checked />
          <ToggleRow label="SMS reminders"               hint="Send automated SMS 24h before each visit"          checked />
          <ToggleRow label="Email confirmations"                                                                   checked />
          <ToggleRow label="Allow same-day cancellations" hint="Disable to enforce cancellation fee policy"       checked={false} />
        </Section>
        <Section title="Danger zone">
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>Reset all data</div>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2, marginBottom: 12 }}>
              Permanently delete all appointments, patients, and doctors. This cannot be undone.
            </div>
            <Btn variant="dangerOutline" size="sm" icon="trash">Delete all data…</Btn>
          </div>
        </Section>
      </div>
    </DeskShell>
  )
})
