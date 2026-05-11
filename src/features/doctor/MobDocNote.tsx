import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Card } from '@/components/primitives/Card'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ConsultationNotesService } from '@/services/consultation-notes.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import type { AvatarTone } from '@/types/domain'

export default memo(function MobDocNote() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { appt } = location.state || {}

  const [notes, setNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      ConsultationNotesService.createForAppointment(id || '', {
        diagnosis: [notes.assessment, notes.subjective].filter(Boolean).join('\n') || 'See notes',
        treatmentPlan: notes.plan,
        prescriptions: notes.objective || undefined,
      }),
    onSuccess: () => {
      toast.success('Consultation note saved')
      navigate(-1)
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to save note'),
  })

  if (!appt) return null

  const canSave = !!(notes.assessment || notes.plan || notes.subjective)

  return (
    <MobScreen>
      <MobTopBar
        title="Consultation note"
        back
        right={
          <button
            onClick={() => canSave && saveMutation.mutate()}
            disabled={!canSave || saveMutation.isPending}
            style={{
              fontSize: 13,
              color: !canSave || saveMutation.isPending ? MB.text4 : MB.primary,
              fontWeight: 600,
              padding: '0 6px',
              cursor: !canSave || saveMutation.isPending ? 'default' : 'pointer',
              background: 'transparent',
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Card padding={12} style={{ margin: 16, background: MB.bg2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={appt.name} tone={(appt.tone || 'primary') as AvatarTone} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{appt.name}</div>
              <div style={{ fontSize: 11, color: MB.text3 }}>{appt.reason}</div>
            </div>
            <StatusPill status={appt.status} />
          </div>
        </Card>

        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '10px 12px', background: MB.primary50, borderRadius: 8, fontSize: 12, color: MB.primary600, display: 'flex', gap: 8 }}>
            Using SOAP format — fill in the relevant sections.
          </div>

          <Field label="Subjective" htmlFor="note-subj" hint="What the patient reports">
            <Textarea
              id="note-subj" rows={3}
              value={notes.subjective}
              onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
              placeholder="Patient reports chest pain on exertion…"
            />
          </Field>
          <Field label="Objective" htmlFor="note-obj" hint="Vital signs, physical exam findings, test results">
            <Textarea
              id="note-obj" rows={3}
              value={notes.objective}
              onChange={(e) => setNotes({ ...notes, objective: e.target.value })}
              placeholder="BP 140/90, HR 82, afebrile…"
            />
          </Field>
          <Field label="Assessment" htmlFor="note-assess" hint="Diagnosis or differential">
            <Textarea
              id="note-assess" rows={2}
              value={notes.assessment}
              onChange={(e) => setNotes({ ...notes, assessment: e.target.value })}
              placeholder="Essential hypertension, controlled…"
            />
          </Field>
          <Field label="Plan" htmlFor="note-plan" hint="Treatment, prescriptions, follow-up">
            <Textarea
              id="note-plan" rows={3}
              value={notes.plan}
              onChange={(e) => setNotes({ ...notes, plan: e.target.value })}
              placeholder="Continue Amlodipine 5mg · Follow up in 4 weeks…"
            />
          </Field>
        </div>
      </div>
    </MobScreen>
  )
})
