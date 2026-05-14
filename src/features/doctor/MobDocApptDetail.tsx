import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePatientSummary } from '@/hooks/useSchedule'
import { DoctorPortalService } from '@/services/doctor-portal.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Skel } from '@/components/feedback/Skel'
import { SafeHtml } from '@/components/feedback/SafeHtml'
import { toast } from 'sonner'
import { useViewport } from '@/hooks/useViewport'
import type { IconName } from '@/types/ui'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-eyebrow" style={{ marginBottom: 8 }}>{title}</div>{children}</div>
}

function ProfileRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

type ConfirmAction = 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | null

const ACTION_CFG: Record<'COMPLETED' | 'CANCELLED' | 'NO_SHOW', {
  title: string; body: string; cta: string; danger: boolean; icon: IconName; iconColor: string; iconBg: string
}> = {
  COMPLETED: {
    title: 'Mark as completed?',
    body: 'This appointment will be moved to your completed list, and you can add a consultation note.',
    cta: 'Yes, mark completed',
    danger: false,
    icon: 'check',
    iconColor: MB.success,
    iconBg: '#E6F6EE',
  },
  CANCELLED: {
    title: 'Cancel this appointment?',
    body: 'The patient will be notified by email and SMS. The slot will be returned to your availability.',
    cta: 'Yes, cancel',
    danger: true,
    icon: 'x',
    iconColor: MB.danger,
    iconBg: '#FEE4E2',
  },
  NO_SHOW: {
    title: 'Mark as no-show?',
    body: "This indicates the patient did not attend. They'll be notified and may be subject to your no-show policy.",
    cta: 'Yes, mark no-show',
    danger: true,
    icon: 'alert',
    iconColor: MB.danger,
    iconBg: '#FEE4E2',
  },
}

function StatusConfirmSheet({ action, apptName, time, onConfirm, onClose, loading }: {
  action: 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  apptName: string; time: string
  onConfirm: () => void; onClose: () => void; loading: boolean
}) {
  const cfg = ACTION_CFG[action]
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cfg.title}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}
    >
      <div style={{ background: MB.bg, width: '100%', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 16px' }} aria-hidden="true" />
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name={cfg.icon} size={22} color={cfg.iconColor} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: '0 0 8px' }}>{cfg.title}</h3>
        <p style={{ fontSize: 13, color: MB.text2, margin: '0 0 14px', lineHeight: 1.5 }}>{cfg.body}</p>
        <Card padding={12} style={{ background: MB.bg2 }}>
          <div style={{ fontSize: 12, color: MB.text3 }}>{time}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{apptName}</div>
        </Card>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Keep as-is</Btn>
          <Btn variant="primary" danger={cfg.danger} size="lg" style={{ flex: 1.4 }} loading={loading} onClick={onConfirm}>{cfg.cta}</Btn>
        </div>
      </div>
    </div>
  )
}

function MobileDocApptDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { appt, time } = location.state || {};
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const patientId = appt?.patientId;
  const { data: summary, isLoading: isSummaryLoading } = usePatientSummary(patientId || '');

  const transitionMutation = useMutation({
    mutationFn: (status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED') =>
      DoctorPortalService.transitionAppointment(id!, status as 'COMPLETED' | 'NO_SHOW'),
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast.success(
        status === 'COMPLETED' ? 'Appointment marked completed'
          : status === 'NO_SHOW' ? 'Marked as no-show'
          : 'Appointment cancelled'
      )
      setConfirmAction(null)
      if (status === 'COMPLETED') {
        navigate(`/doctor/appt/${id}/note`, { state: { appt } })
      } else {
        navigate(-1)
      }
    },
    onError: () => {
      toast.error('Could not update appointment status')
      setConfirmAction(null)
    }
  });

  if (!appt || !patientId) return (
    <MobScreen>
      <MobTopBar title="Appointment" back />
      <div style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: MB.text, marginBottom: 8 }}>Patient information not available.</div>
          <div style={{ fontSize: 13, color: MB.text3 }}>Please navigate from the appointments list.</div>
        </div>
      </div>
    </MobScreen>
  );

  return (
    <MobScreen>
      <MobTopBar title="Appointment" back right={
        <button className="mb-icon-btn" aria-label="More options"><Icon name="moreH" size={18} color={MB.text} /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: MB.bg, padding: 16, borderBottom: `1px solid ${MB.line2}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="mb-eyebrow">{time} PT</div>
              <h2 className="mb-h2" style={{ fontSize: 19, marginTop: 4 }}>{appt.name}</h2>
              <div style={{ fontSize: 12, color: MB.text3 }}>Patient Summary</div>
            </div>
            <StatusPill status={appt.status} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: MB.bg2, borderRadius: 10 }}>
            <PhotoBlock w={44} h={44} label={`PT · ${appt.name.split(' ')[1]?.toUpperCase() || 'PT'}`} tone="slate" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{appt.name}</div>
              <div style={{ fontSize: 11, color: MB.text3 }}>Contact via Secure Messenger</div>
            </div>
            <Btn variant="secondary" size="sm" icon="phone">Call</Btn>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Reason for visit">
            <Card padding={12}>
              <SafeHtml html={appt.reason} style={{ fontSize: 13, color: MB.text, lineHeight: 1.5 }} />
            </Card>
          </Section>
          
          <Section title="Patient History">
            {isSummaryLoading ? (
              <Skel h={120} r={10} />
            ) : (
              <Card padding={0}>
                <ProfileRow label="Last visit"   value={summary?.lastVisitDate || 'Not available'} />
                <ProfileRow label="Blood group"   value={summary?.bloodGroup || 'Not provided'} />
                <ProfileRow label="Allergies"  value={summary?.allergies || 'None reported'} last />
              </Card>
            )}
          </Section>

          <Section title="Clinical Notes">
            <Btn
              variant="secondary"
              full
              icon="plus"
              onClick={() => navigate(`/doctor/appt/${id}/note`, { state: { appt } })}
            >
              Add clinical note
            </Btn>
          </Section>

          {(appt.type === 'TELEMEDICINE' || appt.type === 'TELEHEALTH') && (
            <Section title="Telemedicine">
              <Btn
                variant="primary"
                full
                icon="phone"
                onClick={async () => {
                  try {
                    const { TelemedicineService } = await import('@/services/telemedicine.service')
                    const session = await TelemedicineService.createSession(Number(id))
                    navigate(`/doctor/telemedicine/${session.id}`)
                  } catch {
                    toast.error('Could not create telemedicine session')
                  }
                }}
              >
                Start telemedicine session
              </Btn>
            </Section>
          )}
        </div>
      </div>
      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn
          variant="primary"
          size="lg"
          full
          icon="check"
          disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'}
          onClick={() => setConfirmAction('COMPLETED')}
        >
          {appt.status === 'COMPLETED' ? 'Visit Completed' : 'Mark completed'}
        </Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            variant="secondary"
            size="md"
            style={{ flex: 1, color: MB.danger }}
            disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'}
            onClick={() => setConfirmAction('CANCELLED')}
          >
            Cancel
          </Btn>
          <Btn
            variant="secondary"
            size="md"
            style={{ flex: 1, color: MB.danger }}
            disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED' || appt.status === 'NO_SHOW'}
            onClick={() => setConfirmAction('NO_SHOW')}
          >
            No-show
          </Btn>
        </div>
      </div>

      {confirmAction && (
        <StatusConfirmSheet
          action={confirmAction}
          apptName={appt.name}
          time={time || ''}
          onConfirm={() => transitionMutation.mutate(confirmAction)}
          onClose={() => setConfirmAction(null)}
          loading={transitionMutation.isPending}
        />
      )}
    </MobScreen>
  )
}

// ── Desktop: reuse mobile content inside DoctorShell ─────────────────────────
function DesktopDocApptDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appt, time } = location.state || {}
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const patientId = appt?.patientId
  const { data: summary, isLoading: isSummaryLoading } = usePatientSummary(patientId || '')

  const transitionMutation = useMutation({
    mutationFn: (status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED') =>
      DoctorPortalService.transitionAppointment(id!, status as 'COMPLETED' | 'NO_SHOW'),
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      toast.success(status === 'COMPLETED' ? 'Appointment marked completed' : status === 'NO_SHOW' ? 'Marked as no-show' : 'Appointment cancelled')
      setConfirmAction(null)
      if (status === 'COMPLETED') navigate(`/doctor/appt/${id}/note`, { state: { appt } })
      else navigate(-1)
    },
    onError: () => { toast.error('Could not update appointment status'); setConfirmAction(null) },
  })

  if (!appt || !patientId) return null

  return (
    <DoctorShell title={`${appt.name}`} subtitle={`${time} PT — Appointment detail`} actions={
      <Btn variant="secondary" size="sm" icon="chevronLeft" onClick={() => navigate(-1)}>Back to schedule</Btn>
    }>
      <div style={{ flex: 1, padding: 28, display: 'flex', gap: 24, minHeight: 0, overflowY: 'auto' }}>
        {/* Left: actions */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <PhotoBlock w={48} h={48} label={`PT · ${appt.name.split(' ')[1]?.toUpperCase() || 'PT'}`} tone="slate" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>{appt.name}</div>
                <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{time} PT</div>
              </div>
            </div>
            <StatusPill status={appt.status} />
          </div>
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn variant="primary" full icon="check" disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'} onClick={() => setConfirmAction('COMPLETED')}>
              {appt.status === 'COMPLETED' ? 'Visit Completed' : 'Mark completed'}
            </Btn>
            <Btn variant="secondary" full icon="edit" onClick={() => navigate(`/doctor/appt/${id}/note`, { state: { appt } })}>Add clinical note</Btn>
            <div style={{ height: 1, background: MB.line2 }} />
            <Btn variant="dangerOutline" full disabled={appt.status === 'COMPLETED' || appt.status === 'CANCELLED'} onClick={() => setConfirmAction('CANCELLED')}>Cancel appointment</Btn>
            <Btn variant="dangerOutline" full disabled={['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status)} onClick={() => setConfirmAction('NO_SHOW')}>Mark no-show</Btn>
          </div>
        </div>
        {/* Right: detail */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 20 }}>
            <div className="mb-eyebrow" style={{ marginBottom: 10 }}>Reason for visit</div>
            <SafeHtml html={appt.reason} style={{ fontSize: 14, color: MB.text, lineHeight: 1.6 }} />
          </div>
          <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 20 }}>
            <div className="mb-eyebrow" style={{ marginBottom: 10 }}>Patient history</div>
            {isSummaryLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2].map((i) => <Skel key={i} h={14} r={4} />)}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <ProfileRow label="Last visit" value={summary?.lastVisitDate || 'Not available'} />
                <ProfileRow label="Blood group" value={summary?.bloodGroup || 'Not provided'} />
                <ProfileRow label="Allergies" value={summary?.allergies || 'None reported'} last />
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmAction && (
        <StatusConfirmSheet action={confirmAction} apptName={appt.name} time={time || ''}
          onConfirm={() => transitionMutation.mutate(confirmAction)}
          onClose={() => setConfirmAction(null)}
          loading={transitionMutation.isPending} />
      )}
    </DoctorShell>
  )
}

export default memo(function MobDocApptDetail() {
  const { isWide } = useViewport()
  return isWide ? <DesktopDocApptDetail /> : <MobileDocApptDetail />
})
