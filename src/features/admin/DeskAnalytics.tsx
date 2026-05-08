import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Badge } from '@/components/primitives/Badge'
import { useQuery } from '@tanstack/react-query'
import { AdminService } from '@/services/admin.service'
import type { DeptAnalytics } from '@/types/domain'

const STATS = [
  { label: 'Total appointments', value: '1,248', delta: '+8.2%', up: true  },
  { label: 'Completed',          value: '1,084', delta: '+6.7%', up: true  },
  { label: 'Cancellation rate',  value: '9.3%',  delta: '-1.1%', up: false },
  { label: 'No-show rate',       value: '4.4%',  delta: '+0.2%', up: false },
]

const ANALYTICS: DeptAnalytics[] = [
  { dept: 'Cardiology',    completed: 284, scheduled: 18, cancelled: 22, noshow: 8 },
  { dept: 'Dermatology',   completed: 197, scheduled: 14, cancelled: 17, noshow: 5 },
  { dept: 'Pediatrics',    completed: 341, scheduled: 24, cancelled: 28, noshow: 12 },
  { dept: 'Orthopedics',   completed: 218, scheduled: 11, cancelled: 19, noshow: 6 },
  { dept: 'Endocrinology', completed: 132, scheduled: 8,  cancelled: 11, noshow: 4 },
]

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: MB.line, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 999 }} />
    </div>
  )
}

export default memo(function DeskAnalytics() {
  const { data: health } = useQuery({ queryKey: ['system', 'health'], queryFn: AdminService.getHealth });
  const { data: version } = useQuery({ queryKey: ['system', 'version'], queryFn: AdminService.getVersion });

  const maxCompleted = Math.max(...ANALYTICS.map(a => a.completed))
  
  return (
    <DeskShell active="analytics">
      <DeskTopbar title="Analytics" subtitle="May 2026 · Month to date" />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 20 }}>
              <div style={{ fontSize: 12, color: MB.text3, marginBottom: 8 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: MB.ink, letterSpacing: -0.02 }}>{s.value}</span>
                <Badge tone={s.up ? 'success' : 'warn'} size="sm">{s.delta}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          {/* Dept breakdown */}
          <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>By department</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ANALYTICS.map(a => (
                <div key={a.dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{a.dept}</span>
                    <span style={{ fontSize: 12, color: MB.text3 }}>{a.completed} completed</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Bar value={a.completed}  max={maxCompleted} color={MB.primary} />
                    <Bar value={a.scheduled}  max={maxCompleted} color={MB.primary100} />
                    <Bar value={a.cancelled}  max={maxCompleted} color={MB.warnBg} />
                    <Bar value={a.noshow}     max={maxCompleted} color={MB.dangerBg} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${MB.line2}` }}>
              {[{ label: 'Completed', color: MB.primary }, { label: 'Scheduled', color: MB.primary100 }, { label: 'Cancelled', color: MB.warnBg }, { label: 'No-show', color: MB.dangerBg }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MB.text3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: MB.ink, margin: '0 0 20px' }}>System Status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MB.text2 }}>API Health</span>
                <Badge tone={health?.status === 'ok' ? 'success' : 'neutral'}>
                  {health?.status === 'ok' ? 'Operational' : 'Checking...'}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: MB.text2 }}>Version</span>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: MB.text3 }}>
                  {version?.build || 'v1.4.2-stable'}
                </span>
              </div>
              <div style={{ marginTop: 12, padding: 12, background: MB.bg2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, marginBottom: 4, textTransform: 'uppercase' }}>Region</div>
                <div style={{ fontSize: 13, color: MB.text }}>AWS us-east-1 (Primary)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DeskShell>
  )
})
