import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

interface RowMenuProps {
  onEdit?: () => void
  onDelete?: () => void
  'aria-label'?: string
}

export const RowMenu = memo(function RowMenu({ 'aria-label': ariaLabel = 'Row actions' }: RowMenuProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-haspopup="menu"
      style={{
        width: 28, height: 28, borderRadius: 6, border: 'none',
        background: 'transparent', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}
    >
      <Icon name="moreH" size={16} color={MB.text3} />
    </button>
  )
})
