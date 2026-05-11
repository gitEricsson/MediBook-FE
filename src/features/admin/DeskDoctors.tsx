import { memo, useMemo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Input } from '@/components/forms/Input'
import { Field } from '@/components/forms/Field'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAdminDoctors, useAdminDepartments } from '@/hooks/useAdmin'
import { AdminService } from '@/services/admin.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ── Add Doctor Drawer ─────────────────────────────────────────────────────────

interface AddDoctorForm {
  firstName: string; lastName: string; email: string
  departmentId: string; specialization: string; licenseNumber: string
  startTime: string; endTime: string
}

function AddDoctorDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: departments = [] } = useAdminDepartments()
  const [form, setForm] = useState<AddDoctorForm>({
    firstName: '', lastName: '', email: '',
    departmentId: '', specialization: '', licenseNumber: '',
    startTime: '9:00 AM', endTime: '5:00 PM',
  })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => AdminService.createDoctor({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      departmentId: form.departmentId,
      specialization: form.specialization || undefined,
      licenseNumber: form.licenseNumber || undefined,
      defaultStartTime: form.startTime,
      defaultEndTime: form.endTime,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
      toast.success(`Dr. ${form.firstName} ${form.lastName} invited`)
      onSaved()
    },
    onError: () => toast.error('Failed to create doctor account'),
  })

  const set = (k: keyof AddDoctorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const canSubmit = form.firstName && form.lastName && form.email && form.departmentId

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(15,23,42,0.35)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 100,
        width: 440, background: MB.bg, boxShadow: '-12px 0 32px rgba(15,23,42,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: MB.ink }}>Add a new doctor</h2>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Provisions an account and sends invitation.</div>
          </div>
          <button onClick={onClose} aria-label="Close drawer" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={MB.text2} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First name" required htmlFor="dr-fn">
              <Input id="dr-fn" value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last name" required htmlFor="dr-ln">
              <Input id="dr-ln" value={form.lastName} onChange={set('lastName')} />
            </Field>
          </div>
          <Field label="Work email" required htmlFor="dr-email" hint="An invitation will be sent here.">
            <Input id="dr-email" value={form.email} onChange={set('email')} icon="mail" type="email" autoComplete="off" />
          </Field>
          <Field label="Department" required htmlFor="dr-dept">
            <select
              id="dr-dept"
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: `1px solid ${MB.line}`,
                background: MB.bg, padding: '0 12px', fontSize: 14, color: form.departmentId ? MB.text : MB.text4,
                fontFamily: 'inherit', outline: 'none', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' strokeWidth='1.75' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              }}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Specialisation" htmlFor="dr-spec">
            <Input id="dr-spec" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Interventional Cardiology" />
          </Field>
          <Field label="License number" htmlFor="dr-lic">
            <Input id="dr-lic" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="e.g. MD-CA-44219" />
          </Field>
          <Field label="Default working hours" hint="Doctor can adjust later." htmlFor="dr-start">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
              <Input id="dr-start" value={form.startTime} onChange={set('startTime')} placeholder="9:00 AM" />
              <span style={{ color: MB.text3, fontSize: 13 }}>to</span>
              <Input value={form.endTime} onChange={set('endTime')} placeholder="5:00 PM" />
            </div>
          </Field>
        </div>

        <div style={{ padding: 20, borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="plus" loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
            Create &amp; invite
          </Btn>
        </div>
      </div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default memo(function DeskDoctors() {
  const { data: doctors, isLoading } = useAdminDoctors()
  const [search, setSearch] = useState('')
  const [showAddDrawer, setShowAddDrawer] = useState(false)
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
    <>
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
            <Btn variant="primary" icon="plus" onClick={() => setShowAddDrawer(true)}>
              Add doctor
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
    {showAddDrawer && (
      <AddDoctorDrawer onClose={() => setShowAddDrawer(false)} onSaved={() => setShowAddDrawer(false)} />
    )}
    </>
  )
})
