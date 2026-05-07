import { memo } from 'react'
import { MB } from '@/constants/tokens'

const MB_NAV_H = 56

interface MobTopBarProps {
  title?: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
  transparent?: boolean
}

export const MobTopBar = memo(function MobTopBar({ title, subtitle, back, right, transparent }: MobTopBarProps) {
  return (
    <header style={{
      height: MB_NAV_H, padding: '0 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: transparent ? 'transparent' : MB.bg,
      borderBottom: transparent ? 'none' : `1px solid ${MB.line2}`,
      gap: 8, flexShrink: 0,
    }}>
      <div style={{ width: 36, display: 'flex' }}>
        {back && (
          <button
            aria-label="Go back"
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={MB.text} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-9 6 9 6" />
            </svg>
          </button>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {title && (
          <h1 style={{ fontSize: 15, fontWeight: 600, color: MB.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {title}
          </h1>
        )}
        {subtitle && <div style={{ fontSize: 11, color: MB.text3, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </header>
  )
})
