import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface DCSectionProps {
  title: string
  children: React.ReactNode
}

export const DCSection = memo(function DCSection({ title, children }: DCSectionProps) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ 
        fontSize: 12, 
        fontWeight: 600, 
        color: MB.text3, 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        marginBottom: 16,
        paddingLeft: 4
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {children}
      </div>
    </section>
  )
})
