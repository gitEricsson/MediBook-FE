import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { IconName, Size } from '@/types/ui'

interface InputProps {
  id?: string
  value?: string
  placeholder?: string
  icon?: IconName
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  error?: boolean | string | null
  disabled?: boolean
  suffix?: React.ReactNode
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  full?: boolean
  size?: Size
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
  'aria-label'?: string
  'aria-describedby'?: string
}

export const Input = memo(function Input({
  id, value, placeholder, icon, type = 'text', error, disabled, suffix,
  onChange, full = true, size = 'md', autoComplete, inputMode, maxLength, 'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: InputProps) {
  const h = size === 'sm' ? 34 : size === 'lg' ? 48 : 40
  const hasError = !!error
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      height: h, borderRadius: 8,
      background: disabled ? MB.bg3 : MB.bg,
      border: `1px solid ${hasError ? '#FCA29B' : MB.line}`,
      width: full ? '100%' : undefined,
      boxShadow: hasError ? '0 0 0 3px rgba(180,35,24,0.10)' : 'none',
    }}>
      {icon && (
        <span style={{ paddingLeft: 12, display: 'flex', color: MB.text3 }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        disabled={disabled} onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
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
