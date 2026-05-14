import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Card } from '@/components/primitives/Card'
import { Icon } from '@/components/primitives/Icon'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ConsultationNotesService, ConsultationNoteResponse } from '@/services/consultation-notes.service'
import { AccessGrantService, AccessGrantResponse } from '@/services/access-grant.service'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'

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
      {note.prescriptions && (
        <div style={{ paddingTop: 8, marginTop: 4, borderTop: `1px solid ${MB.line2}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.04, marginBottom: 4 }}>Prescriptions</div>
          <div style={{ fontSize: 13, color: MB.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{note.prescriptions}</div>
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

function AccessRequestCard({ grant }: { grant: AccessGrantResponse }) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: () => AccessGrantService.approveRequest(grant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', 'incoming'] })
      toast.success('Access approved')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to approve'),
  })

  const denyMutation = useMutation({
    mutationFn: () => AccessGrantService.denyRequest(grant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', 'incoming'] })
      toast.success('Access denied')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to deny'),
  })

  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>Dr. {grant.doctorName}</div>
          {grant.doctorDepartment && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{grant.doctorDepartment}</div>}
        </div>
        <Badge tone="warn" size="sm">Pending</Badge>
      </div>
      {grant.reason && (
        <div style={{ fontSize: 13, color: MB.text2, marginBottom: 12, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>Reason: </span>{grant.reason}
        </div>
      )}
      <div style={{ fontSize: 12, color: MB.text3, marginBottom: 12 }}>
        Requested {new Date(grant.grantedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div style={{ fontSize: 12, color: MB.text2, marginBottom: 12, padding: '8px 10px', background: MB.bg2, borderRadius: 8, lineHeight: 1.5 }}>
        If approved, Dr. {grant.doctorName} can view your consultation notes that existed as of the request date.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="dangerOutline" size="sm" loading={denyMutation.isPending} onClick={() => denyMutation.mutate()}>Deny</Btn>
        <Btn variant="primary" size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve</Btn>
      </div>
    </Card>
  )
}

function HistoryTab() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['consultations', 'my'],
    queryFn: ConsultationNotesService.getMyHistory,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2].map((i) => <NoteSkel key={i} />)}
    </div>
  )
  if (isError) return <ErrorState title="Couldn't load history" body="Your consultation notes will appear here." onRetry={() => refetch()} />
  if (!data || data.length === 0) return <EmptyState icon="edit" title="No consultation notes yet" body="Notes from your completed appointments will appear here." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((note) => <NoteCard key={note.id} note={note} />)}
    </div>
  )
}

function RequestsTab() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => AccessGrantService.getIncomingRequests(0, 20),
    enabled: !!user,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1].map((i) => <NoteSkel key={i} />)}
    </div>
  )
  if (isError) return <ErrorState title="Couldn't load requests" onRetry={() => refetch()} />

  const requests = data?.content ?? []
  if (requests.length === 0) return (
    <EmptyState icon="users" title="No pending requests" body="Doctors requesting access to your records will appear here." />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {requests.map((grant) => <AccessRequestCard key={grant.id} grant={grant} />)}
    </div>
  )
}

export default memo(function MobConsultationHistory() {
  const [tab, setTab] = useState<'history' | 'requests'>('history')

  const { data: requestsData } = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => AccessGrantService.getIncomingRequests(0, 20),
  })
  const pendingCount = requestsData?.content?.length ?? 0

  return (
    <MobScreen>
      <MobTopBar title="Consultation history" back />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${MB.line}`, background: MB.bg, flexShrink: 0 }}>
        {(['history', 'requests'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: tab === t ? 600 : 500,
            color: tab === t ? MB.primary : MB.text3, background: 'transparent', border: 'none',
            borderBottom: tab === t ? `2px solid ${MB.primary}` : 'none', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {t === 'history' ? 'My history' : (
              <>
                Doctor requests
                {pendingCount > 0 && (
                  <span style={{ background: MB.danger, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tab === 'history' ? <HistoryTab /> : <RequestsTab />}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
