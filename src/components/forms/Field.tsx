import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

interface FieldProps {
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  optional?: boolean
  children: React.ReactNode
  htmlFor?: string
}

export const Field = memo(function Field({ label, hint, error, required, optional, children, htmlFor }: FieldProps) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: MB.text, display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {label}
            {required && <span aria-hidden="true" style={{ color: MB.danger, marginLeft: 2 }}>*</span>}
            {required && <span className="sr-only"> (required)</span>}
          </span>
          {optional && <span style={{ color: MB.text3, fontWeight: 400 }}>Optional</span>}
        </span>
      )}
      {children}
      {error ? (
        <span role="alert" style={{ fontSize: 12, color: MB.danger, display: 'flex', gap: 4, alignItems: 'center' }}>
          <Icon name="alert" size={12} color={MB.danger} /> {error}
        </span>
      ) : hint ? (
        <span style={{ fontSize: 12, color: MB.text3 }}>{hint}</span>
      ) : null}
    </label>
  )
})
