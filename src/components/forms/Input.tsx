import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { IconName, Size } from '@/types/ui'

interface InputProps {
  id?: string
  value?: string
  placeholder?: string
  icon?: IconName
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date'
  error?: boolean | string | null
  disabled?: boolean
  suffix?: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  full?: boolean
  size?: Size
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
  /** Native HTML min — used by number/date inputs */
  min?: number | string
  /** Native HTML max — used by number/date inputs */
  max?: number | string
  /** Native HTML step — used by number inputs */
  step?: number | string
  style?: React.CSSProperties
  'aria-label'?: string
  'aria-describedby'?: string
}

export const Input = memo(function Input({
  id, value, placeholder, icon, type = 'text', error, disabled, suffix,
  onChange, onKeyDown, full = true, size = 'md', autoComplete, inputMode, maxLength,
  min, max, step,
  style, 'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: InputProps) {
  const h = size === 'sm' ? 34 : size === 'lg' ? 48 : 40
  const hasError = !!error
  return (
    <div
      className="mb-input-shell"
      data-invalid={hasError || undefined}
      data-disabled={disabled || undefined}
      style={{
        '--mb-input-height': `${h}px`,
        '--mb-input-width': full ? '100%' : undefined,
        ...style,
      } as React.CSSProperties}
    >
      {icon && (
        <span style={{ paddingLeft: 12, display: 'flex', color: MB.text3 }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        disabled={disabled} onChange={onChange} onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-invalid={hasError || undefined}
        style={{
          flex: 1, height: '100%', border: 'none', outline: 'none',
          background: 'transparent', padding: icon ? '0 12px 0 8px' : '0 12px',
          fontSize: 14, color: MB.text, fontFamily: 'inherit',
        }}
      />
      {suffix && <span style={{ paddingRight: 12, color: MB.text3, fontSize: 13 }}>{suffix}</span>}
    </div>
  )
})
