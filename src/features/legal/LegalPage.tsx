import { memo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Logo } from '@/components/layout/Logo'
import { Icon } from '@/components/primitives/Icon'

interface LegalPageProps {
  title: string
  subtitle?: string
  lastUpdated: string
  children: ReactNode
}

/**
 * Shared layout for static legal pages (Terms, Privacy).
 * Responsive — picks mobile shell on narrow viewports and a centered desktop
 * column on wider ones. Designed for long-form, scannable reading.
 */
export const LegalPage = memo(function LegalPage({ title, subtitle, lastUpdated, children }: LegalPageProps) {
  const navigate = useNavigate()
  const isWide = typeof window !== 'undefined' && window.innerWidth >= 1024

  const body = (
    <article style={{
      maxWidth: 760, margin: '0 auto', padding: isWide ? '40px 32px 80px' : '16px 16px 56px',
      color: MB.text, fontSize: 15, lineHeight: 1.7,
    }}>
      {/* Hero */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Logo size={32} />
          <span style={{ fontSize: 13, fontWeight: 600, color: MB.text3, letterSpacing: '0.02em' }}>MEDIBOOK</span>
        </div>
        <h1 style={{
          fontSize: isWide ? 36 : 26, fontWeight: 800, color: MB.ink,
          letterSpacing: '-0.02em', margin: '0 0 8px',
        }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 15, color: MB.text2, margin: '0 0 12px', lineHeight: 1.5 }}>{subtitle}</p>
        )}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: MB.primary50, borderRadius: 999,
          fontSize: 12, color: MB.primary700, fontWeight: 600,
        }}>
          <Icon name="clock" size={12} color={MB.primary700} />
          Last updated {lastUpdated}
        </div>
      </header>

      {children}

      {/* Contact block */}
      <section style={{
        marginTop: 48, padding: 20, background: MB.bg, border: `1px solid ${MB.line2}`,
        borderRadius: 12,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: MB.ink, margin: '0 0 6px' }}>Questions?</h3>
        <p style={{ margin: 0, fontSize: 14, color: MB.text2 }}>
          Reach our team at <a href="mailto:support@medibook.health" style={{ color: MB.primary, fontWeight: 600 }}>support@medibook.health</a>.
        </p>
      </section>
    </article>
  )

  if (isWide) {
    return (
      <div style={{ minHeight: '100vh', background: MB.bg2, overflow: 'auto' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={() => navigate('/')} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
            border: 'none', cursor: 'pointer', color: MB.text2, fontSize: 14, fontFamily: 'inherit',
          }}>
            <Icon name="chevronLeft" size={16} color={MB.text2} />
            Back to MediBook
          </button>
        </div>
        {body}
      </div>
    )
  }

  return (
    <MobScreen>
      <MobTopBar title={title} back />
      <div style={{ flex: 1, overflow: 'auto' }}>{body}</div>
    </MobScreen>
  )
})

/** Section heading — consistent typography across legal pages. */
export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} style={{ marginTop: 36 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: MB.ink, letterSpacing: '-0.01em',
        margin: '0 0 12px', paddingBottom: 8, borderBottom: `1px solid ${MB.line2}`,
      }}>{title}</h2>
      <div>{children}</div>
    </section>
  )
}

/** Callout block for highlighted statements (e.g. "We never sell your data"). */
export function Callout({ tone = 'primary', children }: { tone?: 'primary' | 'warn'; children: ReactNode }) {
  const bg = tone === 'warn' ? MB.warnBg : MB.primary50
  const color = tone === 'warn' ? MB.warn : MB.primary700
  return (
    <div style={{
      padding: '12px 16px', background: bg, borderRadius: 10,
      fontSize: 14, color, fontWeight: 500, lineHeight: 1.5, margin: '12px 0',
    }}>
      {children}
    </div>
  )
}
