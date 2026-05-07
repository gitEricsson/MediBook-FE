import { memo } from 'react'
import { MB } from '@/constants/tokens'

interface TdProps {
  children?: React.ReactNode
  align?: 'left' | 'right' | 'center'
  mono?: boolean
  width?: number | string
}

export const Td = memo(function Td({ children, align = 'left', mono, width }: TdProps) {
  return (
    <td style={{
      padding: '14px 16px', textAlign: align, fontSize: 13, color: MB.text,
      fontFamily: mono ? 'var(--mb-font-mono), monospace' : 'inherit',
      width, verticalAlign: 'middle',
    }}>
      {children}
    </td>
  )
})
