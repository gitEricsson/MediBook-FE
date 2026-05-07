import { memo } from 'react'

interface SkelProps {
  w?: number | string
  h?: number | string
  style?: React.CSSProperties
  r?: number
}

export const Skel = memo(function Skel({ w = '100%', h = 14, style, r = 4 }: SkelProps) {
  return (
    <span
      className="mb-skel"
      aria-hidden="true"
      style={{ width: w, height: h, borderRadius: r, display: 'block', ...style }}
    />
  )
})
