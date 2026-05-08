import { memo } from 'react'
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
import { SAMPLE_APPOINTMENTS } from '@/constants/sampleData'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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

function ApptCard({ appt }: { appt: any }) {
  const queryClient = useQueryClient();
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => BookingService.cancel(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] });
    }
  });

  const isCancelable = appt.status === 'CONFIRMED' || appt.status === 'PENDING';

  return (
    <Card padding={14}>
      {appt.soon && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: MB.success, fontWeight: 600, marginBottom: 8 }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: MB.success }} />
          UPCOMING VISIT
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 48, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: MB.primary50, color: MB.primary600, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>DATE</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{new Date(appt.scheduledAt || Date.now()).getDate()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{new Date(appt.scheduledAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <StatusPill status={appt.status || 'CONFIRMED'} />
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
            onClick={() => cancelMutation.mutate(String(appt.id))}
          >
            Cancel
          </Btn>
        </div>
      )}
    </Card>
  )
}

export default memo(function MobMyAppts() {
  const { data, isLoading, isError, refetch } = useMyAppointments();

  return (
    <MobScreen>
      <MobTopBar title="My visits" right={
        <button className="mb-icon-btn" aria-label="Notifications"><Icon name="bell" size={18} color={MB.text} /></button>
      } />
      <div style={{ background: MB.bg, padding: '0 16px', borderBottom: `1px solid ${MB.line2}` }}>
        <div style={{ display: 'flex', gap: 24 }} role="tablist">
          {[{ l: 'Upcoming', active: true, count: data?.length || 0 }, { l: 'Past', count: 0 }].map(t => (
            <div key={t.l} role="tab" aria-selected={t.active} style={{
              padding: '12px 0', borderBottom: `2px solid ${t.active ? MB.primary : 'transparent'}`,
              fontSize: 14, fontWeight: 600, color: t.active ? MB.primary : MB.text3,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }}>
              {t.l} <span style={{ fontSize: 11, fontWeight: 500, color: MB.text3 }}>{t.count}</span>
            </div>
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
          <EmptyState icon="calendar" title="No upcoming visits"
            body="When you book a doctor, your appointments will appear here."
            action={<Btn size="sm" icon="search" style={{ marginTop: 8 }}>Find a doctor</Btn>} />
        )}
        {isError && <ErrorState title="Couldn't load your visits" onRetry={() => refetch()} />}
        {!isLoading && data && data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map((a: any) => <ApptCard key={a.id} appt={a} />)}
          </div>
        )}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
