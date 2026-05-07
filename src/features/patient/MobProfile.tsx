import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-eyebrow" style={{ marginBottom: 8, paddingLeft: 2 }}>{title}</div>
      {children}
    </section>
  )
}

function ProfileRow({ label, value, action, last }: { label: string; value: string; action?: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}` }}>
      <div>
        <div style={{ fontSize: 12, color: MB.text3 }}>{label}</div>
        <div style={{ fontSize: 14, color: MB.text, marginTop: 1 }}>{value}</div>
      </div>
      {action
        ? <span style={{ fontSize: 13, color: MB.primary, fontWeight: 500, cursor: 'pointer' }}>{action}</span>
        : <Icon name="chevronRight" size={16} color={MB.text4} />
      }
    </div>
  )
}

export default memo(function MobProfile() {
  return (
    <MobScreen>
      <MobTopBar title="Profile" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: MB.bg, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${MB.line2}` }}>
          <PhotoBlock w={64} h={64} label="PT · SC" tone="primary" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>Sarah Patient</div>
            <div style={{ fontSize: 13, color: MB.text3, marginTop: 1 }}>Patient · Member since Jan 2024</div>
          </div>
          <Btn variant="secondary" size="sm" icon="edit">Edit</Btn>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Contact details">
            <Card padding={0}>
              <ProfileRow label="Email"         value="sarah.patient@email.com" />
              <ProfileRow label="Phone"         value="(415) 555-0142" />
              <ProfileRow label="Date of birth" value="Mar 14, 1991" last />
            </Card>
          </Section>
          <Section title="Account">
            <Card padding={0}>
              <ProfileRow label="Password"      value="Last changed 4 mo ago" action="Change" />
              <ProfileRow label="Notifications" value="Email · SMS" />
              <ProfileRow label="Language"      value="English (US)" last />
            </Card>
          </Section>
          <Btn variant="ghost" icon="logout" style={{ color: MB.danger, justifyContent: 'flex-start' }}>Sign out</Btn>
        </div>
      </div>
      <MobTabBar active="profile" />
    </MobScreen>
  )
})
