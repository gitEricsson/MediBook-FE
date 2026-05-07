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
import { EmptyState } from '@/components/feedback/EmptyState'

type PSState = 'results' | 'loading' | 'empty'

const PATIENTS = [
  { name: 'Sarah Patient',  dob: 'Mar 14, 1991', mrn: '4Q-2911', dept: 'Cardiology',    last: 'May 6, 2026',  status: 'ACTIVE'   as const },
  { name: 'Marcus Lee',     dob: 'Jul 2, 1989',  mrn: '7X-1204', dept: 'Cardiology',    last: 'May 6, 2026',  status: 'SCHEDULED' as const },
  { name: 'Eleanor Park',   dob: 'Jan 28, 1965', mrn: '5M-0088', dept: 'Cardiology',    last: 'May 6, 2026',  status: 'COMPLETED' as const },
  { name: 'James Whitfield',dob: 'Nov 5, 1978',  mrn: '2R-5500', dept: 'Orthopedics',   last: 'May 6, 2026',  status: 'COMPLETED' as const },
  { name: 'Aisha Ndlovu',   dob: 'Feb 10, 1997', mrn: '9P-3341', dept: 'Cardiology',    last: 'May 6, 2026',  status: 'SCHEDULED' as const },
]

interface DeskPatientSearchProps { state?: PSState }

export default memo(function DeskPatientSearch({ state = 'results' }: DeskPatientSearchProps) {
  return (
    <DeskShell active="home">
      <DeskTopbar title="Patient search"
        actions={<Btn variant="primary" size="sm" icon="plus">New patient</Btn>} />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <Input value="" placeholder="Search by name, MRN, DOB…" icon="search" />
          </div>
          <Btn variant="secondary" size="md" icon="filter">Filter</Btn>
          <Btn variant="secondary" size="md" icon="download">Export</Btn>
        </div>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Patient list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Patient</Th>
                <Th>MRN</Th>
                <Th>Date of birth</Th>
                <Th>Department</Th>
                <Th>Last visit</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {state === 'loading' && [...Array(5)].map((_,i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                  {[...Array(7)].map((_,j) => (
                    <td key={j} style={{ padding: '12px 16px' }}><Skel w={j===0?120:80} h={12} /></td>
                  ))}
                </tr>
              ))}
              {state === 'empty' && (
                <tr><td colSpan={7}><EmptyState icon="users" title="No patients found" body="Try a different search or add a new patient." /></td></tr>
              )}
              {state === 'results' && PATIENTS.map(p => (
                <tr key={p.mrn} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={p.name} size={28} tone="primary" />
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                    </div>
                  </Td>
                  <Td mono>{p.mrn}</Td>
                  <Td>{p.dob}</Td>
                  <Td>{p.dept}</Td>
                  <Td>{p.last}</Td>
                  <Td><StatusPill status={p.status} /></Td>
                  <Td><RowMenu aria-label={`Actions for ${p.name}`} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DeskShell>
  )
})
