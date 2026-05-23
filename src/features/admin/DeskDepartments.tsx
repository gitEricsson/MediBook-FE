import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAdminDepartments, useAdminActions } from '@/hooks/useAdmin'
import { AdminService } from '@/services/admin.service'
import { toast } from 'sonner'
import type { Department } from '@/services/admin.service'

// ── Add/Edit modal ────────────────────────────────────────────────────────

interface DeptForm {
  name: string
  code: string
  description: string
  slotDurationMins: string  // as string so the input can be cleared
  bufferMins: string
  baseConsultationFee: string
}

function DeptDialog({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: Partial<DeptForm>
  onSave: (v: DeptForm) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [slotDurationMins, setSlotDurationMins] = useState(initial?.slotDurationMins ?? '30')
  const [bufferMins, setBufferMins] = useState(initial?.bufferMins ?? '0')
  const [baseConsultationFee, setBaseConsultationFee] = useState(initial?.baseConsultationFee ?? '5000')
  const isEdit = !!initial?.name

  const slot = Number(slotDurationMins)
  const buffer = Number(bufferMins)
  const fee = Number(baseConsultationFee)
  const slotInvalid  = !Number.isFinite(slot) || slot < 5
  const bufferInvalid = !Number.isFinite(buffer) || buffer < 0
  const feeInvalid   = !Number.isFinite(fee) || fee < 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: MB.bg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 48px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>
          {isEdit ? 'Edit department' : 'Add department'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Department name" required htmlFor="dept-name">
            <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Code" required htmlFor="dept-code" hint="Short identifier, e.g. CARD">
            <Input id="dept-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Description" htmlFor="dept-desc">
            <Input id="dept-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div style={{ height: 1, background: MB.line2, margin: '4px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Scheduling & pricing
          </div>
          <Field label="Department base fee (₦)" required htmlFor="dept-fee" hint="Used as the pricing engine's base before modifiers">
            <Input id="dept-fee" type="number" min={0} step="0.01" value={baseConsultationFee} onChange={(e) => setBaseConsultationFee(e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Average consult time (mins)" required htmlFor="dept-slot" hint="≥ 5">
              <Input id="dept-slot" type="number" min={5} max={120} value={slotDurationMins} onChange={(e) => setSlotDurationMins(e.target.value)} />
            </Field>
            <Field label="Buffer between slots (mins)" required htmlFor="dept-buffer" hint="Cleanup / prep">
              <Input id="dept-buffer" type="number" min={0} max={60} value={bufferMins} onChange={(e) => setBufferMins(e.target.value)} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={saving}
            disabled={!name || !code || slotInvalid || bufferInvalid || feeInvalid}
            onClick={() => onSave({ name, code, description, slotDurationMins, bufferMins, baseConsultationFee })}>
            {isEdit ? 'Save changes' : 'Create department'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

export default memo(function DeskDepartments() {
  const { data: depts, isLoading } = useAdminDepartments()
  const { createDepartment, updateDepartment, deactivateDepartment, isProcessing } = useAdminActions()
  const [dialog, setDialog] = useState<'add' | Department | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<Department | null>(null)

  const displayDepts = depts ?? []

  const handleSave = async (form: DeptForm) => {
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description,
      slotDurationMins: Number(form.slotDurationMins),
      bufferMins: Number(form.bufferMins),
      baseConsultationFee: Number(form.baseConsultationFee),
    }
    try {
      if (dialog === 'add') {
        await createDepartment(payload)
        toast.success(`Department "${form.name}" created`)
      } else if (dialog !== null && typeof dialog === 'object') {
        await updateDepartment({ id: dialog.id, data: payload })
        toast.success('Department updated')
      }
      setDialog(null)
    } catch {
      toast.error('Failed to save department')
    }
  }

  const handleDeactivate = async (dept: Department) => {
    try {
      await deactivateDepartment(dept.id)
      toast.success(`${dept.name} deactivated`)
      setConfirmDeactivate(null)
    } catch {
      toast.error('Failed to deactivate department')
    }
  }

  return (
    <DeskShell active="depts">
      <DeskTopbar
        title="Departments"
        subtitle={`${displayDepts.filter((d) => d.isActive).length} active · ${displayDepts.length} total`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" icon="download" onClick={async () => {
              try {
                const blob = await AdminService.exportDepartmentsCsv()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'departments.csv'; a.click()
                URL.revokeObjectURL(url)
              } catch { toast.error('Export failed') }
            }}>Export CSV</Btn>
            <Btn variant="primary" size="sm" icon="plus" onClick={() => setDialog('add')}>Add department</Btn>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Departments list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Department</Th>
                <Th>Code</Th>
                <Th align="right">Base fee</Th>
                <Th align="right">Slot · buffer</Th>
                <Th align="right">Doctors</Th>
                <Th align="right">Appts (90d)</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[180, 60, 80, 80, 50, 60, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : displayDepts.length === 0
                ? <tr><td colSpan={8}><EmptyState icon="building" title="No departments" body="Create departments to organize your doctors." /></td></tr>
                : displayDepts.map((d) => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td><span style={{ fontWeight: 500 }}>{d.name}</span></Td>
                      <Td mono>{d.code || d.id}</Td>
                      <Td align="right">
                        {d.baseConsultationFee != null ? `₦${d.baseConsultationFee.toLocaleString()}` : '—'}
                      </Td>
                      <Td align="right">
                        {d.slotDurationMins != null
                          ? `${d.slotDurationMins}m + ${d.bufferMins ?? 0}m`
                          : '—'}
                      </Td>
                      <Td align="right">{d.doctorCount ?? 0}</Td>
                      <Td align="right">{(d.appointmentCount ?? 0).toLocaleString()}</Td>
                      <Td><StatusPill status={d.isActive ? 'ACTIVE' : 'INACTIVE'} /></Td>
                      <Td>
                        <RowMenu
                          aria-label={`Actions for ${d.name}`}
                          items={[
                            { label: 'Edit', icon: 'edit', onClick: () => setDialog(d) },
                            d.isActive
                              ? { label: 'Deactivate', icon: 'x', danger: true, onClick: () => setConfirmDeactivate(d) }
                              : { label: 'Reactivate', icon: 'check', onClick: () => handleDeactivate(d) },
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

      {/* Add/Edit dialog */}
      {dialog !== null && (
        <DeptDialog
          initial={dialog === 'add' ? {} : {
            name: dialog.name,
            code: dialog.code ?? '',
            description: dialog.description ?? '',
            slotDurationMins: dialog.slotDurationMins != null ? String(dialog.slotDurationMins) : '30',
            bufferMins: dialog.bufferMins != null ? String(dialog.bufferMins) : '0',
            baseConsultationFee: dialog.baseConsultationFee != null ? String(dialog.baseConsultationFee) : '5000',
          }}
          onSave={handleSave}
          onClose={() => setDialog(null)}
          saving={isProcessing}
        />
      )}

      {/* Deactivate confirm */}
      {confirmDeactivate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: MB.bg, borderRadius: 16, padding: 28, width: '100%', maxWidth: 380 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: MB.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon name="alert" size={22} color={MB.danger} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: '0 0 8px' }}>Deactivate {confirmDeactivate.name}?</h3>
            <p style={{ fontSize: 13, color: MB.text2, margin: '0 0 20px', lineHeight: 1.5 }}>
              Patients will no longer be able to book appointments in this department. Existing appointments are not affected.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => setConfirmDeactivate(null)}>Cancel</Btn>
              <Btn variant="primary" danger size="lg" style={{ flex: 1 }} loading={isProcessing} onClick={() => handleDeactivate(confirmDeactivate)}>Deactivate</Btn>
            </div>
          </div>
        </div>
      )}
    </DeskShell>
  )
})
