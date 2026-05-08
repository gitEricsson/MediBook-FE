import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Card } from '@/components/primitives/Card'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { Checkbox } from '@/components/forms/Checkbox'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DoctorPortalService } from '@/services/doctor-portal.service'

export default memo(function MobDocNote() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { appt } = location.state || {};

  const [notes, setNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    isDraft: true,
  });

  const saveMutation = useMutation({
    mutationFn: () => DoctorPortalService.saveConsultationNote({
      appointmentId: id || '1',
      diagnosis: notes.assessment || notes.subjective,
      treatmentPlan: notes.plan,
      prescriptions: notes.objective,
    }),
    onSuccess: () => {
      // Potentially invalidate notes query
      navigate(-1);
    }
  });

  if (!appt) return null;

  return (
    <MobScreen>
      <MobTopBar
        title="Consultation note"
        back
        right={
          <span 
            onClick={() => saveMutation.mutate()}
            style={{ 
              fontSize: 13, 
              color: saveMutation.isPending ? MB.text4 : MB.primary, 
              fontWeight: 600, 
              padding: '0 6px', 
              cursor: saveMutation.isPending ? 'default' : 'pointer' 
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </span>
        }
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Card padding={12} style={{ margin: 16, background: MB.bg2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={appt.name} tone={appt.tone as any} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{appt.name}</div>
              <div style={{ fontSize: 11, color: MB.text3 }}>{appt.reason}</div>
            </div>
            <StatusPill status={appt.status} />
          </div>
        </Card>
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Subjective" htmlFor="note-subj">
            <Textarea 
              id="note-subj" 
              rows={3} 
              value={notes.subjective} 
              onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
              placeholder="Patient reports..." 
            />
          </Field>
          <Field label="Objective" htmlFor="note-obj">
            <Textarea 
              id="note-obj" 
              rows={3} 
              value={notes.objective} 
              onChange={(e) => setNotes({ ...notes, objective: e.target.value })}
              placeholder="Vital signs, physical exam..." 
            />
          </Field>
          <Field label="Assessment & plan" htmlFor="note-plan">
            <Textarea 
              id="note-plan" 
              rows={4} 
              value={notes.plan} 
              onChange={(e) => setNotes({ ...notes, plan: e.target.value })}
              placeholder="Diagnosis and next steps..." 
            />
          </Field>
          <Field label="Status" hint="Mark as final to release to patient portal." htmlFor="note-share">
            <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
              <Checkbox 
                checked={!notes.isDraft} 
                onChange={() => setNotes({ ...notes, isDraft: !notes.isDraft })}
                label="Finalize and share with patient" 
              />
            </div>
          </Field>
        </div>
      </div>
    </MobScreen>
  )
})
