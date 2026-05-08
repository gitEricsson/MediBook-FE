import { memo, type ChangeEvent } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

interface TimeFieldProps {
  value: string
  label?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export const TimeField = memo(function TimeField({ value, label, onChange }: TimeFieldProps) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: MB.text3, marginBottom: 4 }}>{label}</div>}
      <div style={{
        height: 36, padding: '0 12px', borderRadius: 8, border: `1px solid ${MB.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 13, fontFamily: 'var(--mb-font-mono), monospace',
        background: MB.bg,
      }}>
        <input
          type="time"
          value={value}
          onChange={onChange}
          style={{ border: 'none', outline: 'none', background: 'transparent', color: MB.text, width: '100%' }}
        />
        <Icon name="chevronDown" size={14} color={MB.text3} />
      </div>
    </div>
  )
})
