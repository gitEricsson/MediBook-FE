import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDoctorDetail, useDoctorAvailability } from '@/hooks/useDoctorData'
import { useBooking } from '@/hooks/useBooking'
import { useNavigate, useParams } from 'react-router-dom'

interface SlotBtnProps { 
  time: string; 
  ampm: string; 
  selected?: boolean; 
  disabled?: boolean;
  onClick?: () => void;
}

function SlotBtn({ time, ampm, selected, disabled, onClick }: SlotBtnProps) {
  return (
    <div 
      role="button" 
      tabIndex={disabled ? -1 : 0} 
      aria-pressed={selected} 
      onClick={!disabled ? onClick : undefined}
      style={{
        height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600,
        background: selected ? MB.primary : MB.bg,
        color: selected ? '#fff' : disabled ? MB.text4 : MB.text,
        border: `1px solid ${selected ? MB.primary : MB.line}`, 
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {time} <span style={{ fontSize: 10, marginLeft: 3, opacity: 0.7 }}>{ampm}</span>
    </div>
  )
}

export default memo(function MobDoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: doctor, isLoading: isDocLoading } = useDoctorDetail(id || '');
  const { data: availability, isLoading: isAvailLoading, isError } = useDoctorAvailability(id || '', selectedDate);
  const { holdSlot, isHolding } = useBooking();

  const handleContinue = async () => {
    if (!id || !selectedSlotId) return;
    try {
      const [startIso] = selectedSlotId.split('-');
      const hold = await holdSlot({
        doctorId: Number(id),
        scheduledAt: startIso,
        type: 'IN_PERSON',
      });
      // Navigate to review with hold information
      navigate(`/patient/book/review`, { state: { hold, doctor, selectedDate, slotId: selectedSlotId } });
    } catch (err) {
      // Concurrency error handled by useBooking internally, but we could show a local toast
    }
  };

  if (isDocLoading) return <MobScreen><MobTopBar title="Loading..." back /><div style={{ padding: 16 }}><Skel h={200} /></div></MobScreen>;
  if (!doctor) return <MobScreen><MobTopBar title="Error" back /><EmptyState title="Doctor not found" /></MobScreen>;

  return (
    <MobScreen>
      <MobTopBar title={`Dr. ${doctor.name}`} back right={
        <button className="mb-icon-btn" aria-label="More options"><Icon name="moreH" size={18} color={MB.text} /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: MB.bg, padding: '16px 16px 20px', borderBottom: `1px solid ${MB.line2}` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <PhotoBlock w={72} h={72} label={`DR · ${doctor.name.split(' ')[1]?.toUpperCase() || 'DOC'}`} tone="primary" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>Dr. {doctor.name}</div>
              <div style={{ fontSize: 13, color: MB.text2, marginTop: 2 }}>{doctor.specialization || doctor.spec || 'Specialist'}</div>
              <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{doctor.department || doctor.dept || 'General Medicine'} · {doctor.city || 'Bay General'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Badge tone="success" dot size="sm">Accepting new</Badge>
                <Badge tone="neutral" size="sm">12 yrs exp.</Badge>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: MB.text2, marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>
            {doctor.bio || 'Board-certified specialist dedicated to providing high-quality healthcare. Focuses on patient-centered outcomes and preventative care.'}
          </p>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="mb-h4">Available slots</div>
            <span className="mb-caption">Pacific time</span>
          </div>
          
          {/* Calendar Day Picker (Simplified for prototype) */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const iso = d.toISOString().split('T')[0];
              const isActive = selectedDate === iso;
              return (
                <div key={iso} role="button" tabIndex={0} onClick={() => setSelectedDate(iso)} style={{
                  width: 50, padding: '8px 0', borderRadius: 10, flexShrink: 0, textAlign: 'center', cursor: 'pointer',
                  background: isActive ? MB.primary : MB.bg,
                  border: `1px solid ${isActive ? MB.primary : MB.line}`,
                  color: isActive ? '#fff' : MB.text,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {isAvailLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[0,1,2,3,4,5].map(i => <Skel key={i} w="100%" h={40} r={8} />)}
            </div>
          )}
          {isError && <ErrorState title="Couldn't load availability" body="We'll retry automatically." />}
          {!isAvailLoading && (!availability || availability.length === 0) && (
            <EmptyState icon="calendar" title="No slots on this day" body="Try another day this week." />
          )}
          {!isAvailLoading && availability && availability.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {availability[0].slots.map((slot) => {
                  const [h, m] = slot.startTime.split(':');
                  const ampm = parseInt(h) >= 12 ? 'PM' : 'AM';
                  return (
                    <SlotBtn 
                      key={slot.id} 
                      time={slot.startTime} 
                      ampm={ampm} 
                      selected={selectedSlotId === slot.id}
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlotId(slot.id)}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
        <Btn 
          variant="primary" 
          size="lg" 
          full 
          disabled={!selectedSlotId || isHolding}
          onClick={handleContinue}
        >
          {isHolding ? 'Securing slot...' : 'Continue to review'}
        </Btn>
      </div>
    </MobScreen>
  )
})
