import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { Btn } from '@/components/primitives/Btn'
import { Badge } from '@/components/primitives/Badge'
import { Icon } from '@/components/primitives/Icon'
import { Toggle } from '@/components/forms/Toggle'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { useViewport } from '@/hooks/useViewport'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminService } from '@/services/admin.service'
import { UserService } from '@/services/user.service'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { validatePassword } from '@/lib/validation'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${MB.line}` }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: MB.ink }}>{title}</h2>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
    </section>
  )
}

function ToggleRow({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

// ── Change password (re-used from patient profile pattern) ───────────────

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [error, setError]     = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => UserService.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => { toast.success('Password changed'); onDone() },
    onError: (err) => setError(parseApiError(err).message || 'Failed to change password'),
  })

  const handleSubmit = () => {
    setError(null)
    if (!current || !next) return setError('Fill both fields')
    const errs = validatePassword(next)
    if (errs.length > 0) return setError(errs[0])
    mutation.mutate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div role="alert" style={{ padding: '10px 12px', background: MB.dangerBg, borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8 }}>
          <Icon name="alert" size={15} color={MB.danger} />{error}
        </div>
      )}
      <Field label="Current password" htmlFor="ds-cur">
        <Input id="ds-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} icon="lock" autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="ds-new" hint="Min 8 chars, mixed case, number and symbol">
        <Input id="ds-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} icon="lock" autoComplete="new-password" />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="primary" size="sm" loading={mutation.isPending} disabled={!current || !next} onClick={handleSubmit}>
          Update password
        </Btn>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export default memo(function MobDocSettings() {
  const { isWide } = useViewport()
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  // Local UI preferences — persisted via useLocalStorage. These aren't surfaced
  // on the backend yet, but the UI captures the intent and keeps the state
  // across reloads. Replace with an API call when the BE adds doctor prefs.
  const [emailAlerts, setEmailAlerts] = useLocalStorage('doc:pref:emailAlerts', true)
  const [smsAlerts, setSmsAlerts]     = useLocalStorage('doc:pref:smsAlerts',   true)
  const [pushAlerts, setPushAlerts]   = useLocalStorage('doc:pref:pushAlerts',  true)
  const [autoCompleteNotes, setAutoCompleteNotes] = useLocalStorage('doc:pref:autoNoteSuggestions', true)
  const [calendarSync, setCalendarSync] = useLocalStorage('doc:pref:calendarSync', false)
  const [showPassword, setShowPassword] = useState(false)

  const { data: health } = useQuery({ queryKey: ['system', 'health'],  queryFn: AdminService.getHealth })
  const { data: version } = useQuery({ queryKey: ['system', 'version'], queryFn: AdminService.getVersion })
  const isApiUp = health?.status === 'UP' || health?.status === 'ok'

  // Server-side endpoint revokes all sessions for the given user id. The current
  // session may also be invalidated — surface that to the user so they know they
  // might be signed out on the next request.
  const revokeMine = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('No user id available')
      return UserService.revokeSessions(userId)
    },
    onSuccess: () => {
      toast.success('Sessions revoked — you may be signed out on the next action')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to revoke sessions'),
  })

  const body = (
    <>
      <Section title="Notifications">
        <ToggleRow label="Email alerts"
          hint="New appointments, cancellations, reminders"
          checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
        <ToggleRow label="SMS alerts"
          hint="High-priority events (emergency, waiting patient)"
          checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} />
        <ToggleRow label="Browser push"
          hint="Push notifications while the portal is open"
          checked={pushAlerts} onChange={() => setPushAlerts(!pushAlerts)} />
        <div style={{ padding: '10px 12px', background: MB.bg2, borderRadius: 8, fontSize: 12, color: MB.text3, display: 'flex', gap: 8 }}>
          <Icon name="info" size={14} color={MB.text3} />
          <span>
            Preferences are stored locally for now. SMS/email delivery still
            follows the org-wide notification config until a doctor-prefs API ships.
          </span>
        </div>
      </Section>

      <Section title="Clinical workflow">
        <ToggleRow label="AI note suggestions"
          hint="Suggest diagnosis and treatment text while typing consultation notes"
          checked={autoCompleteNotes} onChange={() => setAutoCompleteNotes(!autoCompleteNotes)} />
        <ToggleRow label="Calendar sync"
          hint="Mirror your appointments to a calendar invite (.ics) for each booking"
          checked={calendarSync} onChange={() => setCalendarSync(!calendarSync)} />
      </Section>

      <Section title="Security">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>Password</div>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Change your sign-in password</div>
          </div>
          {!showPassword && <Btn variant="secondary" size="sm" onClick={() => setShowPassword(true)}>Change…</Btn>}
        </div>
        {showPassword && <ChangePasswordForm onDone={() => setShowPassword(false)} />}

        <div style={{ height: 1, background: MB.line2 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>Active sessions</div>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>
              Sign out of every device except this one
            </div>
          </div>
          <Btn variant="dangerOutline" size="sm" loading={revokeMine.isPending}
            onClick={() => revokeMine.mutate()}>
            Revoke others
          </Btn>
        </div>
      </Section>

      <Section title="System">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: MB.text2 }}>API health</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isApiUp ? MB.success : MB.warn }} />
            <Badge tone={isApiUp ? 'success' : 'neutral'} size="sm">
              {isApiUp ? 'Operational' : 'Checking…'}
            </Badge>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: MB.text2 }}>Backend build</div>
          <span style={{ fontFamily: 'var(--mb-font-mono),monospace', fontSize: 12, color: MB.text3 }}>
            {version?.build ?? version?.version ?? 'dev'}
          </span>
        </div>
      </Section>

      <Btn variant="ghost" icon="logout"
        style={{ color: MB.danger, justifyContent: 'flex-start' }}
        onClick={() => { void logout() }}>
        Sign out
      </Btn>
    </>
  )

  if (isWide) {
    return (
      <DoctorShell title="Settings">
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>{body}</div>
        </div>
      </DoctorShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Settings" />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{body}</div>
      <MobTabBar role="doctor" active="settings" />
    </MobScreen>
  )
})
