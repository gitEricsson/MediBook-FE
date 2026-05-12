import { useState, useEffect, useRef, useCallback } from 'react'

// ── Reduced-motion guard ──────────────────────────────────────────────────────
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ── Typewriter ────────────────────────────────────────────────────────────────
export function useTypewriter(words: string[], speed = 55, pause = 1800) {
  const [displayed, setDisplayed] = useState(() => prefersReducedMotion() ? words[0] : '')
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'erasing'>('typing')

  useEffect(() => {
    if (prefersReducedMotion()) return
    const word = words[wordIndex % words.length]
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        timer = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), speed)
      } else {
        timer = setTimeout(() => setPhase('pausing'), pause)
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => setPhase('erasing'), 200)
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), speed / 2)
      } else {
        timer = setTimeout(() => { setWordIndex((i) => i + 1); setPhase('typing') }, speed / 2)
      }
    }
    return () => clearTimeout(timer)
  }, [displayed, phase, wordIndex, words, speed, pause])

  return { displayed, isTyping: phase === 'typing' }
}

// ── Count-up ──────────────────────────────────────────────────────────────────
export function useCountUp(target: number, duration = 2200, formatter?: (n: number) => string) {
  const [count, setCount] = useState(prefersReducedMotion() ? target : 0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return
      started.current = true

      const startTime = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3)
        setCount(Math.round(eased * target))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      observer.disconnect()
    }, { threshold: 0.3 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref, display: formatter ? formatter(count) : String(count) }
}

// ── Scroll reveal (single element) ───────────────────────────────────────────
export function useScrollReveal(delay = 0, threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(prefersReducedMotion())

  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      const t = setTimeout(() => setVisible(true), delay)
      observer.disconnect()
      return () => clearTimeout(t)
    }, { threshold })

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return { ref, visible }
}

// ── Staggered reveal for a list ───────────────────────────────────────────────
export function useStaggerReveal(count: number, baseDelay = 80, threshold = 0.1) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(prefersReducedMotion() ? count : 0)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      // Reveal items one by one
      let i = 0
      const tick = () => {
        setVisibleCount((v) => v + 1)
        i++
        if (i < count) setTimeout(tick, baseDelay)
      }
      tick()
      observer.disconnect()
    }, { threshold })

    observer.observe(el)
    return () => observer.disconnect()
  }, [count, baseDelay, threshold])

  return { containerRef, visibleCount }
}

// ── Parallax ──────────────────────────────────────────────────────────────────
export function useParallax(speed = 0.25) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf: number
    const handleScroll = () => {
      raf = requestAnimationFrame(() => setOffset(window.scrollY * speed))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(raf)
    }
  }, [speed])

  return offset
}

// ── Scroll fill progress (for text-fill reveal) ───────────────────────────────
export function useScrollFill() {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(() => prefersReducedMotion() ? 1 : 0)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf: number
    const handleScroll = () => {
      raf = requestAnimationFrame(() => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const vh = window.innerHeight
        // Start filling when element top enters bottom 30% of viewport
        // Complete when element centre passes viewport centre
        const start = vh * 0.85
        const end = vh * 0.35
        const p = Math.max(0, Math.min(1, (start - rect.top) / (start - end)))
        setProgress(p)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return { ref, progress }
}

// ── Carousel (touch + keyboard) ───────────────────────────────────────────────
export function useCarousel(total: number) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total])
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total])
  const goTo = useCallback((i: number) => setIndex(i), [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 40) { if (dx > 0) next(); else prev() }
    touchStartX.current = null
  }, [next, prev])

  return { index, prev, next, goTo, onTouchStart, onTouchEnd }
}

// ── Hover liquid fill ─────────────────────────────────────────────────────────
export function useLiquidHover() {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || prefersReducedMotion()) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    ref.current.style.setProperty('--liquid-x', `${x}%`)
    ref.current.style.setProperty('--liquid-y', `${y}%`)
    ref.current.style.setProperty('--liquid-scale', '0')
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.setProperty('--liquid-scale', '3')
    })
  }, [])

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.setProperty('--liquid-scale', '0')
  }, [])

  return { ref, onMouseEnter, onMouseLeave }
}
