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
import { useAdminDoctors } from '@/hooks/useAdmin'
import { AdminService } from '@/services/admin.service'
import { toast } from 'sonner'

export default memo(function DeskDoctors() {
  const { data: doctors, isLoading } = useAdminDoctors()
  const [search, setSearch] = useState('')
  const [revoking, setRevoking] = useState<number | null>(null)

  const displayDocs = useMemo(() => doctors ?? [], [doctors])
  const filteredDocs = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return displayDocs
    return displayDocs.filter((d) =>
      d.fullName.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term),
    )
  }, [displayDocs, search])

  const handleExport = () => {
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = [
      ['Name', 'Email', 'Department', 'Specialisation', 'Languages', 'Accepting new'],
      ...filteredDocs.map((d) => [
        d.fullName,
        d.email,
        d.departmentName,
        d.specialization || 'Specialist',
        d.languages || '',
        d.acceptingNew ? 'Yes' : 'No',
      ]),
    ]
    const csv = rows.map((row) => row.map(quote).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'medibook-doctors.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleRevokeSessions = async (doctorId: number, userId: number, name: string) => {
    setRevoking(doctorId)
    try {
      await AdminService.revokeUserSessions(String(userId))
      toast.success(`Sessions revoked for ${name}`)
    } catch {
      toast.error('Failed to revoke sessions')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <DeskShell active="docs">
      <DeskTopbar
        title="Doctors"
        subtitle={`${filteredDocs.length} of ${displayDocs.length}`}
        actions={
          <>
            <div style={{ width: 240 }}>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors..." icon="search" aria-label="Search doctors" />
            </div>
            <Btn variant="secondary" icon="download" onClick={handleExport} disabled={isLoading || filteredDocs.length === 0}>
              Export
            </Btn>
          </>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <div className="mb-table-frame">
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Doctors list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Doctor</Th>
                <Th>Department</Th>
                <Th>Specialisation</Th>
                <Th>Languages</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[200, 120, 140, 100, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : filteredDocs.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="stethoscope" title="No doctors found" body="Assign the ROLE_DOCTOR role to a user to create a doctor profile." /></td></tr>
                : filteredDocs.map((d) => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={d.fullName} size={28} tone="primary" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{d.fullName}</div>
                            <div style={{ fontSize: 11, color: MB.text3 }}>{d.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{d.departmentName}</Td>
                      <Td>{d.specialization || 'Specialist'}</Td>
                      <Td>{d.languages || '—'}</Td>
                      <Td><StatusPill status={d.acceptingNew ? 'ACTIVE' : 'INACTIVE'} /></Td>
                      <Td>
                        <RowMenu
                          aria-label={`Actions for ${d.fullName}`}
                          items={[
                            {
                              label: revoking === d.id ? 'Revoking…' : 'Revoke sessions',
                              icon: 'logout',
                              danger: true,
                              disabled: revoking === d.id,
                              onClick: () => handleRevokeSessions(d.id, d.userId, d.fullName),
                            },
                          ]}
                        />
                      </Td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </DeskShell>
  )
})
