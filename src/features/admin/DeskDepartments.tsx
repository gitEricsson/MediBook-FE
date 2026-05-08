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
import { useAdminDepartments, useAdminActions } from '@/hooks/useAdmin'

export default memo(function DeskDepartments() {
  const { data: depts, isLoading } = useAdminDepartments();
  useAdminActions();

  // Fallback to sample data for visual stability in prototype
  const sampleDepts = [
    { id: '1', name: 'Cardiology',      code: 'CARD', docs: 12, appts: 284, isActive: true },
    { id: '2', name: 'Dermatology',     code: 'DERM', docs: 8,  appts: 197, isActive: true },
    { id: '3', name: 'Pediatrics',      code: 'PEDS', docs: 15, appts: 341, isActive: true },
    { id: '4', name: 'Orthopedics',     code: 'ORTH', docs: 10, appts: 218, isActive: true },
    { id: '5', name: 'General Surgery', code: 'GSUR', docs: 7,  appts: 88,  isActive: false },
  ];

  const displayDepts = depts && depts.length > 0 ? depts : sampleDepts;

  return (
    <DeskShell active="depts">
      <DeskTopbar
        title="Departments"
        subtitle={`${displayDepts.filter(d => d.isActive).length} active · ${displayDepts.length} total`}
        actions={<Btn variant="primary" size="sm" icon="plus">Add department</Btn>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Departments list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Department</Th>
                <Th>ID/Code</Th>
                <Th align="right">Doctors</Th>
                <Th align="right">Appts (MTD)</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[180, 60, 50, 60, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : displayDepts.map(d => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td><span style={{ fontWeight: 500 }}>{d.name}</span></Td>
                      <Td mono>{(d as any).code || d.id}</Td>
                      <Td align="right">{(d as any).docs || (d as any).doctorCount || 0}</Td>
                      <Td align="right">{(d as any).appts?.toLocaleString() || (d as any).appointmentCount || 0}</Td>
                      <Td><StatusPill status={d.isActive ? 'ACTIVE' : 'INACTIVE'} /></Td>
                      <Td>
                        <RowMenu 
                          aria-label={`Actions for ${d.name}`}
                          // In a real app, this would open a menu with edit/deactivate
                        />
                      </Td>
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
