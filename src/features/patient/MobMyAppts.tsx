import { memo, useState, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Card } from '@/components/primitives/Card'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useMyAppointments, useMyAppointmentsCursor } from '@/hooks/useAppointments'
import { BookingService } from '@/services/booking.service'
import { AppointmentsService } from '@/services/appointments.service'
import { ChatService } from '@/services/chat.service'
import { TelemedicineService } from '@/services/telemedicine.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useViewport } from '@/hooks/useViewport'
import { parseApiError } from '@/lib/api/contracts'
import type { Appointment } from '@/types/api'

// ── Shared helpers ────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

function useApptActions(appt: Appointment, onCancel?: () => void) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const cancelMutation = useMutation({
    mutationFn: (id: string) => BookingService.cancel(id, 'Cancelled by patient'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'my'] })
      toast.success('Appointment cancelled')
      onCancel?.()
    },
    onError: () => toast.error('Could not cancel — please try again'),
  })

  const downloadICS = async () => {
    try {
      const blob = await AppointmentsService.getCalendarIcs(String(appt.id))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `appointment-${appt.id}.ics`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Could not download calendar file.') }
  }

  const isCancelable = appt.status === 'CONFIRMED' || appt.status === 'PENDING'

  return { isCancelable, confirmCancel, setConfirmCancel, cancelMutation, downloadICS, navigate }
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function ApptSkel() {
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Skel w={48} h={52} r={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skel w="50%" h={14} /><Skel w="80%" h={12} /><Skel w="60%" h={10} />
        </div>
      </div>
    </Card>
  )
}

function ApptCard({ appt }: { appt: Appointment }) {
  const { isCancelable, confirmCancel, setConfirmCancel, cancelMutation, downloadICS, navigate } = useApptActions(appt)
  const { month, day, time } = formatDate(appt.scheduledAt)
  const scheduled = new Date(appt.scheduledAt)

  // Click handler attached at the Card level so the entire surface opens the
  // consultation detail. Action blocks below are wrapped in <div onClick=stop>
  // so their buttons keep their inline semantics (cancel, pay, chat, rate,
  // etc.) without bubbling up to trigger navigation.
  const openDetail = () => navigate(`/patient/appt/${appt.id}`)
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <Card padding={14} interactive onClick={openDetail}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 48, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: MB.primary50, color: MB.primary600, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>{month}</div>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{day}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{time}</span>
            <StatusPill status={appt.status} />
          </div>
          <div style={{ fontSize: 13, color: MB.text2 }}>{appt.doctorName || 'Doctor'}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{appt.departmentName || '—'}</div>
          {(appt.type === 'TELEMEDICINE' || appt.type === 'TELEHEALTH') && (
            <div style={{ marginTop: 4 }}><span style={{ fontSize: 11, background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>Telemedicine</span></div>
          )}
        </div>
        <Icon name="chevronRight" size={16} color={MB.text4} style={{ alignSelf: 'center' }} />
      </div>
      {/* PENDING (unpaid) — primary CTA is finish payment. We don't show Chat/Video
          buttons here because the backend rejects them with APPOINTMENT_NOT_CONFIRMED. */}
      {appt.status === 'PENDING' && (
        <div onClick={stop} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MB.line2}` }}>
          <Btn
            variant="primary"
            size="sm"
            icon="creditCard"
            full
            onClick={() => navigate(`/patient/pay/${appt.id}`)}
          >
            Complete payment to confirm
          </Btn>
          <div style={{ fontSize: 11, color: MB.text3, marginTop: 6, textAlign: 'center' }}>
            Unpaid slots are auto-released after 30 min.
          </div>
        </div>
      )}
      {(isCancelable || appt.status === 'CONFIRMED' || appt.status === 'COMPLETED') && (
        <>
          {/* TODO[REMOVE-BEFORE-PROD]: Chat + video row was restricted to CONFIRMED only;
              widened to CONFIRMED + PENDING for local testing so chat is discoverable
              without a real payment flow. Before shipping, revert this condition to
              `appt.status === 'CONFIRMED'` and re-enable the matching backend gate in
              ChatService.createConversation. See also MobDocApptDetail. */}
          {(appt.status === 'CONFIRMED' || appt.status === 'PENDING') && (
            <div onClick={stop} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', gap: 8 }}>
              <Btn
                variant="secondary"
                size="sm"
                icon="sparkle"
                style={{ flex: 1 }}
                onClick={async () => {
                  try {
                    const c = await ChatService.createConversation(Number(appt.id))
                    navigate(`/patient/chat/${c.id}`)
                  } catch {
                    toast.error('Unable to open chat right now.')
                  }
                }}
              >
                Chat & AI
              </Btn>
              {(appt.type === 'TELEMEDICINE' || appt.type === 'TELEHEALTH') && (
                <Btn
                  variant="primary"
                  size="sm"
                  icon="video"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    try {
                      const s = await TelemedicineService.startVideoCall(Number(appt.id))
                      navigate(`/patient/telemedicine/${s.sessionId}`)
                    } catch (err) {
                      const code = (err as { errorCode?: string })?.errorCode
                      if (code === 'APPOINTMENT_NOT_CONFIRMED') {
                        toast.error('Complete payment to join the call.')
                      } else if (code === 'TELEMEDICINE_NOT_CONFIGURED') {
                        toast.error('Telemedicine is not enabled on this environment.')
                      } else {
                        toast.error('Unable to start video call.')
                      }
                    }
                  }}
                >
                  Join call
                </Btn>
              )}
            </div>
          )}
          <div onClick={stop} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" icon="download" style={{ flex: 1 }} onClick={downloadICS}>Calendar</Btn>
            {isCancelable && (
              <>
                <Btn variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => navigate(`/patient/doctor/${appt.doctorId}`, { state: { reschedule: true, appointmentId: appt.id } })}>Reschedule</Btn>
                <Btn variant="secondary" size="sm" style={{ flex: 1, color: MB.danger }} loading={cancelMutation.isPending} onClick={() => setConfirmCancel(true)}>Cancel</Btn>
              </>
            )}
          </div>
        </>
      )}
      {confirmCancel && (
        <div role="dialog" aria-modal="true" onClick={stop} style={{ marginTop: 12, padding: 12, background: MB.dangerBg, borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: MB.danger, fontWeight: 600, marginBottom: 4 }}>Cancel this appointment?</div>
          <div style={{ fontSize: 12, color: MB.danger, opacity: 0.8, marginBottom: 10 }}>
            {appt.doctorName} · {time} · {scheduled.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => setConfirmCancel(false)}>Keep</Btn>
            <Btn variant="primary" danger size="sm" style={{ flex: 1 }} loading={cancelMutation.isPending}
              onClick={() => { cancelMutation.mutate(String(appt.id)); setConfirmCancel(false) }}>
              Yes, cancel
            </Btn>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Desktop table row ─────────────────────────────────────────────────────────
function ApptTableRow({ appt, last }: { appt: Appointment; last?: boolean }) {
  const { isCancelable, confirmCancel, setConfirmCancel, cancelMutation, downloadICS, navigate } = useApptActions(appt)
  const { full, time } = formatDate(appt.scheduledAt)
  const scheduled = new Date(appt.scheduledAt)

  return (
    <>
      <tr
        onClick={() => navigate(`/patient/appt/${appt.id}`)}
        style={{ cursor: 'pointer', borderBottom: last && !confirmCancel ? 'none' : `1px solid ${MB.line2}` }}>
        <td
          style={{ padding: '14px 20px', fontSize: 13, color: MB.text, fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          <div>{full}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{time}</div>
        </td>
        <td style={{ padding: '14px 16px', fontSize: 13 }}>
          <div style={{ fontWeight: 600, color: MB.text }}>{appt.doctorName || 'Doctor'}</div>
          <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{appt.departmentName || '—'}</div>
        </td>
        <td style={{ padding: '14px 16px', fontSize: 13, color: MB.text2 }}>
          {appt.reason || '—'}
          {(appt.type === 'TELEMEDICINE' || appt.type === 'TELEHEALTH') && (
            <div><span style={{ fontSize: 11, background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 999, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>Telehealth</span></div>
          )}
        </td>
        <td style={{ padding: '14px 16px' }}><StatusPill status={appt.status} /></td>
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={downloadICS} title="Add to calendar" style={{ width: 32, height: 32, border: `1px solid ${MB.line}`, borderRadius: 7, background: MB.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="download" size={14} color={MB.text3} />
            </button>
            {isCancelable && (
              <>
                <Btn variant="secondary" size="sm"
                  onClick={() => navigate(`/patient/doctor/${appt.doctorId}`, { state: { reschedule: true, appointmentId: appt.id } })}>
                  Reschedule
                </Btn>
                <Btn variant="dangerOutline" size="sm" loading={cancelMutation.isPending} onClick={() => setConfirmCancel(true)}>
                  Cancel
                </Btn>
              </>
            )}
          </div>
        </td>
      </tr>
      {confirmCancel && (
        <tr>
          <td colSpan={5} style={{ padding: '0 20px 16px' }}>
            <div style={{ padding: 14, background: MB.dangerBg, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: MB.danger, fontWeight: 600 }}>Cancel this appointment?</div>
                <div style={{ fontSize: 12, color: MB.danger, opacity: 0.8, marginTop: 2 }}>
                  {appt.doctorName} · {time} · {scheduled.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <Btn variant="secondary" size="sm" onClick={() => setConfirmCancel(false)}>Keep</Btn>
              <Btn variant="primary" danger size="sm" loading={cancelMutation.isPending}
                onClick={() => { cancelMutation.mutate(String(appt.id)); setConfirmCancel(false) }}>
                Yes, cancel
              </Btn>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Tab bar (shared) ──────────────────────────────────────────────────────────
type Tab = 'upcoming' | 'past'

function TabBar({
  tab, setTab, upcomingCount, pastCount, style,
}: { tab: Tab; setTab: (t: Tab) => void; upcomingCount?: number; pastCount?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', gap: 0, ...style }} role="tablist">
      {([['Upcoming', 'upcoming', upcomingCount], ['Past', 'past', pastCount]] as const).map(([label, id, count]) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
          style={{
            padding: '12px 16px', background: 'transparent',
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            borderBottom: `2px solid ${tab === id ? MB.primary : 'transparent'}`,
            fontSize: 14, fontWeight: 600, color: tab === id ? MB.primary : MB.text3,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}>
          {label}
          {count != null && <span style={{ fontSize: 11, fontWeight: 500, color: MB.text3 }}>{count}</span>}
        </button>
      ))}
    </div>
  )
}

// ── Desktop layout ────────────────────────────────────────────────────────────
function DesktopMyAppts() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('upcoming')
  const { data, isLoading, isError, refetch } = useMyAppointments(tab)
  const { data: upcomingData } = useMyAppointments('upcoming')
  const { data: pastData } = useMyAppointments('past')

  return (
    <PatientShell title="My visits" actions={
      <Btn variant="primary" size="sm" icon="search" onClick={() => navigate('/patient/search')}>Book appointment</Btn>
    }>
      <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tabs */}
        <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <div style={{ padding: '0 20px', borderBottom: `1px solid ${MB.line2}` }}>
            <TabBar tab={tab} setTab={setTab} upcomingCount={upcomingData?.length} pastCount={pastData?.length} />
          </div>

          {/* Loading */}
          {isLoading && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[0, 1, 2, 3].map((i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                    {[160, 180, 200, 100, 120].map((w) => (
                      <td key={w} style={{ padding: '14px 16px' }}><Skel w={w} h={13} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Error */}
          {isError && <div style={{ padding: 32 }}><ErrorState title="Couldn't load your visits" onRetry={() => refetch()} /></div>}

          {/* Empty */}
          {!isLoading && !isError && (!data || data.length === 0) && (
            <div style={{ padding: 48 }}>
              <EmptyState icon="calendar"
                title={tab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
                body="When you book a doctor, your appointments will appear here."
                action={tab === 'upcoming' ? <Btn size="sm" icon="search" style={{ marginTop: 8 }} onClick={() => navigate('/patient/search')}>Find a doctor</Btn> : undefined}
              />
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && data && data.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
                    {['Date & Time', 'Doctor', 'Reason', 'Status', ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 20px', textAlign: i === 4 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: MB.text3, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h === '' ? null : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((a, i) => (
                    <ApptTableRow key={a.id} appt={a} last={i === data.length - 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PatientShell>
  )
}

// ── Mobile layout (cursor-paginated infinite scroll) ─────────────────────────
function MobileMyAppts() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const navigate = useNavigate()

  // Use cursor pagination for infinite scroll on mobile
  const {
    data: pages,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyAppointmentsCursor(tab)

  // Counts for tab badges — use lightweight offset queries
  const { data: upcomingData } = useMyAppointments('upcoming')
  const { data: pastData } = useMyAppointments('past')

  const allItems = pages?.pages.flatMap((p) => p.items) ?? []

  // Scroll sentinel to trigger next page load
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelNode || document.getElementById('appts-sentinel') as HTMLDivElement | null
    if (!sentinel) return

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, { threshold: 0.1 })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, sentinelNode])

  return (
    <MobScreen>
      <MobTopBar title="My visits" right={
        <button className="mb-icon-btn" aria-label="Notifications" onClick={() => navigate('/patient/notifications')}>
          <Icon name="bell" size={18} color={MB.text} />
        </button>
      } />
      <div style={{ background: MB.bg, padding: '0 16px', borderBottom: `1px solid ${MB.line2}` }}>
        <TabBar tab={tab} setTab={setTab} upcomingCount={upcomingData?.length} pastCount={pastData?.length} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {isLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[0, 1, 2].map((i) => <ApptSkel key={i} />)}</div>}
        {isError && <ErrorState title="Couldn't load your visits" onRetry={() => refetch()} />}
        {!isLoading && !isError && allItems.length === 0 && (
          <EmptyState icon="calendar" title={tab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
            body="When you book a doctor, your appointments will appear here."
            action={tab === 'upcoming' ? <Btn size="sm" icon="search" style={{ marginTop: 8 }} onClick={() => navigate('/patient/search')}>Find a doctor</Btn> : undefined} />
        )}
        {!isLoading && !isError && allItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allItems.map((a) => (
              <ApptCard key={a.id} appt={a} />
            ))}
            {/* Infinite scroll sentinel */}
            <div id="appts-sentinel" ref={setSentinelNode} style={{ height: 1 }} />
            {isFetchingNextPage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 1].map((i) => <ApptSkel key={i} />)}
              </div>
            )}
            {!hasNextPage && allItems.length > 0 && (
              <div style={{ textAlign: 'center', fontSize: 12, color: MB.text4, padding: '8px 0' }}>All visits loaded</div>
            )}
          </div>
        )}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
}

/**
 * If the user just returned from a payment gateway, MobPayment stashed the paymentId.
 * Verify it server-side (which also flips the appointment to CONFIRMED on success)
 * and toast the outcome. This is the safety-net against missed webhooks.
 */
// Post-payment verify now lives in src/hooks/usePostPaymentVerify.ts and is mounted
// globally from App.tsx so it works regardless of which page the gateway redirects to.

export default memo(function MobMyAppts() {
  const { isWide } = useViewport()
  return isWide ? <DesktopMyAppts /> : <MobileMyAppts />
})
