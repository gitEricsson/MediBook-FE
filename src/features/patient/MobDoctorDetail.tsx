import { memo } from 'react'
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

type DetailState = 'default' | 'loading' | 'empty' | 'error'

const DAYS = [
  { d: 'Tue', n: 6, free: true },
  { d: 'Wed', n: 7, free: true, active: true },
  { d: 'Thu', n: 8, free: true },
  { d: 'Fri', n: 9, free: false },
  { d: 'Sat', n: 10, free: true },
  { d: 'Sun', n: 11, free: false },
  { d: 'Mon', n: 12, free: true },
]
const SLOTS = ['9:00','9:30','10:00','11:00','11:30','1:30','2:00','3:00']

function SlotBtn({ time, ampm, selected }: { time: string; ampm: string; selected?: boolean }) {
  return (
    <div role="button" tabIndex={0} aria-pressed={selected} style={{
      height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600,
      background: selected ? MB.primary : MB.bg,
      color: selected ? '#fff' : MB.text,
      border: `1px solid ${selected ? MB.primary : MB.line}`, cursor: 'pointer',
    }}>
      {time} <span style={{ fontSize: 10, marginLeft: 3, opacity: 0.7 }}>{ampm}</span>
    </div>
  )
}

interface MobDoctorDetailProps { state?: DetailState }

export default memo(function MobDoctorDetail({ state = 'default' }: MobDoctorDetailProps) {
  return (
    <MobScreen>
      <MobTopBar title="Dr. Sarah Chen" back right={
        <button className="mb-icon-btn" aria-label="More options"><Icon name="moreH" size={18} color={MB.text} /></button>
      } />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: MB.bg, padding: '16px 16px 20px', borderBottom: `1px solid ${MB.line2}` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <PhotoBlock w={72} h={72} label="DR · CHEN" tone="primary" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>Dr. Sarah Chen</div>
              <div style={{ fontSize: 13, color: MB.text2, marginTop: 2 }}>Cardiology</div>
              <div style={{ fontSize: 12, color: MB.text3, marginTop: 1 }}>Cardiology Dept · Bay General</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Badge tone="success" dot size="sm">Accepting new</Badge>
                <Badge tone="neutral" size="sm">12 yrs exp.</Badge>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: MB.text2, marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>
            Board-certified cardiologist specialising in preventive cardiology, arrhythmia management, and post-MI recovery. Speaks English, Mandarin.
          </p>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="mb-h4">Available slots</div>
            <span className="mb-caption">Pacific time</span>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {DAYS.map(day => (
              <div key={day.n} role="button" tabIndex={0} aria-pressed={day.active} style={{
                width: 50, padding: '8px 0', borderRadius: 10, flexShrink: 0, textAlign: 'center', cursor: 'pointer',
                background: day.active ? MB.primary : day.free ? MB.bg : MB.bg3,
                border: `1px solid ${day.active ? MB.primary : MB.line}`,
                color: day.active ? '#fff' : day.free ? MB.text : MB.text4,
                opacity: day.free ? 1 : 0.55,
              }}>
                <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{day.d}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{day.n}</div>
                {day.free && !day.active && <div style={{ fontSize: 9, color: MB.success, marginTop: 1 }}>● free</div>}
                {!day.free && <div style={{ fontSize: 9, marginTop: 1 }}>—</div>}
              </div>
            ))}
          </div>
          {state === 'loading' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[0,1,2,3,4,5].map(i => <Skel key={i} w="100%" h={40} r={8} />)}
            </div>
          )}
          {state === 'empty' && <EmptyState icon="calendar" title="No slots on this day" body="Try another day this week." />}
          {state === 'error' && <ErrorState title="Couldn't load availability" body="We'll retry automatically." />}
          {state === 'default' && (
            <>
              <div style={{ fontSize: 12, color: MB.text3, marginBottom: 8 }}>Morning</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {SLOTS.slice(0,5).map((s,i) => <SlotBtn key={s} time={s} ampm="AM" selected={i===1} />)}
              </div>
              <div style={{ fontSize: 12, color: MB.text3, marginBottom: 8 }}>Afternoon</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {SLOTS.slice(5).map(s => <SlotBtn key={s} time={s} ampm="PM" />)}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0 }}>
        <Btn variant="primary" size="lg" full disabled={state !== 'default'}>
          Continue with Wed, May 7 · 9:30 AM
        </Btn>
      </div>
    </MobScreen>
  )
})
