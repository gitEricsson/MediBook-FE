import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Card } from '@/components/primitives/Card'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useMyAppointments } from '@/hooks/useAppointments'
import { BookingService } from '@/services/booking.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Appointment } from '@/types/api'

function ApptSkel() {
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Skel w={48} h={52} r={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skel w="50%" h={14} /><Skel w="80%" h={12} /><Skel w="60%" h={10} />
        </div>
      </div>
    </Card>
  )
}

function ApptCard({ appt }: { appt: Appointment }) {
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => BookingService.cancel(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] });
      toast.success('Appointment cancelled');
    }
  });

  const isCancelable = appt.status === 'CONFIRMED' || appt.status === 'PENDING';
  const scheduled = new Date(appt.scheduledAt);

  return (
    <Card padding={14}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 48, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: MB.primary50, color: MB.primary600, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>DATE</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{scheduled.getDate()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <StatusPill status={appt.status} />
          </div>
          <div style={{ fontSize: 13, color: MB.text2 }}>{appt.doctorName || 'Dr. Specialist'}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{appt.departmentName || 'Cardiology'} · Bay General</div>
        </div>
      </div>
      {isCancelable && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="sm" style={{ flex: 1 }}>Reschedule</Btn>
          <Btn 
            variant="secondary" 
            size="sm" 
            style={{ flex: 1, color: MB.danger }}
            loading={cancelMutation.isPending}
            onClick={() => setConfirmCancel(true)}
          >
            Cancel
          </Btn>
        </div>
      )}
      {confirmCancel && (
        <div role="dialog" aria-modal="true" style={{ marginTop: 12, padding: 12, background: MB.dangerBg, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: MB.danger, fontWeight: 600 }}>Cancel this appointment?</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Btn variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => setConfirmCancel(false)}>Keep</Btn>
            <Btn variant="primary" danger size="sm" style={{ flex: 1 }} loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(String(appt.id))}>Cancel</Btn>
          </div>
        </div>
      )}
    </Card>
  )
}

export default memo(function MobMyAppts() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data, isLoading, isError, refetch } = useMyAppointments(tab);

  return (
    <MobScreen>
      <MobTopBar title="My visits" right={
        <button className="mb-icon-btn" aria-label="Notifications"><Icon name="bell" size={18} color={MB.text} /></button>
      } />
      <div style={{ background: MB.bg, padding: '0 16px', borderBottom: `1px solid ${MB.line2}` }}>
        <div style={{ display: 'flex', gap: 24 }} role="tablist">
          {[{ l: 'Upcoming', id: 'upcoming' as const }, { l: 'Past', id: 'past' as const }].map(t => (
            <button key={t.l} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 0', borderBottom: `2px solid ${tab === t.id ? MB.primary : 'transparent'}`,
              fontSize: 14, fontWeight: 600, color: tab === t.id ? MB.primary : MB.text3,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              background: 'transparent', borderLeft: 0, borderRight: 0, borderTop: 0, fontFamily: 'inherit',
            }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0,1,2].map(i => <ApptSkel key={i} />)}
          </div>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <EmptyState icon="calendar" title={tab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
            body="When you book a doctor, your appointments will appear here."
            action={<Btn size="sm" icon="search" style={{ marginTop: 8 }}>Find a doctor</Btn>} />
        )}
        {isError && <ErrorState title="Couldn't load your visits" onRetry={() => refetch()} />}
        {!isLoading && data && data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map((a) => <ApptCard key={a.id} appt={a} />)}
          </div>
        )}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
