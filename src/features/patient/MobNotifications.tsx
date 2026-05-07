import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { IconName } from '@/types/ui'
import type { BadgeTone } from '@/types/ui'

type NotifState = 'default' | 'loading' | 'empty'

interface NotifItem {
  type: string; icon: IconName; tone: BadgeTone
  title: string; body: string; time: string; unread?: boolean
}

const ITEMS: NotifItem[] = [
  { type: 'reminder',    icon: 'clock',    tone: 'primary', title: 'Tomorrow: Dr. Sarah Chen',  body: 'Your visit is at 9:30 AM. Tap to add to calendar.', time: '2h ago', unread: true },
  { type: 'confirmed',   icon: 'check',    tone: 'success', title: 'Appointment confirmed',      body: 'Mon, May 19 · 3:00 PM with Dr. Marcus Okafor',     time: '1d ago', unread: true },
  { type: 'rescheduled', icon: 'calendar', tone: 'warn',    title: 'Doctor rescheduled',         body: 'Dr. Whitfield moved your visit from Apr 28 to May 9, 2:15 PM.', time: '5d ago' },
  { type: 'note',        icon: 'inbox',    tone: 'neutral', title: 'New consultation note',      body: 'Dr. Chen added notes from your Apr 12 visit.',     time: '3w ago' },
]

const TONE_BG: Record<BadgeTone, string> = {
  primary: MB.primary50, success: MB.successBg, warn: MB.warnBg,
  danger: MB.dangerBg,   neutral: MB.bg3,
}
const TONE_COLOR: Record<BadgeTone, string> = {
  primary: MB.primary, success: MB.success, warn: MB.warn,
  danger: MB.danger,   neutral: MB.text2,
}

interface MobNotificationsProps { state?: NotifState }

export default memo(function MobNotifications({ state = 'default' }: MobNotificationsProps) {
  return (
    <MobScreen>
      <MobTopBar title="Notifications" right={
        <button className="mb-icon-btn" aria-label="Mark all as read">
          <Icon name="check" size={18} color={MB.text2} />
        </button>
      } />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {state === 'empty' && <EmptyState icon="bell" title="You're all caught up" body="Reminders and updates about your visits will show here." />}
        {state === 'loading' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <Skel w={40} h={40} r={10} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skel w="60%" h={13} /><Skel w="90%" h={11} />
                </div>
              </div>
            ))}
          </div>
        )}
        {state === 'default' && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {ITEMS.map((n, i) => (
              <li key={i} style={{
                padding: '14px 16px', display: 'flex', gap: 12,
                borderBottom: `1px solid ${MB.line2}`,
                background: n.unread ? `${MB.primary50}66` : 'transparent',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TONE_BG[n.tone] }}>
                  <Icon name={n.icon} size={18} color={TONE_COLOR[n.tone]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{n.title}</span>
                    <span style={{ fontSize: 11, color: MB.text3, flexShrink: 0 }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: MB.text2, marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                </div>
                {n.unread && <div aria-label="Unread" style={{ width: 8, height: 8, borderRadius: '50%', background: MB.primary, marginTop: 6, flexShrink: 0 }} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobScreen>
  )
})
