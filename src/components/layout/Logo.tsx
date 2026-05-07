import { memo } from 'react'
import { MB } from '@/constants/tokens'

export const Logo = memo(function Logo({ size = 28 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="MediBook logo"
      style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: MB.primary, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4v16M4 12h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
})
