import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Card } from '@/components/primitives/Card'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useQuery } from '@tanstack/react-query'
import { ConsultationNotesService, ConsultationNoteResponse } from '@/services/consultation-notes.service'

function NoteSkel() {
  return (
    <Card padding={14}>
      <Skel h={12} w="40%" r={4} />
      <Skel h={14} w="70%" r={4} style={{ marginTop: 8 }} />
      <Skel h={12} w="90%" r={4} style={{ marginTop: 6 }} />
      <Skel h={12} w="60%" r={4} style={{ marginTop: 4 }} />
    </Card>
  )
}

function NoteCard({ note }: { note: ConsultationNoteResponse }) {
  const date = new Date(note.createdAt)
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: MB.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.04 }}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text, marginTop: 2 }}>{note.doctorName}</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="edit" size={15} color={MB.primary} />
        </div>
      </div>
      <div style={{ padding: '10px 0', borderTop: `1px solid ${MB.line2}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.04, marginBottom: 4 }}>Diagnosis</div>
        <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.5 }}>{note.diagnosis}</div>
      </div>
      {note.treatmentPlan && (
        <div style={{ paddingTop: 8, marginTop: 4, borderTop: `1px solid ${MB.line2}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.04, marginBottom: 4 }}>Treatment plan</div>
          <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.5 }}>{note.treatmentPlan}</div>
        </div>
      )}
      {note.followUpDate && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: MB.primary50, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="calendar" size={13} color={MB.primary} />
          <span style={{ fontSize: 12, color: MB.primary600, fontWeight: 500 }}>
            Follow-up: {new Date(note.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}
    </Card>
  )
}

export default memo(function MobConsultationHistory() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['consultations', 'my'],
    queryFn: ConsultationNotesService.getMyHistory,
  })

  return (
    <MobScreen>
      <MobTopBar title="Consultation history" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map((i) => <NoteSkel key={i} />)}
          </div>
        )}
        {isError && (
          <ErrorState title="Couldn't load history" body="Your consultation notes will appear here." onRetry={() => refetch()} />
        )}
        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState icon="edit" title="No consultation notes yet" body="Notes from your completed appointments will appear here." />
        )}
        {!isLoading && !isError && data && data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
