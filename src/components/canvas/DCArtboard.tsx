import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface DCArtboardProps {
  title: string
  width: number | string
  height: number | string
  children: React.ReactNode
}

export const DCArtboard = memo(function DCArtboard({ title, width, height, children }: DCArtboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: MB.text4, display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span>{width} × {height}</span>
      </div>
      <div style={{ 
        width, 
        height, 
        background: MB.bg, 
        borderRadius: 8, 
        border: `1px solid ${MB.line}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {children}
      </div>
    </div>
  )
})
