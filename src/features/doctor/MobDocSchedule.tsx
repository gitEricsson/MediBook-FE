import { memo, useState, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSchedule, ScheduleAppt } from '@/hooks/useSchedule'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

type ScheduleState = 'default' | 'loading' | 'empty' | 'error'

interface ApptRowProps {
  time: string; dur: string; appt: ScheduleAppt; onClick?: () => void
}

function DocApptRow({ time, dur, appt, onClick }: ApptRowProps) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: MB.bg, borderRadius: 12, padding: 12,
        border: `1px solid ${appt.next ? MB.primary100 : MB.line}`,
        boxShadow: appt.next ? '0 0 0 3px rgba(14,138,95,0.08)' : 'none',
        display: 'flex', gap: 12, position: 'relative', cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 2, minWidth: 56 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.text }}>{time}</div>
        <div style={{ fontSize: 10, color: MB.text3 }}>{dur}</div>
      </div>
      <div style={{ width: 1, background: MB.line2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={appt.name} size={24} tone={appt.tone as any} />
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.name}</div>
          <StatusPill status={appt.status} />
        </div>
        <div style={{ fontSize: 12, color: MB.text3, marginTop: 4 }}>{appt.reason}</div>
      </div>
      {appt.next && (
        <div aria-label="Up next" style={{
          position: 'absolute', top: -8, left: 12, padding: '2px 8px',
          background: MB.primary, color: '#fff', borderRadius: 999,
          fontSize: 10, fontWeight: 600, letterSpacing: 0.04,
        }}>UP NEXT</div>
      )}
    </div>
  )
}

export default memo(function MobDocSchedule() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore(state => state.unreadCount);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: appts, isLoading, isError, refetch } = useSchedule(user?.id || 'dr-chen', selectedDate);

  const apptEntries = appts ? Object.entries(appts).sort((a, b) => a[0].localeCompare(b[0])) : [];
  const completedCount = apptEntries.filter(([_, a]) => a.status === 'COMPLETED').length;
  const nextApptTime = apptEntries.find(([_, a]) => a.next)?.[0];

  const resolvedState: ScheduleState = isLoading ? 'loading' : isError ? 'error' : (apptEntries.length === 0 ? 'empty' : 'default');

  // Week generation
  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + i); // Start from Monday
    return {
      d: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      n: d.getDate(),
      iso: d.toISOString().split('T')[0],
      today: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
    };
  });

  return (
    <MobScreen>
      <MobTopBar title="Today's schedule" subtitle={new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} right={
        <button className="mb-icon-btn" aria-label="Notifications" style={{ position: 'relative' }}>
          <Icon name="bell" size={18} color={MB.text} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: MB.danger, border: `2px solid ${MB.bg}` }} />
          )}
        </button>
      } />

      <div style={{ background: MB.bg, padding: '10px 16px 14px', borderBottom: `1px solid ${MB.line2}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Weekly Overview</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="mb-icon-btn" aria-label="Previous week"><Icon name="chevronLeft" size={16} color={MB.text2} /></button>
            <button className="mb-icon-btn" aria-label="Next week"><Icon name="chevronRight" size={16} color={MB.text2} /></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }} role="listbox" aria-label="Week days">
          {weekDays.map(d => (
            <div 
              key={d.iso} 
              role="option" 
              aria-selected={selectedDate === d.iso} 
              onClick={() => setSelectedDate(d.iso)}
              style={{
                padding: '6px 0', borderRadius: 8, textAlign: 'center',
                background: selectedDate === d.iso ? MB.primary : 'transparent',
                color: selectedDate === d.iso ? '#fff' : MB.text, cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.85 }}>{d.d}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{d.n}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: MB.bg2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: MB.text2, fontWeight: 500 }}>
        <span>{apptEntries.length} appointments · {completedCount} done</span>
        {nextApptTime && (
          <span style={{ color: MB.success, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: MB.success }} />
            Next at {nextApptTime}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px' }}>
        {resolvedState === 'empty' && <EmptyState icon="calendar" title="No appointments today" body="Enjoy the open day." />}
        {resolvedState === 'error' && <ErrorState title="Couldn't load schedule" onRetry={() => refetch()} />}
        {resolvedState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
            {[0,1,2,3].map(i => <Skel key={i} w="100%" h={64} r={12} />)}
          </div>
        )}
        {resolvedState === 'default' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {apptEntries.map(([time, appt]) => (
              <DocApptRow 
                key={time} 
                time={time} 
                dur={appt.dur ? `${appt.dur * 30}m` : '30m'} 
                appt={appt} 
                onClick={() => navigate(`/doctor/appt/${appt.id || '1'}`, { state: { appt, time } })}
              />
            ))}
          </div>
        )}
      </div>
      <MobTabBar role="doctor" active="schedule" />
    </MobScreen>
  )
})
