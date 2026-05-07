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
import { useAppointments } from '@/hooks/useAppointments'
import { SAMPLE_APPOINTMENTS } from '@/constants/sampleData'
import type { Appointment } from '@/types/domain'

type ApptState = 'default' | 'loading' | 'empty' | 'error'

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
  return (
    <Card padding={14}>
      {appt.soon && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: MB.success, fontWeight: 600, marginBottom: 8 }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: MB.success }} />
          STARTS IN 18 HOURS
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 48, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: MB.primary50, color: MB.primary600, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>{appt.date.split(',')[0].toUpperCase()}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{appt.date.split(' ').pop()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{appt.time}</span>
            <StatusPill status={appt.status} />
          </div>
          <div style={{ fontSize: 13, color: MB.text2 }}>{appt.doctorName}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{appt.spec} · {appt.location}</div>
        </div>
      </div>
      {appt.cancelable && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="sm" style={{ flex: 1 }}>Reschedule</Btn>
          <Btn variant="secondary" size="sm" style={{ flex: 1, color: MB.danger }}>Cancel</Btn>
        </div>
      )}
    </Card>
  )
}

interface MobMyApptsProps { state?: ApptState }

export default memo(function MobMyAppts({ state = 'default' }: MobMyApptsProps) {
  const { data, isLoading, isError, refetch } = useAppointments('patient-1')
  const resolvedState: ApptState = isLoading ? 'loading' : isError ? 'error' : state

  return (
    <MobScreen>
      <MobTopBar title="My visits" right={
        <button className="mb-icon-btn" aria-label="Notifications"><Icon name="bell" size={18} color={MB.text} /></button>
      } />
      <div style={{ background: MB.bg, padding: '0 16px', borderBottom: `1px solid ${MB.line2}` }}>
        <div style={{ display: 'flex', gap: 24 }} role="tablist">
          {[{ l: 'Upcoming', active: true, count: 2 }, { l: 'Past', count: 8 }].map(t => (
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
        {resolvedState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0,1,2].map(i => <ApptSkel key={i} />)}
          </div>
        )}
        {resolvedState === 'empty' && (
          <EmptyState icon="calendar" title="No upcoming visits"
            body="When you book a doctor, your appointments will appear here."
            action={<Btn size="sm" icon="search" style={{ marginTop: 8 }}>Find a doctor</Btn>} />
        )}
        {resolvedState === 'error' && <ErrorState title="Couldn't load your visits" onRetry={refetch} />}
        {resolvedState === 'default' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data ?? SAMPLE_APPOINTMENTS).map(a => <ApptCard key={a.id} appt={a} />)}
          </div>
        )}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
