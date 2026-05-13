import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDoctorDetail, useDoctorAvailability } from '@/hooks/useDoctorData'
import { useBooking } from '@/hooks/useBooking'
import { useNavigate, useParams } from 'react-router-dom'
import { useViewport } from '@/hooks/useViewport'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReviewsService, ReviewResponse } from '@/services/reviews.service'
import { WaitlistService } from '@/services/waitlist.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'

// ── Doctor reviews section ─────────────────────────────────────────────────────
function DoctorReviews({ doctorId }: { doctorId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', 'doctor', doctorId],
    queryFn: () => ReviewsService.getDoctorReviews(doctorId, 0, 5),
    enabled: !!doctorId,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1].map((i) => <Skel key={i} h={80} w="100%" r={10} />)}
    </div>
  )

  const reviews = data?.content ?? []
  if (reviews.length === 0) return (
    <div style={{ fontSize: 13, color: MB.text3, textAlign: 'center', padding: '16px 0' }}>No reviews yet.</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reviews.map((r: ReviewResponse) => (
        <div key={r.id} style={{ background: MB.bg2, borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={r.patientName} size={28} tone="primary" />
              <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{r.patientName}</div>
            </div>
            <div style={{ fontSize: 13, color: '#F59E0B' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          </div>
          {r.comment && <p style={{ margin: 0, fontSize: 13, color: MB.text2, lineHeight: 1.5 }}>{r.comment}</p>}
          <div style={{ fontSize: 11, color: MB.text3, marginTop: 6 }}>
            {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Waitlist join button ───────────────────────────────────────────────────────
function WaitlistButton({ doctorId }: { doctorId: string }) {
  const mutation = useMutation({
    mutationFn: () => WaitlistService.join({ doctorId: Number(doctorId) }),
    onSuccess: () => toast.success('Added to waitlist — we\'ll notify you when a slot opens'),
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to join waitlist'),
  })

  return (
    <Btn variant="secondary" size="sm" icon="clock" loading={mutation.isPending} onClick={() => mutation.mutate()}>
      Join waitlist
    </Btn>
  )
}

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

// ── Shared slot-picker panel ──────────────────────────────────────────────────
function SlotPicker({
  week, selectedDate, setSelectedDate, selectedSlotId, setSelectedSlotId,
  availability, isAvailLoading, isError, cols = 3,
}: {
  week: ReturnType<typeof buildWeek>
  selectedDate: string; setSelectedDate: (d: string) => void
  selectedSlotId: string | null; setSelectedSlotId: (s: string | null) => void
  availability: { slots: { id: string; startTime: string; isAvailable: boolean; start: string }[] }[] | undefined
  isAvailLoading: boolean; isError: boolean; cols?: number
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, flexWrap: 'nowrap' }}>
        {week.map(({ iso, label, day }) => {
          const isActive = selectedDate === iso
          return (
            <div key={iso} role="button" tabIndex={0}
              onClick={() => { setSelectedDate(iso); setSelectedSlotId(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedDate(iso); setSelectedSlotId(null) } }}
              style={{ width: 52, padding: '8px 0', borderRadius: 10, flexShrink: 0, textAlign: 'center', cursor: 'pointer',
                background: isActive ? MB.primary : MB.bg, border: `1px solid ${isActive ? MB.primary : MB.line}`, color: isActive ? '#fff' : MB.text }}>
              <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{day}</div>
            </div>
          )
        })}
      </div>
      {isAvailLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <Skel key={i} w="100%" h={40} r={8} />)}
        </div>
      )}
      {isError && <ErrorState title="Couldn't load availability" body="We'll retry when you choose another day." />}
      {!isAvailLoading && !isError && (!availability || availability.length === 0 || availability[0].slots.length === 0) && (
        <EmptyState icon="calendar" title="No slots on this day" body="Try another day this week." />
      )}
      {!isAvailLoading && !isError && availability && availability[0]?.slots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
          {availability[0].slots.map((slot) => {
            const h = parseInt(slot.startTime.split(':')[0])
            const ampm = h >= 12 ? 'PM' : 'AM'
            return (
              <SlotBtn key={slot.id} time={slot.startTime} ampm={ampm}
                selected={selectedSlotId === slot.id} disabled={!slot.isAvailable}
                onClick={() => setSelectedSlotId(slot.id)} />
            )
          })}
        </div>
      )}
    </>
  )
}

// ── Desktop two-column ────────────────────────────────────────────────────────
function DesktopDoctorDetail() {
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
    const selectedSlot = availability?.[0]?.slots.find((s) => s.id === selectedSlotId)
    if (!selectedSlot) return
    const hold = await holdSlot({ doctorId: Number(id), scheduledAt: selectedSlot.start, type: 'IN_PERSON' })
    navigate('/patient/book/review', { state: { hold, doctor, selectedDate, slotId: selectedSlotId, scheduledAt: selectedSlot.start } })
  }

  const fee = doctor?.effectiveConsultationFee ?? doctor?.consultationFee
  const rating = doctor?.averageRating

  return (
    <PatientShell title={doctor ? `Dr. ${doctor.name}` : 'Doctor profile'} actions={
      <Btn variant="secondary" size="sm" icon="chevronLeft" onClick={() => navigate(-1)}>Back</Btn>
    }>
      {isDocLoading ? (
        <div style={{ padding: 28, display: 'flex', gap: 24 }}>
          <Skel w={320} h={400} r={12} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skel h={160} r={12} /><Skel h={200} r={12} />
          </div>
        </div>
      ) : !doctor ? (
        <div style={{ padding: 28 }}><ErrorState title="Doctor not found" /></div>
      ) : (
        <div style={{ padding: 28, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Left: profile */}
          <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 14, padding: 24 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <PhotoBlock w={80} h={80} label={`DR · ${doctor.name.split(' ')[1]?.toUpperCase().slice(0, 3) || 'DOC'}`} tone="primary" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>Dr. {doctor.name}</div>
                  <div style={{ fontSize: 13, color: MB.text2, marginTop: 2 }}>{doctor.specialization || doctor.spec}</div>
                  <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>{doctor.department || doctor.dept}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: doctor.bio ? 14 : 0 }}>
                {doctor.acceptingNew && <Badge tone="success" dot size="sm">Accepting new</Badge>}
                {doctor.telemedicineEnabled && <Badge tone="primary" size="sm">Telehealth</Badge>}
                {doctor.yearsOfExperience != null && <Badge tone="neutral" size="sm">{doctor.yearsOfExperience} yrs</Badge>}
              </div>
              {doctor.bio && <p style={{ fontSize: 13, color: MB.text2, lineHeight: 1.6, margin: 0 }}>{doctor.bio}</p>}
            </div>

            {/* Stats */}
            {(rating != null || fee != null || doctor.languages) && (
              <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rating != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: MB.text2 }}>Rating</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: MB.ink }}>
                      <span style={{ color: '#F59E0B' }}>★</span> {rating.toFixed(1)}
                      <span style={{ fontSize: 12, fontWeight: 400, color: MB.text3 }}>({doctor.reviewCount ?? 0})</span>
                    </div>
                  </div>
                )}
                {fee != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: MB.text2 }}>Consultation fee</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</div>
                  </div>
                )}
                {doctor.languages && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: MB.text2 }}>Languages</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>{doctor.languages}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: slot picker */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink, marginBottom: 18 }}>Available slots</div>
              <SlotPicker week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                selectedSlotId={selectedSlotId} setSelectedSlotId={setSelectedSlotId}
                availability={availability} isAvailLoading={isAvailLoading} isError={isError} cols={4} />
            </div>

            {/* CTA bar */}
            <div style={{ marginTop: 16, background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedSlotId && (() => {
                  const slot = availability?.[0]?.slots.find((s) => s.id === selectedSlotId)
                  const d = new Date(selectedDate)
                  return (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>
                        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {slot?.startTime}
                      </div>
                      {fee != null && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Consultation fee: ₦{fee.toLocaleString()}</div>}
                    </div>
                  )
                })()}
                {!selectedSlotId && <div style={{ fontSize: 13, color: MB.text3 }}>Select a time slot above to continue</div>}
              </div>
              <Btn variant="primary" size="lg" disabled={!selectedSlotId || isHolding} loading={isHolding} onClick={handleContinue}>
                {isHolding ? 'Securing slot…' : 'Continue to review →'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  )
}

// ── Mobile (original, unchanged) ──────────────────────────────────────────────
function MobileDoctorDetail() {
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
            <div>
              <EmptyState icon="calendar" title="No slots on this day" body="Try another day this week." />
              {id && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <WaitlistButton doctorId={id} />
                </div>
              )}
            </div>
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

        {/* Reviews section */}
        {id && (
          <div style={{ padding: '0 16px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink, marginBottom: 12 }}>Patient reviews</div>
            <DoctorReviews doctorId={id} />
          </div>
        )}
      </div>

      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
        {fee != null && selectedSlotId && (
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MB.text2 }}>
            <span>Consultation fee</span>
            <span style={{ fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</span>
          </div>
        )}
        <Btn variant="primary" size="lg" full disabled={!selectedSlotId || isHolding} loading={isHolding} onClick={handleContinue}>
          {isHolding ? 'Securing slot…' : 'Continue to review'}
        </Btn>
      </div>
    </MobScreen>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default memo(function MobDoctorDetail() {
  const { isWide } = useViewport()
  return isWide ? <DesktopDoctorDetail /> : <MobileDoctorDetail />
})
