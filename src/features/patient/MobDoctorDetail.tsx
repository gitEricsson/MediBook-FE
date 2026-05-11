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
  time: string
  ampm: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

function SlotBtn({ time, ampm, selected, disabled, onClick }: SlotBtnProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={!disabled && onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
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

// ── Week day strip ─────────────────────────────────────────────────────────

function buildWeek(offset = 0) {
  return [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + offset)
    return {
      iso: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    }
  })
}

// ── Main ──────────────────────────────────────────────────────────────────

export default memo(function MobDoctorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const week = buildWeek()

  const { data: doctor, isLoading: isDocLoading } = useDoctorDetail(id || '')
  const { data: availability, isLoading: isAvailLoading, isError } = useDoctorAvailability(id || '', selectedDate)
  const { holdSlot, isHolding } = useBooking()

  const handleContinue = async () => {
    if (!id || !selectedSlotId) return
    const selectedSlot = availability?.[0]?.slots.find((slot) => slot.id === selectedSlotId)
    if (!selectedSlot) return
    const hold = await holdSlot({ doctorId: Number(id), scheduledAt: selectedSlot.start, type: 'IN_PERSON' })
    navigate('/patient/book/review', {
      state: { hold, doctor, selectedDate, slotId: selectedSlotId, scheduledAt: selectedSlot.start },
    })
  }

  if (isDocLoading) {
    return (
      <MobScreen>
        <MobTopBar title="Loading..." back />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skel h={200} r={12} />
          <Skel h={120} r={12} />
        </div>
      </MobScreen>
    )
  }
  if (!doctor) {
    return <MobScreen><MobTopBar title="Error" back /><EmptyState title="Doctor not found" /></MobScreen>
  }

  const fee = doctor.effectiveConsultationFee ?? doctor.consultationFee
  const rating = doctor.averageRating

  return (
    <MobScreen>
      <MobTopBar
        title={`Dr. ${doctor.name}`}
        back
        right={<button className="mb-icon-btn" aria-label="More options"><Icon name="moreH" size={18} color={MB.text} /></button>}
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Doctor header */}
        <div style={{ background: MB.bg, padding: '16px 16px 20px', borderBottom: `1px solid ${MB.line2}` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <PhotoBlock w={72} h={72} label={`DR · ${doctor.name.split(' ')[1]?.toUpperCase() || 'DOC'}`} tone="primary" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>Dr. {doctor.name}</div>
              <div style={{ fontSize: 13, color: MB.text2, marginTop: 2 }}>{doctor.specialization || doctor.spec || 'Specialist'}</div>
              <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{doctor.department || doctor.dept || 'General Medicine'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {doctor.acceptingNew && <Badge tone="success" dot size="sm">Accepting new</Badge>}
                {doctor.telemedicineEnabled && <Badge tone="primary" size="sm">Telemedicine</Badge>}
                {doctor.yearsOfExperience != null && <Badge tone="neutral" size="sm">{doctor.yearsOfExperience} yrs exp.</Badge>}
              </div>
            </div>
          </div>

          {/* Rating + fee row */}
          {(rating != null || fee != null) && (
            <div style={{ display: 'flex', gap: 16, marginTop: 14, padding: '10px 12px', background: MB.bg2, borderRadius: 10 }}>
              {rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>★</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>{rating.toFixed(1)}</div>
                    <div style={{ fontSize: 11, color: MB.text3 }}>{doctor.reviewCount ?? 0} reviews</div>
                  </div>
                </div>
              )}
              {fee != null && (
                <>
                  {rating != null && <div style={{ width: 1, background: MB.line2 }} />}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: MB.text3 }}>Consultation fee</div>
                  </div>
                </>
              )}
              {doctor.languages && (
                <>
                  <div style={{ width: 1, background: MB.line2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: MB.text }}>{doctor.languages}</div>
                    <div style={{ fontSize: 11, color: MB.text3 }}>Languages</div>
                  </div>
                </>
              )}
            </div>
          )}

          {doctor.bio && (
            <p style={{ fontSize: 13, color: MB.text2, marginTop: 12, marginBottom: 0, lineHeight: 1.55 }}>
              {doctor.bio}
            </p>
          )}
        </div>

        {/* Slot picker */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="mb-h4">Available slots</div>
          </div>

          {/* Week strip */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {week.map(({ iso, label, day }) => {
              const isActive = selectedDate === iso
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelectedDate(iso); setSelectedSlotId(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedDate(iso); setSelectedSlotId(null) } }}
                  style={{
                    width: 50, padding: '8px 0', borderRadius: 10, flexShrink: 0,
                    textAlign: 'center', cursor: 'pointer',
                    background: isActive ? MB.primary : MB.bg,
                    border: `1px solid ${isActive ? MB.primary : MB.line}`,
                    color: isActive ? '#fff' : MB.text,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{day}</div>
                </div>
              )
            })}
          </div>

          {/* Slots grid */}
          {isAvailLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => <Skel key={i} w="100%" h={40} r={8} />)}
            </div>
          )}
          {isError && <ErrorState title="Couldn't load availability" body="We'll retry when you choose another day." />}
          {!isAvailLoading && !isError && (!availability || availability.length === 0 || availability[0].slots.length === 0) && (
            <EmptyState icon="calendar" title="No slots on this day" body="Try another day this week." />
          )}
          {!isAvailLoading && !isError && availability && availability[0]?.slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {availability[0].slots.map((slot) => {
                const h = parseInt(slot.startTime.split(':')[0])
                const ampm = h >= 12 ? 'PM' : 'AM'
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
          )}
        </div>
      </div>

      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
        {fee != null && selectedSlotId && (
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MB.text2 }}>
            <span>Consultation fee</span>
            <span style={{ fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</span>
          </div>
        )}
        <Btn
          variant="primary"
          size="lg"
          full
          disabled={!selectedSlotId || isHolding}
          loading={isHolding}
          onClick={handleContinue}
        >
          {isHolding ? 'Securing slot…' : 'Continue to review'}
        </Btn>
      </div>
    </MobScreen>
  )
})
