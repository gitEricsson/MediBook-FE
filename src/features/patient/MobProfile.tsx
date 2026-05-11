import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { useAuth } from '@/hooks/useAuth'
import { UserService } from '@/services/user.service'
import { PatientProfileService } from '@/services/patient-profile.service'
import { useQuery } from '@tanstack/react-query'
import { Skel } from '@/components/feedback/Skel'

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
  const { logout } = useAuth()
  const { data: user, isLoading: userLoading } = useQuery({ queryKey: ['me'], queryFn: UserService.getMe })
  const { data: profile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: PatientProfileService.getMyProfile,
    enabled: user?.role === 'patient',
    retry: false,
  })
  const name = user ? `${user.firstName} ${user.lastName}` : 'Profile'
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : 'ME'

  return (
    <MobScreen>
      <MobTopBar title="Profile" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: MB.bg, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${MB.line2}` }}>
          <PhotoBlock w={64} h={64} label={`PT · ${initials.toUpperCase()}`} tone="primary" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>{userLoading ? <Skel w={120} h={16} /> : name}</div>
            <div style={{ fontSize: 13, color: MB.text3, marginTop: 1 }}>{user?.role ?? 'Account'} · {user?.enabled ? 'Active' : 'Disabled'}</div>
          </div>
          <Btn variant="secondary" size="sm" icon="edit">Edit</Btn>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Contact details">
            <Card padding={0}>
              <ProfileRow label="Email"         value={user?.email ?? 'Not available'} />
              <ProfileRow label="Phone"         value={user?.phone ?? 'Not provided'} />
              <ProfileRow label="Blood group" value={profile?.bloodGroup ?? 'Not provided'} last />
            </Card>
          </Section>
          <Section title="Account">
            <Card padding={0}>
              <ProfileRow label="Password"      value="Last changed 4 mo ago" action="Change" />
              <ProfileRow label="Notifications" value={[user?.emailNotifications ? 'Email' : null, user?.smsNotifications ? 'SMS' : null].filter(Boolean).join(' · ') || 'Off'} />
              <ProfileRow label="Language"      value={user?.locale ?? 'en-US'} last />
            </Card>
          </Section>
          <Btn variant="ghost" icon="logout" style={{ color: MB.danger, justifyContent: 'flex-start' }} onClick={logout}>Sign out</Btn>
        </div>
      </div>
      <MobTabBar active="profile" />
    </MobScreen>
  )
})
