import { memo, useState, useRef } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Skel } from '@/components/feedback/Skel'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import { UserService } from '@/services/user.service'
import { PatientProfileService, PatientProfileResponse } from '@/services/patient-profile.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useNavigate } from 'react-router-dom'
import { AccessGrantList } from './AccessGrantList'
import { sanitizeInput } from '@/lib/sanitize'
import { validatePassword } from '@/lib/validation'

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
    mutationFn: () => UserService.updateMe({
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      phone: phone.replace(/\s+/g, ''),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to update profile'),
  })

  return (
    <ModalShell onClose={onClose} title="Edit profile">
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
    </ModalShell>
  )
}

// ── Change password panel ──────────────────────────────────────────────────

function ChangePasswordPanel({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChangePassword = () => {
    setError(null)

    if (!current || !next) {
      setError('Please fill in both password fields')
      return
    }

    const passwordErrors = validatePassword(next)
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0])
      return
    }

    mutation.mutate()
  }

  const mutation = useMutation({
    mutationFn: () => UserService.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => { toast.success('Password changed'); onClose() },
    onError: (err) => setError(parseApiError(err).message || 'Failed to change password'),
  })

  return (
    <ModalShell onClose={onClose} title="Change password">
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
        <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={mutation.isPending} disabled={!current || !next} onClick={handleChangePassword}>Update password</Btn>
      </div>
    </ModalShell>
  )
}

// ── Edit medical details panel ─────────────────────────────────────────────────

function EditMedicalPanel({ profile, onClose }: { profile: PatientProfileResponse | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup ?? '')
  const [allergies, setAllergies] = useState(profile?.allergies ?? '')
  const [medicalHistory, setMedicalHistory] = useState(profile?.medicalHistory ?? '')
  const [emergencyContact, setEmergencyContact] = useState(profile?.emergencyContact ?? '')

  const mutation = useMutation({
    mutationFn: () => PatientProfileService.upsertMyProfile({
      bloodGroup: sanitizeInput(bloodGroup) || undefined,
      allergies: sanitizeInput(allergies),
      medicalHistory: sanitizeInput(medicalHistory),
      emergencyContact: sanitizeInput(emergencyContact),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] })
      toast.success('Medical info updated')
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to update medical info'),
  })

  return (
    <ModalShell onClose={onClose} title="Medical information">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Blood group" htmlFor="med-bg" hint="e.g. A+, O-">
          <Input id="med-bg" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="A+" />
        </Field>
        <Field label="Allergies" htmlFor="med-allergy">
          <Input id="med-allergy" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Penicillin, Latex…" />
        </Field>
        <Field label="Medical history" htmlFor="med-hist">
          <textarea id="med-hist" value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} rows={4}
            placeholder="Hypertension (2018), Appendectomy (2020)…"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${MB.line}`, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: MB.text }} />
        </Field>
        <Field label="Emergency contact" htmlFor="med-ec" hint="Name and phone number">
          <Input id="med-ec" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Jane Doe – +1 555 000 0000" icon="phone" />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={mutation.isPending} onClick={() => mutation.mutate()}>Save</Btn>
      </div>
    </ModalShell>
  )
}

// ── Access Management panel ────────────────────────────────────────────────────

function AccessManagementPanel({ patientId, onClose }: { patientId: number; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} title="Health Record Access">
      <p style={{ fontSize: 14, color: MB.text2, marginBottom: 20 }}>Manage which doctors can access your health records. You can grant or revoke access at any time.</p>
      <div style={{ marginBottom: 20 }}>
        <AccessGrantList patientId={patientId} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Done</Btn>
      </div>
    </ModalShell>
  )
}

// Responsive modal — bottom sheet on mobile, centred dialog on desktop.
function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  const { isWide } = useViewport()
  if (isWide) {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: MB.bg, width: '100%', maxWidth: 520, borderRadius: 14, padding: 28, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: 0 }}>{title}</h3>
            <button aria-label="Close" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="x" size={18} color={MB.text3} />
            </button>
          </div>
          {children}
        </div>
      </div>
    )
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: MB.bg, width: '100%', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 20px' }} aria-hidden="true" />
        <h3 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ── Shared profile content ─────────────────────────────────────────────────

type Panel = 'edit' | 'password' | 'medical' | 'access' | null

interface ProfileContentProps {
  user: { firstName?: string; lastName?: string; email?: string; phone?: string; role?: string; avatarUrl?: string; id: string | number } | undefined
  userLoading: boolean
  profile: PatientProfileResponse | undefined
  initials: string
  name: string
  onAvatarClick: () => void
  setPanel: (p: Panel) => void
  navigate: (to: string) => void
  logout: () => void | Promise<void>
}

function ProfileContent({ user, userLoading, profile, initials, name, onAvatarClick, setPanel, navigate, logout }: ProfileContentProps) {
  return (
    <>
      {/* Header */}
      <div style={{ background: MB.bg, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${MB.line2}` }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <PhotoBlock w={64} h={64} label={initials.toUpperCase()} tone="primary" src={user?.avatarUrl} onClick={onAvatarClick} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: MB.primary, border: `2px solid ${MB.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Icon name="camera" size={10} color="#fff" />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>
            {userLoading ? <Skel w={120} h={16} /> : name}
          </div>
          <div style={{ fontSize: 13, color: MB.text3, marginTop: 1 }}>
            {user?.role === 'patient' ? 'Patient' : user?.role === 'doctor' ? 'Doctor' : user?.role ?? 'Account'}
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
          <Card padding={0} style={{ position: 'relative' }}>
            <ProfileRow label="Allergies" value={profile?.allergies ?? ''} />
            <ProfileRow label="Medical history" value={profile?.medicalHistory ?? ''} />
            <ProfileRow label="Emergency contact" value={profile?.emergencyContact ?? ''} last />
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="secondary" size="sm" icon="edit" onClick={() => setPanel('medical')}>Edit medical info</Btn>
            </div>
          </Card>
        </Section>

        <Section title="Access Management">
          <Card padding={0}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setPanel('access')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontSize: 14, color: MB.text }}>Manage Doctor Access</div>
                <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Grant or revoke health record access.</div>
              </div>
              <Icon name="chevronRight" size={16} color={MB.text4} />
            </div>
          </Card>
        </Section>

        <Section title="Records">
          <Card padding={0}>
            <RecordsRow icon="edit"     label="Consultation history"   onClick={() => navigate('/patient/history')} />
            <RecordsRow icon="inbox"    label="Invoices"               onClick={() => navigate('/patient/invoices')} />
            <RecordsRow icon="clock"    label="Waitlist"               onClick={() => navigate('/patient/waitlist')} />
            <RecordsRow icon="calendar" label="Recurring appointments" onClick={() => navigate('/patient/recurring')} last />
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
          onClick={() => { void logout() }}
        >
          Sign out
        </Btn>
      </div>
    </>
  )
}

function RecordsRow({ icon, label, onClick, last }: { icon: 'edit' | 'inbox' | 'clock' | 'calendar'; label: string; onClick: () => void; last?: boolean }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={16} color={MB.text3} />
        <span style={{ fontSize: 14, color: MB.text }}>{label}</span>
      </div>
      <Icon name="chevronRight" size={16} color={MB.text4} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

export default memo(function MobProfile() {
  const { isWide } = useViewport()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel>(null)
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: user, isLoading: userLoading } = useQuery({ queryKey: ['me'], queryFn: UserService.getMe })
  const { data: profile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: PatientProfileService.getMyProfile,
    enabled: user?.role === 'patient',
    retry: false,
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => UserService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile picture updated')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to upload photo'),
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
    e.target.value = ''
  }

  const name = user ? `${user.firstName} ${user.lastName}` : 'Profile'
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : 'ME'

  const content = (
    <ProfileContent
      user={user}
      userLoading={userLoading}
      profile={profile}
      initials={initials}
      name={name}
      onAvatarClick={() => avatarInputRef.current?.click()}
      setPanel={setPanel}
      navigate={navigate}
      logout={logout}
    />
  )

  const fileInput = (
    <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
  )

  const panels = (
    <>
      {panel === 'edit'     && <EditProfilePanel onClose={() => setPanel(null)} />}
      {panel === 'password' && <ChangePasswordPanel onClose={() => setPanel(null)} />}
      {panel === 'medical'  && <EditMedicalPanel profile={profile ?? null} onClose={() => setPanel(null)} />}
      {panel === 'access'   && user && <AccessManagementPanel patientId={typeof user.id === 'number' ? user.id : parseInt(user.id as string)} onClose={() => setPanel(null)} />}
    </>
  )

  if (isWide) {
    return (
      <PatientShell title="Profile">
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 760 }}>
            {content}
          </div>
        </div>
        {fileInput}
        {panels}
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Profile" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {content}
      </div>
      <MobTabBar active="profile" />
      {fileInput}
      {panels}
    </MobScreen>
  )
})
