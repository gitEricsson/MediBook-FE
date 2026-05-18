import { memo, useEffect, useRef } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { IconName } from '@/types/ui'
import type { BadgeTone } from '@/types/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/services/notification.service'
import type { NotificationItem } from '@/services/notification.service'
import { useViewport } from '@/hooks/useViewport'
import { useNotificationStore } from '@/store/notificationStore'

type NotifState = 'default' | 'loading' | 'empty'

interface NotifItem {
  type: string; icon: IconName; tone: BadgeTone
  title: string; body: string; time: string; unread?: boolean
}

const TONE_BG: Record<BadgeTone, string> = {
  primary: MB.primary50, success: MB.successBg, warn: MB.warnBg,
  danger: MB.dangerBg,   neutral: MB.bg3,
}
const TONE_COLOR: Record<BadgeTone, string> = {
  primary: MB.primary, success: MB.success, warn: MB.warn,
  danger: MB.danger,   neutral: MB.text2,
}

const iconForType = (type: string): { icon: IconName; tone: BadgeTone } => {
  if (type.includes('CANCEL')) return { icon: 'alert', tone: 'danger' }
  if (type.includes('BOOK') || type.includes('CONFIRM')) return { icon: 'check', tone: 'success' }
  if (type.includes('REMIND')) return { icon: 'clock', tone: 'primary' }
  return { icon: 'inbox', tone: 'neutral' }
}

function toRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface MobNotificationsProps { state?: NotifState }

// ── Notification list (shared) ────────────────────────────────────────────────
function NotifList({ items, state, onRetry, wide = false }: {
  items: NotifItem[]; state: NotifState | 'error' | 'loading'
  onRetry: () => void; wide?: boolean
}) {
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {state === 'empty' && <EmptyState icon="bell" title="You're all caught up" body="Reminders and updates about your visits will show here." />}
      {state === 'error' && <ErrorState title="Couldn't load notifications" onRetry={onRetry} />}
      {state === 'loading' && (
        <div style={{ padding: wide ? '24px 28px' : 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
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
        <ul style={{ listStyle: 'none', margin: 0, padding: wide ? '8px 0' : 0 }}>
          {items.map((n, i) => (
            <li key={i} style={{
              padding: wide ? '14px 28px' : '14px 16px',
              display: 'flex', gap: 12,
              borderBottom: `1px solid ${MB.line2}`,
              background: n.unread ? `${MB.primary50}66` : 'transparent',
              maxWidth: wide ? 720 : undefined,
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TONE_BG[n.tone] }}>
                <Icon name={n.icon} size={17} color={TONE_COLOR[n.tone]} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: MB.text3, flexShrink: 0 }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 13, color: MB.text2, marginTop: 2, lineHeight: 1.45 }}>{n.body}</div>
              </div>
              {n.unread && <div aria-label="Unread" style={{ width: 8, height: 8, borderRadius: '50%', background: MB.primary, marginTop: 6, flexShrink: 0 }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default memo(function MobNotifications({ state = 'default' }: MobNotificationsProps) {
  const { isWide } = useViewport()
  const queryClient = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationService.list(),
  })
  const markAll = useMutation({
    mutationFn: NotificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // Opening the panel counts as "viewed" — clear the badge immediately so the
  // red ping disappears on the tab bar, then fire markAllRead asynchronously so
  // the server state matches. Runs once per mount.
  const clearedRef = useRef(false)
  useEffect(() => {
    if (clearedRef.current) return
    clearedRef.current = true
    setUnreadCount(0)
    markAll.mutate(undefined, { onError: () => { /* server will catch up on next list refresh */ } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items: NotifItem[] = (data ?? []).map((n: NotificationItem) => {
    const { icon, tone } = iconForType(n.type)
    return {
      type: n.type,
      icon,
      tone,
      title: n.title,
      body: n.message,
      time: toRelativeTime(n.createdAt),
      unread: !n.read,
    }
  })
  const resolvedState: NotifState | 'error' = isLoading ? 'loading' : isError ? 'error' : items.length === 0 ? 'empty' : state

  if (isWide) {
    return (
      <PatientShell title="Notifications" actions={
        items.length > 0 ? <Btn variant="secondary" size="sm" icon="check" onClick={() => markAll.mutate()} loading={markAll.isPending}>Mark all read</Btn> : undefined
      }>
        <NotifList items={items} state={resolvedState} onRetry={() => refetch()} wide />
      </PatientShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Notifications" right={
        <button className="mb-icon-btn" aria-label="Mark all as read" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          <Icon name="check" size={18} color={MB.text2} />
        </button>
      } />
      <NotifList items={items} state={resolvedState} onRetry={() => refetch()} />
    </MobScreen>
  )
})
