import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Toggle } from '@/components/forms/Toggle'

interface TweakControlProps {
  label: string
  children: React.ReactNode
}

const TweakControl = memo(function TweakControl({ label, children }: TweakControlProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: MB.text2 }}>{label}</span>
      {children}
    </div>
  )
})

export const TweakToggle = memo(function TweakToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (val: boolean) => void }) {
  return (
    <TweakControl label={label}>
      <Toggle checked={value} onChange={onChange} />
    </TweakControl>
  )
})

export const TweakSelect = memo(function TweakSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (val: string) => void }) {
  return (
    <TweakControl label={label}>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 11,
          padding: '2px 4px',
          borderRadius: 4,
          border: `1px solid ${MB.line}`,
          background: MB.bg,
          color: MB.text
        }}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </TweakControl>
  )
})

export const TweakInput = memo(function TweakInput({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <TweakControl label={label}>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 11,
          padding: '2px 4px',
          borderRadius: 4,
          border: `1px solid ${MB.line}`,
          background: MB.bg,
          color: MB.text,
          width: 80,
          textAlign: 'right'
        }}
      />
    </TweakControl>
  )
})
