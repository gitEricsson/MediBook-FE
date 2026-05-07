import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

interface CheckboxProps {
  checked: boolean
  label?: React.ReactNode
  onChange?: (checked: boolean) => void
}

export const Checkbox = memo(function Checkbox({ checked, label, onChange }: CheckboxProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: MB.text }}>
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onChange) onChange(!checked) }}
        onClick={() => onChange?.(!checked)}
        style={{
          width: 16, height: 16, borderRadius: 4,
          background: checked ? MB.primary : MB.bg,
          border: `1px solid ${checked ? MB.primary : MB.line}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
      </span>
      {label}
    </label>
  )
})
