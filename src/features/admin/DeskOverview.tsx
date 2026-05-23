import { memo, useMemo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AdminService } from '@/services/admin.service'
import {
  useAppointmentAnalytics,
  useRevenueAnalytics,
  useDoctorUtilization,
  useAdminDoctors,
  useAdminUsers,
  useAdminDepartments,
} from '@/hooks/useAdmin'

// ── Date helpers (today + last 7d windows) ───────────────────────────────────

function toIso(d: Date, endOfDay = false) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

function todayRange(): { from: string; to: string } {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(start); end.setHours(23, 59, 59, 999)
  return { from: toIso(start), to: toIso(end, true) }
}

function last7dRange(): { from: string; to: string } {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  const start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0)
  return { from: toIso(start), to: toIso(end, true) }
}

function fmtNgn(n: number) {
  if (!Number.isFinite(n)) return '₦0'
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
  return `₦${n.toLocaleString()}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
  loading?: boolean
  icon?: 'users' | 'stethoscope' | 'calendar' | 'inbox'
  accentColor?: string
}

const KpiCard = memo(function KpiCard({ label, value, sub, loading, icon, accentColor }: KpiProps) {
  return (
    <div style={{
      background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.05 }}>
          {label}
        </span>
        {icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: accentColor ? `${accentColor}1A` : MB.primary50,
          }}>
            <Icon name={icon} size={15} color={accentColor ?? MB.primary} />
          </div>
        )}
      </div>
      {loading ? (
        <>
          <Skel h={28} w="55%" r={6} />
          {sub && <Skel h={11} w="40%" r={3} />}
        </>
      ) : (
        <>
          <div style={{ fontSize: 26, fontWeight: 700, color: MB.ink, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: MB.text3, fontWeight: 500 }}>{sub}</div>}
        </>
      )}
    </div>
  )
})

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: MB.ink }}>{title}</h2>
        {action}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: 'building' | 'stethoscope' | 'sparkle' | 'chart' | 'users'; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: MB.bg2, border: `1px solid ${MB.line2}`, borderRadius: 10,
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = MB.bg3 }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = MB.bg2 }}
    >
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default memo(function DeskOverview() {
  const navigate = useNavigate()

  // Today's slice for "today's appointments / revenue".
  const today = useMemo(() => todayRange(), [])
  const week  = useMemo(() => last7dRange(), [])

  const { data: todayAppts, isLoading: todayApptsLoading } = useAppointmentAnalytics(today.from, today.to)
  const { data: todayRev,   isLoading: todayRevLoading   } = useRevenueAnalytics(today.from, today.to)
  const { data: weekAppts,  isLoading: weekApptsLoading  } = useAppointmentAnalytics(week.from, week.to)
  const { data: weekUtil,   isLoading: weekUtilLoading   } = useDoctorUtilization(week.from, week.to)
  const { data: doctors,    isLoading: doctorsLoading    } = useAdminDoctors()
  const { data: users,      isLoading: usersLoading      } = useAdminUsers()
  const { data: depts                                    } = useAdminDepartments()
  const { data: health }  = useQuery({ queryKey: ['system', 'health'],  queryFn: AdminService.getHealth })
  const { data: version } = useQuery({ queryKey: ['system', 'version'], queryFn: AdminService.getVersion })

  // Derived counts. We don't have a dedicated "active patients" endpoint, but
  // ROLE_PATIENT users with enabled=true is the same thing here.
  const activePatients = useMemo(
    () => (users ?? []).filter((u) => u.role === 'patient' && (u.enabled ?? true)).length,
    [users],
  )
  const totalDoctors = (doctors ?? []).length
  const activeDoctors = useMemo(
    () => (doctors ?? []).filter((d) => d.isActive ?? d.active ?? d.acceptingNew).length,
    [doctors],
  )

  const isApiHealthy = health?.status === 'UP' || health?.status === 'ok'

  const topUtil = useMemo(
    () => [...(weekUtil ?? [])].sort((a, b) => b.utilizationRate - a.utilizationRate).slice(0, 5),
    [weekUtil],
  )
  const topDepts = useMemo(() => {
    if (!weekAppts) return [] as { name: string; count: number }[]
    return Object.entries(weekAppts.appointmentsByDepartment)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [weekAppts])
  const deptMax = topDepts[0]?.count ?? 1

  return (
    <DeskShell active="overview">
      <DeskTopbar
        title="Overview"
        subtitle="System-wide snapshot"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: MB.text3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isApiHealthy ? MB.success : MB.warn }} />
              {isApiHealthy ? 'All systems operational' : 'Health check pending'}
            </span>
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── KPI row ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard
            label="Active patients"
            value={String(activePatients)}
            sub={users ? `${users.length} total accounts` : undefined}
            loading={usersLoading}
            icon="users"
          />
          <KpiCard
            label="Active doctors"
            value={String(activeDoctors)}
            sub={`${totalDoctors} on roster · ${depts?.length ?? 0} departments`}
            loading={doctorsLoading}
            icon="stethoscope"
          />
          <KpiCard
            label="Appointments today"
            value={todayAppts ? String(todayAppts.totalAppointments) : '0'}
            sub={todayAppts
              ? `${todayAppts.completedAppointments} done · ${todayAppts.cancelledAppointments} cancelled`
              : undefined}
            loading={todayApptsLoading}
            icon="calendar"
          />
          <KpiCard
            label="Revenue today"
            value={todayRev ? fmtNgn(todayRev.netRevenue) : '₦0'}
            sub={todayRev
              ? `${todayRev.successfulPayments} paid · ${todayRev.failedPayments} failed`
              : undefined}
            loading={todayRevLoading}
            icon="inbox"
            accentColor={MB.success}
          />
        </div>

        {/* ── Two-column body ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

          {/* Departments by volume (last 7d) */}
          <SectionCard
            title="Top departments (last 7 days)"
            action={<Btn variant="secondary" size="sm" onClick={() => navigate('/admin/analytics')}>Analytics →</Btn>}
          >
            {weekApptsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1, 2, 3].map((i) => <Skel key={i} h={20} r={6} />)}
              </div>
            ) : topDepts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: MB.text3, fontSize: 13 }}>
                No appointments this week.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topDepts.map(({ name, count }) => (
                  <div key={name} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: MB.text2, fontWeight: 500 }}>{name}</span>
                    <div style={{ height: 8, background: MB.line2, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: '100%',
                        background: MB.primary, borderRadius: 999,
                        transform: `scaleX(${count / deptMax})`, transformOrigin: 'left center',
                        transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: MB.ink, textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* System status */}
          <SectionCard title="System status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MB.text2 }}>API</span>
                <Badge tone={isApiHealthy ? 'success' : 'warn'} size="sm">
                  {isApiHealthy ? 'UP' : 'Checking'}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MB.text2 }}>Build</span>
                <span style={{ fontFamily: 'var(--mb-font-mono),monospace', fontSize: 12, color: MB.text3 }}>
                  {version?.build ?? version?.version ?? 'dev'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MB.text2 }}>Departments</span>
                <span style={{ fontSize: 13, color: MB.text, fontWeight: 500 }}>{depts?.length ?? 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MB.text2 }}>Last refresh</span>
                <span style={{ fontSize: 12, color: MB.text3 }}>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </SectionCard>

          {/* Top-utilised doctors */}
          <SectionCard
            title="Most-utilised doctors (last 7 days)"
            action={<Btn variant="secondary" size="sm" onClick={() => navigate('/admin/performance')}>Performance →</Btn>}
          >
            {weekUtilLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1, 2, 3].map((i) => <Skel key={i} h={32} r={8} />)}
              </div>
            ) : topUtil.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: MB.text3, fontSize: 13 }}>
                No appointments this week.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topUtil.map((u) => (
                  <div key={u.doctorId} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8, padding: '8px 12px', background: MB.bg2, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>Dr. {u.doctorName}</div>
                      <div style={{ fontSize: 11, color: MB.text3 }}>{u.completedAppointments} completed · {u.totalAppointments} total</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: MB.primary }}>
                      {Math.round(u.utilizationRate * 10) / 10}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick actions */}
          <SectionCard title="Quick actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickAction icon="users"       label="Manage patients"  onClick={() => navigate('/admin/patients')} />
              <QuickAction icon="building"    label="Manage departments" onClick={() => navigate('/admin/depts')} />
              <QuickAction icon="stethoscope" label="Manage doctors"   onClick={() => navigate('/admin/docs')} />
              <QuickAction icon="sparkle"     label="Doctor performance" onClick={() => navigate('/admin/performance')} />
              <QuickAction icon="chart"       label="Analytics"        onClick={() => navigate('/admin/analytics')} />
            </div>
          </SectionCard>
        </div>
      </div>
    </DeskShell>
  )
})
