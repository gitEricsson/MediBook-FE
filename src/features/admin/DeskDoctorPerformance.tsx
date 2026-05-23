import { memo, useMemo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useDoctorUtilization, useAdminDoctors } from '@/hooks/useAdmin'
import { ReviewsService, type ReviewResponse } from '@/services/reviews.service'
import type { DoctorUtilizationEntry } from '@/services/admin.service'

// Same range options as Analytics so admins context-switch with no learning curve.
type Range = '7d' | '30d' | '90d' | 'ytd'

const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'ytd', label: 'YTD' },
]

function toIso(d: Date, endOfDay = false) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

function buildRange(r: Range): { from: string; to: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const from = new Date(today)
  switch (r) {
    case '7d':  from.setDate(today.getDate() - 7);  break
    case '30d': from.setDate(today.getDate() - 30); break
    case '90d': from.setDate(today.getDate() - 90); break
    case 'ytd': from.setMonth(0); from.setDate(1); break
  }
  return { from: toIso(from), to: toIso(today, true) }
}

// ── Sub-views ────────────────────────────────────────────────────────────

function StarBar({ rating }: { rating: number }) {
  const full = Math.round(rating * 10) / 10
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontWeight: 600 }}>
      ★ <span style={{ color: MB.text }}>{full > 0 ? full.toFixed(1) : '—'}</span>
    </span>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ flex: 1, padding: 16, background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12 }}>
      <div style={{ fontSize: 11, color: MB.text3, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: MB.ink, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function DoctorReviewsPanel({ doctorId }: { doctorId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', 'doctor', doctorId],
    queryFn: () => ReviewsService.getDoctorReviews(String(doctorId), 0, 20),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2].map((i) => <Skel key={i} h={70} r={10} />)}
      </div>
    )
  }
  const reviews = data?.content ?? []
  if (reviews.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: MB.text3, fontSize: 13 }}>No patient reviews yet.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reviews.map((r: ReviewResponse) => (
        <div key={r.id} style={{ background: MB.bg2, borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={r.patientName} size={26} tone="primary" />
              <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{r.patientName}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#F59E0B', fontSize: 13 }}>
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </span>
              <Badge tone={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warn' : 'neutral'} size="sm">
                {r.status.toLowerCase()}
              </Badge>
            </div>
          </div>
          {r.comment && (
            <p style={{ margin: 0, fontSize: 13, color: MB.text2, lineHeight: 1.5 }}>{r.comment}</p>
          )}
          <div style={{ fontSize: 11, color: MB.text3, marginTop: 6 }}>
            {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────

export default memo(function DeskDoctorPerformance() {
  const navigate = useNavigate()
  const [activeRange, setActiveRange] = useState<Range>('90d')
  const range = useMemo(() => buildRange(activeRange), [activeRange])

  const { data: util, isLoading: utilLoading } = useDoctorUtilization(range.from, range.to)
  const { data: doctorList } = useAdminDoctors()

  // Build a stable rows view that includes doctors with no appointments in the
  // window (they still show 0s — surfaces under-utilised staff).
  const rows = useMemo<DoctorUtilizationEntry[]>(() => {
    const byId = new Map<number, DoctorUtilizationEntry>()
    if (util) util.forEach((u) => byId.set(u.doctorId, u))
    if (doctorList) {
      doctorList.forEach((d) => {
        if (!byId.has(d.id)) {
          byId.set(d.id, {
            doctorId: d.id,
            doctorName: d.fullName,
            department: d.departmentName ?? '—',
            totalSlots: 0,
            bookedSlots: 0,
            utilizationRate: 0,
            totalAppointments: 0,
            completedAppointments: 0,
            cancelledAppointments: 0,
            averageRating: 0,
          })
        }
      })
    }
    return Array.from(byId.values()).sort((a, b) => b.totalAppointments - a.totalAppointments)
  }, [util, doctorList])

  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Auto-select the highest-volume doctor once data lands so the right panel isn't empty.
  const effectiveSelected = selectedId ?? rows[0]?.doctorId ?? null
  const selectedRow = rows.find((r) => r.doctorId === effectiveSelected) ?? null

  // Headline numbers for the selected doctor.
  const completionPct = selectedRow && selectedRow.totalAppointments > 0
    ? Math.round((selectedRow.completedAppointments / selectedRow.totalAppointments) * 1000) / 10
    : 0
  const cancelPct = selectedRow && selectedRow.totalAppointments > 0
    ? Math.round((selectedRow.cancelledAppointments / selectedRow.totalAppointments) * 1000) / 10
    : 0

  return (
    <DeskShell active="performance">
      <DeskTopbar
        title="Doctor performance"
        subtitle={`${rows.length} doctors · ${RANGES.find((r) => r.key === activeRange)?.label} window`}
        actions={
          <div style={{ display: 'flex', gap: 4, background: MB.bg2, borderRadius: 8, padding: 4 }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setActiveRange(r.key)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: activeRange === r.key ? MB.bg : 'transparent',
                  color: activeRange === r.key ? MB.text : MB.text3,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', gap: 16, minHeight: 0 }}>
        {/* Left: ranked doctors table */}
        <div style={{ flex: 1.4, minWidth: 0, background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${MB.line2}`, fontSize: 13, fontWeight: 700, color: MB.ink }}>
            Doctors
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Doctor performance">
              <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}`, position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <Th>Doctor</Th>
                  <Th align="right">Appts</Th>
                  <Th align="right">Done</Th>
                  <Th align="right">Cancelled</Th>
                  <Th align="right">Util.</Th>
                  <Th align="right">Rating</Th>
                </tr>
              </thead>
              <tbody>
                {utilLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[200, 50, 50, 50, 50, 50].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon="stethoscope" title="No doctor data" body="Add doctors first." />
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const isActive = r.doctorId === effectiveSelected
                    return (
                      <tr
                        key={r.doctorId}
                        onClick={() => setSelectedId(r.doctorId)}
                        style={{
                          borderBottom: `1px solid ${MB.line2}`,
                          cursor: 'pointer',
                          background: isActive ? MB.primary50 : 'transparent',
                        }}
                      >
                        <Td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={r.doctorName} size={26} tone="primary" />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>Dr. {r.doctorName}</div>
                              <div style={{ fontSize: 11, color: MB.text3 }}>{r.department}</div>
                            </div>
                          </div>
                        </Td>
                        <Td align="right">{r.totalAppointments}</Td>
                        <Td align="right">{r.completedAppointments}</Td>
                        <Td align="right">{r.cancelledAppointments}</Td>
                        <Td align="right">{Math.round(r.utilizationRate * 10) / 10}%</Td>
                        <Td align="right"><StarBar rating={r.averageRating} /></Td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: selected doctor detail */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {!selectedRow ? (
            <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 32 }}>
              <EmptyState icon="user" title="Pick a doctor" body="Select a row to see metrics and reviews." />
            </div>
          ) : (
            <>
              <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar name={selectedRow.doctorName} size={44} tone="primary" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink }}>Dr. {selectedRow.doctorName}</div>
                    <div style={{ fontSize: 12, color: MB.text3 }}>{selectedRow.department}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <MetricCard label="Total" value={String(selectedRow.totalAppointments)} />
                  <MetricCard label="Done" value={`${completionPct}%`} sub={`${selectedRow.completedAppointments} appts`} />
                  <MetricCard label="Cancelled" value={`${cancelPct}%`} sub={`${selectedRow.cancelledAppointments} appts`} />
                  <MetricCard label="Utilisation" value={`${Math.round(selectedRow.utilizationRate * 10) / 10}%`} />
                  <MetricCard label="Rating" value={selectedRow.averageRating > 0 ? selectedRow.averageRating.toFixed(1) : '—'} sub="Avg of approved reviews" />
                </div>
              </div>

              <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 16, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink }}>Patient reviews</div>
                  <Btn variant="secondary" size="sm" icon="moreH"
                    onClick={() => navigate(`/admin/docs?tab=reviews&doctorId=${selectedRow.doctorId}`)}>
                    Moderate
                  </Btn>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <DoctorReviewsPanel doctorId={selectedRow.doctorId} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DeskShell>
  )
})
