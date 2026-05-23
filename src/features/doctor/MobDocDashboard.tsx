import { memo, useMemo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { Avatar } from '@/components/primitives/Avatar'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useViewport } from '@/hooks/useViewport'
import { useSchedule } from '@/hooks/useSchedule'
import { todayLocalIsoDate, toLocalIsoDate } from '@/lib/date'
import type { AvatarTone } from '@/types/domain'

/**
 * Doctor dashboard — a quick at-a-glance landing page.
 *
 *   • Today's KPI tiles (total, completed, remaining, next appointment).
 *   • "Up next" panel with the next 3 confirmed appointments.
 *   • Quick links to schedule, hours, leave, profile.
 *
 * Reuses {@link useSchedule}; doesn't introduce a new endpoint.
 */
export default memo(function MobDocDashboard() {
  const { isWide } = useViewport()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const todayIso = todayLocalIsoDate()
  const { data: schedule, isLoading, isError, refetch } = useSchedule(user?.id ?? 'current', todayIso)

  const apptEntries = useMemo(
    () => schedule
      ? Object.entries(schedule.appointments).sort((a, b) => a[0].localeCompare(b[0]))
      : [],
    [schedule],
  )
  const completedCount = apptEntries.filter(([, a]) => a.status === 'COMPLETED').length
  const cancelledCount = apptEntries.filter(([, a]) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length
  const upcomingCount = apptEntries.length - completedCount - cancelledCount
  const nextEntry = apptEntries.find(([, a]) => a.next) ?? apptEntries.find(([, a]) => a.status === 'CONFIRMED' || a.status === 'PENDING')

  const upNext = useMemo(
    () => apptEntries
      .filter(([, a]) => a.status === 'CONFIRMED' || a.status === 'PENDING')
      .slice(0, 3),
    [apptEntries],
  )

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])
  const displayName = user ? `Dr. ${user.firstName}` : 'Doctor'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const body = (
    <>
      {/* Header card with greeting + today's date */}
      <div style={{
        background: `linear-gradient(135deg, ${MB.primary} 0%, ${MB.primary600} 100%)`,
        color: '#fff', borderRadius: 14, padding: 20, marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>{todayLabel}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{greeting}, {displayName}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
          {isLoading
            ? 'Loading today\'s schedule…'
            : apptEntries.length === 0
            ? 'You have no appointments scheduled today.'
            : `${apptEntries.length} appointment${apptEntries.length === 1 ? '' : 's'} today · ${upcomingCount} remaining`}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <KpiTile label="Total"     value={String(apptEntries.length)}   loading={isLoading} />
        <KpiTile label="Completed" value={String(completedCount)}        loading={isLoading} accent={MB.success} />
        <KpiTile label="Remaining" value={String(upcomingCount)}         loading={isLoading} accent={MB.primary} />
        <KpiTile label="Skipped"   value={String(cancelledCount)}        loading={isLoading} accent={MB.text3} />
      </div>

      {/* Up next */}
      <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink }}>Up next today</div>
          <Btn variant="secondary" size="sm" onClick={() => navigate('/doctor/schedule')}>Open schedule →</Btn>
        </div>
        {isLoading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map((i) => <Skel key={i} h={56} r={10} />)}
          </div>
        ) : isError ? (
          <div style={{ padding: 24 }}><ErrorState title="Couldn't load schedule" onRetry={() => refetch()} /></div>
        ) : upNext.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState icon="calendar" title="No upcoming appointments"
              body={nextEntry ? `Next at ${nextEntry[0]}` : 'Your queue is clear for the rest of today.'} />
          </div>
        ) : (
          <div>
            {upNext.map(([time, appt], i) => (
              <button key={time}
                onClick={() => appt.id && navigate(`/doctor/appt/${appt.id}`, { state: { appt, time } })}
                style={{
                  width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  background: appt.next ? MB.primary50 : 'transparent',
                  borderTop: i === 0 ? 'none' : `1px solid ${MB.line2}`,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <div style={{ width: 64, textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: MB.text, fontFamily: 'ui-monospace, monospace' }}>{time}</div>
                  <div style={{ fontSize: 11, color: MB.text3 }}>{appt.dur ? `${appt.dur * 30}m` : '30m'}</div>
                </div>
                <Avatar name={appt.name} size={34} tone={(appt.tone || 'primary') as AvatarTone} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{appt.name}</div>
                  <div style={{ fontSize: 12, color: MB.text3 }}>{appt.reason}</div>
                </div>
                <StatusPill status={appt.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink, marginBottom: 12 }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
          <ActionTile icon="calendar"  label="Today's schedule" onClick={() => navigate('/doctor/schedule')} />
          <ActionTile icon="clock"     label="Working hours"   onClick={() => navigate('/doctor/hours')} />
          <ActionTile icon="calendar"  label="Request leave"   onClick={() => navigate('/doctor/leave')} />
          <ActionTile icon="user"      label="My profile"      onClick={() => navigate('/doctor/profile')} />
        </div>
      </div>

      {/* Tomorrow preview link */}
      <div style={{ marginTop: 12, fontSize: 12, color: MB.text3, textAlign: 'center' }}>
        Planning ahead? <button
          onClick={() => {
            const d = new Date()
            d.setDate(d.getDate() + 1)
            navigate(`/doctor/schedule?date=${toLocalIsoDate(d)}`)
          }}
          style={{ background: 'transparent', border: 'none', color: MB.primary, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >Open tomorrow's schedule →</button>
      </div>
    </>
  )

  if (isWide) {
    return (
      <DoctorShell title="Dashboard" subtitle={todayLabel}>
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>{body}</div>
        </div>
      </DoctorShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Dashboard" />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{body}</div>
      <MobTabBar role="doctor" active="dashboard" />
    </MobScreen>
  )
})

function KpiTile({ label, value, loading, accent }: { label: string; value: string; loading?: boolean; accent?: string }) {
  return (
    <div style={{
      background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: MB.text3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {loading
        ? <Skel h={20} w="60%" r={4} style={{ marginTop: 6 }} />
        : <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? MB.ink, marginTop: 4 }}>{value}</div>}
    </div>
  )
}

function ActionTile({ icon, label, onClick }: { icon: 'calendar' | 'clock' | 'user'; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        background: MB.bg2, border: `1px solid ${MB.line2}`, borderRadius: 10,
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: MB.primary50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={15} color={MB.primary} />
      </div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: MB.text }}>{label}</span>
      <Icon name="chevronRight" size={14} color={MB.text3} />
    </button>
  )
}
