import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Input } from '@/components/forms/Input'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import type { DoctorProfile } from '@/types/domain'

type DocListState = 'results' | 'loading'

const DOCS: DoctorProfile[] = [
  { name: 'Dr. Sarah Chen',     email: 'sarah.chen@medibook.health',    dept: 'Cardiology',    spec: 'Cardiologist',    appts: 284, status: 'ACTIVE',   tone: 'primary' },
  { name: 'Dr. Marcus Okafor',  email: 'marcus.okafor@medibook.health', dept: 'Dermatology',   spec: 'Dermatologist',   appts: 197, status: 'ACTIVE',   tone: 'teal'    },
  { name: 'Dr. Priya Raghavan', email: 'priya.r@medibook.health',       dept: 'Pediatrics',    spec: 'Pediatrician',    appts: 341, status: 'ACTIVE',   tone: 'amber'   },
  { name: 'Dr. James Whitfield',email: 'james.w@medibook.health',       dept: 'Orthopedics',   spec: 'Orthopedic Surg.',appts: 218, status: 'ACTIVE',   tone: 'indigo'  },
  { name: 'Dr. Lina Haddad',    email: 'lina.h@medibook.health',        dept: 'Internal Med.', spec: 'Endocrinologist', appts: 132, status: 'INACTIVE', tone: 'rose'    },
]

interface DeskDoctorsProps { state?: DocListState }

export default memo(function DeskDoctors({ state = 'results' }: DeskDoctorsProps) {
  return (
    <DeskShell active="docs">
      <DeskTopbar
        title="Doctors"
        subtitle={`${DOCS.filter(d => d.status === 'ACTIVE').length} active`}
        actions={<>
          <div style={{ width: 240 }}><Input value="" placeholder="Search doctors…" icon="search" /></div>
          <Btn variant="primary" size="sm" icon="plus">Add doctor</Btn>
        </>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Doctors list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Doctor</Th>
                <Th>Department</Th>
                <Th>Specialisation</Th>
                <Th align="right">Appts (MTD)</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {state === 'loading'
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[200, 120, 140, 60, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : DOCS.map(d => (
                    <tr key={d.email} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={d.name} size={28} tone={d.tone} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{d.name}</div>
                            <div style={{ fontSize: 11, color: MB.text3 }}>{d.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{d.dept}</Td>
                      <Td>{d.spec}</Td>
                      <Td align="right">{d.appts.toLocaleString()}</Td>
                      <Td><StatusPill status={d.status} /></Td>
                      <Td><RowMenu aria-label={`Actions for ${d.name}`} /></Td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </DeskShell>
  )
})
