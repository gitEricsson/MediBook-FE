import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Btn } from '@/components/primitives/Btn'
import { Skel } from '@/components/feedback/Skel'
import type { AvatarTone } from '@/types/domain'

type DSState = 'results' | 'loading'

const WEEK_SLOTS: Record<string, string[]> = {
  '9:00':  ['P', 'P', 'P', '—', 'P'],
  '9:30':  ['P', 'P', 'P', 'P', 'P'],
  '10:00': ['P', '—', '—', 'P', '—'],
  '10:30': ['P', 'P', 'P', 'P', 'P'],
  '11:00': ['P', 'P', '—', 'P', 'P'],
}

const DOCS: { name: string; tone: AvatarTone }[] = [
  { name: 'Dr. Sarah Chen',    tone: 'primary' },
  { name: 'Dr. Marcus Okafor', tone: 'teal'    },
  { name: 'Dr. Priya Raghavan',tone: 'amber'   },
]

interface DeskDoctorScheduleProps { state?: DSState }

export default memo(function DeskDoctorSchedule({ state = 'results' }: DeskDoctorScheduleProps) {
  return (
    <DeskShell active="schedule">
      <DeskTopbar title="Doctor schedules" subtitle="Week of May 5 – 11, 2026"
        actions={<>
          <Btn variant="secondary" size="sm" icon="chevronLeft" aria-label="Previous week" />
          <Btn variant="secondary" size="sm" icon="chevronRight" aria-label="Next week" />
          <Btn variant="primary"   size="sm" icon="plus">Add block</Btn>
        </>} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {DOCS.map(doc => (
          <div key={doc.name} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Avatar name={doc.name} size={28} tone={doc.tone} />
              <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{doc.name}</span>
              <StatusPill status="ACTIVE" />
            </div>
            <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label={`Schedule for ${doc.name}`}>
                <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
                  <tr>
                    <Th width={80}>Time</Th>
                    {['Mon','Tue','Wed','Thu','Fri'].map(d => <Th key={d} align="center">{d}</Th>)}
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {state === 'loading' ? [...Array(5)].map((_,i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[...Array(7)].map((_,j) => <td key={j} style={{ padding: '10px 16px' }}><Skel w={40} h={12} /></td>)}
                    </tr>
                  )) : Object.entries(WEEK_SLOTS).map(([time, slots]) => (
                    <tr key={time} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td mono>{time}</Td>
                      {slots.map((s, i) => (
                        <Td key={i} align="center">
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: s === 'P' ? MB.primary50 : MB.bg3, color: s === 'P' ? MB.primary600 : MB.text4 }}>{s}</span>
                        </Td>
                      ))}
                      <Td align="right"><RowMenu aria-label={`Slot ${time} actions`} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </DeskShell>
  )
})
