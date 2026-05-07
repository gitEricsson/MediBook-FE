import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'

interface DCEditableProps {
  value: string
  onSave: (val: string) => void
  style?: React.CSSProperties
}

export const DCEditable = memo(function DCEditable({ value, onSave, style }: DCEditableProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(value)

  if (isEditing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setIsEditing(false)
          onSave(val)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false)
            onSave(val)
          }
        }}
        style={{
          border: `1px solid ${MB.primary}`,
          borderRadius: 4,
          padding: '2px 4px',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          color: 'inherit',
          fontFamily: 'inherit',
          background: MB.bg,
          width: '100%',
          outline: 'none',
          ...style
        }}
      />
    )
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      style={{ 
        cursor: 'text',
        border: '1px solid transparent',
        borderRadius: 4,
        padding: '2px 4px',
        margin: '-3px -5px',
        transition: 'border-color 0.1s',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = MB.primary100
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {value}
    </div>
  )
})
