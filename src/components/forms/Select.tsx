import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

type SelectOption = string | { value: string; label: string }

interface SelectProps {
  value?: string
  placeholder?: string
  error?: boolean
  disabled?: boolean
  full?: boolean
  onChange?: (value: string) => void
  options?: SelectOption[]
  'aria-label'?: string
}

export const Select = memo(function Select({
  value, placeholder, error, disabled, full = true, 'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <div
      role="combobox"
      aria-label={ariaLabel ?? placeholder}
      aria-expanded="false"
      style={{
        display: 'flex', alignItems: 'center', height: 40, borderRadius: 8,
        background: disabled ? MB.bg3 : MB.bg,
        border: `1px solid ${error ? '#FCA29B' : MB.line}`,
        padding: '0 12px', width: full ? '100%' : undefined,
        fontSize: 14, color: value ? MB.text : MB.text4,
        justifyContent: 'space-between', cursor: 'pointer',
      }}
    >
      <span>{value ?? placeholder}</span>
      <Icon name="chevronDown" size={16} color={MB.text3} />
    </div>
  )
})
