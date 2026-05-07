import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Card } from '@/components/primitives/Card'
import { Icon } from '@/components/primitives/Icon'
import { Toggle } from '@/components/forms/Toggle'
import { TimeField } from '@/components/forms/TimeField'

const DAYS = [
  { d: 'Monday',    open: true,  start: '8:00 AM', end: '5:00 PM' },
  { d: 'Tuesday',   open: true,  start: '8:00 AM', end: '5:00 PM' },
  { d: 'Wednesday', open: true,  start: '9:00 AM', end: '6:00 PM' },
  { d: 'Thursday',  open: true,  start: '8:00 AM', end: '5:00 PM' },
  { d: 'Friday',    open: true,  start: '8:00 AM', end: '2:00 PM', short: true },
  { d: 'Saturday',  open: false },
  { d: 'Sunday',    open: false },
]

export default memo(function MobDocHours() {
  return (
    <MobScreen>
      <MobTopBar
        title="Working hours"
        right={<span style={{ fontSize: 13, color: MB.primary, fontWeight: 600, cursor: 'pointer' }}>Save</span>}
      />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ padding: 12, background: MB.primary50, borderRadius: 10, fontSize: 12, color: MB.primary600, marginBottom: 16, display: 'flex', gap: 8 }}>
          <Icon name="info" size={14} color={MB.primary600} />
          <span>Slots are auto-generated in 30-min intervals based on these hours.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAYS.map(day => (
            <Card key={day.d} padding={14}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{day.d}</div>
                <Toggle checked={day.open} label={`${day.d} toggle`} />
              </div>
              {day.open && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <TimeField value={day.start!} label="Start" />
                  <span style={{ color: MB.text3, fontSize: 12, paddingTop: 18 }}>to</span>
                  <TimeField value={day.end!}   label="End" />
                </div>
              )}
              {day.open && day.short && (
                <div style={{ marginTop: 8, fontSize: 11, color: MB.warn, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="info" size={12} color={MB.warn} /> Short day · 12 slots
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
      <MobTabBar role="doctor" active="hours" />
    </MobScreen>
  )
})
