import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

interface TweaksPanelProps {
  title?: string
  children: React.ReactNode
}

export const TweaksPanel = memo(function TweaksPanel({ title = 'Design Tweaks', children }: TweaksPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: MB.primary,
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(14,138,95,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Icon name="settings" size={20} color="#fff" />
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 280,
      maxHeight: 'calc(100vh - 48px)',
      background: MB.bg,
      borderRadius: 12,
      border: `1px solid ${MB.line}`,
      boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'twk-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes twk-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: `1px solid ${MB.line2}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: MB.bg2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="settings" size={14} color={MB.primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: MB.ink }}>{title}</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            color: MB.text4
          }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {children}
      </div>
      <div style={{ 
        padding: '10px 16px', 
        background: MB.bg2, 
        borderTop: `1px solid ${MB.line2}`,
        fontSize: 10,
        fontWeight: 600,
        color: MB.text4,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>
        MediBook Design System v1.0
      </div>
    </div>
  )
})
