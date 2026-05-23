import { memo, useEffect, useRef, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { NotificationService, type NotificationItem } from '@/services/notification.service'
import { useViewport } from '@/hooks/useViewport'
import { useNotificationStore } from '@/store/notificationStore'
import type { IconName } from '@/types/ui'
import type { BadgeTone } from '@/types/ui'

const TONE_BG: Record<BadgeTone, string> = {
  primary: MB.primary50, success: MB.successBg, warn: MB.warnBg,
  danger: MB.dangerBg,   neutral: MB.bg3,
}
const TONE_COLOR: Record<BadgeTone, string> = {
  primary: MB.primary, success: MB.success, warn: MB.warn,
  danger: MB.danger,   neutral: MB.text2,
}

/**
 * Doctor-side notification preferences differ slightly from the patient:
 * messages center on incoming appointments, waiting patients, and chat
 * escalations. Same backing endpoint (/me/notifications) — the type→icon
 * mapping leans into the doctor-relevant cases.
 */
function iconForType(type: string): { icon: IconName; tone: BadgeTone } {
  if (type.includes('CANCEL'))                     return { icon: 'alert',       tone: 'danger'  }
  if (type.includes('BOOK') || type.includes('CONFIRM')) return { icon: 'check', tone: 'success' }
  if (type.includes('REMIND'))                     return { icon: 'clock',       tone: 'primary' }
  if (type.includes('EMERGENCY'))                  return { icon: 'alert',       tone: 'danger'  }
  if (type.includes('TELEMEDICINE') || type.includes('WAITING')) return { icon: 'video', tone: 'primary' }
  if (type.includes('ESCALATION') || type.includes('URGENCY'))  return { icon: 'sparkle', tone: 'warn' }
  if (type.includes('ACCESS'))                     return { icon: 'shield',      tone: 'primary' }
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

interface ListItem {
  notificationId: string
  appointmentId?: number
  icon: IconName
  tone: BadgeTone
  title: string
  body: string
  time: string
  unread: boolean
}

function NotifList({ items, state, onRetry, onClick, wide = false }: {
  items: ListItem[]
  state: 'default' | 'loading' | 'empty' | 'error'
  onRetry: () => void
  onClick: (item: ListItem) => void
  wide?: boolean
}) {
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {state === 'empty' && (
        <EmptyState icon="bell" title="You're all caught up"
          body="New appointments, cancellations, and chat alerts will show here." />
      )}
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
          {items.map((n) => (
            <li key={n.notificationId} style={{
              padding: wide ? '14px 28px' : '14px 16px',
              display: 'flex', gap: 12,
              borderBottom: `1px solid ${MB.line2}`,
              background: n.unread ? MB.primary50 : 'transparent',
              cursor: n.appointmentId ? 'pointer' : 'default',
            }}
              onClick={() => onClick(n)}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: TONE_BG[n.tone], display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={n.icon} size={17} color={TONE_COLOR[n.tone]} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: MB.text3, flexShrink: 0 }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 12, color: MB.text2, marginTop: 3, lineHeight: 1.45 }}>{n.body}</div>
              </div>
              {n.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: MB.primary, alignSelf: 'center' }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default memo(function MobDocNotifications() {
  const { isWide } = useViewport()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationService.list(),
  })

  // Click-pending kept locally so the spinner only reflects user-initiated
  // clicks. The auto-mount markAll is fire-and-forget — its lifecycle no
  // longer leaks into the button state.
  const [clickPending, setClickPending] = useState(false)
  const handleMarkAll = async () => {
    if (clickPending) return
    setClickPending(true)
    try {
      await NotificationService.markAllRead()
      setUnreadCount(0)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch {
      /* server will catch up on next list refresh */
    } finally {
      setClickPending(false)
    }
  }

  // Mark inbox as viewed once per mount — clears the badge immediately,
  // then settles server-side in the background. The mutation's lifecycle
  // intentionally does NOT drive the button's spinner.
  const clearedRef = useRef(false)
  useEffect(() => {
    if (clearedRef.current) return
    clearedRef.current = true
    setUnreadCount(0)
    NotificationService.markAllRead()
      .then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))
      .catch(() => { /* server will catch up on next list refresh */ })
  }, [setUnreadCount, queryClient])

  const items: ListItem[] = (data ?? []).map((n: NotificationItem) => {
    const { icon, tone } = iconForType(n.type)
    return {
      notificationId: n.notificationId,
      appointmentId: n.appointmentId,
      icon, tone,
      title: n.title,
      body: n.message,
      time: toRelativeTime(n.createdAt),
      unread: !n.read,
    }
  })
  const state: 'default' | 'loading' | 'empty' | 'error' =
    isLoading ? 'loading' : isError ? 'error' : items.length === 0 ? 'empty' : 'default'

  const handleClick = (item: ListItem) => {
    if (item.appointmentId) {
      navigate(`/doctor/appt/${item.appointmentId}`)
    }
  }

  if (isWide) {
    return (
      <DoctorShell title="Notifications" actions={
        items.length > 0
          ? <Btn variant="secondary" size="sm" icon="check" loading={clickPending} onClick={handleMarkAll}>Mark all read</Btn>
          : undefined
      }>
        <NotifList items={items} state={state} onRetry={() => refetch()} onClick={handleClick} wide />
      </DoctorShell>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title="Notifications" right={
        items.length > 0
          ? <button className="mb-icon-btn" aria-label="Mark all as read" onClick={handleMarkAll} disabled={clickPending}>
              <Icon name="check" size={18} color={MB.text2} />
            </button>
          : undefined
      } />
      <NotifList items={items} state={state} onRetry={() => refetch()} onClick={handleClick} />
      <MobTabBar role="doctor" active="notifications" />
    </MobScreen>
  )
})
