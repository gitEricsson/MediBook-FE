import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WaitlistService, WaitlistResponse } from '@/services/waitlist.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useViewport } from '@/hooks/useViewport'

function WaitlistCard({ entry, onLeave }: { entry: WaitlistResponse; onLeave: () => void }) {
  const promoted = entry.status === 'PROMOTED'
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>
            {entry.doctorName ? `Dr. ${entry.doctorName}` : entry.departmentName ?? entry.specialization ?? 'Any doctor'}
          </div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>
            {entry.departmentName && <span>{entry.departmentName}</span>}
            {entry.specialization && <span> · {entry.specialization}</span>}
          </div>
          {entry.preferredDate && (
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="calendar" size={12} color={MB.text3} />
              Preferred: {new Date(entry.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
        <Badge tone={promoted ? 'success' : 'warn'} size="sm" dot>
          {promoted ? 'Promoted' : 'Waiting'}
        </Badge>
      </div>
      {promoted && entry.promotedAppointmentId && (
        <div style={{ padding: '8px 10px', background: '#D1FAE5', borderRadius: 8, marginBottom: 10, fontSize: 12, color: '#065F46', fontWeight: 500, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="check" size={13} color="#065F46" />
          Appointment available! Appt #{entry.promotedAppointmentId}
        </div>
      )}
      {!promoted && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="dangerOutline" size="sm" icon="x" onClick={onLeave}>Leave waitlist</Btn>
        </div>
      )}
    </Card>
  )
}

function WaitlistContent() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['waitlist', 'my'],
    queryFn: () => WaitlistService.getMyEntries(0, 20).then((p) => p.content),
  })

  const leaveMutation = useMutation({
    mutationFn: (id: string) => WaitlistService.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', 'my'] })
      toast.success('Removed from waitlist')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to leave waitlist'),
  })

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '10px 12px', background: MB.primary50, borderRadius: 8, fontSize: 12, color: MB.primary600, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="info" size={14} color={MB.primary} />
        <span>You'll be notified automatically when a slot opens up for doctors you're waiting for.</span>
      </div>

      {isLoading && [...Array(3)].map((_, i) => <Skel key={i} h={100} w="100%" r={12} />)}
      {isError && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Btn variant="secondary" size="sm" onClick={() => refetch()}>Retry</Btn>
        </div>
      )}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState icon="clock" title="No waitlist entries" body="When you join a waitlist for a doctor, your entries appear here." />
      )}
      {!isLoading && !isError && data && data.length > 0 && data.map((entry) => (
        <WaitlistCard key={entry.id} entry={entry} onLeave={() => leaveMutation.mutate(String(entry.id))} />
      ))}
    </div>
  )
}

function DesktopWaitlist() {
  return (
    <PatientShell title="Waitlist">
      <div style={{ flex: 1, padding: 28, maxWidth: 640 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: MB.ink }}>My waitlist</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: MB.text2 }}>You'll be notified when a slot becomes available.</p>
        <WaitlistContent />
      </div>
    </PatientShell>
  )
}

export default memo(function MobWaitlist() {
  const { isWide } = useViewport()
  return isWide ? <DesktopWaitlist /> : (
    <MobScreen>
      <MobTopBar title="Waitlist" back />
      <WaitlistContent />
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
