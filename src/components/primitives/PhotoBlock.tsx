import { memo } from 'react'

type PhotoTone = 'slate' | 'primary' | 'teal' | 'indigo' | 'amber' | 'rose'

interface PhotoBlockProps {
  w?: number
  h?: number
  label?: string
  tone?: PhotoTone
  src?: string | null
  onClick?: () => void
}

const TONE_MAP: Record<PhotoTone, { bg: string; color: string }> = {
  slate:   { bg: '#E2E8F0', color: '#475569' },
  primary: { bg: '#D1F1E0', color: '#0B7651' },
  teal:    { bg: '#CCEAE6', color: '#0E7C7B' },
  indigo:  { bg: '#DDD6FE', color: '#5B21B6' },
  amber:   { bg: '#FEF3C7', color: '#92400E' },
  rose:    { bg: '#FCE7E8', color: '#9F1239' },
}

export const PhotoBlock = memo(function PhotoBlock({ w = 96, h = 96, label = 'PHOTO', tone = 'slate', src, onClick }: PhotoBlockProps) {
  const t = TONE_MAP[tone]
  const radius = Math.min(w, h) <= 48 ? '50%' : 12
  return (
    <div
      aria-label={label}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        width: w, height: h, borderRadius: radius,
        backgroundColor: t.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mb-font-mono), ui-monospace, monospace',
        fontSize: 10, fontWeight: 600, color: t.color,
        letterSpacing: 0.08, textTransform: 'uppercase', flexShrink: 0,
        overflow: 'hidden', position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {src
        ? <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : label
      }
    </div>
  )
})
