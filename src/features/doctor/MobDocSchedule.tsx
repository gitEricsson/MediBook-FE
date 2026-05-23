import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSchedule, ScheduleAppt } from '@/hooks/useSchedule'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useViewport } from '@/hooks/useViewport'
import { toLocalIsoDate, todayLocalIsoDate } from '@/lib/date'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SlotBlocksService, type SlotBlockResponse } from '@/services/slot-blocks.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Textarea } from '@/components/forms/Textarea'
import { TimeField } from '@/components/forms/TimeField'
import type { AvatarTone } from '@/types/domain'

type ScheduleState = 'default' | 'loading' | 'empty' | 'error'

/** Returns a compact label + colour for the consultation medium/type. Returns null for PHYSICAL. */
function mediumTag(medium?: string, type?: string): { label: string; bg: string; color: string } | null {
  const m = medium?.toUpperCase()
  const t = type?.toUpperCase()
  if (m === 'VIDEO' || t === 'TELEMEDICINE' || t === 'TELEHEALTH') {
    return { label: 'Video', bg: '#EEF2FF', color: '#6366F1' }
  }
  if (m === 'AUDIO') {
    return { label: 'Audio', bg: '#F0FDF4', color: '#16A34A' }
  }
  return null  // PHYSICAL — no tag
}

/**
 * Build the Monday-anchored 7-day strip that contains `anchorIso`.
 * Returning derived data keyed off the selected day means navigating prev/next
 * weeks just shifts the selected date by ±7 days — the strip follows naturally
 * with no separate `weekOffset` state to keep in sync.
 */
function buildWeekStrip(anchorIso: string) {
  const todayIso = todayLocalIsoDate()
  const anchor = new Date(anchorIso + 'T00:00:00')
  // JS getDay() is 0..6 with Sun=0. Normalize to Mon=0..Sun=6 so Monday anchors the week.
  const dow = (anchor.getDay() + 6) % 7
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - dow)

  const days = [...Array(7)].map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = toLocalIsoDate(d)
    return {
      iso,
      n: d.getDate(),
      narrow: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      short:  d.toLocaleDateString('en-US', { weekday: 'short' }),
      today:  iso === todayIso,
    }
  })

  const sun = new Date(monday); sun.setDate(monday.getDate() + 6)
  // E.g. "Mon, May 19 – Sun, May 25" or "Mon, May 19 – Sun, Jun 1" when crossing months.
  const sameMonth = monday.getMonth() === sun.getMonth()
  const label = sameMonth
    ? `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.getDate()}`
    : `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return { days, monday, sun, label }
}

function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toLocalIsoDate(d)
}

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
          <Avatar name={appt.name} size={24} tone={(appt.tone || 'primary') as AvatarTone} />
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.name}</div>
          <StatusPill status={appt.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ fontSize: 12, color: MB.text3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.reason}</div>
          {(() => { const tag = mediumTag(appt.consultationMedium, appt.type); return tag ? (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: tag.bg, color: tag.color, flexShrink: 0 }}>{tag.label}</span>
          ) : null })()}
        </div>
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

function MobileDocSchedule() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore(state => state.unreadCount);

  const [selectedDate, setSelectedDate] = useState(todayLocalIsoDate());
  const [blockOpen, setBlockOpen] = useState(false);
  const { data: schedule, isLoading, isError, refetch } = useSchedule(user?.id || 'current', selectedDate);

  const apptEntries = schedule ? Object.entries(schedule.appointments).sort((a, b) => a[0].localeCompare(b[0])) : [];
  const completedCount = apptEntries.filter(([, a]) => a.status === 'COMPLETED').length;
  const nextApptTime = apptEntries.find(([, a]) => a.next)?.[0];

  const resolvedState: ScheduleState = isLoading ? 'loading' : isError ? 'error' : (apptEntries.length === 0 ? 'empty' : 'default');

  // The week strip is derived from the selected date — clicking ◀/▶ jumps the
  // selection ±7 days and the strip follows automatically. Picking a day in a
  // distant week shifts the strip there too, so there's no separate offset state
  // that can drift out of sync.
  const { days: weekDays, label: weekLabel } = buildWeekStrip(selectedDate)
  const handlePrevWeek = () => setSelectedDate(prev => shiftIsoDate(prev, -7))
  const handleNextWeek = () => setSelectedDate(prev => shiftIsoDate(prev, +7))

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{weekLabel}</div>
            <button
              onClick={() => setSelectedDate(todayLocalIsoDate())}
              style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 11, color: MB.primary, fontWeight: 500, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Jump to today
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="mb-icon-btn" aria-label="Previous week" onClick={handlePrevWeek}><Icon name="chevronLeft" size={16} color={MB.text2} /></button>
            <button className="mb-icon-btn" aria-label="Next week" onClick={handleNextWeek}><Icon name="chevronRight" size={16} color={MB.text2} /></button>
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
                color: selectedDate === d.iso ? '#fff' : d.today ? MB.primary : MB.text, cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.85 }}>{d.narrow}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{d.n}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: MB.bg2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: MB.text2, fontWeight: 500 }}>
        <span>{apptEntries.length} appointments · {completedCount} done</span>
        <button
          onClick={() => setBlockOpen(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MB.warn, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Icon name="clock" size={12} color={MB.warn} /> Block time
        </button>
      </div>
      <div style={{ padding: '0 16px' }}>
        <MyBlocksForDay date={selectedDate} />
      </div>
      {nextApptTime && (
        <div style={{ padding: '6px 16px', background: MB.bg2, fontSize: 12, color: MB.success, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: MB.success }} />
          Next at {nextApptTime}
        </div>
      )}
      {blockOpen && <BlockTimeDialog defaultDate={selectedDate} onClose={() => setBlockOpen(false)} />}

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
            {apptEntries.map(([time, appt]) => {
              if (!appt.id) return null
              return (
                <DocApptRow
                  key={time}
                  time={time}
                  dur={appt.dur ? `${appt.dur * 30}m` : '30m'}
                  appt={appt}
                  onClick={() => navigate(`/doctor/appt/${appt.id}`, { state: { appt, time } })}
                />
              )
            })}
          </div>
        )}
      </div>
      <MobTabBar role="doctor" active="schedule" />
    </MobScreen>
  )
}

// ── Desktop schedule timeline ─────────────────────────────────────────────────
function DesktopDocSchedule() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState(todayLocalIsoDate())
  const [blockOpen, setBlockOpen] = useState(false)
  const { data: schedule, isLoading, isError, refetch } = useSchedule(user?.id || 'current', selectedDate)

  // Week strip derived from the active selection — ◀/▶ on the strip header
  // shift the selectedDate by ±7 days so prev/next week navigation works the
  // same whether you click a sidebar week button or a day directly.
  const { days: weekDays, label: weekLabel } = buildWeekStrip(selectedDate)
  const todayIsoForStrip = todayLocalIsoDate()
  const stripIncludesToday = weekDays.some((d) => d.iso === todayIsoForStrip)

  const apptEntries = schedule ? Object.entries(schedule.appointments).sort((a, b) => a[0].localeCompare(b[0])) : []
  const completedCount = apptEntries.filter(([, a]) => a.status === 'COMPLETED').length
  const selectedDateLabel = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
    COMPLETED: { bg: MB.successBg, color: MB.success },
    CONFIRMED: { bg: MB.primary50, color: MB.primary600 },
    SCHEDULED: { bg: MB.primary50, color: MB.primary600 },
    CANCELLED: { bg: MB.bg3, color: MB.text3 },
    NO_SHOW: { bg: MB.dangerBg, color: MB.danger },
    PENDING: { bg: MB.warnBg, color: MB.warn },
  }

  return (
    <DoctorShell title="My schedule" subtitle={selectedDateLabel} actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" size="sm" icon="clock" onClick={() => setBlockOpen(true)}>Block time</Btn>
        <Btn variant="secondary" size="sm" icon="chevronLeft" aria-label="Previous day"
          onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(toLocalIsoDate(d)) }} />
        <Btn variant="secondary" size="sm" onClick={() => setSelectedDate(todayLocalIsoDate())}>Today</Btn>
        <Btn variant="secondary" size="sm" icon="chevronRight" aria-label="Next day"
          onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(toLocalIsoDate(d)) }} />
      </div>
    }>
      <div style={{ flex: 1, padding: 28, display: 'flex', gap: 24, minHeight: 0 }}>
        {/* Left: week strip + stats */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Calendar strip — week-by-week navigation */}
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              padding: '10px 12px', borderBottom: `1px solid ${MB.line2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
            }}>
              <button
                aria-label="Previous week"
                onClick={() => setSelectedDate(shiftIsoDate(selectedDate, -7))}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="chevronLeft" size={16} color={MB.text3} />
              </button>
              <div style={{ fontSize: 12, fontWeight: 600, color: MB.text, textAlign: 'center', flex: 1 }}>
                {weekLabel}
              </div>
              <button
                aria-label="Next week"
                onClick={() => setSelectedDate(shiftIsoDate(selectedDate, +7))}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="chevronRight" size={16} color={MB.text3} />
              </button>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {weekDays.map((day) => {
                const isSelected = selectedDate === day.iso
                return (
                  <button key={day.iso} onClick={() => setSelectedDate(day.iso)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: isSelected ? MB.primary : 'transparent',
                      color: isSelected ? '#fff' : day.today ? MB.primary : MB.text,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 13, fontWeight: isSelected ? 600 : 500,
                    }}>
                    <span>{day.short}</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{day.n}</span>
                    {day.today && !isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: MB.primary }} />}
                  </button>
                )
              })}
            </div>
            {!stripIncludesToday && (
              <div style={{ padding: '8px 14px', borderTop: `1px solid ${MB.line2}` }}>
                <button
                  onClick={() => setSelectedDate(todayLocalIsoDate())}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${MB.line}`, background: MB.bg, fontSize: 12, fontWeight: 600, color: MB.primary, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Jump to today
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: MB.text3 }}>Total</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: MB.ink }}>{apptEntries.length}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: MB.text3 }}>Completed</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: MB.success }}>{completedCount}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: MB.text3 }}>Remaining</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: MB.primary600 }}>{apptEntries.length - completedCount}</div>
            </div>
          </div>

          {/* Existing slot blocks for this day */}
          <MyBlocksForDay date={selectedDate} />
        </div>

        {/* Right: appointment list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isLoading && (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0, 1, 2, 3].map((i) => <Skel key={i} w="100%" h={72} r={10} />)}
              </div>
            )}
            {isError && <div style={{ padding: 32 }}><ErrorState title="Couldn't load schedule" onRetry={() => refetch()} /></div>}
            {!isLoading && !isError && apptEntries.length === 0 && (
              <EmptyState icon="calendar" title="No appointments" body="Your schedule is clear for this day." />
            )}
            {!isLoading && !isError && apptEntries.length > 0 && (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {apptEntries.map(([time, appt], i) => {
                  const sc = STATUS_COLOR[appt.status] ?? { bg: MB.bg3, color: MB.text3 }
                  if (!appt.id) return null
                  return (
                    <div key={time}
                      onClick={() => navigate(`/doctor/appt/${appt.id}`, { state: { appt, time } })}
                      style={{
                        padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center',
                        borderBottom: i === apptEntries.length - 1 ? 'none' : `1px solid ${MB.line2}`,
                        background: appt.next ? `${MB.primary50}66` : 'transparent',
                        cursor: 'pointer', transition: 'background .1s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => { if (!appt.next) (e.currentTarget as HTMLDivElement).style.background = MB.bg2 }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = appt.next ? `${MB.primary50}66` : 'transparent' }}
                    >
                      {appt.next && (
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: MB.primary, borderRadius: '0 2px 2px 0' }} />
                      )}
                      <div style={{ width: 64, textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: MB.text, fontFamily: 'ui-monospace, monospace' }}>{time}</div>
                        <div style={{ fontSize: 11, color: MB.text3, marginTop: 1 }}>{appt.dur ? `${appt.dur * 30}m` : '30m'}</div>
                      </div>
                      <div style={{ width: 1, height: 40, background: MB.line2, flexShrink: 0 }} />
                      <Avatar name={appt.name} size={36} tone={(appt.tone || 'primary') as AvatarTone} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{appt.name}</div>
                        <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{appt.reason}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {appt.next && <Badge tone="primary" size="sm">Up next</Badge>}
                        {(() => { const tag = mediumTag(appt.consultationMedium, appt.type); return tag ? (
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: tag.bg, color: tag.color }}>{tag.label}</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: MB.bg3, color: MB.text3 }}>Physical</span>
                        ) })()}
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{appt.status}</span>
                        <Icon name="chevronRight" size={14} color={MB.text3} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {blockOpen && <BlockTimeDialog defaultDate={selectedDate} onClose={() => setBlockOpen(false)} />}
    </DoctorShell>
  )
}

// ── Block-time dialog ────────────────────────────────────────────────────
//
// Distinct from `taking a leave` — a leave covers whole days for personal /
// sick / conference reasons. A slot block carves a specific time window out
// of a single day with a reason (e.g. operating on patient X). Both restrict
// availability, just at different granularities; conceptually the same idea
// behind `acceptingNew` but per-window instead of doctor-wide.

interface BlockTimeDialogProps {
  defaultDate: string
  onClose: () => void
}

function BlockTimeDialog({ defaultDate, onClose }: BlockTimeDialogProps) {
  const queryClient = useQueryClient()
  const [date, setDate]           = useState(defaultDate)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime]     = useState('10:00')
  const [reason, setReason]       = useState('')

  const create = useMutation({
    mutationFn: () => SlotBlocksService.createMine({
      blockDate: date, startTime, endTime, reason: reason.trim(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'slot-blocks'] })
      // The patient availability cache is server-side; the next /availability
      // call will rebuild — no client-side query to invalidate.
      toast.success('Time blocked')
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not block time'),
  })

  const invalidRange = startTime >= endTime
  const canSubmit = !!date && !invalidRange && reason.trim().length >= 3 && !create.isPending

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: MB.bg, borderRadius: 14, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: MB.warnBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="clock" size={18} color={MB.warn} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: MB.ink }}>Block time</h3>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>
              Make a specific window unbookable for this day.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Date" htmlFor="sb-date">
            <Input id="sb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={todayLocalIsoDate()} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <TimeField label="From" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <TimeField label="To"   value={endTime}   onChange={(e) => setEndTime(e.target.value)} />
          </div>
          {invalidRange && (
            <div style={{ fontSize: 11, color: MB.danger }}>End time must be after start time.</div>
          )}
          <Field label="Reason" htmlFor="sb-reason" hint="Visible to administrators only. Patients see 'unavailable'.">
            <Textarea
              id="sb-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. operating on a patient; admin meeting"
              rows={3}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" danger loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>
            Block time
          </Btn>
        </div>
      </div>
    </div>
  )
}

/** Strip showing the doctor's blocks for the selected day with a delete affordance. */
function MyBlocksForDay({ date }: { date: string }) {
  const queryClient = useQueryClient()
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['doctor', 'slot-blocks', date],
    queryFn: () => SlotBlocksService.listMine(date, date),
  })
  const remove = useMutation({
    mutationFn: (id: number) => SlotBlocksService.removeMine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'slot-blocks'] })
      toast.success('Block removed')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not remove block'),
  })

  if (isLoading) return null
  if (!blocks || blocks.length === 0) return null

  return (
    <div style={{ marginTop: 12, padding: 12, background: MB.warnBg, borderRadius: 10, border: `1px solid ${MB.warn}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MB.warn, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Unavailable today
      </div>
      {blocks.map((b: SlotBlockResponse) => (
        <div key={b.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: `1px solid ${MB.warn}33` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>
              {b.startTime} – {b.endTime}
            </div>
            <div style={{ fontSize: 12, color: MB.text2, marginTop: 2 }}>{b.reason}</div>
          </div>
          <button
            onClick={() => remove.mutate(b.id)}
            disabled={remove.isPending}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MB.text3, padding: 4 }}
            aria-label="Remove block"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default memo(function MobDocSchedule() {
  const { isWide } = useViewport()
  return isWide ? <DesktopDocSchedule /> : <MobileDocSchedule />
})
