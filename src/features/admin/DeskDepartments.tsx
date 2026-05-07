import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import type { Department } from '@/types/domain'

type DeptState = 'results' | 'loading'

const DEPTS: Department[] = [
  { name: 'Cardiology',      code: 'CARD', docs: 12, appts: 284, status: 'ACTIVE'   },
  { name: 'Dermatology',     code: 'DERM', docs: 8,  appts: 197, status: 'ACTIVE'   },
  { name: 'Pediatrics',      code: 'PEDS', docs: 15, appts: 341, status: 'ACTIVE'   },
  { name: 'Orthopedics',     code: 'ORTH', docs: 10, appts: 218, status: 'ACTIVE'   },
  { name: 'Endocrinology',   code: 'ENDO', docs: 6,  appts: 132, status: 'ACTIVE'   },
  { name: 'Neurology',       code: 'NEUR', docs: 9,  appts: 176, status: 'ACTIVE'   },
  { name: 'General Surgery', code: 'GSUR', docs: 7,  appts: 88,  status: 'INACTIVE' },
]

interface DeskDepartmentsProps { state?: DeptState }

export default memo(function DeskDepartments({ state = 'results' }: DeskDepartmentsProps) {
  return (
    <DeskShell active="depts">
      <DeskTopbar
        title="Departments"
        subtitle={`${DEPTS.filter(d => d.status === 'ACTIVE').length} active · ${DEPTS.length} total`}
        actions={<Btn variant="primary" size="sm" icon="plus">Add department</Btn>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Departments list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Department</Th>
                <Th>Code</Th>
                <Th align="right">Doctors</Th>
                <Th align="right">Appts (MTD)</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {state === 'loading'
                ? [...Array(7)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[180, 60, 50, 60, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : DEPTS.map(d => (
                    <tr key={d.code} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td><span style={{ fontWeight: 500 }}>{d.name}</span></Td>
                      <Td mono>{d.code}</Td>
                      <Td align="right">{d.docs}</Td>
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
