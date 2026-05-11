import { memo, useMemo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Badge } from '@/components/primitives/Badge'
import { Input } from '@/components/forms/Input'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserService, UserProfile } from '@/services/user.service'
import { toast } from 'sonner'

export default memo(function DeskPatientSearch() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<UserProfile[]>({
    queryKey: ['users', 'all'],
    queryFn: () => UserService.listUsers(),
  })

  const patients = useMemo(() => {
    const all = users ?? []
    const term = search.trim().toLowerCase()
    const filtered = all.filter((u) => u.role === 'patient')
    if (!term) return filtered
    return filtered.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.includes(term),
    )
  }, [search, users])

  const disableMutation = useMutation({
    mutationFn: (id: string) => UserService.disableUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users', 'all'] }); toast.success('Account disabled') },
    onError: () => toast.error('Failed to disable account'),
  })
  const enableMutation = useMutation({
    mutationFn: (id: string) => UserService.enableUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users', 'all'] }); toast.success('Account enabled') },
    onError: () => toast.error('Failed to enable account'),
  })
  const revokeMutation = useMutation({
    mutationFn: (id: string) => UserService.revokeSessions(id),
    onSuccess: () => toast.success('Sessions revoked'),
    onError: () => toast.error('Failed to revoke sessions'),
  })

  const displayState = isLoading ? 'loading' : patients.length === 0 ? 'empty' : 'results'

  return (
    <DeskShell active="home">
      <DeskTopbar
        title="Patients"
        subtitle={`${patients.length} records`}
        actions={
          <div style={{ width: 320 }}>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or ID" icon="search" />
          </div>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Patient list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Patient</Th>
                <Th>Patient ID</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>2FA</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {displayState === 'loading' && [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} style={{ padding: '12px 16px' }}><Skel w={j === 0 ? 140 : 90} h={12} /></td>
                  ))}
                </tr>
              ))}
              {displayState === 'empty' && (
                <tr><td colSpan={7}><EmptyState icon="users" title="No patients found" body="Registered patient accounts will appear here." /></td></tr>
              )}
              {displayState === 'results' && patients.map((user) => {
                const name = `${user.firstName} ${user.lastName}`
                return (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={name} size={28} tone="primary" />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{name}</span>
                      </div>
                    </Td>
                    <Td mono>PT-{user.id}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.phone ?? '—'}</Td>
                    <Td>
                      {user.twoFactorEnabled
                        ? <Badge tone="success" size="sm">On</Badge>
                        : <Badge tone="neutral" size="sm">Off</Badge>
                      }
                    </Td>
                    <Td><StatusPill status={user.enabled ? 'ACTIVE' : 'INACTIVE'} /></Td>
                    <Td>
                      <RowMenu
                        aria-label={`Actions for ${name}`}
                        items={[
                          {
                            label: 'Revoke sessions',
                            icon: 'logout',
                            onClick: () => revokeMutation.mutate(user.id),
                          },
                          user.enabled
                            ? { label: 'Disable account', icon: 'x', danger: true, onClick: () => disableMutation.mutate(user.id) }
                            : { label: 'Enable account', icon: 'check', onClick: () => enableMutation.mutate(user.id) },
                        ]}
                      />
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DeskShell>
  )
})
