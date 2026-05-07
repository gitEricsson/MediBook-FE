import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface CardProps {
  children: React.ReactNode
  padding?: number | string
  style?: React.CSSProperties
  onClick?: () => void
  interactive?: boolean
}

export const Card = memo(function Card({ children, padding = 16, style, onClick, interactive }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`,
        padding, cursor: interactive ? 'pointer' : undefined,
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  )
})
