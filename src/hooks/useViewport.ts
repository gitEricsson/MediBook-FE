import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

interface Viewport {
  bp: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  /** ≥ tablet */
  isWide: boolean
}

function getBreakpoint(w: number): Breakpoint {
  if (w < 768) return 'mobile'
  if (w < 1200) return 'tablet'
  return 'desktop'
}

export function useViewport(): Viewport {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'mobile'
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const mql2 = window.matchMedia('(min-width: 1200px)')

    const update = () => setBp(getBreakpoint(window.innerWidth))
    mql.addEventListener('change', update)
    mql2.addEventListener('change', update)
    update()

    return () => {
      mql.removeEventListener('change', update)
      mql2.removeEventListener('change', update)
    }
  }, [])

  return {
    bp,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
    isWide: bp !== 'mobile',
  }
}
