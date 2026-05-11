import { memo, useState, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBooking } from '@/hooks/useBooking'
import type { Appointment } from '@/types/api'

function ReviewRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500, fontFamily: mono ? 'var(--mb-font-mono),monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

export default memo(function MobBookReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hold, doctor, scheduledAt } = location.state || {};
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [reviewHoldTimer, setReviewHoldTimer] = useState<number | null>(null);

  const { confirmBooking, isConfirming, cancelHold } = useBooking();

  // If no hold, redirect back
  useEffect(() => {
    if (!hold) {
      navigate('/patient/search');
    }
  }, [hold, navigate]);

  useEffect(() => {
    if (!hold?.expiresAt) return;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));
      setReviewHoldTimer(remaining);
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [hold?.expiresAt]);

  const handleConfirm = async () => {
    try {
      const appt = await confirmBooking({ 
        holdId: hold.holdId,
        doctorId: Number(doctor.id),
        scheduledAt,
        type: 'IN_PERSON',
        reason,
      });
      setAppointment(appt);
      setSuccess(true);
    } catch {
      // Error handled by useBooking/QueryClient
    }
  };

  const handleBack = () => {
    cancelHold();
    navigate(-1);
  };

  if (!hold || !doctor) return null;

  return (
    <MobScreen>
      <MobTopBar title={success ? 'Confirmed' : 'Review & confirm'} back={!success} />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {success ? (
          <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={32} color={MB.success} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="mb-h2" style={{ fontSize: 20 }}>You're booked!</h2>
              <div className="mb-small" style={{ marginTop: 4 }}>Confirmation sent to your email</div>
            </div>
            <Card padding={14} style={{ width: '100%', textAlign: 'left', background: MB.bg2 }}>
              <ReviewRow label="Doctor"       value={`Dr. ${doctor.name}`} />
              <ReviewRow label="Date"         value={appointment?.scheduledAt ? new Date(appointment.scheduledAt).toLocaleDateString() : 'Upcoming'} />
              <ReviewRow label="Time"         value={appointment?.scheduledAt ? appointment.scheduledAt.slice(11, 16) : 'Confirmed'} />
              <ReviewRow label="Location"     value={`${doctor.department} · Bay General`} />
              <ReviewRow label="Confirmation" value={appointment?.confirmationCode || String(appointment?.id ?? '')} mono last />
            </Card>
            <Btn variant="primary" size="lg" full style={{ marginTop: 8 }} onClick={() => navigate('/patient/appts')}>
              View in My visits
            </Btn>
            <Btn variant="ghost"   size="md" full>Add to calendar</Btn>
          </div>
        ) : (
          <>
            <div style={{ 
              background: MB.primary50, 
              padding: '10px 14px', 
              borderRadius: 8, 
              marginBottom: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: MB.primary700, fontSize: 13, fontWeight: 600 }}>
                <Icon name="clock" size={14} color={MB.primary} />
                <span>Slot secured temporarily</span>
              </div>
              <div style={{ color: MB.primary, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {Math.floor((reviewHoldTimer || 0) / 60)}:{(reviewHoldTimer || 0) % 60 < 10 ? '0' : ''}{(reviewHoldTimer || 0) % 60}
              </div>
            </div>

            <Card padding={14} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PhotoBlock w={48} h={48} label={`DR · ${doctor.name.split(' ')[1]?.toUpperCase()}`} tone="primary" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. {doctor.name}</div>
                  <div style={{ fontSize: 12, color: MB.text3 }}>{doctor.specialization} · {doctor.department}</div>
                </div>
              </div>
            </Card>
            <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Appointment</div>
            <Card padding={0} style={{ marginBottom: 14 }}>
              <ReviewRow label="Type"     value="In-person consultation" last />
            </Card>
            <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Reason for visit</div>
            <Field>
              <Textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="Briefly describe your reason for visit..."
                rows={3} 
              />
            </Field>
            <div style={{ marginTop: 14, padding: 12, background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn, display: 'flex', gap: 8 }}>
              <Icon name="info" size={14} color={MB.warn} />
              <span>Cancellations are free up to 24 hours before your visit.</span>
            </div>
            {!reviewHoldTimer && (
              <div role="alert" style={{ marginTop: 14, padding: 12, background: MB.dangerBg, borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8 }}>
                <Icon name="alert" size={16} color={MB.danger} />
                <div><strong>Hold expired.</strong> Please pick another time.</div>
              </div>
            )}
          </>
        )}
      </div>
      {!success && (
        <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', gap: 10 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={handleBack}>Back</Btn>
          <Btn 
            variant="primary"   
            size="lg" 
            style={{ flex: 1.6 }} 
            loading={isConfirming}
            disabled={!reviewHoldTimer}
            onClick={handleConfirm}
          >
            Confirm booking
          </Btn>
        </div>
      )}
    </MobScreen>
  )
})
