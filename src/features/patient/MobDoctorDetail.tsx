import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
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
import { useViewport } from '@/hooks/useViewport'
import { useMutation } from '@tanstack/react-query'
import { WaitlistService } from '@/services/waitlist.service'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { toLocalIsoDate, todayLocalIsoDate } from '@/lib/date'

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

// ── Week day strip ─────────────────────────────────────────────────────────

function buildWeek(offset = 0) {
  return [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + offset)
    // iso, label, and day all derived from the user's *local* timezone so the
    // string sent to the backend matches what the user sees on the tile.
    return {
      iso: toLocalIsoDate(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
    }
  })
}

// Fixed-grid slot selection. The backend returns availability slots already
// bucketed by the department's average consultation time + buffer, within the
// doctor's active working hours and around any midday break — the FE just renders.
export interface BookingSelection {
  slotId: string
  start: string
  label: string
}

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
                selected={selection?.slotId === slot.id}
                disabled={!slot.isAvailable}
                isPast={slot.isPast}
                onClick={() => setSelection({ slotId: slot.id, start: slot.start,
                                              label: `${slot.startTime}–${slot.endTime}` })} />
          ))}
        </div>
      )}
    </>
  )
}

function holdErrorToast(err: unknown) {
  const code = (err as { errorCode?: string })?.errorCode
  if (code === 'OUTSIDE_WORKING_HOURS')   toast.error("That window is outside this doctor's working hours.")
  else if (code === 'SLOT_TAKEN')         toast.error('Doctor is not available for booking at this time.')
  else if (code === 'DOCTOR_ON_LEAVE')    toast.error('Doctor is on leave that day.')
  else if (code === 'SLOT_IN_PAST')       toast.error('That time has already passed today.')
  else                                    toast.error('Could not hold that window. Please try another.')
}

// ── Desktop two-column ────────────────────────────────────────────────────────
function DesktopDoctorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(todayLocalIsoDate())
  const [selection, setSelection] = useState<BookingSelection | null>(null)
  const week = buildWeek()
  const { data: doctor, isLoading: isDocLoading } = useDoctorDetail(id || '')
  const { data: availability, isLoading: isAvailLoading, isError } = useDoctorAvailability(id || '', selectedDate)
  const { holdSlot, isHolding } = useBooking()

  const handleContinue = async () => {
    if (!id || !selection) return
    try {
      const hold = await holdSlot({ doctorId: Number(id), scheduledAt: selection.start, type: 'IN_PERSON' })
      navigate('/patient/book/review', {
        state: { hold, doctor, selectedDate, slotId: selection.slotId, scheduledAt: selection.start },
      })
    } catch (err) {
      holdErrorToast(err)
    }
  }

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
              </div>
              {doctor.bio && <p style={{ fontSize: 13, color: MB.text2, lineHeight: 1.6, margin: 0 }}>{doctor.bio}</p>}
            </div>

            {/* Languages — pricing is the department's and only shown at checkout */}
            {doctor.languages && (
              <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: MB.text2 }}>Languages</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: MB.text }}>{doctor.languages}</div>
              </div>
            )}
          </div>

          {/* Right: slot picker */}
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {selection.label}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: MB.text3 }}>Pick an available slot to continue</div>
                )}
              </div>
              <Btn variant="primary" size="lg" disabled={!selection || isHolding} loading={isHolding} onClick={handleContinue}>
                {isHolding ? 'Securing slot…' : 'Continue to review →'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────
function MobileDoctorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(todayLocalIsoDate())
  const [selection, setSelection] = useState<BookingSelection | null>(null)
  const week = buildWeek()

  const { data: doctor, isLoading: isDocLoading } = useDoctorDetail(id || '')
  const { data: availability, isLoading: isAvailLoading, isError } = useDoctorAvailability(id || '', selectedDate)
  const { holdSlot, isHolding } = useBooking()

  const handleContinue = async () => {
    if (!id || !selection) return
    try {
      const hold = await holdSlot({ doctorId: Number(id), scheduledAt: selection.start, type: 'IN_PERSON' })
      navigate('/patient/book/review', {
        state: { hold, doctor, selectedDate, slotId: selection.slotId, scheduledAt: selection.start },
      })
    } catch (err) {
      holdErrorToast(err)
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
              </div>
            </div>
          </div>

          {doctor.languages && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: MB.bg2, borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: MB.text }}>{doctor.languages}</div>
              <div style={{ fontSize: 11, color: MB.text3 }}>Languages</div>
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
      </div>

      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
        {selection && (
          <div style={{ marginBottom: 10, fontSize: 13, color: MB.text2 }}>
            <span>{selection.label}</span>
          </div>
        )}
        <Btn variant="primary" size="lg" full disabled={!selection || isHolding} loading={isHolding} onClick={handleContinue}>
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
