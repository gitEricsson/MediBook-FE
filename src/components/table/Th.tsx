import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface ThProps {
  children?: React.ReactNode
  align?: 'left' | 'right' | 'center'
  width?: number | string
}

export const Th = memo(function Th({ children, align = 'left', width }: ThProps) {
  return (
    <th scope="col" style={{
      padding: '10px 16px', textAlign: align, fontSize: 11, fontWeight: 600,
      color: MB.text3, letterSpacing: 0.04, textTransform: 'uppercase', width,
    }}>
      {children}
    </th>
  )
})
