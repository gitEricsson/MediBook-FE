import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface DeskTopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const DeskTopbar = memo(function DeskTopbar({ title, subtitle, actions }: DeskTopbarProps) {
  return (
    <div className="mb-desk-topbar" style={{
      height: 64, padding: '0 28px', background: MB.bg,
      borderBottom: `1px solid ${MB.line2}`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <h1 style={{ fontSize: 19, fontWeight: 700, color: MB.ink, margin: 0, letterSpacing: 0 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div className="mb-desk-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>
    </div>
  )
})
