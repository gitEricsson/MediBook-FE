import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Btn } from '@/components/primitives/Btn'
import { logger } from '@/lib/logger'

interface ErrorStateProps {
  title?: string
  body?: string
  correlationId?: string
  onRetry?: () => void
}

export const ErrorState = memo(function ErrorState({
  title = 'Something went wrong',
  body = "We couldn't load this. Please try again.",
  correlationId,
  onRetry,
}: ErrorStateProps) {
  logger.error('ErrorState rendered', { title })
  return (
    <div
      role="alert"
      style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: MB.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="alert" size={22} color={MB.danger} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: MB.text }}>{title}</div>
      <div style={{ fontSize: 13, color: MB.text3, maxWidth: 280 }}>{body}</div>
      {onRetry && <Btn variant="secondary" size="sm" onClick={onRetry}>Try again</Btn>}
      {correlationId && <div style={{ fontSize: 10, color: MB.text4, marginTop: 12, opacity: 0.7 }}>Support ID: {correlationId}</div>}
    </div>
  )
})
