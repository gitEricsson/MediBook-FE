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
import { useAdminUsers, useAdminActions } from '@/hooks/useAdmin'

export default memo(function DeskDoctors() {
  const { data: users, isLoading } = useAdminUsers();
  useAdminActions();
  const [search, setSearch] = useState('');

  // Fallback to sample data for visual stability in prototype
  const sampleDocs = [
    { id: '1', name: 'Dr. Sarah Chen',     email: 'sarah.chen@medibook.health',    dept: 'Cardiology',    spec: 'Cardiologist',    appts: 284, status: 'ACTIVE',   tone: 'primary' },
    { id: '2', name: 'Dr. Marcus Okafor',  email: 'marcus.okafor@medibook.health', dept: 'Dermatology',   spec: 'Dermatologist',   appts: 197, status: 'ACTIVE',   tone: 'teal'    },
    { id: '3', name: 'Dr. Priya Raghavan', email: 'priya.r@medibook.health',       dept: 'Pediatrics',    spec: 'Pediatrician',    appts: 341, status: 'ACTIVE',   tone: 'amber'   },
    { id: '4', name: 'Dr. James Whitfield',email: 'james.w@medibook.health',       dept: 'Orthopedics',   spec: 'Orthopedic Surg.',appts: 218, status: 'ACTIVE',   tone: 'indigo'  },
  ];

  // Filter users who are doctors
  const doctors = users ? users.filter(u => u.role === 'doctor') : [];
  const displayDocs = doctors.length > 0 ? doctors : sampleDocs;
  const getDoctorName = (doctor: (typeof displayDocs)[number]) =>
    (doctor as any).name || `${(doctor as any).firstName ?? ''} ${(doctor as any).lastName ?? ''}`.trim();
  
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
                : filteredDocs.map(d => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={getDoctorName(d)} size={28} tone={(d as any).tone || 'primary'} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{getDoctorName(d)}</div>
                            <div style={{ fontSize: 11, color: MB.text3 }}>{d.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{(d as any).dept || 'Cardiology'}</Td>
                      <Td>{(d as any).spec || 'Specialist'}</Td>
                      <Td align="right">{((d as any).appts || 0).toLocaleString()}</Td>
                      <Td><StatusPill status={(d as any).status || 'ACTIVE'} /></Td>
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
