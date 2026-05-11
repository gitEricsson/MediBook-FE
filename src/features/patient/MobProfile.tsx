import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Skel } from '@/components/feedback/Skel'
import { useAuth } from '@/hooks/useAuth'
import { UserService } from '@/services/user.service'
import { PatientProfileService } from '@/services/patient-profile.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useNavigate } from 'react-router-dom'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-eyebrow" style={{ marginBottom: 8, paddingLeft: 2 }}>{title}</div>
      {children}
    </section>
  )
}

function ProfileRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}` }}>
      <div>
        <div style={{ fontSize: 12, color: MB.text3 }}>{label}</div>
        <div style={{ fontSize: 14, color: MB.text, marginTop: 1 }}>{value || 'Not provided'}</div>
      </div>
    </div>
  )
}

// ── Edit profile panel ─────────────────────────────────────────────────────

function EditProfilePanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: UserService.getMe })
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')

  const mutation = useMutation({
    mutationFn: () => UserService.updateMe({ firstName, lastName, phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to update profile'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: MB.bg, width: '100%', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 20px' }} aria-hidden="true" />
        <h3 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>Edit profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First name" htmlFor="edit-fn">
              <Input id="edit-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="edit-ln">
              <Input id="edit-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field label="Phone" htmlFor="edit-phone">
            <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon="phone" />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={mutation.isPending} onClick={() => mutation.mutate()}>Save changes</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Change password panel ──────────────────────────────────────────────────

function ChangePasswordPanel({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => UserService.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => { toast.success('Password changed'); onClose() },
    onError: (err) => setError(parseApiError(err).message || 'Failed to change password'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: MB.bg, width: '100%', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 20px' }} aria-hidden="true" />
        <h3 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>Change password</h3>
        {error && (
          <div style={{ padding: '10px 12px', background: MB.dangerBg, borderRadius: 8, marginBottom: 14, fontSize: 13, color: MB.danger, display: 'flex', gap: 8 }}>
            <Icon name="alert" size={15} color={MB.danger} />{error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Current password" htmlFor="cp-cur">
            <Input id="cp-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} icon="lock" autoComplete="current-password" />
          </Field>
          <Field label="New password" htmlFor="cp-new" hint="Min 8 chars with upper/lowercase, number and symbol">
            <Input id="cp-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} icon="lock" autoComplete="new-password" />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={mutation.isPending} disabled={!current || !next} onClick={() => mutation.mutate()}>Update password</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

type Panel = 'edit' | 'password' | null

export default memo(function MobProfile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel>(null)
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
        {/* Header */}
        <div style={{ background: MB.bg, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${MB.line2}` }}>
          <PhotoBlock w={64} h={64} label={`PT · ${initials.toUpperCase()}`} tone="primary" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>
              {userLoading ? <Skel w={120} h={16} /> : name}
            </div>
            <div style={{ fontSize: 13, color: MB.text3, marginTop: 1 }}>
              {user?.role === 'patient' ? 'Patient' : user?.role ?? 'Account'}
            </div>
          </div>
          <Btn variant="secondary" size="sm" icon="edit" onClick={() => setPanel('edit')}>Edit</Btn>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Contact details">
            <Card padding={0}>
              <ProfileRow label="Email" value={user?.email ?? ''} />
              <ProfileRow label="Phone" value={user?.phone ?? ''} />
              <ProfileRow label="Blood group" value={profile?.bloodGroup ?? ''} last />
            </Card>
          </Section>

          <Section title="Medical details">
            <Card padding={0}>
              <ProfileRow label="Allergies" value={profile?.allergies ?? ''} />
              <ProfileRow label="Medical history" value={profile?.medicalHistory ?? ''} />
              <ProfileRow label="Emergency contact" value={profile?.emergencyContact ?? ''} last />
            </Card>
          </Section>

          <Section title="Records">
            <Card padding={0}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/patient/history')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${MB.line2}`, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="edit" size={16} color={MB.text3} />
                  <span style={{ fontSize: 14, color: MB.text }}>Consultation history</span>
                </div>
                <Icon name="chevronRight" size={16} color={MB.text4} />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/patient/invoices')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="inbox" size={16} color={MB.text3} />
                  <span style={{ fontSize: 14, color: MB.text }}>Invoices</span>
                </div>
                <Icon name="chevronRight" size={16} color={MB.text4} />
              </div>
            </Card>
          </Section>

          <Section title="Security">
            <Card padding={0}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setPanel('password')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: 14, color: MB.text }}>Change password</div>
                </div>
                <Icon name="chevronRight" size={16} color={MB.text4} />
              </div>
            </Card>
          </Section>

          <Btn
            variant="ghost"
            icon="logout"
            style={{ color: MB.danger, justifyContent: 'flex-start' }}
            onClick={logout}
          >
            Sign out
          </Btn>
        </div>
      </div>

      <MobTabBar active="profile" />

      {panel === 'edit'     && <EditProfilePanel onClose={() => setPanel(null)} />}
      {panel === 'password' && <ChangePasswordPanel onClose={() => setPanel(null)} />}
    </MobScreen>
  )
})
