import { memo, useState, useEffect, useRef } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { IconName } from '@/types/ui'

export interface RowMenuAction {
  label: string
  icon?: IconName
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface RowMenuProps {
  items?: RowMenuAction[]
  'aria-label'?: string
}

export const RowMenu = memo(function RowMenu({ items = [], 'aria-label': ariaLabel = 'Row actions' }: RowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const pointerHandler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', pointerHandler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', pointerHandler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  if (!items.length) {
    return (
      <button
        aria-label={ariaLabel}
        disabled
        style={{
          width: 28, height: 28, borderRadius: 6, border: 'none',
          background: 'transparent', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'not-allowed', opacity: 0.25,
        }}
      >
        <Icon name="moreH" size={16} color={MB.text3} />
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 28, height: 28, borderRadius: 6, border: 'none',
          background: open ? MB.bg3 : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="moreH" size={16} color={MB.text3} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 200,
            minWidth: 180, overflow: 'hidden',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => { item.onClick(); setOpen(false) }}
              style={{
                width: '100%', padding: '10px 14px', border: 'none',
                background: 'transparent', display: 'flex', alignItems: 'center',
                gap: 10, cursor: item.disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
                color: item.danger ? MB.danger : MB.text, textAlign: 'left',
                fontFamily: 'inherit',
                opacity: item.disabled ? 0.55 : 1,
                borderBottom: i < items.length - 1 ? `1px solid ${MB.line2}` : 'none',
              }}
              onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = MB.bg2 }}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {item.icon && (
                <Icon name={item.icon} size={15} color={item.danger ? MB.danger : MB.text3} />
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
