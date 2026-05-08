import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
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

export default memo(function MobDocApptDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { appt, time } = location.state || {};

  const { data: summary, isLoading: isSummaryLoading } = usePatientSummary(appt?.patientId || 'pt-1');

  const transitionMutation = useMutation({
    mutationFn: (status: 'COMPLETED' | 'NO_SHOW') => DoctorPortalService.transitionAppointment(id || '1', status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      navigate(-1);
    }
  });

  if (!appt) return null;

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
                <ProfileRow label="Last visit"   value={summary?.lastVisit || 'Not available'} />
                <ProfileRow label="Conditions"   value={summary?.conditions?.join(', ') || 'None reported'} />
                <ProfileRow label="Active meds"  value={summary?.medications?.join(', ') || 'None reported'} last />
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
        </div>
      </div>
      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn 
          variant="primary" 
          size="lg" 
          full 
          icon="check"
          loading={transitionMutation.isPending}
          disabled={appt.status === 'COMPLETED'}
          onClick={() => transitionMutation.mutate('COMPLETED')}
        >
          {appt.status === 'COMPLETED' ? 'Visit Completed' : 'Mark completed'}
        </Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="md" style={{ flex: 1 }}>Reschedule</Btn>
          <Btn 
            variant="secondary" 
            size="md" 
            style={{ flex: 1, color: MB.danger }}
            onClick={() => transitionMutation.mutate('NO_SHOW')}
          >
            No-show
          </Btn>
        </div>
      </div>
    </MobScreen>
  )
})
