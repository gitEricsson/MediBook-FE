import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { Skel } from '@/components/feedback/Skel'
import type { CapacityRow } from '@/types/domain'

const ROWS: CapacityRow[] = [
  { name: 'Dr. Sarah Chen',     dept: 'Cardiology',    booked: 22, total: 28, tone: 'primary' },
  { name: 'Dr. Marcus Okafor',  dept: 'Dermatology',   booked: 19, total: 24, tone: 'teal'    },
  { name: 'Dr. Priya Raghavan', dept: 'Pediatrics',    booked: 28, total: 28, tone: 'amber'   },
  { name: 'Dr. James Whitfield',dept: 'Orthopedics',   booked: 11, total: 20, tone: 'indigo'  },
  { name: 'Dr. Lina Haddad',    dept: 'Internal Med.', booked: 8,  total: 24, tone: 'rose'    },
]

function CapacityBar({ booked, total }: { booked: number; total: number }) {
  const pct = (booked / total) * 100
  const color = pct >= 90 ? MB.danger : pct >= 70 ? MB.warn : MB.primary
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: MB.line, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: MB.text3, minWidth: 56, textAlign: 'right', fontFamily: 'var(--mb-font-mono),monospace' }}>
        {booked}/{total}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36 }}>{Math.round(pct)}%</span>
    </div>
  )
}

type CapState = 'results' | 'loading'
interface DeskCapacityProps { state?: CapState }

export default memo(function DeskCapacity({ state = 'results' }: DeskCapacityProps) {
  return (
    <DeskShell active="capacity">
      <DeskTopbar title="Capacity" subtitle="Today · May 6, 2026" />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>Doctor utilisation</span>
            <span style={{ fontSize: 12, color: MB.text3 }}>Slots booked / available today</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {state === 'loading'
              ? [...Array(5)].map((_, i) => (
                  <div key={i} style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Skel w={32} h={32} r={999} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skel w={140} h={13} />
                      <Skel w="100%" h={8} r={999} />
                    </div>
                  </div>
                ))
              : ROWS.map(r => (
                  <div key={r.name} style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line2}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <Avatar name={r.name} size={32} tone={r.tone} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: MB.text3 }}>{r.dept}</div>
                      </div>
                    </div>
                    <CapacityBar booked={r.booked} total={r.total} />
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </DeskShell>
  )
})
