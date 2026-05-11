import { memo } from 'react'

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
      className="mb-card"
      data-interactive={interactive || undefined}
      style={{
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
})
