import { memo, useMemo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminService, type AdminLeave } from '@/services/admin.service'
import { SlotBlocksService, type SlotBlockResponse } from '@/services/slot-blocks.service'
import { parseApiError } from '@/lib/api/contracts'
import { Icon } from '@/components/primitives/Icon'

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL',      label: 'All'      },
]

function statusTone(s: AdminLeave['status']): 'warn' | 'success' | 'danger' {
  if (s === 'APPROVED') return 'success'
  if (s === 'REJECTED') return 'danger'
  return 'warn'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function inclusiveDays(startIso: string, endIso: string) {
  const start = new Date(startIso); start.setHours(0, 0, 0, 0)
  const end   = new Date(endIso);   end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

type Tab = 'leaves' | 'blocks'

export default memo(function DeskLeaves() {
  const [tab, setTab] = useState<Tab>('leaves')
  const [status, setStatus] = useState<StatusFilter>('PENDING')
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'leaves', status],
    queryFn: () => status === 'PENDING'
      ? AdminService.getPendingLeaves()
      : AdminService.listLeaves(status === 'ALL' ? undefined : status),
  })

  // Sort: pending first (oldest first to clear backlog), then by start date.
  const rows = useMemo(() => {
    const list = [...(data ?? [])]
    return list.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1
      return a.startDate.localeCompare(b.startDate)
    })
  }, [data])

  // Counts for the tab labels — quick visual signal of how big the queue is.
  const pendingCount = useMemo(
    () => (data ?? []).filter((r) => r.status === 'PENDING').length,
    [data],
  )

  const approveMutation = useMutation({
    mutationFn: AdminService.approveLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leaves'] })
      toast.success('Leave approved')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not approve leave'),
  })

  const rejectMutation = useMutation({
    mutationFn: AdminService.rejectLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leaves'] })
      toast.success('Leave rejected')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not reject leave'),
  })

  return (
    <DeskShell active="leaves">
      <DeskTopbar
        title={tab === 'leaves' ? 'Leave requests' : 'Ad-hoc slot blocks'}
        subtitle={tab === 'leaves'
          ? (status === 'PENDING' ? `${pendingCount} awaiting review` : `Filtered: ${status.toLowerCase()}`)
          : 'Time blocks declared directly on the schedule (not full-day leave)'}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: MB.bg2, borderRadius: 8, padding: 4 }}>
              <button onClick={() => setTab('leaves')}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: tab === 'leaves' ? MB.bg : 'transparent', color: tab === 'leaves' ? MB.text : MB.text3, fontFamily: 'inherit',
                }}>
                Leave requests
              </button>
              <button onClick={() => setTab('blocks')}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: tab === 'blocks' ? MB.bg : 'transparent', color: tab === 'blocks' ? MB.text : MB.text3, fontFamily: 'inherit',
                }}>
                Slot blocks
              </button>
            </div>
            {tab === 'leaves' && (
              <div style={{ display: 'flex', gap: 4, background: MB.bg2, borderRadius: 8, padding: 4 }}>
                {STATUS_TABS.map((t) => (
                  <button key={t.key} onClick={() => setStatus(t.key)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: status === t.key ? MB.bg : 'transparent',
                      color: status === t.key ? MB.text : MB.text3,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {tab === 'blocks' && <AdminBlocksTab />}

      {tab === 'leaves' && (
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Doctor leave requests">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Doctor</Th>
                <Th>Type</Th>
                <Th>Dates</Th>
                <Th align="right">Days</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Reviewed</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[180, 80, 120, 30, 200, 70, 120, 120].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : isError
                ? <tr><td colSpan={8}><ErrorState title="Couldn't load leave requests" onRetry={() => refetch()} /></td></tr>
                : rows.length === 0
                ? <tr><td colSpan={8}><EmptyState icon="calendar" title="No leave requests"
                    body={status === 'PENDING' ? 'Nothing awaiting review.' : 'Try a different filter.'} /></td></tr>
                : rows.map((r) => {
                    const days = inclusiveDays(r.startDate, r.endDate)
                    const isPending = r.status === 'PENDING'
                    return (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                        <Td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={r.doctorName ?? `Doctor #${r.doctorId}`} size={28} tone="primary" />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>
                                Dr. {r.doctorName ?? r.doctorId}
                              </div>
                              <div style={{ fontSize: 11, color: MB.text3 }}>
                                {r.departmentName ?? '—'}
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <Badge tone="neutral" size="sm">{r.leaveType.toLowerCase()}</Badge>
                        </Td>
                        <Td>
                          <div style={{ fontSize: 13, color: MB.text }}>{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</div>
                        </Td>
                        <Td align="right">{days}</Td>
                        <Td>
                          <div style={{ fontSize: 12, color: MB.text2, maxWidth: 320, whiteSpace: 'pre-wrap' }}>
                            {r.reason || '—'}
                          </div>
                        </Td>
                        <Td>
                          <Badge tone={statusTone(r.status)} size="sm">{r.status.toLowerCase()}</Badge>
                        </Td>
                        <Td>
                          <div style={{ fontSize: 12, color: MB.text2 }}>
                            {r.reviewedAt
                              ? <>
                                  <div>{new Date(r.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                  {r.reviewedByName && <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>by {r.reviewedByName}</div>}
                                </>
                              : '—'}
                          </div>
                        </Td>
                        <Td align="right">
                          {isPending ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <Btn variant="primary" size="sm" loading={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(r.id)}>Approve</Btn>
                              <Btn variant="dangerOutline" size="sm" loading={rejectMutation.isPending}
                                onClick={() => rejectMutation.mutate(r.id)}>Reject</Btn>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: MB.text3 }}>—</span>
                          )}
                        </Td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
      )}
    </DeskShell>
  )
})

// ── Slot-blocks audit tab ───────────────────────────────────────────────────

function defaultWindow() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today); start.setDate(today.getDate() - 7)
  const end   = new Date(today); end.setDate(today.getDate() + 30)
  const iso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { from: iso(start), to: iso(end) }
}

function AdminBlocksTab() {
  const queryClient = useQueryClient()
  const [{ from, to }, setRange] = useState(defaultWindow)

  const { data: blocks, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'slot-blocks', from, to],
    queryFn: () => SlotBlocksService.listAdmin(from, to),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => SlotBlocksService.removeAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'slot-blocks'] })
      toast.success('Block removed')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Could not remove block'),
  })

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12 }}>
        <Icon name="calendar" size={16} color={MB.text3} />
        <span style={{ fontSize: 13, color: MB.text3 }}>Date window</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          style={{ height: 32, padding: '0 10px', borderRadius: 6, border: `1px solid ${MB.line}`, fontSize: 13, fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 13, color: MB.text3 }}>to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          style={{ height: 32, padding: '0 10px', borderRadius: 6, border: `1px solid ${MB.line}`, fontSize: 13, fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 12, color: MB.text3, marginLeft: 'auto' }}>
          {blocks?.length ?? 0} block{(blocks?.length ?? 0) === 1 ? '' : 's'}
        </span>
      </div>

      <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Slot blocks">
          <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
            <tr>
              <Th>Doctor</Th>
              <Th>Date</Th>
              <Th>Window</Th>
              <Th>Reason</Th>
              <Th>Created</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    {[180, 100, 120, 240, 120, 80].map((w, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                    ))}
                  </tr>
                ))
              : isError
              ? <tr><td colSpan={6}><ErrorState title="Couldn't load slot blocks" onRetry={() => refetch()} /></td></tr>
              : (blocks ?? []).length === 0
              ? <tr><td colSpan={6}><EmptyState icon="calendar" title="No slot blocks"
                  body="Doctors haven't blocked any time in this window." /></td></tr>
              : (blocks ?? []).map((b: SlotBlockResponse) => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={b.doctorName ?? `Doctor #${b.doctorId ?? ''}`} size={28} tone="primary" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>Dr. {b.doctorName ?? b.doctorId}</div>
                          <div style={{ fontSize: 11, color: MB.text3 }}>{b.departmentName ?? '—'}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{new Date(b.blockDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Td>
                    <Td>{b.startTime}–{b.endTime}</Td>
                    <Td>
                      <div style={{ fontSize: 12, color: MB.text2, maxWidth: 360, whiteSpace: 'pre-wrap' }}>{b.reason}</div>
                    </Td>
                    <Td>
                      <div style={{ fontSize: 12, color: MB.text2 }}>
                        {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {b.createdByName && <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>by {b.createdByName}</div>}
                      </div>
                    </Td>
                    <Td align="right">
                      <Btn variant="dangerOutline" size="sm"
                        loading={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(b.id)}>
                        Remove
                      </Btn>
                    </Td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
