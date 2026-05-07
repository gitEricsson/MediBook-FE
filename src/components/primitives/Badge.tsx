import { memo } from 'react'
import { MB } from '@/constants/tokens'
import type { BadgeTone } from '@/types/ui'

interface BadgeProps {
  children: React.ReactNode
  tone?: BadgeTone
  dot?: boolean
  size?: 'sm' | 'md'
}

const TONE_MAP: Record<BadgeTone, { bg: string; color: string; dot: string }> = {
  neutral: { bg: MB.bg3,       color: MB.text2,     dot: MB.text3   },
  primary: { bg: MB.primary50, color: MB.primary600, dot: MB.primary },
  success: { bg: MB.successBg, color: MB.success,    dot: MB.success },
  warn:    { bg: MB.warnBg,    color: MB.warn,       dot: MB.warn    },
  danger:  { bg: MB.dangerBg,  color: MB.danger,     dot: MB.danger  },
}

export const Badge = memo(function Badge({ children, tone = 'neutral', dot, size = 'md' }: BadgeProps) {
  const t = TONE_MAP[tone]
  const s = size === 'sm' ? { fs: 11, py: 2, px: 6 } : { fs: 12, py: 3, px: 8 }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${s.py}px ${s.px}px`, borderRadius: 999,
      background: t.bg, color: t.color,
      fontSize: s.fs, fontWeight: 600, letterSpacing: 0.01, whiteSpace: 'nowrap',
    }}>
      {dot && <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }} />}
      {children}
    </span>
  )
})
