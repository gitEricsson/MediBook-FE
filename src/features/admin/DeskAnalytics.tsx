import { memo, useState, useMemo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Badge } from '@/components/primitives/Badge'
import { Skel } from '@/components/feedback/Skel'
import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/services/admin.service'
import {
  useAppointmentAnalytics,
  useRevenueAnalytics,
  useDoctorUtilization,
} from '@/hooks/useAdmin'

// ── Date range helpers ────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d' | 'ytd'

function toIso(d: Date, endOfDay = false) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

function buildRange(r: Range): { from: string; to: string; label: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const from = new Date(today)

  if (r === '7d') from.setDate(today.getDate() - 6)
  else if (r === '30d') from.setDate(today.getDate() - 29)
  else if (r === '90d') from.setDate(today.getDate() - 89)
  else from.setMonth(0, 1) // ytd

  const labels: Record<Range, string> = {
    '7d': 'Last 7 days', '30d': 'Last 30 days',
    '90d': 'Last 90 days', ytd: 'Year to date',
  }
  return { from: toIso(from), to: toIso(today, true), label: labels[r] }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtNGN(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`
  return `₦${v.toLocaleString()}`
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
  loading?: boolean
  accent?: string
}

const KpiCard = memo(function KpiCard({ label, value, sub, loading, accent }: KpiProps) {
  return (
    <div style={{
      background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`,
      padding: '18px 20px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 12 }}>
        {label}
      </div>
      {loading ? (
        <>
          <Skel h={28} w="55%" r={6} />
          <Skel h={11} w="40%" r={3} style={{ marginTop: 8 }} />
        </>
      ) : (
        <>
          <div style={{ fontSize: 26, fontWeight: 700, color: MB.ink, letterSpacing: 0, lineHeight: 1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: accent ?? MB.text3, marginTop: 7, fontWeight: 500 }}>
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  )
})

function HBar({ value, max, color = MB.primary }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div style={{ flex: 1, height: 6, background: MB.line2, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: '100%', background: color,
        borderRadius: 999,
        transform: `scaleX(${w / 100})`, transformOrigin: 'left center',
        transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </div>
  )
}

function DonutChart({
  a, b, colorA, colorB, size = 128,
}: { a: number; b: number; colorA: string; colorB: string; size?: number }) {
  const r = (size - 26) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const total = a + b || 1
  const pctA = a / total
  const dashA = pctA * circ
  const dashB = (b / total) * circ
  const rotB = pctA * 360 - 90

  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={MB.line} strokeWidth={20} />
      {b > 0 && (
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={colorB} strokeWidth={20}
          strokeDasharray={`${dashB} ${circ}`}
          transform={`rotate(${rotB} ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      )}
      {a > 0 && (
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={colorA} strokeWidth={20}
          strokeDasharray={`${dashA} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
        />
      )}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={15} fontWeight={700} fill={MB.ink}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill={MB.text3} fontWeight={500}>
        visits
      </text>
    </svg>
  )
}

function UtilBar({ rate }: { rate: number }) {
  const color = rate >= 0.8 ? MB.danger : rate >= 0.6 ? MB.warn : MB.success
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: 6, background: MB.line, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '100%', background: color, borderRadius: 999, transform: `scaleX(${rate})`, transformOrigin: 'left center', transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'ytd', label: 'YTD' },
]

export default memo(function DeskAnalytics() {
  const [activeRange, setActiveRange] = useState<Range>('90d')
  const range = useMemo(() => buildRange(activeRange), [activeRange])

  const { data: appts, isLoading: apptLoading } = useAppointmentAnalytics(range.from, range.to)
  const { data: rev, isLoading: revLoading } = useRevenueAnalytics(range.from, range.to)
  const { data: util, isLoading: utilLoading } = useDoctorUtilization(range.from, range.to)
  const { data: health } = useQuery({ queryKey: ['system', 'health'], queryFn: AdminService.getHealth })
  const { data: version } = useQuery({ queryKey: ['system', 'version'], queryFn: AdminService.getVersion })

  const completionRate = appts
    ? (appts.completedAppointments / Math.max(1, appts.totalAppointments)) * 100
    : 0
  const paymentSuccessRate = rev
    ? (rev.successfulPayments / Math.max(1, rev.successfulPayments + rev.failedPayments)) * 100
    : 0

  const deptEntries = appts
    ? Object.entries(appts.appointmentsByDepartment).sort((a, b) => b[1] - a[1])
    : []
  const deptMax = deptEntries[0]?.[1] ?? 1

  const inPerson = appts?.appointmentsByType?.['IN_PERSON'] ?? 0
  const tele = appts?.appointmentsByType?.['TELEMEDICINE'] ?? 0

  const sortedUtil = useMemo(
    () => [...(util ?? [])].sort((a, b) => b.utilizationRate - a.utilizationRate),
    [util],
  )

  const isApiHealthy = health?.status === 'UP' || health?.status === 'ok'

  return (
    <DeskShell active="analytics">
      <DeskTopbar
        title="Analytics"
        subtitle={range.label}
        actions={
          <div style={{
            display: 'flex', background: MB.bg3, borderRadius: 8,
            padding: 3, gap: 2,
          }}>
            {RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveRange(key)}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.12s',
                  background: activeRange === key ? MB.bg : 'transparent',
                  color: activeRange === key ? MB.primary : MB.text3,
                  boxShadow: activeRange === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── KPI row ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <KpiCard
            label="Net Revenue"
            value={rev ? fmtNGN(rev.netRevenue) : '—'}
            sub={rev ? `${fmtNGN(rev.totalRevenue)} gross` : undefined}
            loading={revLoading}
          />
          <KpiCard
            label="Total Appointments"
            value={appts ? appts.totalAppointments.toLocaleString() : '—'}
            sub={appts ? `${appts.completedAppointments.toLocaleString()} completed` : undefined}
            loading={apptLoading}
          />
          <KpiCard
            label="Completion Rate"
            value={appts ? fmtPct(completionRate) : '—'}
            sub={completionRate >= 75 ? 'On target' : 'Below target'}
            accent={completionRate >= 75 ? MB.success : MB.warn}
            loading={apptLoading}
          />
          <KpiCard
            label="Cancellation Rate"
            value={appts ? fmtPct(appts.cancellationRatePercent) : '—'}
            sub={appts ? `${appts.cancelledAppointments.toLocaleString()} cancelled` : undefined}
            accent={
              appts && appts.cancellationRatePercent > 15
                ? MB.danger
                : appts && appts.cancellationRatePercent > 10
                ? MB.warn
                : MB.success
            }
            loading={apptLoading}
          />
          <KpiCard
            label="No-show Rate"
            value={appts ? fmtPct(appts.noShowRatePercent) : '—'}
            sub="of confirmed appointments"
            accent={appts && appts.noShowRatePercent > 5 ? MB.danger : MB.text3}
            loading={apptLoading}
          />
        </div>

        {/* ── Middle row ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

          {/* Department breakdown */}
          <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>
              Appointments by department
            </h2>
            {apptLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Skel h={12} w="42%" r={4} />
                      <Skel h={12} w="14%" r={4} />
                    </div>
                    <Skel h={6} w="100%" r={999} />
                  </div>
                ))}
              </div>
            ) : deptEntries.length === 0 ? (
              <div style={{ textAlign: 'center', color: MB.text3, fontSize: 13, padding: '40px 0' }}>
                No appointment data for this period
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {deptEntries.map(([dept, count]) => (
                  <div key={dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>{dept}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: MB.ink, fontVariantNumeric: 'tabular-nums' }}>
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <HBar value={count} max={deptMax} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: donut + revenue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Visit type donut */}
            <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 22, flex: 1 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: MB.ink, margin: '0 0 16px' }}>Visit type split</h2>
              {apptLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                  <Skel w={128} h={128} r={64} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <DonutChart a={inPerson} b={tele} colorA={MB.primary} colorB="#6366F1" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                    {[
                      { label: 'In-person', value: inPerson, color: MB.primary },
                      { label: 'Telemedicine', value: tele, color: '#6366F1' },
                    ].map(({ label, value, color }) => {
                      const total = inPerson + tele || 1
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                            <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: MB.text2, fontWeight: 500 }}>{label}</span>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: MB.ink, letterSpacing: 0, lineHeight: 1 }}>
                            {((value / total) * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>
                            {value.toLocaleString()} visits
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue breakdown */}
            <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 22 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: MB.ink, margin: '0 0 16px' }}>Revenue breakdown</h2>
              {revLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                        <Skel h={11} w="38%" r={4} />
                        <Skel h={11} w="20%" r={4} />
                      </div>
                      <Skel h={6} w="100%" r={999} />
                    </div>
                  ))}
                </div>
              ) : !rev ? (
                <div style={{ fontSize: 13, color: MB.text3 }}>No revenue data for this period</div>
              ) : (
                <>
                  {[
                    { label: 'Gross revenue', value: rev.totalRevenue, color: MB.primary, prefix: '' },
                    { label: 'Refunds issued', value: rev.totalRefunds, color: MB.danger, prefix: '−' },
                    { label: 'Net revenue', value: rev.netRevenue, color: MB.success, prefix: '' },
                  ].map(({ label, value, color, prefix }) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: MB.text2 }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                          {prefix}{fmtNGN(value)}
                        </span>
                      </div>
                      <HBar value={value} max={rev.totalRevenue} color={color} />
                    </div>
                  ))}
                  <div style={{
                    marginTop: 4, paddingTop: 12, borderTop: `1px solid ${MB.line2}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: MB.text3 }}>Payment success rate</span>
                    <Badge tone={paymentSuccessRate >= 95 ? 'success' : paymentSuccessRate >= 85 ? 'warn' : 'danger'} size="sm">
                      {fmtPct(paymentSuccessRate)}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Doctor utilization ───────────────────────────────────────────── */}
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: MB.ink, margin: 0 }}>Doctor utilization</h2>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { color: MB.success, label: '< 60% — available' },
                { color: MB.warn, label: '60–80% — busy' },
                { color: MB.danger, label: '> 80% — at capacity' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MB.text3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {utilLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 2fr 60px 80px', gap: 16, alignItems: 'center' }}>
                  <Skel h={13} r={4} />
                  <Skel h={13} r={4} />
                  <Skel h={6} r={999} />
                  <Skel h={13} r={4} />
                  <Skel h={13} r={4} />
                </div>
              ))}
            </div>
          ) : sortedUtil.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: MB.text3, fontSize: 13 }}>
              No utilization data for this period
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 2fr 60px 80px',
                gap: 16, paddingBottom: 10, borderBottom: `1px solid ${MB.line2}`,
                fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.06,
              }}>
                <div>Doctor</div>
                <div>Department</div>
                <div>Utilization</div>
                <div style={{ textAlign: 'right' }}>Rate</div>
                <div style={{ textAlign: 'right' }}>Slots</div>
              </div>
              {sortedUtil.map((doc, i) => {
                const rateColor = doc.utilizationRate >= 0.8 ? MB.danger : doc.utilizationRate >= 0.6 ? MB.warn : MB.success
                return (
                  <div
                    key={doc.doctorId}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 160px 2fr 60px 80px',
                      gap: 16, padding: '13px 0', alignItems: 'center',
                      borderBottom: i < sortedUtil.length - 1 ? `1px solid ${MB.line2}` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{doc.doctorName}</span>
                    <span style={{ fontSize: 12, color: MB.text2 }}>{doc.department}</span>
                    <UtilBar rate={doc.utilizationRate} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: rateColor, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {(doc.utilizationRate * 100).toFixed(0)}%
                    </span>
                    <span style={{ fontSize: 12, color: MB.text3, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {doc.bookedSlots}/{doc.totalSlots}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* ── System health footer ─────────────────────────────────────────── */}
        <div style={{
          background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`,
          padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: isApiHealthy ? MB.success : MB.warn,
              boxShadow: isApiHealthy ? `0 0 0 3px ${MB.successBg}` : `0 0 0 3px ${MB.warnBg}`,
            }} />
            <span style={{ fontSize: 12, color: MB.text2, fontWeight: 500 }}>API Health</span>
            <Badge tone={isApiHealthy ? 'success' : 'neutral'} size="sm">
              {isApiHealthy ? 'Operational' : 'Checking…'}
            </Badge>
          </div>
          <div style={{ fontSize: 12, color: MB.text3 }}>
            Version{' '}
            <span style={{ fontFamily: 'monospace', color: MB.text2 }}>
              {version?.build ?? 'v1.4.2-stable'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: MB.text3 }}>
            Region <span style={{ color: MB.text2 }}>AWS us-east-1</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: MB.text4 }}>
            Stale after 5 min · last synced just now
          </div>
        </div>

      </div>
    </DeskShell>
  )
})
