import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Card } from '@/components/primitives/Card'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { Checkbox } from '@/components/forms/Checkbox'

export default memo(function MobDocNote() {
  return (
    <MobScreen>
      <MobTopBar
        title="Consultation note"
        back
        right={<span style={{ fontSize: 13, color: MB.primary, fontWeight: 600, padding: '0 6px', cursor: 'pointer' }}>Save</span>}
      />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Card padding={12} style={{ margin: 16, background: MB.bg2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Eleanor Park" tone="rose" size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Eleanor Park</div>
              <div style={{ fontSize: 11, color: MB.text3 }}>Tue, May 6 · 9:00 AM · Follow-up</div>
            </div>
            <StatusPill status="COMPLETED" />
          </div>
        </Card>
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Subjective" htmlFor="note-subj">
            <Textarea id="note-subj" rows={3} value="Patient reports BP well-controlled on current regimen. No headaches or dizziness. Sleep improved." readOnly />
          </Field>
          <Field label="Objective" htmlFor="note-obj">
            <Textarea id="note-obj" rows={3} value="BP 124/78. HR 68. Heart sounds regular. No edema. Weight stable." readOnly />
          </Field>
          <Field label="Assessment & plan" htmlFor="note-plan">
            <Textarea id="note-plan" rows={4} value="Hypertension well-controlled. Continue lisinopril 10mg daily. Follow up in 3 months. Annual labs ordered." readOnly />
          </Field>
          <Field label="Visible to patient" hint="Patient will see your assessment & plan in their portal." htmlFor="note-share">
            <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
              <Checkbox checked label="Share with patient" />
            </div>
          </Field>
        </div>
      </div>
    </MobScreen>
  )
})
