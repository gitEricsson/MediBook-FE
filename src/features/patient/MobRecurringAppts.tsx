import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookingService } from '@/services/booking.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useViewport } from '@/hooks/useViewport'

interface SeriesEntry {
  id: number
  doctorName: string
  recurrenceType: string
  startDate: string
  endDate?: string
  status: string
  appointmentType: string
  reason?: string
}

const RECURRENCE_LABEL: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
}

const TYPE_LABEL: Record<string, string> = {
  IN_PERSON: 'In person',
  TELEHEALTH: 'Telehealth',
  TELEMEDICINE: 'Telemedicine',
}

function SeriesCard({ series, onCancel }: { series: SeriesEntry; onCancel: () => void }) {
  const isActive = series.status === 'ACTIVE'
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>Dr. {series.doctorName}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>
            {RECURRENCE_LABEL[series.recurrenceType] ?? series.recurrenceType}
            {' · '}
            {TYPE_LABEL[series.appointmentType] ?? series.appointmentType}
          </div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="calendar" size={11} color={MB.text3} />
            {new Date(series.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {series.endDate && ` — ${new Date(series.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </div>
          {series.reason && <div style={{ fontSize: 12, color: MB.text2, marginTop: 4 }}>{series.reason}</div>}
        </div>
        <Badge tone={isActive ? 'success' : 'neutral'} size="sm">{series.status}</Badge>
      </div>
      {isActive && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn variant="dangerOutline" size="sm" icon="x" onClick={onCancel}>Cancel series</Btn>
        </div>
      )}
    </Card>
  )
}

function RecurringContent() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', 'recurring', 'my'],
    queryFn: () => BookingService.getMySeries(0, 20).then((p) => p.content as SeriesEntry[]),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => BookingService.cancelSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'recurring', 'my'] })
      toast.success('Recurring series cancelled')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to cancel series'),
  })

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isLoading && [...Array(3)].map((_, i) => <Skel key={i} h={120} w="100%" r={12} />)}
      {isError && <div style={{ textAlign: 'center', padding: 32 }}><Btn variant="secondary" size="sm" onClick={() => refetch()}>Retry</Btn></div>}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState icon="calendar" title="No recurring appointments" body="Book a recurring series through a doctor's profile to see them here." />
      )}
      {!isLoading && !isError && data && data.length > 0 && data.map((s) => (
        <SeriesCard key={s.id} series={s} onCancel={() => cancelMutation.mutate(String(s.id))} />
      ))}
    </div>
  )
}

export default memo(function MobRecurringAppts() {
  const { isWide } = useViewport()
  return isWide ? (
    <PatientShell title="Recurring appointments">
      <div style={{ flex: 1, padding: 28, maxWidth: 640 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Recurring appointments</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: MB.text2 }}>Your active recurring series.</p>
        <RecurringContent />
      </div>
    </PatientShell>
  ) : (
    <MobScreen>
      <MobTopBar title="Recurring appointments" back />
      <RecurringContent />
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
