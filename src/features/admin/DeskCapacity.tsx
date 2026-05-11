import { memo, useMemo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/primitives/Badge'
import { useDoctorUtilization } from '@/hooks/useAdmin'

interface KpiBoxProps { label: string; value: string; sub?: string; loading?: boolean }

function KpiBox({ label, value, sub, loading }: KpiBoxProps) {
  return (
    <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 10 }}>
        {label}
      </div>
      {loading ? (
        <>
          <Skel h={26} w="55%" r={6} />
          <Skel h={11} w="40%" r={3} style={{ marginTop: 8 }} />
        </>
      ) : (
        <>
          <div style={{ fontSize: 26, fontWeight: 700, color: MB.ink, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: MB.text3, marginTop: 6 }}>{sub}</div>}
        </>
      )}
    </div>
  )
}

function CapacityBar({ rate }: { rate: number }) {
  const pct = rate * 100
  const color = pct >= 80 ? MB.danger : pct >= 60 ? MB.warn : MB.primary
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: MB.line, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: MB.text3, minWidth: 56, textAlign: 'right', fontFamily: 'monospace' }}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}

function todayRange() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return { from: `${y}-${m}-${d}T00:00:00`, to: `${y}-${m}-${d}T23:59:59` }
}

export default memo(function DeskCapacity() {
  const { from, to } = todayRange()
  const { data: utilization, isLoading } = useDoctorUtilization(from, to)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const kpi = useMemo(() => {
    if (!utilization) return null
    const totalBooked = utilization.reduce((s, d) => s + d.bookedSlots, 0)
    const totalSlots = utilization.reduce((s, d) => s + d.totalSlots, 0)
    const atCapacity = utilization.filter((d) => d.utilizationRate >= 1).length
    const freeSlots = totalSlots - totalBooked
    return { totalBooked, totalSlots, atCapacity, freeSlots, doctorCount: utilization.length }
  }, [utilization])

  return (
    <DeskShell active="capacity">
      <DeskTopbar title="Capacity" subtitle={`Today · ${today}`} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

        {/* KPI summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <KpiBox
            label="Slots booked"
            value={isLoading ? '—' : `${kpi?.totalBooked ?? 0}`}
            sub={kpi ? `of ${kpi.totalSlots} total` : undefined}
            loading={isLoading}
          />
          <KpiBox
            label="Doctors at capacity"
            value={isLoading ? '—' : `${kpi?.atCapacity ?? 0}`}
            sub={kpi ? `of ${kpi.doctorCount} doctors` : undefined}
            loading={isLoading}
          />
          <KpiBox
            label="Free slots"
            value={isLoading ? '—' : `${kpi?.freeSlots ?? 0}`}
            sub={kpi ? `across ${kpi.doctorCount - (kpi.atCapacity ?? 0)} doctors` : undefined}
            loading={isLoading}
          />
        </div>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 24px', borderBottom: `1px solid ${MB.line}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>Doctor utilisation</span>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: MB.text3 }}>
              {[{ color: MB.primary, label: 'Available' }, { color: MB.warn, label: 'Busy' }, { color: MB.danger, label: 'At capacity' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '8px 0' }}>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <div key={i} style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Skel w={160} h={13} />
                      <Skel w="100%" h={8} r={999} />
                    </div>
                  </div>
                ))
              : !utilization || utilization.length === 0
              ? <div style={{ padding: 24 }}><EmptyState icon="users" title="No utilization data" body="Doctor slot utilization for today will appear here." /></div>
              : utilization.map((doc) => (
                  <div key={doc.doctorId} style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line2}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{doc.doctorName}</div>
                        <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>{doc.department}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: MB.text3, fontFamily: 'monospace' }}>
                          {doc.bookedSlots}/{doc.totalSlots} slots
                        </span>
                        <Badge
                          tone={doc.utilizationRate >= 0.8 ? 'danger' : doc.utilizationRate >= 0.6 ? 'warn' : 'success'}
                          size="sm"
                        >
                          {doc.utilizationRate >= 0.8 ? 'At capacity' : doc.utilizationRate >= 0.6 ? 'Busy' : 'Available'}
                        </Badge>
                      </div>
                    </div>
                    <CapacityBar rate={doc.utilizationRate} />
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </DeskShell>
  )
})
