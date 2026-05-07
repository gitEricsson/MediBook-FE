import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-eyebrow" style={{ marginBottom: 8 }}>{title}</div>{children}</div>
}

function ProfileRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

export default memo(function MobDocApptDetail() {
  return (
    <MobScreen>
      <MobTopBar title="Appointment" back right={
        <button className="mb-icon-btn" aria-label="More options"><Icon name="moreH" size={18} color={MB.text} /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: MB.bg, padding: 16, borderBottom: `1px solid ${MB.line2}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="mb-eyebrow">Tue, May 6 · 10:00 AM PT</div>
              <h2 className="mb-h2" style={{ fontSize: 19, marginTop: 4 }}>Marcus Lee</h2>
              <div style={{ fontSize: 12, color: MB.text3 }}>34 yrs · M · MRN 4Q-2911</div>
            </div>
            <StatusPill status="SCHEDULED" />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: MB.bg2, borderRadius: 10 }}>
            <PhotoBlock w={44} h={44} label="PT · ML" tone="slate" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Marcus Lee</div>
              <div style={{ fontSize: 11, color: MB.text3 }}>(415) 555-0188</div>
            </div>
            <Btn variant="secondary" size="sm" icon="phone">Call</Btn>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Reason for visit">
            <Card padding={12}>
              <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.5 }}>
                Intermittent chest discomfort over past 2 weeks, worse on exertion. No prior cardiac history. Father had MI at 58.
              </div>
            </Card>
          </Section>
          <Section title="History">
            <Card padding={0}>
              <ProfileRow label="Last visit"   value="Mar 4, 2026 · Annual physical" />
              <ProfileRow label="Allergies"    value="Penicillin" />
              <ProfileRow label="Active meds"  value="Atorvastatin 20mg" last />
            </Card>
          </Section>
        </div>
      </div>
      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn variant="primary" size="lg" full icon="check">Mark completed</Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="md" style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="secondary" size="md" style={{ flex: 1, color: MB.danger }}>No-show</Btn>
        </div>
      </div>
    </MobScreen>
  )
})
