import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface DCFocusOverlayProps {
  visible: boolean
  targetRect?: DOMRect
}

export const DCFocusOverlay = memo(function DCFocusOverlay({ visible, targetRect }: DCFocusOverlayProps) {
  if (!visible || !targetRect) return null

  return (
    <div style={{
      position: 'fixed',
      top: targetRect.top - 4,
      left: targetRect.left - 4,
      width: targetRect.width + 8,
      height: targetRect.height + 8,
      border: `2px solid ${MB.primary}`,
      borderRadius: 6,
      pointerEvents: 'none',
      zIndex: 9999,
      transition: 'all 0.15s ease-out',
      boxShadow: `0 0 0 4000px rgba(0,0,0,0.1)`
    }}>
      <div style={{
        position: 'absolute',
        top: -24,
        right: -2,
        background: MB.primary,
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: '4px 4px 0 0',
        textTransform: 'uppercase',
        letterSpacing: '0.02em'
      }}>
        Editing
      </div>
    </div>
  )
})
