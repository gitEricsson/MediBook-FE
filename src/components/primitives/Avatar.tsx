import { memo } from 'react'
import type { AvatarTone } from '@/types/domain'

interface AvatarProps {
  name: string
  size?: number
  tone?: AvatarTone
}

const TONE_MAP: Record<AvatarTone, { bg: string; color: string }> = {
  primary: { bg: '#D1F1E0', color: '#086043' },
  teal:    { bg: '#CCEAE6', color: '#0E7C7B' },
  indigo:  { bg: '#DDD6FE', color: '#5B21B6' },
  amber:   { bg: '#FEF3C7', color: '#92400E' },
  rose:    { bg: '#FCE7E8', color: '#9F1239' },
  slate:   { bg: '#E2E8F0', color: '#334155' },
}

export const Avatar = memo(function Avatar({ name, size = 36, tone = 'primary' }: AvatarProps) {
  const initials = (name || '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const t = TONE_MAP[tone]
  return (
    <div
      aria-label={`Avatar for ${name}`}
      role="img"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: t.bg, color: t.color,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 600, flexShrink: 0, letterSpacing: 0.02,
      }}
    >
      {initials}
    </div>
  )
})
