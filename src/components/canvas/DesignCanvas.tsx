import { memo } from 'react'
import { DCViewport } from './DCViewport'

interface DesignCanvasProps {
  children: React.ReactNode
}

export const DesignCanvas = memo(function DesignCanvas({ children }: DesignCanvasProps) {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <DCViewport>
        {children}
      </DCViewport>
    </div>
  )
})
