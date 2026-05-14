import { memo, useState, useMemo } from 'react'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Badge } from '@/components/primitives/Badge'
import { Input } from '@/components/forms/Input'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { Button } from '@/components/primitives/Button'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SoftDeleteService, type DeletedAppointment, type DeletedConsultationNote, type DeletedInvoice, type DeletedPayment } from '@/services/soft-delete.service'
import { toast } from 'sonner'

interface KpiBoxProps { label: string; value: string | number; loading?: boolean }

function KpiBox({ label, value, loading }: KpiBoxProps) {
  return (
    <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.05, marginBottom: 10 }}>
        {label}
      </div>
      {loading ? (
        <Skel h={26} w="55%" r={6} />
      ) : (
        <div style={{ fontSize: 26, fontWeight: 700, color: MB.ink, lineHeight: 1 }}>{value}</div>
      )}
    </div>
  )
}

type TabId = 'appointments' | 'notes' | 'invoices' | 'payments'

export default memo(function MobDeletedRecords() {
  const [activeTab, setActiveTab] = useState<TabId>('appointments')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const queryClient = useQueryClient()

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['soft-delete', 'stats'],
    queryFn: () => SoftDeleteService.getStats(),
  })

  // Fetch deleted appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['soft-delete', 'appointments', startDate, endDate],
    queryFn: () => SoftDeleteService.getDeletedAppointments(startDate, endDate),
  })

  // Fetch deleted consultation notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['soft-delete', 'notes', startDate, endDate],
    queryFn: () => SoftDeleteService.getDeletedConsultationNotes(startDate, endDate),
  })

  // Fetch deleted invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['soft-delete', 'invoices', startDate, endDate],
    queryFn: () => SoftDeleteService.getDeletedInvoices(startDate, endDate),
  })

  // Fetch deleted payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['soft-delete', 'payments', startDate, endDate],
    queryFn: () => SoftDeleteService.getDeletedPayments(startDate, endDate),
  })

  // Restore mutations
  const restoreAppointmentMutation = useMutation({
    mutationFn: (id: string) => SoftDeleteService.restoreAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'stats'] })
      toast.success('Appointment restored')
    },
    onError: () => toast.error('Failed to restore appointment'),
  })

  const restoreNoteMutation = useMutation({
    mutationFn: (id: string) => SoftDeleteService.restoreConsultationNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'notes'] })
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'stats'] })
      toast.success('Consultation note restored')
    },
    onError: () => toast.error('Failed to restore consultation note'),
  })

  const restoreInvoiceMutation = useMutation({
    mutationFn: (id: string) => SoftDeleteService.restoreInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'stats'] })
      toast.success('Invoice restored')
    },
    onError: () => toast.error('Failed to restore invoice'),
  })

  const restorePaymentMutation = useMutation({
    mutationFn: (id: string) => SoftDeleteService.restorePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['soft-delete', 'stats'] })
      toast.success('Payment restored')
    },
    onError: () => toast.error('Failed to restore payment'),
  })

  const isLoading = useMemo(() => {
    if (activeTab === 'appointments') return appointmentsLoading
    if (activeTab === 'notes') return notesLoading
    if (activeTab === 'invoices') return invoicesLoading
    if (activeTab === 'payments') return paymentsLoading
    return false
  }, [activeTab, appointmentsLoading, notesLoading, invoicesLoading, paymentsLoading])

  const currentData = useMemo(() => {
    if (activeTab === 'appointments') return appointments || []
    if (activeTab === 'notes') return notes || []
    if (activeTab === 'invoices') return invoices || []
    if (activeTab === 'payments') return payments || []
    return []
  }, [activeTab, appointments, notes, invoices, payments])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <DeskShell active="deleted">
      <DeskTopbar title="Deleted Records" subtitle="Restore soft-deleted records" />
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

        {/* Stats summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <KpiBox
            label="Deleted Appointments"
            value={statsLoading ? '—' : stats?.deletedAppointmentsCount ?? 0}
            loading={statsLoading}
          />
          <KpiBox
            label="Deleted Notes"
            value={statsLoading ? '—' : stats?.deletedConsultationNotesCount ?? 0}
            loading={statsLoading}
          />
          <KpiBox
            label="Deleted Invoices"
            value={statsLoading ? '—' : stats?.deletedInvoicesCount ?? 0}
            loading={statsLoading}
          />
          <KpiBox
            label="Deleted Payments"
            value={statsLoading ? '—' : stats?.deletedPaymentsCount ?? 0}
            loading={statsLoading}
          />
        </div>

        {/* Date filters */}
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MB.text3, marginBottom: 8 }}>Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MB.text3, marginBottom: 8 }}>End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
            />
          </div>
          <Button
            tone="neutral"
            size="sm"
            onClick={() => { setStartDate(''); setEndDate('') }}
          >
            Clear
          </Button>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${MB.line}`, marginBottom: 16 }}>
          {(['appointments', 'notes', 'invoices', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? MB.primary : MB.text3,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${MB.primary}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
                tab === 'appointments' ? stats?.deletedAppointmentsCount ?? 0 :
                tab === 'notes' ? stats?.deletedConsultationNotesCount ?? 0 :
                tab === 'invoices' ? stats?.deletedInvoicesCount ?? 0 :
                stats?.deletedPaymentsCount ?? 0
              })
            </button>
          ))}
        </div>

        {/* Data table */}
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          {activeTab === 'appointments' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Deleted appointments">
              <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
                <tr>
                  <Th>Patient</Th>
                  <Th>Doctor</Th>
                  <Th>Appointment Date</Th>
                  <Th>Deleted At</Th>
                  <Th>Deleted By</Th>
                  <Th width={100} />
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}><Skel w={j === 5 ? 70 : 110} h={12} /></td>
                    ))}
                  </tr>
                ))}
                {!isLoading && currentData.length === 0 && (
                  <tr><td colSpan={6}><EmptyState icon="trash" title="No deleted appointments" body="Soft-deleted appointments will appear here." /></td></tr>
                )}
                {!isLoading && (currentData as DeletedAppointment[]).map((appt) => (
                  <tr key={appt.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td>{appt.patientName}</Td>
                    <Td>{appt.doctorName}</Td>
                    <Td>{formatDate(appt.appointmentDate)}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{formatDate(appt.deletedAt)}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{appt.deletedBy}</Td>
                    <Td>
                      <Button
                        tone="success"
                        size="xs"
                        onClick={() => restoreAppointmentMutation.mutate(appt.id)}
                        disabled={restoreAppointmentMutation.isPending}
                      >
                        {restoreAppointmentMutation.isPending ? 'Restoring...' : 'Restore'}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'notes' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Deleted consultation notes">
              <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
                <tr>
                  <Th>Patient</Th>
                  <Th>Doctor</Th>
                  <Th>Note Preview</Th>
                  <Th>Deleted At</Th>
                  <Th>Deleted By</Th>
                  <Th width={100} />
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}><Skel w={j === 5 ? 70 : 110} h={12} /></td>
                    ))}
                  </tr>
                ))}
                {!isLoading && currentData.length === 0 && (
                  <tr><td colSpan={6}><EmptyState icon="trash" title="No deleted consultation notes" body="Soft-deleted notes will appear here." /></td></tr>
                )}
                {!isLoading && (currentData as DeletedConsultationNote[]).map((note) => (
                  <tr key={note.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td>{note.patientName}</Td>
                    <Td>{note.doctorName}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.noteContent.substring(0, 50)}...
                    </Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{formatDate(note.deletedAt)}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{note.deletedBy}</Td>
                    <Td>
                      <Button
                        tone="success"
                        size="xs"
                        onClick={() => restoreNoteMutation.mutate(note.id)}
                        disabled={restoreNoteMutation.isPending}
                      >
                        {restoreNoteMutation.isPending ? 'Restoring...' : 'Restore'}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'invoices' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Deleted invoices">
              <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
                <tr>
                  <Th>Invoice Number</Th>
                  <Th>Patient</Th>
                  <Th>Amount</Th>
                  <Th>Deleted At</Th>
                  <Th>Deleted By</Th>
                  <Th width={100} />
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}><Skel w={j === 5 ? 70 : 110} h={12} /></td>
                    ))}
                  </tr>
                ))}
                {!isLoading && currentData.length === 0 && (
                  <tr><td colSpan={6}><EmptyState icon="trash" title="No deleted invoices" body="Soft-deleted invoices will appear here." /></td></tr>
                )}
                {!isLoading && (currentData as DeletedInvoice[]).map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td mono>{inv.invoiceNumber}</Td>
                    <Td>{inv.patientName}</Td>
                    <Td mono>{inv.amount.toFixed(2)} {inv.currency}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{formatDate(inv.deletedAt)}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{inv.deletedBy}</Td>
                    <Td>
                      <Button
                        tone="success"
                        size="xs"
                        onClick={() => restoreInvoiceMutation.mutate(inv.id)}
                        disabled={restoreInvoiceMutation.isPending}
                      >
                        {restoreInvoiceMutation.isPending ? 'Restoring...' : 'Restore'}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'payments' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Deleted payments">
              <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
                <tr>
                  <Th>Payment ID</Th>
                  <Th>Patient</Th>
                  <Th>Amount</Th>
                  <Th>Method</Th>
                  <Th>Deleted At</Th>
                  <Th>Deleted By</Th>
                  <Th width={100} />
                </tr>
              </thead>
              <tbody>
                {isLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}><Skel w={j === 6 ? 70 : 110} h={12} /></td>
                    ))}
                  </tr>
                ))}
                {!isLoading && currentData.length === 0 && (
                  <tr><td colSpan={7}><EmptyState icon="trash" title="No deleted payments" body="Soft-deleted payments will appear here." /></td></tr>
                )}
                {!isLoading && (currentData as DeletedPayment[]).map((pay) => (
                  <tr key={pay.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    <Td mono>{pay.paymentId}</Td>
                    <Td>{pay.patientName}</Td>
                    <Td mono>{pay.amount.toFixed(2)} {pay.currency}</Td>
                    <Td><Badge tone="neutral" size="sm">{pay.paymentMethod}</Badge></Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{formatDate(pay.deletedAt)}</Td>
                    <Td style={{ fontSize: 12, color: MB.text3 }}>{pay.deletedBy}</Td>
                    <Td>
                      <Button
                        tone="success"
                        size="xs"
                        onClick={() => restorePaymentMutation.mutate(pay.id)}
                        disabled={restorePaymentMutation.isPending}
                      >
                        {restorePaymentMutation.isPending ? 'Restoring...' : 'Restore'}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DeskShell>
  )
})
