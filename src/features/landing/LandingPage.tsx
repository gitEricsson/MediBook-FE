/**
 * MediBook — Kinetic Landing Page
 * Animations: typewriter · animated counters · scroll-reveal · parallax ·
 *             glass cards · liquid-fill hover · mobile carousel · text-fill reveal
 * All effects respect prefers-reduced-motion.
 */
import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { Logo } from '@/components/layout/Logo'
import { Icon } from '@/components/primitives/Icon'
import {
  useTypewriter, useCountUp, useScrollReveal, useStaggerReveal,
  useParallax, useScrollFill, useCarousel, prefersReducedMotion, useIsMobile,
} from '@/hooks/useAnimation'
import { ContactSection } from './ContactSection'

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION CSS (injected once)
// ─────────────────────────────────────────────────────────────────────────────
const ANIM_CSS = `
@keyframes lp-fade-up   { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:none } }
@keyframes lp-fade-in   { from { opacity:0 } to { opacity:1 } }
@keyframes lp-scale-in  { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:none } }
@keyframes lp-slide-left{ from { opacity:0; transform:translateX(32px) } to { opacity:1; transform:none } }
@keyframes lp-gear-spin { to { transform:rotate(360deg) } }
@keyframes lp-gear-rev  { to { transform:rotate(-360deg) } }
@keyframes lp-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
@keyframes lp-pulse-ring{ 0%{transform:scale(.9);opacity:.7} 100%{transform:scale(1.6);opacity:0} }
@keyframes lp-cursor    { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes lp-shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes lp-count-bar { from{width:0} to{width:var(--bar-w,60%)} }
@keyframes lp-bar-fill  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
@keyframes lp-dot-pop   { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
@keyframes lp-nav-in    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }

/* Scroll-reveal base classes */
.lp-reveal        { opacity:0; transform:translateY(24px); transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1); }
.lp-reveal.visible{ opacity:1; transform:none; }
.lp-reveal-left   { opacity:0; transform:translateX(-24px); transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1); }
.lp-reveal-left.visible{ opacity:1; transform:none; }
.lp-reveal-right  { opacity:0; transform:translateX(24px); transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1); }
.lp-reveal-right.visible{ opacity:1; transform:none; }
.lp-reveal-scale  { opacity:0; transform:scale(.94); transition:opacity .5s ease,transform .5s ease; }
.lp-reveal-scale.visible{ opacity:1; transform:none; }

/* Liquid fill button */
.lp-liquid-btn {
  position:relative; overflow:hidden; isolation:isolate;
}
.lp-liquid-btn::before {
  content:''; position:absolute;
  left:var(--liquid-x,50%); top:var(--liquid-y,50%);
  width:32px; height:32px; border-radius:50%;
  background:rgba(255,255,255,.18);
  transform:translate(-50%,-50%) scale(var(--liquid-scale,0));
  transition:transform .55s cubic-bezier(.22,1,.36,1);
  pointer-events:none;
}

/* Glass card */
.lp-glass {
  background:rgba(255,255,255,.12);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.22);
}
.lp-glass-light {
  background:rgba(255,255,255,.78);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border:1px solid rgba(14,138,95,.15);
}

/* Feature card hover lift */
.lp-card-hover {
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
  cursor:default;
}
.lp-card-hover:hover {
  transform:translateY(-4px);
  box-shadow:0 16px 40px rgba(16,24,40,.10);
  border-color:#C8D5CA !important;
}

/* Stat bar animation */
.lp-stat-bar { transform-origin:left; }
.lp-stat-bar.animate { animation:lp-bar-fill .9s cubic-bezier(.22,1,.36,1) both; }

/* Nav blur on scroll */
.lp-nav-scrolled {
  background:rgba(255,255,255,.9) !important;
  box-shadow:0 1px 12px rgba(16,24,40,.06);
}

@media(prefers-reduced-motion:reduce){
  .lp-reveal,.lp-reveal-left,.lp-reveal-right,.lp-reveal-scale{opacity:1;transform:none;transition:none;}
  .lp-liquid-btn::before{display:none;}
  .lp-card-hover:hover{transform:none;}
}

@media(max-width: 768px) {
  .lp-hide-mobile { display: none !important; }
  .lp-show-mobile { display: block !important; }
}
`

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function cn(...args: (string | undefined | false)[]) {
  return args.filter(Boolean).join(' ')
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return scrolled
}

// ─────────────────────────────────────────────────────────────────────────────
// KINETIC GEAR SVG
// ─────────────────────────────────────────────────────────────────────────────
function GearBg() {
  return (
    <svg viewBox="0 0 240 240" style={{ position: 'absolute', top: -20, right: -20, width: 340, height: 340, opacity: 0.06, pointerEvents: 'none' }} aria-hidden="true">
      {/* Outer gear */}
      <g style={{ animation: `lp-gear-spin 22s linear infinite`, transformOrigin: '120px 120px' }}>
        <circle cx="120" cy="120" r="98" fill="none" stroke={MB.primary} strokeWidth="3" />
        {[...Array(16)].map((_, i) => {
          const a = (i / 16) * 360
          const rad = (a * Math.PI) / 180
          const x1 = 120 + 88 * Math.cos(rad), y1 = 120 + 88 * Math.sin(rad)
          const x2 = 120 + 108 * Math.cos(rad), y2 = 120 + 108 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={MB.primary} strokeWidth="7" strokeLinecap="round" />
        })}
      </g>
      {/* Inner gear */}
      <g style={{ animation: `lp-gear-rev 14s linear infinite`, transformOrigin: '120px 120px' }}>
        <circle cx="120" cy="120" r="58" fill="none" stroke={MB.primary} strokeWidth="2.5" />
        {[...Array(10)].map((_, i) => {
          const a = (i / 10) * 360
          const rad = (a * Math.PI) / 180
          const x1 = 120 + 50 * Math.cos(rad), y1 = 120 + 50 * Math.sin(rad)
          const x2 = 120 + 64 * Math.cos(rad), y2 = 120 + 64 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={MB.primary} strokeWidth="6" strokeLinecap="round" />
        })}
      </g>
      {/* Cross */}
      <g style={{ animation: `lp-gear-spin 22s linear infinite`, transformOrigin: '120px 120px' }}>
        <path d="M120 30v180M30 120h180" stroke={MB.primary} strokeWidth="1.5" />
        <circle cx="120" cy="120" r="22" fill="none" stroke={MB.primary} strokeWidth="2" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO AVATAR
// ─────────────────────────────────────────────────────────────────────────────
function HeroAvatar({ 
  src, top, left, right, bottom, delay, pointerStyle 
}: { 
  src: string, top?: number | string, left?: number | string, right?: number | string, bottom?: number | string, 
  delay: string, pointerStyle: React.CSSProperties
}) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom, zIndex: 10,
      animation: `lp-float 6s ease-in-out infinite ${delay}, lp-fade-in 1s ease both ${delay}`,
      pointerEvents: 'none'
    }}>
      <div style={{ position: 'relative', width: 76, height: 76, borderRadius: '50%', background: '#fff', padding: 5, boxShadow: '0 12px 36px rgba(16,24,40,.12)' }}>
        <img src={src} alt="Doctor" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        {/* Pointer cursor */}
        <div style={{ position: 'absolute', width: 28, height: 28, ...pointerStyle }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill={MB.primary700} stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  const p1 = useParallax(0.15)
  const p2 = useParallax(0.28)
  const p3 = useParallax(0.10)
  const { displayed, isTyping } = useTypewriter(
    ['the right time.', 'your schedule.', 'one click.', 'zero wait.'],
    52,
    2000
  )

  const isMobile = useIsMobile(900)
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: MB.bg, padding: '100px 24px 80px' }}>
      {/* Parallax blobs */}
      <div style={{ position: 'absolute', top: -80, right: -60, width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${MB.primary50} 0%, transparent 68%)`, transform: `translateY(${p1}px)`, pointerEvents: 'none', willChange: 'transform' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle, #EEF6FF 0%, transparent 68%)`, transform: `translateY(${p2}px)`, pointerEvents: 'none', willChange: 'transform' }} />
      <div style={{ position: 'absolute', top: 120, left: '30%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${MB.primary50} 0%, transparent 68%)`, transform: `translateY(${p3}px)`, pointerEvents: 'none', opacity: 0.5, willChange: 'transform' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Floating Avatars (Hidden on mobile) */}
          <div className="lp-hide-mobile">
            <HeroAvatar 
              src="/doctor_avatar_1_1778628057718.png" 
              top={-10} left={-60} delay="0s" 
              pointerStyle={{ bottom: -8, right: -8, transform: 'rotate(160deg)' }} 
            />
            <HeroAvatar 
              src="/doctor_avatar_2_1778628196879.png" 
              top={20} right={-50} delay="0.5s" 
              pointerStyle={{ bottom: -8, left: -14, transform: 'rotate(250deg)' }} 
            />
            <HeroAvatar 
              src="/doctor_avatar_3_1778628250846.png" 
              bottom={60} left={-30} delay="1s" 
              pointerStyle={{ top: -12, right: -16, transform: 'rotate(60deg)' }} 
            />
            <HeroAvatar 
              src="/doctor_avatar_4_1778628898019.png" 
              bottom={30} right={-70} delay="1.5s" 
              pointerStyle={{ top: -12, left: -14, transform: 'rotate(330deg)' }} 
            />
          </div>


          {/* Headline with typewriter */}
          <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 70px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.035em', lineHeight: 1.08, margin: '0 0 24px', animation: 'lp-fade-up .7s .1s both ease' }}>
            Book the right doctor at{' '}
            <span style={{ color: MB.primary, display: 'inline-block', minWidth: '4ch' }}>
              {displayed}
              <span style={{ animation: 'lp-cursor .75s step-end infinite', opacity: isTyping ? 1 : 0, marginLeft: 2, color: MB.primary }}>|</span>
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: MB.text2, lineHeight: 1.65, maxWidth: 580, margin: '0 auto 40px', animation: 'lp-fade-up .7s .2s both ease' }}>
            MediBook connects patients, doctors, and hospital admins on one intelligent platform — real-time availability, zero double-bookings, automated reminders.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'lp-fade-up .7s .3s both ease' }}>
            <Link to="/register" className="lp-liquid-btn" style={{
              height: 54, padding: '0 32px',
              background: MB.primary, color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 16, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', cursor: 'pointer',
              boxShadow: `0 4px 20px rgba(14,138,95,.30)`,
              transition: 'background .15s, box-shadow .15s, transform .12s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary600; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 28px rgba(14,138,95,.38)` }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px rgba(14,138,95,.30)` }}>
              Get started free <Icon name="arrowRight" size={18} color="#fff" />
            </Link>
            <Link to="/login" style={{
              height: 54, padding: '0 28px',
              background: 'transparent', color: MB.text, border: `1.5px solid ${MB.line}`, borderRadius: 12,
              fontSize: 15, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none',
              transition: 'background .15s, border-color .15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.bg3; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#C0C8D0' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.borderColor = MB.line }}>
              Sign in to your account
            </Link>
          </div>
        </div>

        {/* Floating app mockup */}
        <div style={{ marginTop: 64, position: 'relative', maxWidth: 860, margin: '64px auto 0', animation: 'lp-fade-up .9s .45s both ease' }}>
          {/* Pulse rings on mockup */}
          <div style={{ position: 'absolute', top: -16, right: 48, width: 24, height: 24, zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: MB.success, opacity: 0.9 }} />
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: MB.success, animation: 'lp-pulse-ring 2s ease-out infinite' }} />
          </div>

          <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${MB.line}`, boxShadow: '0 28px 72px rgba(16,24,40,.13), 0 4px 16px rgba(16,24,40,.06)', background: MB.bg }}>
            {/* Browser chrome */}
            <div style={{ height: 38, background: MB.bg3, borderBottom: `1px solid ${MB.line}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 7 }}>
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
              <div style={{ flex: 1, maxWidth: 300, marginLeft: 8, height: 22, background: MB.bg, borderRadius: 5, border: `1px solid ${MB.line}`, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, color: MB.text3, fontFamily: 'ui-monospace, monospace' }}>medibook.health</div>
            </div>
            {/* App UI preview */}
            <div style={{ display: 'flex', height: isMobile ? 'auto' : 340 }}>
              {/* Sidebar mini (Hidden on mobile) */}
              <div className="lp-hide-mobile" style={{ width: 180, borderRight: `1px solid ${MB.line2}`, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 3, background: MB.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', marginBottom: 16 }}>
                  <Logo size={22} /><span style={{ fontSize: 12, fontWeight: 700, color: MB.ink }}>MediBook</span>
                </div>
                {[
                  { icon: 'search', label: 'Find a doctor', active: true },
                  { icon: 'calendar', label: 'My visits', active: false },
                  { icon: 'bell', label: 'Alerts', active: false },
                  { icon: 'user', label: 'Profile', active: false },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: item.active ? MB.primary50 : 'transparent', color: item.active ? MB.primary600 : MB.text3, fontSize: 12, fontWeight: item.active ? 600 : 500 }}>
                    <Icon name={item.icon as never} size={13} color={item.active ? MB.primary : MB.text3} /> {item.label}
                  </div>
                ))}
              </div>
              {/* Main content mini */}
              <div style={{ flex: 1, padding: '20px 20px', background: MB.bg, overflowY: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink, marginBottom: 14 }}>Find a doctor</div>
                <div style={{ height: 34, borderRadius: 8, background: MB.bg2, border: `1px solid ${MB.line}`, marginBottom: 14, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
                  <Icon name="search" size={13} color={MB.text4} />
                  <span style={{ fontSize: 12, color: MB.text4 }}>Search by name or specialty…</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {[
                    { name: 'Dr. Sarah Chen', spec: 'Cardiology', next: 'Today · 4:30 PM', bg: MB.primary100, tc: MB.primary700, badge: 'Accepting new', bcolor: MB.success },
                    { name: 'Dr. Marcus Okafor', spec: 'Dermatology', next: 'Tomorrow · 9 AM', bg: '#CCEAE6', tc: '#0E7C7B', badge: 'Telehealth', bcolor: '#6366F1' },
                    { name: 'Dr. Priya Raghavan', spec: 'Pediatrics', next: 'May 14 · 11 AM', bg: '#FEF3C7', tc: '#92400E', badge: '12 yrs exp.', bcolor: MB.warn },
                    { name: 'Dr. James Whitfield', spec: 'Orthopedics', next: 'May 15 · 2 PM', bg: '#E0E7FF', tc: '#3730A3', badge: 'Accepting new', bcolor: MB.success },
                  ].map((doc) => (
                    <div key={doc.name} style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: doc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: doc.tc, letterSpacing: '.04em', flexShrink: 0 }}>DR</div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: MB.text }}>{doc.name}</div>
                          <div style={{ fontSize: 10, color: MB.text3 }}>{doc.spec}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MB.success }}>{doc.next}</div>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${doc.bcolor}18`, color: doc.bcolor, fontWeight: 600 }}>{doc.badge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUST BAR (glass variant on subtle gradient)
// ─────────────────────────────────────────────────────────────────────────────
function TrustBar() {
  const { ref, visible } = useScrollReveal(0)
  const badges = [
    { icon: 'lock', label: 'HIPAA-aligned' },
    { icon: 'check', label: 'Zero double-bookings' },
    { icon: 'bell', label: 'Auto-reminders' },
    { icon: 'users', label: 'Multi-role access' },
    { icon: 'chart', label: 'Real-time analytics' },
    { icon: 'clock', label: '24/7 availability' },
  ]

  return (
    <section style={{ background: `linear-gradient(135deg, ${MB.primary50} 0%, #EFF6FF 100%)`, padding: '32px 24px' }}>
      <div ref={ref} className={cn('lp-reveal', visible && 'visible')} style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: MB.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 8 }}>Trusted by providers worldwide</span>
        {badges.map((b) => (
          <div key={b.label} className="lp-glass-light" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: MB.text2, transition: 'transform .15s ease, box-shadow .15s ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(14,138,95,.12)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>
            <Icon name={b.icon as never} size={14} color={MB.primary} />
            {b.label}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED STATS
// ─────────────────────────────────────────────────────────────────────────────
interface StatItem { target: number; prefix?: string; suffix?: string; label: string; decimals?: number }

function StatCounter({ target, prefix = '', suffix = '', label, decimals = 0 }: StatItem) {
  const fmt = useCallback((n: number) => `${prefix}${n % 1 === 0 ? n : n.toFixed(decimals)}${suffix}`, [prefix, suffix, decimals])
  const { count, ref } = useCountUp(target, 2400)
  const display = decimals > 0
    ? `${prefix}${(count / Math.pow(10, decimals)).toFixed(decimals)}${suffix}`
    : fmt(count)

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: MB.primary, letterSpacing: '-0.03em', lineHeight: 1 }}>{display}</div>
      <div style={{ fontSize: 13, color: MB.text3, marginTop: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ width: 32, height: 3, background: MB.primary100, borderRadius: 999, margin: '10px auto 0' }} />
    </div>
  )
}

function StatsSection() {
  const { ref, visible } = useScrollReveal(0)
  const stats: StatItem[] = [
    { target: 98, suffix: '%', label: 'Patient satisfaction' },
    { target: 60, suffix: '%', label: 'Reduction in no-shows' },
    { target: 3, suffix: ' min', label: 'Average booking time' },
    { target: 5, suffix: '×', label: 'Faster admin workflows' },
  ]

  return (
    <section style={{ background: MB.bg, padding: '72px 24px' }}>
      <div ref={ref} className={cn('lp-reveal', visible && 'visible')} style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MB.primary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>By the numbers</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: 0 }}>The impact speaks for itself</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
          {stats.map((s) => <StatCounter key={s.label} {...s} />)}
        </div>
      </div>
    </section>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// FEATURE GRID (liquid-fill hover + stagger)
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'search', title: 'Smart Search & Discovery', body: 'Full-text search and faceted filtering by specialty, department, availability. Find the right doctor in seconds.' },
  { icon: 'video', title: 'Telemedicine Suite', body: 'Integrated Video/Audio and chat with an AI note-taker to automatically save consultation summaries.' },
  { icon: 'creditCard', title: 'Payments & Billing', body: 'Automated consultation fees, invoicing, and instant refunds via Paystack, Flutterwave, or Stripe.' },
  { icon: 'star', title: 'Patient Experience', body: 'Verified ratings, reviews, recurring appointments, and smart waitlists to improve care quality.' },
  { icon: 'chart', title: 'Advanced Analytics', body: 'Interactive charted dashboards and a custom report builder for deep operational insights.' },
  { icon: 'bell', title: 'Automated reminders', body: 'SMS & email reminders sent 48h, 24h, and 2h before. Cuts no-shows by up to 60%.' },
  { icon: 'edit', title: 'Consultation notes', body: 'Doctors capture structured SOAP notes directly from the schedule. Searchable history.' },
  { icon: 'calendar', title: 'Real-time scheduling', body: 'Live availability synced across all devices. No double-bookings. Changes reflect instantly.' },
]

function FeatureCard({ icon, title, body, delay }: { icon: string; title: string; body: string; delay: number }) {
  const { ref, visible } = useScrollReveal(delay)
  const [hovered, setHovered] = useState(false)

  return (
    <div ref={ref} className={cn('lp-reveal', 'lp-card-hover', visible && 'visible')} style={{
      background: hovered ? `linear-gradient(135deg, ${MB.primary50} 0%, #EFF6FF 100%)` : MB.bg,
      border: `1px solid ${hovered ? MB.primary100 : MB.line}`,
      borderRadius: 14, padding: '24px 22px',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'background .25s ease, border-color .25s ease, transform .2s ease, box-shadow .2s ease',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: hovered ? MB.primary : MB.primary50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .25s ease', flexShrink: 0,
      }}>
        <Icon name={icon as never} size={20} color={hovered ? '#fff' : MB.primary} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: MB.text2, lineHeight: 1.65 }}>{body}</div>
      </div>
    </div>
  )
}

function FeaturesSection() {
  const { ref, visible } = useScrollReveal(0)
  return (
    <section id="features" style={{ background: MB.bg, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div ref={ref} className={cn('lp-reveal', visible && 'visible')} style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 52px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Everything you need, nothing you don't</h2>
          <p style={{ fontSize: 15, color: MB.text2, lineHeight: 1.65, margin: 0 }}>Purpose-built for healthcare. Every feature reduces friction for all three roles.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 70} />)}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CARDS — Glass variant + mobile carousel
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'patient', accent: MB.primary,
    icon: 'user', role: 'For Patients', headline: 'Book in minutes, not hours',
    points: [
      'Full-text search & faceted filtering (gender, fees)',
      'Telemedicine with Video/Audio and Chat',
      'Recurring appointments & smart waitlists',
      'Verified ratings and doctor reviews',
      'Instant refunds on appointment cancellation'
    ],
    cta: 'Book your first appointment', href: '/register',
    gradient: `linear-gradient(135deg, ${MB.primary} 0%, #1BA06E 100%)`,
  },
  {
    id: 'doctor', accent: MB.primary,
    icon: 'stethoscope', role: 'For Doctors', headline: 'Focus on patients, not paperwork',
    points: [
      'AI call note-taker for consultation summaries',
      'Captures structured SOAP notes in seconds',
      'Set and adjust working hours anytime', 
      'Never get interrupted by double-bookings',
      'Integrated Video & Chat for telehealth',
      'Full day timeline with status tracking'
    ],
    // cta: 'View doctor dashboard', href: '/login',
    cta: undefined, href: undefined,
    gradient: `linear-gradient(135deg, ${MB.primary} 0%, #1BA06E 100%)`,
  },
  {
    id: 'admin', accent: MB.primary,
    icon: 'building', role: 'For Administrators', headline: 'Run a smarter clinic',
    points: [
      'Manage departments, doctors, patients',
      'Interactive charted dashboards & KPIs',
      'Custom report builder for clinical insights',
      'Manage payments (Paystack, Stripe, Monnify)',
      'Real-time capacity and revenue heatmaps',
      'Automated invoicing and refund management'
    ],
        // cta: 'Explore admin console', href: '/login',
    cta: undefined, href: undefined,
    gradient: `linear-gradient(135deg, ${MB.primary} 0%, #1BA06E 100%)`,
  },
]

function RoleCardDesktop({ role, visible, index }: { role: typeof ROLES[0]; visible: boolean; index: number }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      className="lp-reveal-scale"
      style={{
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'scale(.94)',
        transition: `opacity .55s ${index * 0.1}s ease, transform .55s ${index * 0.1}s ease`,
        position: 'relative', borderRadius: 18, overflow: 'hidden',
        background: hov ? role.gradient : MB.bg,
        border: `1px solid ${hov ? 'transparent' : MB.line}`,
        boxShadow: hov ? `0 20px 50px ${role.accent}30` : '0 1px 3px rgba(16,24,40,.05)',
        transition2: 'background .35s ease, box-shadow .35s ease, border-color .35s ease',
      } as React.CSSProperties}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 18, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: 13, background: hov ? 'rgba(255,255,255,.2)' : `${role.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .3s' }}>
            <Icon name={role.icon as never} size={22} color={hov ? '#fff' : role.accent} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: hov ? 'rgba(255,255,255,.7)' : role.accent, letterSpacing: '0.07em', textTransform: 'uppercase', transition: 'color .3s' }}>{role.role}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: hov ? '#fff' : MB.ink, marginTop: 1, transition: 'color .3s' }}>{role.headline}</div>
          </div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {role.points.map((p) => (
            <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: hov ? 'rgba(255,255,255,.85)' : MB.text2, transition: 'color .3s' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: hov ? 'rgba(255,255,255,.2)' : `${role.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Icon name="check" size={10} color={hov ? '#fff' : role.accent} strokeWidth={2.5} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        {role.cta && role.href && (
          <Link to={role.href} style={{
            marginTop: 'auto', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            background: hov ? 'rgba(255,255,255,.18)' : role.accent,
            border: hov ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent',
            color: '#fff', borderRadius: 9, textDecoration: 'none',
            fontSize: 13, fontWeight: 700,
            transition: 'background .3s, border .3s',
          }}>
            {role.cta} <Icon name="arrowRight" size={14} color="#fff" />
          </Link>
        )}
      </div>
    </div>
  )
}

function RolesMobileCarousel() {
  const { index, prev, next, goTo, onTouchStart, onTouchEnd } = useCarousel(ROLES.length)
  const role = ROLES[index]

  return (
    <div style={{ width: '100%' }}>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ overflow: 'hidden', borderRadius: 16 }}>
        <div style={{ background: role.gradient, borderRadius: 16, padding: '28px 24px', minHeight: 380, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={role.icon as never} size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{role.role}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginTop: 1 }}>{role.headline}</div>
            </div>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {role.points.map((p) => (
              <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.88)' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon name="check" size={10} color="#fff" strokeWidth={2.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          {role.cta && role.href && (
            <Link to={role.href} style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 700, marginTop: 'auto' }}>
              {role.cta} <Icon name="arrowRight" size={14} color="#fff" />
            </Link>
          )}
        </div>
      </div>
      {/* Dots + nav */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
        <button onClick={prev} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${MB.line}`, background: MB.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronLeft" size={16} color={MB.text2} />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {ROLES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 4, background: i === index ? MB.primary : MB.line, border: 'none', cursor: 'pointer', padding: 0, transition: 'width .2s ease, background .2s ease' }} />
          ))}
        </div>
        <button onClick={next} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${MB.line}`, background: MB.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronRight" size={16} color={MB.text2} />
        </button>
      </div>
    </div>
  )
}

function RolesSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => prefersReducedMotion())
  const isMobile = useIsMobile(767)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = containerRef.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el); return () => obs.disconnect()
  }, [])

  const { ref: headRef, visible: headVis } = useScrollReveal(0)

  return (
    <section id="roles" style={{ background: MB.bg2, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div ref={headRef} className={cn('lp-reveal', headVis && 'visible')} style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 52px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: 0 }}>One platform. Three experiences.</h2>
        </div>
        <div ref={containerRef}>
          {isMobile ? <RolesMobileCarousel /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {ROLES.map((role, i) => <RoleCardDesktop key={role.id} role={role} visible={visible} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT BOOKING FLOW
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, title: 'Search & filter', body: 'Find doctors by specialty, department, or name. See availability for the next 7 days in real time.' },
  { n: 2, title: 'Pick a slot', body: 'Choose from morning or afternoon slots. The system holds your slot for 5 minutes while you review.' },
  { n: 3, title: 'Confirm & receive', body: 'Instant invoicing and secure payment. Get confirmation plus SMS reminders added to your calendar.' },
]

function BookingFlowSection() {
  const { containerRef, visibleCount } = useStaggerReveal(STEPS.length, 180)
  const { ref: rightRef, visible: rightVis } = useScrollReveal(200)
  const [selectedSlot, setSelectedSlot] = useState(1)

  return (
    <section style={{ background: MB.bg, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
        {/* Left: steps */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', marginBottom: 20 }}>
            <Icon name="user" size={11} color={MB.primary} />
            <span style={{ fontSize: 11, fontWeight: 700, color: MB.primary600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Patient flow</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Book an appointment in 3 steps</h2>
          <p style={{ fontSize: 15, color: MB.text2, lineHeight: 1.65, margin: '0 0 36px' }}>No phone calls. No waiting on hold. MediBook puts patients in control.</p>
          <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', opacity: i < visibleCount ? 1 : 0, transform: i < visibleCount ? 'none' : 'translateX(-16px)', transition: `opacity .5s ease, transform .5s ease` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: MB.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 12px rgba(14,138,95,.3)` }}>{s.n}</div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: MB.text2, marginTop: 4, lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: interactive slot picker */}
        <div ref={rightRef} className={cn('lp-reveal-right', rightVis && 'visible')}>
          <div style={{ background: MB.bg2, borderRadius: 20, border: `1px solid ${MB.line}`, padding: 28, boxShadow: '0 8px 32px rgba(16,24,40,.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink, marginBottom: 16 }}>Select a time slot</div>
            {/* Day strip */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[{ d: 'Mon', n: 12 }, { d: 'Tue', n: 13, active: true }, { d: 'Wed', n: 14 }, { d: 'Thu', n: 15 }, { d: 'Fri', n: 16 }].map((day) => (
                <div key={day.d} style={{ flex: 1, padding: '8px 0', borderRadius: 10, textAlign: 'center', background: day.active ? MB.primary : MB.bg, border: `1px solid ${day.active ? MB.primary : MB.line}`, color: day.active ? '#fff' : MB.text, cursor: 'pointer', transition: 'background .15s, color .15s' }}>
                  <div style={{ fontSize: 10, fontWeight: 500 }}>{day.d}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{day.n}</div>
                </div>
              ))}
            </div>
            {/* Slots */}
            <div style={{ fontSize: 11, color: MB.text3, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Morning</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'].map((t, i) => (
                <div key={t} onClick={() => setSelectedSlot(i)}
                  style={{
                    height: 40, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selectedSlot === i ? MB.primary : MB.bg,
                    color: selectedSlot === i ? '#fff' : MB.text,
                    border: `1px solid ${selectedSlot === i ? MB.primary : MB.line}`,
                    transform: selectedSlot === i ? 'scale(1.04)' : 'scale(1)',
                    transition: 'background .15s, color .15s, border-color .15s, transform .15s',
                  }}>{t}</div>
              ))}
            </div>
            <Link to="/register" style={{
              height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: MB.primary, color: '#fff', borderRadius: 10, textDecoration: 'none',
              fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(14,138,95,.25)',
              transition: 'background .15s, box-shadow .15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary600 }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary }}>
              Continue with Tue, May 13 · 9:30 AM →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────
const APPT_ITEMS = [
  { time: '9:00 AM', name: 'Eleanor Park', reason: 'Follow-up · Hypertension', status: 'COMPLETED', bg: MB.successBg, color: MB.success },
  { time: '10:00 AM', name: 'Marcus Lee', reason: 'Chest pain consult', status: 'NEXT', bg: MB.primary50, color: MB.primary600 },
  { time: '11:00 AM', name: 'Aisha Ndlovu', reason: 'Echocardiogram review', status: 'SCHEDULED', bg: MB.bg3, color: MB.text3 },
  { time: '2:00 PM', name: 'Robert Tanaka', reason: 'New patient consult', status: 'SCHEDULED', bg: MB.bg3, color: MB.text3 },
]

function DoctorWorkflowSection() {
  const { ref: leftRef, visible: leftVis } = useScrollReveal(0)
  const { ref: rightRef, visible: rightVis } = useScrollReveal(200)

  return (
    <section style={{ background: MB.bg2, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
        {/* Left: schedule visual */}
        <div ref={leftRef} className={cn('lp-reveal-left', leftVis && 'visible')}>
          <div style={{ background: MB.bg, borderRadius: 18, border: `1px solid ${MB.line}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(16,24,40,.08)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: MB.ink }}>Today's schedule</div>
                <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>Wednesday, May 12 · 8 appointments</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: MB.primary, cursor: 'pointer' }}>View all</span>
            </div>
            {APPT_ITEMS.map((a, i) => (
              <div key={a.name} style={{ padding: '12px 20px', borderBottom: i < APPT_ITEMS.length - 1 ? `1px solid ${MB.line2}` : 'none', display: 'flex', alignItems: 'center', gap: 12, background: a.status === 'NEXT' ? `${MB.primary50}66` : 'transparent', borderLeft: a.status === 'NEXT' ? `3px solid ${MB.primary}` : '3px solid transparent', transition: 'background .15s' }}>
                <div style={{ fontSize: 11, color: MB.text3, width: 60, flexShrink: 0, fontFamily: 'ui-monospace, monospace' }}>{a.time}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: MB.text3, marginTop: 1 }}>{a.reason}</div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: 999, background: a.bg, color: a.color, fontSize: 11, fontWeight: 600 }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Right: copy */}
        <div ref={rightRef} className={cn('lp-reveal-right', rightVis && 'visible')}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', marginBottom: 20 }}>
            <Icon name="stethoscope" size={11} color={MB.primary} />
            <span style={{ fontSize: 11, fontWeight: 700, color: MB.primary600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Doctor workflow</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Your clinic day, at a glance</h2>
          <p style={{ fontSize: 15, color: MB.text2, lineHeight: 1.65, margin: '0 0 28px' }}>Integrated telemedicine with AI-powered summaries. Log notes, manage custom fees, and handle hours — all from your phone.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'video', text: 'Video/Audio and chat for seamless telemedicine consultations' },
              { icon: 'edit', text: 'AI call note-taker saves summaries directly as consultation notes' },
                            { icon: 'check', text: 'One tap to mark status with automatic patient notification' },
              { icon: 'edit', text: 'Add SOAP consultation notes tied to each appointment' },
            ].map((item) => (
              <div key={item.text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={item.icon as never} size={14} color="#2563EB" />
                </div>
                <div style={{ fontSize: 14, color: MB.text2, lineHeight: 1.55, paddingTop: 7 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ANALYTICS (animated bars)
// ─────────────────────────────────────────────────────────────────────────────
const DEPT_DATA = [
  { name: 'Cardiology', pct: 88, n: 1284 },
  { name: 'Pediatrics', pct: 95, n: 2103 },
  { name: 'Internal Med.', pct: 72, n: 3104 },
  { name: 'Dermatology', pct: 61, n: 892 },
  { name: 'Orthopedics', pct: 55, n: 745 },
]

function AdminSection() {
  const { ref: leftRef, visible: leftVis } = useScrollReveal(0)
  const { ref: rightRef, visible: rightVis } = useScrollReveal(0)
  const [barsVisible, setBarsVisible] = useState(() => prefersReducedMotion())
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = barsRef.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setBarsVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el); return () => obs.disconnect()
  }, [])

  const kpis = [
    { label: 'Appointments today', value: '148', change: '+12%' },
    { label: 'Active doctors', value: '24', change: '100%' },
    { label: 'No-show rate', value: '4.2%', change: '−60%' },
    { label: 'Avg booking time', value: '3 min', change: '−72%' },
  ]

  return (
    <section style={{ background: MB.bg, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, alignItems: 'center' }}>
        {/* Left: copy + KPIs */}
        <div ref={leftRef} className={cn('lp-reveal-left', leftVis && 'visible')}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', marginBottom: 20 }}>
            <Icon name="grid" size={11} color={MB.primary} />
            <span style={{ fontSize: 11, fontWeight: 700, color: MB.primary600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin console</span>
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Real-time operations visibility</h2>
          <p style={{ fontSize: 15, color: MB.text2, lineHeight: 1.65, margin: '0 0 28px' }}>Interactive charted dashboards and a custom report builder. Monitor capacity, track payments, and act before problems happen.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {kpis.map((kpi) => (
              <div key={kpi.label} style={{ background: MB.bg2, borderRadius: 12, padding: '16px', border: `1px solid ${MB.line}`, transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(16,24,40,.07)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>
                <div style={{ fontSize: 10, color: MB.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: MB.ink }}>{kpi.value}</div>
                <div style={{ fontSize: 10, color: MB.success, fontWeight: 600, marginTop: 3 }}>{kpi.change} vs last month</div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: bar chart */}
        <div ref={rightRef} className={cn('lp-reveal-right', rightVis && 'visible')}>
          <div ref={barsRef} style={{ background: MB.bg2, borderRadius: 18, border: `1px solid ${MB.line}`, padding: 26, boxShadow: '0 8px 32px rgba(16,24,40,.07)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink, marginBottom: 18 }}>Department performance (90d)</div>
            {DEPT_DATA.map((dept, i) => (
              <div key={dept.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: MB.text }}>{dept.name}</span>
                  <span style={{ fontSize: 11, color: MB.text3, fontFamily: 'ui-monospace, monospace' }}>{dept.n.toLocaleString()}</span>
                </div>
                <div style={{ height: 7, background: MB.line2, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: barsVisible ? `${dept.pct}%` : '0%',
                    background: `linear-gradient(90deg, ${MB.primary} 0%, ${MB.primary600} 100%)`,
                    borderRadius: 999,
                    transition: `width .9s ${i * 0.12}s cubic-bezier(.22,1,.36,1)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT-FILL REVEAL SECTION
// ─────────────────────────────────────────────────────────────────────────────
function TextFillReveal() {
  const { ref, progress } = useScrollFill()
  const text = 'Ready to transform your practice?'
  // Split into words for word-by-word reveal
  const words = text.split(' ')
  const wordProgress = words.length

  return (
    <section style={{ background: MB.bg2, padding: '80px 24px', overflow: 'hidden' }}>
      <div ref={ref} style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5.5vw, 64px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          margin: '0 0 24px',
        }}>
          {words.map((w, i) => {
            const wordStart = i / wordProgress
            const wordEnd = (i + 0.9) / wordProgress
            const filled = progress >= wordStart
            const partial = progress > wordStart && progress < wordEnd
            const pct = partial ? Math.max(0, Math.min(100, ((progress - wordStart) / (wordEnd - wordStart)) * 100)) : filled ? 100 : 0

            return (
              <span key={i} style={{ display: 'inline-block', marginRight: '0.25em', position: 'relative' }}>
                {/* Ghost text (grey) */}
                <span style={{ color: MB.line, userSelect: 'none' }}>{w}</span>
                {/* Filled text (green) — clip-mask approach */}
                <span style={{
                  position: 'absolute', left: 0, top: 0,
                  color: MB.primary,
                  clipPath: `inset(0 ${100 - pct}% 0 0)`,
                  transition: prefersReducedMotion() ? 'none' : 'clip-path .1s linear',
                  whiteSpace: 'nowrap',
                }}>{w}</span>
              </span>
            )
          })}
        </h2>
        <p style={{ fontSize: 17, color: MB.text2, lineHeight: 1.65, maxWidth: 520, margin: '0 auto 36px' }}>
          Join healthcare providers who trust MediBook to manage appointments, patients, and analytics in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="lp-liquid-btn" style={{
            height: 54, padding: '0 32px',
            background: MB.primary, color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none',
            boxShadow: `0 4px 20px rgba(14,138,95,.28)`,
            transition: 'background .15s, box-shadow .15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary600 }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary }}>
            Get started free <Icon name="arrowRight" size={18} color="#fff" />
          </Link>
          <Link to="/login" style={{
            height: 54, padding: '0 28px',
            background: 'transparent', color: MB.text,
            border: `1.5px solid ${MB.line}`, borderRadius: 12,
            fontSize: 15, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', transition: 'background .15s, border-color .15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.bg3 }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY + FUTURE SECTIONS
// ─────────────────────────────────────────────────────────────────────────────
function SecuritySection() {
  const { containerRef, visibleCount } = useStaggerReveal(4, 90)
  const { ref: headRef, visible: headVis } = useScrollReveal(0)
  const items = [
    { icon: 'lock', title: 'End-to-end encryption', body: 'All data in transit and at rest encrypted with TLS 1.3 and AES-256.' },
    { icon: 'user', title: 'Role-based access', body: 'Granular permissions ensure each user sees only what they are authorised to view.' },
    { icon: 'check', title: 'Audit-ready logging', body: 'Every action logged with timestamps, user IDs, and IPs for full audit trails.' },
    { icon: 'bell', title: 'Security alerts', body: 'Real-time alerts for suspicious login attempts and unusual access patterns.' },
  ]

  return (
    <section style={{ background: MB.bg, padding: '72px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div ref={headRef} className={cn('lp-reveal', headVis && 'visible')} style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
 
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Built with patient privacy in mind</h2>
          <p style={{ fontSize: 15, color: MB.text2, lineHeight: 1.65, margin: 0 }}>Healthcare data is among the most sensitive. MediBook is engineered from the ground up with security controls that protect everyone.</p>
        </div>
        <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {items.map((item, i) => (
            <div key={item.title} className="lp-card-hover" style={{
              background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 14, padding: '22px 20px',
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'none' : 'translateY(16px)',
              transition: `opacity .5s ease, transform .5s ease`,
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name={item.icon as never} size={18} color={MB.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: MB.text2, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KINETIC CTA — gradient + animated dots
// ─────────────────────────────────────────────────────────────────────────────
function CtaSection() {
  const { ref, visible } = useScrollReveal(0)
  const gearP = useParallax(0.12)

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '96px 24px', background: `linear-gradient(135deg, ${MB.primary} 0%, ${MB.primary700} 100%)` }}>
      {/* Kinetic gear background */}
      <div style={{ position: 'absolute', top: -40, right: -40, transform: `translateY(${gearP}px)`, willChange: 'transform', opacity: 0.14, pointerEvents: 'none' }}>
        <GearBg />
      </div>

      {/* Dot grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07, pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice">
        <defs><pattern id="cta-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#cta-dots)" />
      </svg>

      <div ref={ref} className={cn('lp-reveal', visible && 'visible')} style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <h2 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', margin: '0 0 18px', lineHeight: 1.12 }}>
          The smarter way to run a clinic starts here.
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.82)', margin: '0 auto 40px', maxWidth: 500, lineHeight: 1.65 }}>
          Join healthcare providers who trust MediBook to manage appointments, patients, and analytics in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="lp-liquid-btn" style={{
            height: 56, padding: '0 36px',
            background: '#fff', color: MB.primary,
            border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,.14)',
            transition: 'box-shadow .15s, transform .12s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 28px rgba(0,0,0,.2)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(0,0,0,.14)'; (e.currentTarget as HTMLAnchorElement).style.transform = '' }}>
            Get started free <Icon name="arrowRight" size={18} color={MB.primary} />
          </Link>
          <Link to="/login" style={{
            height: 56, padding: '0 28px',
            background: 'rgba(255,255,255,.14)',
            border: '1.5px solid rgba(255,255,255,.3)',
            color: '#fff', borderRadius: 12,
            fontSize: 15, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textDecoration: 'none',
            transition: 'background .15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.22)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.14)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY NAV
// ─────────────────────────────────────────────────────────────────────────────
function Nav() {
  const scrolled = useNavScroll()
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useIsMobile(900)

  const links = [
    { label: 'For Patients', href: '#roles' },
    { label: 'For Doctors', href: '#roles' },
    { label: 'Features', href: '#features' },
  ]

  return (
    <header style={{ 
      position: 'sticky', top: 0, zIndex: 100, 
      background: scrolled || menuOpen ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.75)', 
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', 
      borderBottom: scrolled || menuOpen ? `1px solid ${MB.line2}` : '1px solid transparent', 
      transition: 'background .2s ease, border-color .2s ease, box-shadow .2s ease', 
      boxShadow: scrolled ? '0 1px 14px rgba(16,24,40,.07)' : 'none', 
      animation: 'lp-nav-in .4s ease both' 
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
          <Logo size={30} />
          <span style={{ fontSize: 17, fontWeight: 700, color: MB.ink, letterSpacing: '-0.01em' }}>MediBook</span>
        </Link>

        {!isMobile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, justifyContent: 'center' }}>
              {links.map((l) => (
                <a key={l.label} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: MB.text2, textDecoration: 'none', transition: 'color .12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = MB.primary }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = MB.text2 }}>
                  {l.label}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: MB.text, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'background .12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.bg3 }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
                Sign in
              </Link>
              <Link to="/register" style={{
                height: 38, padding: '0 18px',
                background: MB.primary, color: '#fff', border: 'none', borderRadius: 9,
                fontSize: 14, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center',
                textDecoration: 'none',
                boxShadow: '0 1px 4px rgba(14,138,95,.22)',
                transition: 'background .12s, box-shadow .12s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary600 }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = MB.primary }}>
                Get started
              </Link>
            </div>
          </>
        )}

        {isMobile && (
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: MB.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div style={{ 
          position: 'absolute', top: 64, left: 0, right: 0, 
          background: '#fff', borderBottom: `1px solid ${MB.line2}`, 
          padding: '12px 24px 32px', display: 'flex', flexDirection: 'column', gap: 8,
          boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
          animation: 'lp-fade-up .3s ease both'
        }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} 
              onClick={() => setMenuOpen(false)}
              style={{ padding: '14px 0', fontSize: 16, fontWeight: 600, color: MB.ink, textDecoration: 'none', borderBottom: `1px solid ${MB.bg2}` }}>
              {l.label}
            </a>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: MB.bg2, color: MB.ink, borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: MB.primary, color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const isMobile = useIsMobile(768)
  return (
    <footer style={{ background: MB.ink, padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', textAlign: isMobile ? 'center' : 'left', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div style={{ maxWidth: 280, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Logo size={28} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>MediBook</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, margin: 0 }}>The intelligent appointment platform for modern healthcare.</p>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 32 : 48, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            {[
              { title: 'Platform', links: [{ label: 'For Patients', href: '#roles' }, { label: 'For Doctors', href: '#roles' }, { label: 'Features', href: '#features' }] },
              { title: 'Account', links: [{ label: 'Sign in', href: '/login' }, { label: 'Create account', href: '/register' }, { label: 'Forgot password', href: '/forgot-password' }] },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link to={link.href} style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', textDecoration: 'none', transition: 'color .12s' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.55)' }}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', textDecoration: 'none' }}>{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 24, display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>© 2026 MediBook Health. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service'].map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', textDecoration: 'none', transition: 'color .12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.65)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.3)' }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default memo(function LandingPage() {
  return (
    <div style={{ background: MB.bg, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', overflowX: 'hidden' }}>
      {/* Inject animation CSS once */}
      <style>{ANIM_CSS}</style>

      <Nav />
      <HeroSection />
      <TrustBar />
      <StatsSection />
      <FeaturesSection />
      <RolesSection />
      <BookingFlowSection />
      <DoctorWorkflowSection />
      <AdminSection />
      <SecuritySection />
      <TextFillReveal />
      <CtaSection />
      <ContactSection />
      <Footer />
    </div>
  )
})
