import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SuperAdminService } from '@/services/superadmin.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useAuthStore } from '@/store/authStore'

// ── Create Admin Dialog ────────────────────────────────────────────────────────

function CreateAdminDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [password, setPassword]   = useState('')

  const mutation = useMutation({
    mutationFn: () => SuperAdminService.createAdmin({ firstName, lastName, email, phone, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] })
      toast.success(`Admin account created for ${email}`)
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to create admin'),
  })

  const valid = firstName && lastName && email && password.length >= 8

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,32,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: MB.bg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 48px rgba(0,0,0,0.20)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={18} color="#6366F1" />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: MB.ink }}>Create admin account</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First name" required htmlFor="ca-fn">
              <Input id="ca-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last name" required htmlFor="ca-ln">
              <Input id="ca-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field label="Email" required htmlFor="ca-email">
            <Input id="ca-email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" type="email" autoComplete="off" />
          </Field>
          <Field label="Phone" htmlFor="ca-phone">
            <Input id="ca-phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon="phone" />
          </Field>
          <Field label="Temporary password" required htmlFor="ca-pwd" hint="Min 8 characters">
            <Input id="ca-pwd" value={password} onChange={(e) => setPassword(e.target.value)} icon="lock" type="password" autoComplete="new-password" />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={mutation.isPending} disabled={!valid} onClick={() => mutation.mutate()}>
            Create admin
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Remove Dialog ──────────────────────────────────────────────────────

function ConfirmRemoveDialog({ adminName, adminId, onClose }: { adminName: string; adminId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => SuperAdminService.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] })
      toast.success(`Admin "${adminName}" removed`)
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to remove admin'),
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,32,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: MB.bg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 48px rgba(0,0,0,0.20)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: MB.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="trash" size={22} color={MB.danger} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: MB.ink }}>Remove admin account?</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: MB.text2, lineHeight: 1.6 }}>
          <strong>{adminName}</strong> will be disabled and all active sessions revoked. This action cannot be undone without Super Admin intervention.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" size="lg" style={{ flex: 1 }} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Remove admin
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Reset Password Dialog ─────────────────────────────────────────────────────

function ResetPasswordDialog({ adminName, adminId, onClose }: { adminName: string; adminId: string; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const mutation = useMutation({
    mutationFn: () => SuperAdminService.resetAdminPassword(adminId, newPassword),
    onSuccess: () => {
      toast.success(`Password reset for ${adminName} — all sessions revoked`)
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to reset password'),
  })

  const valid = newPassword.length >= 8

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,32,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: MB.bg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 48px rgba(0,0,0,0.20)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={20} color="#D97706" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: MB.ink }}>Reset password</h2>
            <p style={{ margin: 0, fontSize: 13, color: MB.text3 }}>{adminName}</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: MB.text2, margin: '0 0 16px', lineHeight: 1.6 }}>
          All active sessions for this admin will be revoked immediately. They must log in with the new password.
        </p>
        <Field label="New password" required htmlFor="rp-pwd" hint="Minimum 8 characters">
          <Input
            id="rp-pwd"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type={showPwd ? 'text' : 'password'}
            icon="lock"
            autoComplete="new-password"
            suffix={
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <Icon name={showPwd ? 'eye-off' : 'eye'} size={16} color={MB.text3} />
              </button>
            }
          />
        </Field>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} disabled={!valid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Reset password
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default memo(function DeskSuperAdmins() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null)
  const [resetPwd, setResetPwd] = useState<{ id: string; name: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['super-admin', 'admins'],
    queryFn: SuperAdminService.listAdmins,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? SuperAdminService.deactivateAdmin(id) : SuperAdminService.activateAdmin(id),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] })
      toast.success(vars.active ? 'Admin deactivated' : 'Admin activated')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Operation failed'),
  })

  return (
    <DeskShell active="admins">
      <DeskTopbar
        title="Admin Management"
        subtitle={`${admins.filter((a) => a.enabled).length} active · ${admins.length} total`}
        actions={
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowCreate(true)}>
            Add admin
          </Btn>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Info Banner */}
        <div style={{ padding: '12px 16px', background: '#EEF2FF', borderRadius: 10, border: '1px solid #C7D2FE', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="shield" size={16} color="#6366F1" />
          <span style={{ fontSize: 13, color: '#4338CA', fontWeight: 500 }}>
            Only Super Admins can create or remove admin accounts. This page is not visible to regular admins.
          </span>
        </div>

        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Admin accounts">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Admin</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Role</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[180, 200, 80, 100, 40].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : admins.length === 0
                ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState icon="users" title="No admin accounts" body="Create the first admin account to get started." />
                      </td>
                    </tr>
                  )
                : admins.map((admin) => {
                    const isSelf = admin.id === currentUserId
                    const fullName = `${admin.firstName} ${admin.lastName}`
                    return (
                      <tr key={admin.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                        <Td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={fullName} size={32} tone="indigo" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: MB.text }}>{fullName}</div>
                              {isSelf && <Badge tone="primary" size="sm">You</Badge>}
                            </div>
                          </div>
                        </Td>
                        <Td mono>{admin.email}</Td>
                        <Td><StatusPill status={admin.enabled ? 'ACTIVE' : 'INACTIVE'} /></Td>
                        <Td>
                          <span style={{ fontSize: 12, background: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                            Admin
                          </span>
                        </Td>
                        <Td>
                          <RowMenu
                            aria-label={`Actions for ${fullName}`}
                            items={[
                              admin.enabled
                                ? { label: 'Deactivate', icon: 'x', onClick: () => toggleMutation.mutate({ id: admin.id, active: true }), disabled: isSelf }
                                : { label: 'Activate', icon: 'check', onClick: () => toggleMutation.mutate({ id: admin.id, active: false }) },
                              { label: 'Reset password', icon: 'lock', onClick: () => setResetPwd({ id: admin.id, name: fullName }), disabled: isSelf },
                              { label: 'Remove admin', icon: 'trash', danger: true, onClick: () => setConfirmRemove({ id: admin.id, name: fullName }), disabled: isSelf },
                            ]}
                          />
                        </Td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateAdminDialog onClose={() => setShowCreate(false)} />}
      {confirmRemove && (
        <ConfirmRemoveDialog
          adminName={confirmRemove.name}
          adminId={confirmRemove.id}
          onClose={() => setConfirmRemove(null)}
        />
      )}
      {resetPwd && (
        <ResetPasswordDialog
          adminName={resetPwd.name}
          adminId={resetPwd.id}
          onClose={() => setResetPwd(null)}
        />
      )}
    </DeskShell>
  )
})
