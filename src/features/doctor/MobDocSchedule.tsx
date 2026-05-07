import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useSchedule } from '@/hooks/useSchedule'
import type { AvatarTone } from '@/types/domain'

type ScheduleState = 'default' | 'loading' | 'empty'

const WEEK = [
  { d: 'M', n: 5, count: 6 },
  { d: 'T', n: 6, count: 8, today: true },
  { d: 'W', n: 7, count: 7 },
  { d: 'T', n: 8, count: 9 },
  { d: 'F', n: 9, count: 5 },
  { d: 'S', n: 10, count: 0 },
  { d: 'S', n: 11, count: 0 },
]

interface ApptRowProps {
  time: string; dur: string; name: string; reason: string
  status: 'COMPLETED' | 'SCHEDULED' | 'NO_SHOW' | 'CANCELLED'
  tone: AvatarTone; next?: boolean
}

function DocApptRow({ time, dur, name, reason, status, tone, next }: ApptRowProps) {
  return (
    <div style={{
      background: MB.bg, borderRadius: 12, padding: 12,
      border: `1px solid ${next ? MB.primary100 : MB.line}`,
      boxShadow: next ? '0 0 0 3px rgba(14,138,95,0.08)' : 'none',
      display: 'flex', gap: 12, position: 'relative',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 2, minWidth: 56 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.text }}>{time}</div>
        <div style={{ fontSize: 10, color: MB.text3 }}>{dur}</div>
      </div>
      <div style={{ width: 1, background: MB.line2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={name} size={24} tone={tone} />
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <StatusPill status={status} />
        </div>
        <div style={{ fontSize: 12, color: MB.text3, marginTop: 4 }}>{reason}</div>
      </div>
      {next && (
        <div aria-label="Up next" style={{
          position: 'absolute', top: -8, left: 12, padding: '2px 8px',
          background: MB.primary, color: '#fff', borderRadius: 999,
          fontSize: 10, fontWeight: 600, letterSpacing: 0.04,
        }}>UP NEXT</div>
      )}
    </div>
  )
}

interface MobDocScheduleProps { state?: ScheduleState }

export default memo(function MobDocSchedule({ state = 'default' }: MobDocScheduleProps) {
  const { data: appts, isLoading } = useSchedule('dr-chen', '2026-05-06')
  const resolvedState: ScheduleState = isLoading ? 'loading' : state

  const apptList = appts ? Object.entries(appts) : []

  return (
    <MobScreen>
      <MobTopBar title="Today's schedule" subtitle="Tue, May 6, 2026" right={
        <button className="mb-icon-btn" aria-label="Notifications"><Icon name="bell" size={18} color={MB.text} /></button>
      } />

      <div style={{ background: MB.bg, padding: '10px 16px 14px', borderBottom: `1px solid ${MB.line2}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>May 5 – 11</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="mb-icon-btn" aria-label="Previous week"><Icon name="chevronLeft" size={16} color={MB.text2} /></button>
            <button className="mb-icon-btn" aria-label="Next week"><Icon name="chevronRight" size={16} color={MB.text2} /></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }} role="listbox" aria-label="Week days">
          {WEEK.map(d => (
            <div key={d.n} role="option" aria-selected={d.today} style={{
              padding: '6px 0', borderRadius: 8, textAlign: 'center',
              background: d.today ? MB.primary : 'transparent',
              color: d.today ? '#fff' : d.count === 0 ? MB.text4 : MB.text, cursor: 'pointer',
            }}>
              <div style={{ fontSize: 10, opacity: 0.85 }}>{d.d}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{d.n}</div>
              <div style={{ fontSize: 9, marginTop: 1, opacity: d.today ? 0.9 : 0.7 }}>
                {d.count > 0 ? `${d.count} appt` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: MB.bg2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: MB.text2, fontWeight: 500 }}>
        <span>{apptList.length || 7} appointments · 2 done</span>
        <span style={{ color: MB.success, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: MB.success }} />
          Next at 10:00 AM
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px' }}>
        {resolvedState === 'empty' && <EmptyState icon="calendar" title="No appointments today" body="Enjoy the open day." />}
        {resolvedState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
            {[0,1,2,3].map(i => <Skel key={i} w="100%" h={64} r={12} />)}
          </div>
        )}
        {resolvedState === 'default' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DocApptRow time="9:00 AM"  dur="30m" name="Eleanor Park"    reason="Follow-up · Hypertension"  status="COMPLETED" tone="rose" />
            <DocApptRow time="9:30 AM"  dur="30m" name="James Whitfield" reason="Annual physical"            status="COMPLETED" tone="indigo" />
            <DocApptRow time="10:00 AM" dur="45m" name="Marcus Lee"      reason="Chest pain consult"         status="SCHEDULED" tone="primary" next />
            <DocApptRow time="11:00 AM" dur="30m" name="Aisha Ndlovu"    reason="Echocardiogram review"      status="SCHEDULED" tone="amber" />
            <DocApptRow time="2:00 PM"  dur="30m" name="Robert Tanaka"   reason="New patient consult"        status="SCHEDULED" tone="teal" />
            <DocApptRow time="2:30 PM"  dur="30m" name="Maria Santos"    reason="Med review"                 status="SCHEDULED" tone="slate" />
            <DocApptRow time="3:00 PM"  dur="30m" name="Daniel Kim"      reason="Follow-up · Arrhythmia"     status="NO_SHOW"   tone="rose" />
          </div>
        )}
      </div>
      <MobTabBar role="doctor" active="schedule" />
    </MobScreen>
  )
})
