import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Badge } from '@/components/primitives/Badge'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { unwrapApiResponse } from '@/lib/api/contracts'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useViewport } from '@/hooks/useViewport'

type LeaveType = 'PERSONAL' | 'SICK' | 'CONFERENCE' | 'HOLIDAY'

interface DoctorLeave {
  id: number
  startDate: string
  endDate: string
  reason?: string
  leaveType: LeaveType
  status: string
}

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  PERSONAL: 'Personal',
  SICK: 'Sick leave',
  CONFERENCE: 'Conference',
  HOLIDAY: 'Holiday',
}

const STATUS_TONE: Record<string, 'primary' | 'warn' | 'neutral' | 'success'> = {
  PENDING: 'warn',
  APPROVED: 'success',
  REJECTED: 'neutral',
}

function AddLeaveDialog({ doctorId, onClose }: { doctorId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [leaveType, setLeaveType] = useState<LeaveType>('PERSONAL')

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/api/v1/doctors/${doctorId}/leaves`, {
        startDate,
        endDate,
        reason,
        leaveType,
      })
      return unwrapApiResponse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'leaves', doctorId] })
      toast.success('Leave request submitted')
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to submit leave request'),
  })

  const valid = startDate && endDate && endDate >= startDate

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: MB.bg, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: MB.ink }}>Request leave</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Leave type" htmlFor="lt-type">
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              id="lt-type"
              style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${MB.line}`, background: MB.bg, padding: '0 12px', fontSize: 14, color: MB.text, fontFamily: 'inherit' }}>
              {Object.entries(LEAVE_TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Start date" htmlFor="lt-start">
              <Input id="lt-start" type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="YYYY-MM-DD" />
            </Field>
            <Field label="End date" htmlFor="lt-end">
              <Input id="lt-end" type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="YYYY-MM-DD" />
            </Field>
          </div>
          <Field label="Reason (optional)" htmlFor="lt-reason">
            <Input id="lt-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" style={{ flex: 1.5 }} disabled={!valid} loading={mutation.isPending} onClick={() => mutation.mutate()}>Submit</Btn>
        </div>
      </div>
    </div>
  )
}

function LeaveCard({ leave }: { leave: DoctorLeave }) {
  const start = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{LEAVE_TYPE_LABEL[leave.leaveType] ?? leave.leaveType}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{start} — {end}</div>
          {leave.reason && <div style={{ fontSize: 12, color: MB.text2, marginTop: 4 }}>{leave.reason}</div>}
        </div>
        <Badge tone={STATUS_TONE[leave.status] ?? 'neutral'} size="sm">{leave.status}</Badge>
      </div>
    </Card>
  )
}

function LeaveContent({ doctorId }: { doctorId: string }) {
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctor', 'leaves', doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/doctors/${doctorId}/leaves`)
      return unwrapApiResponse<DoctorLeave[]>(response.data)
    },
    enabled: !!doctorId,
  })

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>Leave schedule</div>
          <div style={{ fontSize: 12, color: MB.text3 }}>Approved leaves block booking slots automatically.</div>
        </div>
        <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowAdd(true)}>Request leave</Btn>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map((i) => <Skel key={i} h={70} w="100%" r={12} />)}
        </div>
      )}
      {isError && <div style={{ color: MB.danger, fontSize: 13 }}>Failed to load leave records.</div>}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState icon="calendar" title="No leave records" body="Your approved and pending leave periods will appear here." />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((leave) => <LeaveCard key={leave.id} leave={leave} />)}
        </div>
      )}

      {showAdd && <AddLeaveDialog doctorId={doctorId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

export default memo(function MobDocLeave() {
  const { isWide } = useViewport()
  const user = useAuthStore((s) => s.user)
  const doctorId = user?.id ?? ''

  if (isWide) {
    return (
      <DeskShell active="leave">
        <DeskTopbar title="Leave management" subtitle="Block out dates when you're unavailable" />
        <LeaveContent doctorId={doctorId} />
      </DeskShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Leave management" back />
      <LeaveContent doctorId={doctorId} />
    </MobScreen>
  )
})
