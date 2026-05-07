import { memo, useState, useEffect, useCallback } from 'react'
import { MB } from '@/constants/tokens'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'

interface Step {
  title: string
  body: string
  targetSelector?: string // Optional: if we want to point to something specific
}

const STEPS: Step[] = [
  {
    title: 'Welcome to MediBook',
    body: 'Your new health companion is ready. Let’s take a quick look at how to get started.'
  },
  {
    title: 'Find the Right Care',
    body: 'Search for doctors by specialty, department, or location. Real-time availability makes booking a breeze.'
  },
  {
    title: 'Manage Your Visits',
    body: 'Keep track of upcoming appointments and access your consultation notes anytime, anywhere.'
  }
]

export const TourOverlay = memo(function TourOverlay() {
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('mb_tour_seen')
    if (!seen) {
      // Delay slightly to let the initial load finish
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const finish = useCallback(() => {
    localStorage.setItem('mb_tour_seen', 'true')
    setIsVisible(false)
  }, [])

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      finish()
    }
  }, [step, finish])

  if (!isVisible) return null

  const currentStep = STEPS[step]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(11, 18, 32, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 11000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      animation: 'mb-fade-in 0.3s ease-out'
    }}>
      <style>{`
        @keyframes mb-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mb-slide-up-scale { 
          from { transform: translateY(20px) scale(0.95); opacity: 0; } 
          to { transform: translateY(0) scale(1); opacity: 1; } 
        }
      `}</style>
      
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: MB.bg,
        borderRadius: 20,
        padding: '32px 24px 24px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
        textAlign: 'center',
        position: 'relative',
        animation: 'mb-slide-up-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: MB.primary50,
          color: MB.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          {step === 0 && <Icon name="sparkle" size={28} strokeWidth={2} />}
          {step === 1 && <Icon name="search" size={28} strokeWidth={2} />}
          {step === 2 && <Icon name="calendar" size={28} strokeWidth={2} />}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: MB.ink, marginBottom: 12 }}>
          {currentStep.title}
        </h2>
        
        <p style={{ fontSize: 14, color: MB.text2, lineHeight: 1.6, marginBottom: 28 }}>
          {currentStep.body}
        </p>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === step ? MB.primary : MB.line,
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
              Back
            </Btn>
          )}
          <Btn variant="primary" size="lg" style={{ flex: 2 }} onClick={next}>
            {step === STEPS.length - 1 ? 'Get started' : 'Continue'}
          </Btn>
        </div>

        <button 
          onClick={finish}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            color: MB.text4
          }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  )
})
