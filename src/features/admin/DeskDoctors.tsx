import { memo, useState } from 'react'
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
import { useAdminActions, useAdminDoctors } from '@/hooks/useAdmin'

export default memo(function DeskDoctors() {
  const { data: doctors, isLoading } = useAdminDoctors();
  useAdminActions();
  const [search, setSearch] = useState('');

  const displayDocs = doctors ?? [];
  const getDoctorName = (doctor: (typeof displayDocs)[number]) => doctor.fullName;
  
  const filteredDocs = displayDocs.filter(d => 
    getDoctorName(d).toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DeskShell active="docs">
      <DeskTopbar
        title="Doctors"
        subtitle={`${filteredDocs.length} total`}
        actions={<>
          <div style={{ width: 240 }}>
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors…" 
              icon="search" 
            />
          </div>
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
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[200, 120, 140, 60, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : filteredDocs.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState icon="stethoscope" title="No doctors found" body="Create a doctor profile after assigning a user the doctor role." /></td></tr>
                  )
                : filteredDocs.map(d => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={getDoctorName(d)} size={28} tone="primary" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{getDoctorName(d)}</div>
                            <div style={{ fontSize: 11, color: MB.text3 }}>{d.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{d.departmentName}</Td>
                      <Td>{d.specialization || 'Specialist'}</Td>
                      <Td align="right">-</Td>
                      <Td><StatusPill status={d.acceptingNew ? 'ACTIVE' : 'INACTIVE'} /></Td>
                      <Td>
                        <RowMenu 
                          aria-label={`Actions for ${getDoctorName(d)}`}
                          // In a real app, options like "Revoke Sessions" would be here
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
