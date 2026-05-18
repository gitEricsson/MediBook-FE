import { memo, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { Btn } from '@/components/primitives/Btn'
import { Skel } from '@/components/feedback/Skel'
import { DoctorService } from '@/services/doctor.service'

/**
 * Admin oversight of doctor schedules.
 *
 * For each doctor on the platform we fetch their availability for the selected
 * Mon–Fri window. A slot is rendered as "P" when a free slot exists at that
 * 30-min bucket on that day, "—" when unavailable.
 *
 * Prev/Next week navigation is wired; "Add block" is intentionally a no-op for
 * now (admins manage blocks via per-doctor leave & hours pages).
 */

const SLOT_TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
const WEEKDAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7  // 0 = Mon
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setDate(out.getDate() - day)
  return out
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d); out.setDate(out.getDate() + n); return out
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 4)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Week of ${fmt(weekStart)} – ${fmt(end)}, ${end.getFullYear()}`
}

export default memo(function DeskDoctorSchedule() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const weekFromIso = isoDate(weekStart)
  const weekToIso   = isoDate(addDays(weekStart, 4))

  const doctorsQuery = useQuery({
    queryKey: ['admin', 'doctors', 'all'],
    queryFn: () => DoctorService.search({ acceptingNew: undefined, page: 0, size: 50 }),
  })

  return (
    <DeskShell active="schedule">
      <DeskTopbar
        title="Doctor schedules"
        subtitle={formatWeekRange(weekStart)}
        actions={<>
          <Btn variant="secondary" size="sm" icon="chevronLeft"  aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))} />
          <Btn variant="secondary" size="sm" icon="chevronRight" aria-label="Next week"     onClick={() => setWeekStart(addDays(weekStart, 7))} />
        </>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {doctorsQuery.isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => <Skel key={i} w="100%" h={180} />)}
          </div>
        )}
        {doctorsQuery.isError && (
          <div style={{ color: MB.danger, fontSize: 14 }}>Could not load doctors.</div>
        )}
        {doctorsQuery.data?.length === 0 && (
          <div style={{ color: MB.text3, fontSize: 14 }}>No doctors found.</div>
        )}
        {doctorsQuery.data?.map((doc) => (
          <DoctorWeekRow key={doc.id} doctorId={String(doc.id)} name={`Dr. ${doc.name}`} from={weekFromIso} to={weekToIso} />
        ))}
      </div>
    </DeskShell>
  )
})

function DoctorWeekRow({ doctorId, name, from, to }: { doctorId: string; name: string; from: string; to: string }) {
  // Per-doctor availability fetched lazily so a slow doctor doesn't block the rest.
  const availability = useQuery({
    queryKey: ['admin', 'schedule', doctorId, from, to],
    queryFn: () => DoctorService.getAvailability(doctorId, from, to),
    staleTime: 60_000,
  })

  // Build a Map<time, slots-per-day-array> from the real availability response.
  const grid = useMemo(() => {
    const result: Record<string, string[]> = Object.fromEntries(SLOT_TIMES.map((t) => [t, WEEKDAYS.map(() => '—')]))
    if (!availability.data) return result
    for (const day of availability.data) {
      const date = new Date(day.date)
      const dow  = (date.getDay() + 6) % 7  // 0 = Mon
      if (dow > 4) continue
      for (const slot of day.slots) {
        const hhmm = slot.startTime  // already "HH:mm"
        if (result[hhmm]) result[hhmm][dow] = 'P'
      }
    }
    return result
  }, [availability.data])

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar name={name} size={28} tone="primary" />
        <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{name}</span>
        <StatusPill status="ACTIVE" />
        {availability.isLoading && <span style={{ fontSize: 11, color: MB.text3 }}>loading…</span>}
      </div>
      <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label={`Schedule for ${name}`}>
          <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
            <tr>
              <Th width={80}>Time</Th>
              {WEEKDAYS.map((d) => <Th key={d} align="center">{d}</Th>)}
            </tr>
          </thead>
          <tbody>
            {availability.isLoading
              ? [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                  {[...Array(6)].map((_, j) => <td key={j} style={{ padding: '10px 16px' }}><Skel w={40} h={12} /></td>)}
                </tr>
              ))
              : Object.entries(grid).map(([time, slots]) => (
                <tr key={time} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                  <Td mono>{time}</Td>
                  {slots.map((s, i) => (
                    <Td key={i} align="center">
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: s === 'P' ? MB.primary50 : MB.bg3,
                        color: s === 'P' ? MB.primary600 : MB.text4,
                      }}>{s}</span>
                    </Td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
