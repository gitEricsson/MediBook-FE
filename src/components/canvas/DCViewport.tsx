import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface DCViewportProps {
  children: React.ReactNode
  zoom?: number
}

export const DCViewport = memo(function DCViewport({ children, zoom = 1 }: DCViewportProps) {
  return (
    <div style={{ 
      flex: 1, 
      overflow: 'auto', 
      background: MB.bg3,
      padding: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: 0
    }}>
      <div style={{ 
        transform: `scale(${zoom})`, 
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease-out'
      }}>
        {children}
      </div>
    </div>
  )
})
