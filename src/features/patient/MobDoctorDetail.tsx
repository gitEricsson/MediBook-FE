import { memo, useEffect, useState } from 'react'
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
  selected?: boolean
  disabled?: boolean
  isPast?: boolean
  onClick?: () => void
}

function SlotBtn({ time, selected, disabled, isPast, onClick }: SlotBtnProps) {
  const isInactive = disabled || isPast
  return (
    <div
      role="button"
      tabIndex={isInactive ? -1 : 0}
      aria-pressed={selected}
      onClick={!isInactive ? onClick : undefined}
      onKeyDown={!isInactive && onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
      style={{
        height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', padding: '0 4px',
        background: isPast ? MB.bg2 : selected ? MB.primary : MB.bg,
        color: selected ? '#fff' : isInactive ? MB.text4 : MB.text,
        border: `1px solid ${selected ? MB.primary : MB.line}`,
        cursor: isInactive ? 'not-allowed' : 'pointer',
        opacity: isPast ? 0.35 : disabled ? 0.5 : 1,
        textDecoration: isPast ? 'line-through' : 'none',
      }}
    >
      {time}
    </div>
  )
}

// ── Time helpers ───────────────────────────────────────────────────────────
function minutesBetween(startHHmm: string, endHHmm: string): number {
  const [sh, sm] = startHHmm.split(':').map(Number)
  const [eh, em] = endHHmm.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
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

// Unified selection — either an hourly grid slot or a custom start+end window.
// One state field for both modes so the "Continue" button has a single source of truth.
export type BookingSelection =
  | { kind: 'grid';   slotId: string; start: string;                    label: string }
  | { kind: 'custom'; start: string;  end: string; durationMins: number; label: string }

// ── Shared slot-picker panel ──────────────────────────────────────────────────
function SlotPicker({
  week, selectedDate, setSelectedDate, selection, setSelection,
  availability, isAvailLoading, isError, cols = 3, workingHoursHint,
}: {
  week: ReturnType<typeof buildWeek>
  selectedDate: string; setSelectedDate: (d: string) => void
  selection: BookingSelection | null
  setSelection: (s: BookingSelection | null) => void
  availability: { slots: { id: string; startTime: string; endTime: string; isAvailable: boolean; isPast?: boolean; start: string }[] }[] | undefined
  isAvailLoading: boolean; isError: boolean; cols?: number
  workingHoursHint?: string
}) {
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]     = useState('')

  // Keep custom inputs in sync with the unified selection so switching back to
  // grid mode clears them visually.
  useEffect(() => {
    if (!selection || selection.kind !== 'custom') {
      if (customStart || customEnd) { setCustomStart(''); setCustomEnd('') }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.kind])

  // Build a custom selection only when both ends are valid. Patient still has to
  // press "Continue" to actually submit — no auto-fire on blur.
  function commitCustom(start: string, end: string) {
    if (!start || !end || end <= start) return
    const durationMins = minutesBetween(start, end)
    if (durationMins < 15) return
    const scheduledAt = `${selectedDate}T${start}:00`
    setSelection({ kind: 'custom', start: scheduledAt, end: `${selectedDate}T${end}:00`,
                   durationMins, label: `${start}–${end}` })
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, flexWrap: 'nowrap' }}>
        {week.map(({ iso, label, day }) => {
          const isActive = selectedDate === iso
          return (
            <div key={iso} role="button" tabIndex={0}
              onClick={() => { setSelectedDate(iso); setSelection(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedDate(iso); setSelection(null) } }}
              style={{ width: 52, padding: '8px 0', borderRadius: 10, flexShrink: 0, textAlign: 'center', cursor: 'pointer',
                background: isActive ? MB.primary : MB.bg, border: `1px solid ${isActive ? MB.primary : MB.line}`, color: isActive ? '#fff' : MB.text }}>
              <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{day}</div>
            </div>
          )
        })}
      </div>
      {workingHoursHint && (
        <div style={{ fontSize: 12, color: MB.text3, marginBottom: 10 }}>
          <Icon name="clock" size={12} /> Available {workingHoursHint}
        </div>
      )}
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
          {availability[0].slots.map((slot) => (
              <SlotBtn key={slot.id} time={`${slot.startTime}–${slot.endTime}`}
                selected={selection?.kind === 'grid' && selection.slotId === slot.id}
                disabled={!slot.isAvailable}
                isPast={slot.isPast}
                onClick={() => setSelection({ kind: 'grid', slotId: slot.id, start: slot.start,
                                              label: `${slot.startTime}–${slot.endTime}` })} />
          ))}
        </div>
      )}

      {/* Custom window — sets the unified selection only when both ends are valid.
          Submission still requires the "Continue" button at the bottom. */}
      <div style={{ marginTop: 14, padding: 12, background: MB.bg2, borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: MB.text3, marginBottom: 8, fontWeight: 600 }}>
          Or pick a custom window (15-min minimum)
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="time"
            value={customStart}
            onChange={(e) => { setCustomStart(e.target.value); commitCustom(e.target.value, customEnd) }}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${MB.line2}`, fontSize: 14, background: MB.bg }}
            aria-label="Start time"
          />
          <span style={{ fontSize: 12, color: MB.text3 }}>to</span>
          <input
            type="time"
            value={customEnd}
            onChange={(e) => { setCustomEnd(e.target.value); commitCustom(customStart, e.target.value) }}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${MB.line2}`, fontSize: 14, background: MB.bg }}
            aria-label="End time"
          />
        </div>
        {customStart && customEnd && customEnd <= customStart && (
          <div style={{ fontSize: 11, color: MB.danger, marginTop: 6 }}>End time must be after start time.</div>
        )}
        {customStart && customEnd && customEnd > customStart && minutesBetween(customStart, customEnd) < 15 && (
          <div style={{ fontSize: 11, color: MB.danger, marginTop: 6 }}>Consultation must be at least 15 minutes.</div>
        )}
      </div>
    </>
  )
}

// ── Desktop two-column ────────────────────────────────────────────────────────
function DesktopDoctorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selection, setSelection] = useState<BookingSelection | null>(null)
  const week = buildWeek()
  const { data: doctor, isLoading: isDocLoading } = useDoctorDetail(id || '')
  const { data: availability, isLoading: isAvailLoading, isError } = useDoctorAvailability(id || '', selectedDate)
  const { holdSlot, isHolding } = useBooking()

  // Single submit path — branches on the unified selection.
  const handleContinue = async () => {
    if (!id || !selection) return
    try {
      const hold = await holdSlot(
        selection.kind === 'grid'
          ? { doctorId: Number(id), scheduledAt: selection.start, type: 'IN_PERSON' }
          : { doctorId: Number(id), scheduledAt: selection.start, type: 'IN_PERSON', durationMins: selection.durationMins }
      )
      navigate('/patient/book/review', {
        state: {
          hold, doctor, selectedDate,
          slotId: selection.kind === 'grid' ? selection.slotId : `custom-${selection.label}`,
          scheduledAt: selection.start,
          durationMins: selection.kind === 'custom' ? selection.durationMins : undefined,
        },
      })
    } catch (err) {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'OUTSIDE_WORKING_HOURS')   toast.error("That window is outside this doctor's working hours.")
      else if (code === 'SLOT_TAKEN')         toast.error('Doctor is not available for booking at this time.')
      else if (code === 'DOCTOR_ON_LEAVE')    toast.error('Doctor is on leave that day.')
      else if (code === 'SLOT_IN_PAST')       toast.error('That time has already passed today.')
      else if (code === 'INVALID_TIME_RANGE') toast.error('End time must be after start time.')
      else                                    toast.error('Could not hold that window. Please try another.')
    }
  }

  const fee = doctor?.consultationFee
  const rating = doctor?.averageRating
  const isSenior = doctor?.seniorConsultant

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
                {isSenior && <Badge tone="primary" size="sm">Senior Consultant</Badge>}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</span>
                      {isSenior && <span style={{ fontSize: 10, color: MB.primary, fontWeight: 600, background: MB.primary50, padding: '2px 6px', borderRadius: 4 }}>Senior premium</span>}
                    </div>
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

          {/* Right: slot picker + reviews */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink, marginBottom: 18 }}>Available slots</div>
              <SlotPicker week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                selection={selection} setSelection={setSelection}
                availability={availability} isAvailLoading={isAvailLoading} isError={isError} cols={4}
                workingHoursHint="08:00–22:00, Mon–Sat" />
            </div>

            {/* CTA bar */}
            <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selection ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {selection.label}
                    </div>
                    {fee != null && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Consultation fee{isSenior ? ' (Senior)' : ''}: ₦{fee.toLocaleString()}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: MB.text3 }}>Pick a slot or type a custom window to continue</div>
                )}
              </div>
              <Btn variant="primary" size="lg" disabled={!selection || isHolding} loading={isHolding} onClick={handleContinue}>
                {isHolding ? 'Securing slot…' : 'Continue to review →'}
              </Btn>
            </div>

            {/* Reviews */}
            {id && (
              <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink, marginBottom: 16 }}>Patient reviews</div>
                <DoctorReviews doctorId={id} />
              </div>
            )}
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
  const [selection, setSelection] = useState<BookingSelection | null>(null)
  const week = buildWeek()

  const { data: doctor, isLoading: isDocLoading } = useDoctorDetail(id || '')
  const { data: availability, isLoading: isAvailLoading, isError } = useDoctorAvailability(id || '', selectedDate)
  const { holdSlot, isHolding } = useBooking()

  // Single submit path — same as Desktop.
  const handleContinue = async () => {
    if (!id || !selection) return
    try {
      const hold = await holdSlot(
        selection.kind === 'grid'
          ? { doctorId: Number(id), scheduledAt: selection.start, type: 'IN_PERSON' }
          : { doctorId: Number(id), scheduledAt: selection.start, type: 'IN_PERSON', durationMins: selection.durationMins }
      )
      navigate('/patient/book/review', {
        state: {
          hold, doctor, selectedDate,
          slotId: selection.kind === 'grid' ? selection.slotId : `custom-${selection.label}`,
          scheduledAt: selection.start,
          durationMins: selection.kind === 'custom' ? selection.durationMins : undefined,
        },
      })
    } catch (err) {
      const code = (err as { errorCode?: string })?.errorCode
      if (code === 'OUTSIDE_WORKING_HOURS')   toast.error("That window is outside this doctor's working hours.")
      else if (code === 'SLOT_TAKEN')         toast.error('Doctor is not available for booking at this time.')
      else if (code === 'DOCTOR_ON_LEAVE')    toast.error('Doctor is on leave that day.')
      else if (code === 'SLOT_IN_PAST')       toast.error('That time has already passed today.')
      else if (code === 'INVALID_TIME_RANGE') toast.error('End time must be after start time.')
      else                                    toast.error('Could not hold that window. Please try another.')
    }
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

  const fee = doctor.consultationFee
  const rating = doctor.averageRating
  const isSenior = doctor.seniorConsultant

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
                {isSenior && <Badge tone="primary" size="sm">Senior Consultant</Badge>}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</span>
                      {isSenior && <span style={{ fontSize: 9, color: MB.primary, fontWeight: 600, background: MB.primary50, padding: '1px 4px', borderRadius: 3 }}>Senior</span>}
                    </div>
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

        {/* Slot picker — same shared component the desktop uses. Grid + manual entry
            both feed a single `selection` so the "Continue" button at the bottom is
            the only commit path. */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="mb-h4">Available slots</div>
          </div>
          <SlotPicker week={week} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            selection={selection} setSelection={setSelection}
            availability={availability} isAvailLoading={isAvailLoading} isError={isError} cols={3}
            workingHoursHint="08:00–22:00, Mon–Sat" />
          {!isAvailLoading && !isError && (!availability || availability.length === 0 || availability[0].slots.length === 0) && id && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <WaitlistButton doctorId={id} />
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
        {selection && (
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MB.text2 }}>
            <span>{selection.label} · {selection.kind === 'custom' ? `${selection.durationMins} min` : '60 min'}</span>
            {fee != null && <span style={{ fontWeight: 700, color: MB.ink }}>₦{fee.toLocaleString()}</span>}
          </div>
        )}
        <Btn variant="primary" size="lg" full disabled={!selection || isHolding} loading={isHolding} onClick={handleContinue}>
          {isHolding ? 'Securing slot…' : 'Continue to review'}
        </Btn>
      </div>
    </MobScreen>
  )
}

// CustomTimeRow has been folded into SlotPicker — mobile and desktop share the same UI now.

// ── Export ────────────────────────────────────────────────────────────────────
export default memo(function MobDoctorDetail() {
  const { isWide } = useViewport()
  return isWide ? <DesktopDoctorDetail /> : <MobileDoctorDetail />
})
