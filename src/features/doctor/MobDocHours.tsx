import { memo, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Toggle } from '@/components/forms/Toggle'
import { TimeField } from '@/components/forms/TimeField'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoctorPortalService, WorkingHours } from '@/services/doctor-portal.service'
import { Skel } from '@/components/feedback/Skel'
import { useViewport } from '@/hooks/useViewport'
import type { ChangeEvent } from 'react'

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function useHoursLogic() {
  const queryClient = useQueryClient()
  const { data: serverHours, isLoading } = useQuery<WorkingHours[]>({
    queryKey: ['doctor', 'hours'],
    queryFn: () => DoctorPortalService.getWorkingHours(),
  })
  const [hours, setHours] = useState<WorkingHours[]>([])

  useEffect(() => {
    if (!serverHours) return
    const byDay = new Map(serverHours.map((h) => [h.dayOfWeek, h]))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHours([1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => byDay.get(dayOfWeek) ?? { dayOfWeek, startTime: '09:00', endTime: '17:00', isAvailable: false }))
  }, [serverHours])

  const saveMutation = useMutation({
    mutationFn: (nextHours: WorkingHours[]) => DoctorPortalService.updateWorkingHours(nextHours),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctor', 'hours'] }); toast.success('Working hours saved') },
    onError: () => toast.error('Failed to save working hours'),
  })

  const handleToggle = (d: number) => setHours((prev) => prev.map((h) => h.dayOfWeek === d ? { ...h, isAvailable: !h.isAvailable } : h))
  const handleTime = (d: number, field: 'startTime' | 'endTime', value: string) =>
    setHours((prev) => prev.map((h) => h.dayOfWeek === d ? { ...h, [field]: value } : h))

  return { hours, isLoading, saveMutation, handleToggle, handleTime }
}

// ── Mobile ────────────────────────────────────────────────────────────────────
function MobileDocHours() {
  const { hours, isLoading, saveMutation, handleToggle, handleTime } = useHoursLogic()
  return (
    <MobScreen>
      <MobTopBar title="Working hours" right={
        <span onClick={() => saveMutation.mutate(hours)} style={{ fontSize: 13, color: saveMutation.isPending ? MB.text4 : MB.primary, fontWeight: 600, cursor: saveMutation.isPending ? 'default' : 'pointer' }}>
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </span>
      } />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ padding: 12, background: MB.primary50, borderRadius: 10, fontSize: 12, color: MB.primary600, marginBottom: 16, display: 'flex', gap: 8 }}>
          <Icon name="info" size={14} color={MB.primary600} />
          <span>Slots are auto-generated in 30-min intervals based on these hours.</span>
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2, 3, 4, 5, 6].map((i) => <Skel key={i} h={100} r={12} />)}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hours.map((day) => (
              <Card key={day.dayOfWeek} padding={14}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{DAY_NAMES[day.dayOfWeek]}</div>
                  <Toggle checked={day.isAvailable} onChange={() => handleToggle(day.dayOfWeek)} label={`${DAY_NAMES[day.dayOfWeek]} toggle`} />
                </div>
                {day.isAvailable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginTop: 12, alignItems: 'center' }}>
                    <TimeField value={day.startTime} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTime(day.dayOfWeek, 'startTime', e.target.value)} label="Start" />
                    <span style={{ color: MB.text3, fontSize: 12, paddingTop: 18 }}>to</span>
                    <TimeField value={day.endTime} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTime(day.dayOfWeek, 'endTime', e.target.value)} label="End" />
                  </div>
                )}
                {!day.isAvailable && <div style={{ marginTop: 8, fontSize: 12, color: MB.text3 }}>Closed for bookings</div>}
              </Card>
            ))}
          </div>
        )}
      </div>
      <MobTabBar role="doctor" active="hours" />
    </MobScreen>
  )
}

// ── Desktop ───────────────────────────────────────────────────────────────────
function DesktopDocHours() {
  const { hours, isLoading, saveMutation, handleToggle, handleTime } = useHoursLogic()
  const activeDays = hours.filter((h) => h.isAvailable).length

  return (
    <DoctorShell title="Working hours" subtitle={`${activeDays} of 7 days active`} actions={
      <Btn variant="primary" size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(hours)}>Save changes</Btn>
    }>
      <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ padding: '12px 16px', background: MB.primary50, borderRadius: 10, fontSize: 13, color: MB.primary600, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="info" size={15} color={MB.primary600} />
            Appointment slots are auto-generated in intervals based on these hours.
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <Skel key={i} h={80} r={12} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {hours.map((day) => (
                <div key={day.dayOfWeek} style={{
                  background: MB.bg, border: `1px solid ${day.isAvailable ? MB.line : MB.line2}`,
                  borderRadius: 12, padding: '16px 20px',
                  opacity: day.isAvailable ? 1 : 0.7,
                  transition: 'opacity .15s, border-color .15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.isAvailable ? 14 : 0 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: MB.ink }}>{DAY_NAMES[day.dayOfWeek]}</div>
                      <div style={{ fontSize: 11, color: day.isAvailable ? MB.success : MB.text4, marginTop: 2, fontWeight: 600 }}>
                        {day.isAvailable ? `${day.startTime} – ${day.endTime}` : 'Closed'}
                      </div>
                    </div>
                    <Toggle checked={day.isAvailable} onChange={() => handleToggle(day.dayOfWeek)} label={`${DAY_NAMES[day.dayOfWeek]} toggle`} />
                  </div>
                  {day.isAvailable && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <TimeField value={day.startTime} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTime(day.dayOfWeek, 'startTime', e.target.value)} label="Start time" />
                      </div>
                      <span style={{ color: MB.text3, fontSize: 12, marginTop: 18 }}>–</span>
                      <div style={{ flex: 1 }}>
                        <TimeField value={day.endTime} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTime(day.dayOfWeek, 'endTime', e.target.value)} label="End time" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorShell>
  )
}

export default memo(function MobDocHours() {
  const { isWide } = useViewport()
  return isWide ? <DesktopDocHours /> : <MobileDocHours />
})
