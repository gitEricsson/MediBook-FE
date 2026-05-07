import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { IconName } from '@/types/ui'

interface EmptyStateProps {
  icon?: IconName
  title?: string
  body?: string
  action?: React.ReactNode
}

export const EmptyState = memo(function EmptyState({ icon = 'inbox', title, body, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: MB.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={MB.text3} />
      </div>
      {title && <div style={{ fontSize: 15, fontWeight: 600, color: MB.text }}>{title}</div>}
      {body && <div style={{ fontSize: 13, color: MB.text3, maxWidth: 280 }}>{body}</div>}
      {action}
    </div>
  )
})
