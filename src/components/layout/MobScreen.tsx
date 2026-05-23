import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface MobScreenProps {
  children: React.ReactNode
  bg?: string
}

export const MobScreen = memo(function MobScreen({ children, bg = MB.bg2 }: MobScreenProps) {
  return (
    <main className="mb-mobile-screen" style={{
      width: '100%', minHeight: '100vh', background: bg,
      display: 'flex', justifyContent: 'center', overflow: 'hidden',
    }}>
      <div className="mb-mobile-screen-frame" style={{
        width: '100%', minHeight: '100vh', background: bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        paddingTop: 50,
      }}>
        {children}
      </div>
    </main>
  )
})
