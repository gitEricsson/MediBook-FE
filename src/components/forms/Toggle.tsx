import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface ToggleProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: string
}

export const Toggle = memo(function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      style={{
        width: 40, height: 24, borderRadius: 999,
        background: checked ? MB.primary : MB.line, padding: 2,
        border: 'none', cursor: 'pointer',
        transition: 'background .15s',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transform: `translateX(${checked ? 16 : 0}px)`,
        transition: 'transform .15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
})
