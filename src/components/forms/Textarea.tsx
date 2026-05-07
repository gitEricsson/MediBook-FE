import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface TextareaProps {
  id?: string
  value?: string
  placeholder?: string
  rows?: number
  error?: boolean
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  readOnly?: boolean
}

export const Textarea = memo(function Textarea({ id, value, placeholder, rows = 4, error, onChange, readOnly }: TextareaProps) {
  return (
    <textarea
      id={id} value={value} placeholder={placeholder} rows={rows}
      readOnly={readOnly} onChange={onChange}
      aria-invalid={error || undefined}
      style={{
        width: '100%', padding: '10px 12px', fontSize: 14,
        fontFamily: 'inherit', borderRadius: 8,
        border: `1px solid ${error ? '#FCA29B' : MB.line}`,
        background: MB.bg, color: MB.text, resize: 'none', outline: 'none',
        lineHeight: 1.5,
      }}
    />
  )
})
