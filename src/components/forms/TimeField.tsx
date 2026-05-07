import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

interface TimeFieldProps {
  value: string
  label?: string
}

export const TimeField = memo(function TimeField({ value, label }: TimeFieldProps) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: MB.text3, marginBottom: 4 }}>{label}</div>}
      <div style={{
        height: 36, padding: '0 12px', borderRadius: 8, border: `1px solid ${MB.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 13, fontFamily: 'var(--mb-font-mono), monospace', color: MB.text,
        background: MB.bg,
      }}>
        {value}
        <Icon name="chevronDown" size={14} color={MB.text3} />
      </div>
    </div>
  )
})
