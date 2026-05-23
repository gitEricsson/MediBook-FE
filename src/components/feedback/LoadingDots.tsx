import { memo } from 'react'
import { MB } from '@/constants/tokens'

export const LoadingDots = memo(function LoadingDots() {
  return (
    <div role="status" aria-label="Loading" style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
      {([0, 1, 2] as const).map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: MB.primary,
          animation: `mb-dot-pulse 1.2s ${i * 0.16}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  )
})
