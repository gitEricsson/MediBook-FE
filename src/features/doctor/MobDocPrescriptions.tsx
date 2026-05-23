import { memo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Textarea } from '@/components/forms/Textarea'
import { Select } from '@/components/forms/Select'
import { toast } from 'sonner'
import { PrescriptionsService, type Prescription } from '@/services/prescriptions.service'

/**
 * Doctor's per-appointment prescription manager.
 *
 * URL: /doctor/appt/:id/prescriptions
 * Shows existing prescriptions for the appointment + an inline "Issue new" form.
 * Active prescriptions can be cancelled with a reason.
 */
export default memo(function MobDocPrescriptions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const appointmentId = Number(id)

  const list = useQuery({
    queryKey: ['prescriptions', 'appointment', appointmentId],
    queryFn: () => PrescriptionsService.forAppointment(appointmentId),
    enabled: !!appointmentId,
  })

  const [showForm, setShowForm] = useState(false)

  const cancelMut = useMutation({
    mutationFn: ({ rxId, reason }: { rxId: number; reason?: string }) =>
      PrescriptionsService.cancel(rxId, reason),
    onSuccess: () => {
      toast.success('Prescription cancelled')
      qc.invalidateQueries({ queryKey: ['prescriptions', 'appointment', appointmentId] })
    },
    onError: () => toast.error('Could not cancel prescription'),
  })

  return (
    <MobScreen>
      <MobTopBar title="Prescriptions" back onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {list.isLoading && <div style={{ color: MB.text3 }}>Loading…</div>}
        {list.isError && <div style={{ color: MB.danger }}>Could not load prescriptions.</div>}

        {!showForm && (
          <Btn variant="primary" size="lg" full icon="plus" onClick={() => setShowForm(true)}>
            Issue prescription
          </Btn>
        )}

        {showForm && (
          <IssueForm
            appointmentId={appointmentId}
            onDone={() => {
              setShowForm(false)
              qc.invalidateQueries({ queryKey: ['prescriptions', 'appointment', appointmentId] })
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="mb-eyebrow" style={{ margin: '20px 0 8px' }}>Issued</div>
        {(list.data ?? []).length === 0 && !list.isLoading && (
          <Card padding={12} style={{ textAlign: 'center', color: MB.text3, fontSize: 13 }}>
            No prescriptions issued yet.
          </Card>
        )}
        {list.data?.map((rx) => (
          <RxCard key={rx.id} rx={rx} onCancel={(reason) => cancelMut.mutate({ rxId: rx.id, reason })} />
        ))}
      </div>
    </MobScreen>
  )
})

function IssueForm({ appointmentId, onDone, onCancel }: { appointmentId: number; onDone: () => void; onCancel: () => void }) {
  const [drugName, setDrugName]       = useState('')
  const [dosage, setDosage]           = useState('')
  const [route, setRoute]             = useState('PO')
  const [frequency, setFrequency]     = useState('')
  const [durationDays, setDurationDays] = useState<number | ''>('')
  const [instructions, setInstructions] = useState('')

  const createMut = useMutation({
    mutationFn: () => PrescriptionsService.create({
      appointmentId,
      drugName: drugName.trim(),
      dosage: dosage.trim(),
      route: route.trim() || undefined,
      frequency: frequency.trim(),
      durationDays: durationDays === '' ? undefined : Number(durationDays),
      instructions: instructions.trim() || undefined,
    }),
    onSuccess: () => { toast.success('Prescription issued'); onDone() },
    onError: () => toast.error('Could not issue prescription'),
  })

  const valid = drugName.trim() && dosage.trim() && frequency.trim()

  return (
    <Card padding={14} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Field label="Drug name" required>
        <Input value={drugName} onChange={setDrugName} placeholder="e.g. Amoxicillin" />
      </Field>
      <Field label="Dosage" required>
        <Input value={dosage} onChange={setDosage} placeholder="e.g. 500mg" />
      </Field>
      <Field label="Route">
        <Select
          value={route}
          onChange={setRoute}
          options={[
            { value: 'PO',  label: 'Oral (PO)' },
            { value: 'IV',  label: 'Intravenous (IV)' },
            { value: 'IM',  label: 'Intramuscular (IM)' },
            { value: 'SC',  label: 'Subcutaneous (SC)' },
            { value: 'TOP', label: 'Topical' },
            { value: 'PR',  label: 'Rectal (PR)' },
          ]}
        />
      </Field>
      <Field label="Frequency" required>
        <Input value={frequency} onChange={setFrequency} placeholder="e.g. Every 8 hours" />
      </Field>
      <Field label="Duration (days)" optional>
        <Input
          value={durationDays === '' ? '' : String(durationDays)}
          onChange={(v) => setDurationDays(v === '' ? '' : Number(v.replace(/[^0-9]/g, '')))}
          placeholder="e.g. 7"
        />
      </Field>
      <Field label="Patient instructions" optional>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Take with food. Finish the full course." />
      </Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary"   size="lg" style={{ flex: 1.4 }} loading={createMut.isPending} disabled={!valid} onClick={() => createMut.mutate()}>
          Issue
        </Btn>
      </div>
    </Card>
  )
}

function RxCard({ rx, onCancel }: { rx: Prescription; onCancel: (reason: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason]         = useState('')
  const isActive = rx.status === 'ACTIVE'

  return (
    <Card padding={12} style={{ marginBottom: 10, background: isActive ? MB.primary50 : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{rx.drugName} <span style={{ color: MB.text3, fontWeight: 500 }}>· {rx.dosage}</span></div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>
            {rx.frequency}{rx.route ? ` · ${rx.route}` : ''}{rx.durationDays ? ` · ${rx.durationDays} days` : ''}
          </div>
          {rx.instructions && (
            <div style={{ fontSize: 12, color: MB.text2, marginTop: 6, whiteSpace: 'pre-wrap' }}>{rx.instructions}</div>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: isActive ? MB.primary50 : MB.bg3, color: isActive ? MB.primary700 : MB.text4 }}>
          {rx.status}
        </span>
      </div>
      {rx.status === 'CANCELLED' && rx.cancelledReason && (
        <div style={{ fontSize: 11, color: MB.text3, marginTop: 6 }}>Reason: {rx.cancelledReason}</div>
      )}
      {isActive && !confirming && (
        <Btn variant="secondary" size="sm" style={{ marginTop: 10 }} onClick={() => setConfirming(true)}>
          <Icon name="alert" size={12} /> Cancel
        </Btn>
      )}
      {isActive && confirming && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input value={reason} onChange={setReason} placeholder="Reason (optional)" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => { setConfirming(false); setReason('') }}>Keep</Btn>
            <Btn variant="primary"   size="sm" style={{ flex: 1, background: MB.danger }} onClick={() => onCancel(reason || undefined as never)}>Confirm cancel</Btn>
          </div>
        </div>
      )}
    </Card>
  )
}
