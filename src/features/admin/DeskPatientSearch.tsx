import { memo, useMemo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Input } from '@/components/forms/Input'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { UserService, UserProfile } from '@/services/user.service'

export default memo(function DeskPatientSearch() {
  const [search, setSearch] = useState('')
  const { data: users, isLoading, isError } = useQuery<UserProfile[]>({
    queryKey: ['users', 'patients'],
    queryFn: async () => (await UserService.listUsers()).filter((user) => user.role === 'patient'),
  })

  const patients = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users ?? []
    return (users ?? []).filter((user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.id.includes(term),
    )
  }, [search, users])

  const displayState = isLoading ? 'loading' : isError || patients.length === 0 ? 'empty' : 'results'

  return (
    <DeskShell active="home">
      <DeskTopbar title="Patient search" actions={<Btn variant="secondary" size="sm" icon="users">Patients</Btn>} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or ID" icon="search" />
          </div>
        </div>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Patient list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Patient</Th>
                <Th>Patient ID</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {displayState === 'loading' && [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} style={{ padding: '12px 16px' }}><Skel w={j === 0 ? 140 : 90} h={12} /></td>
                  ))}
                </tr>
              ))}
              {displayState === 'empty' && (
                <tr><td colSpan={6}><EmptyState icon="users" title="No patients found" body="Registered patient accounts will appear here." /></td></tr>
              )}
              {displayState === 'results' && patients.map((user) => {
                const name = `${user.firstName} ${user.lastName}`
                return (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={name} size={28} tone="primary" />
                        <span style={{ fontWeight: 500 }}>{name}</span>
                      </div>
                    </Td>
                    <Td mono>PT-{user.id}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.phone ?? 'Not provided'}</Td>
                    <Td><StatusPill status={user.enabled ? 'ACTIVE' : 'INACTIVE'} /></Td>
                    <Td><RowMenu aria-label={`Actions for ${name}`} /></Td>
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
