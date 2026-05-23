import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { Logo } from '@/components/layout/Logo'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Checkbox } from '@/components/forms/Checkbox'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { MobScreen } from '@/components/layout/MobScreen'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import { AuthService } from '@/services/auth.service'
import { parseApiError } from '@/lib/api/contracts'
import { validateEmail } from '@/lib/validation'

// ── Shared form logic ─────────────────────────────────────────────────────────
function useLoginLogic() {
  const navigate = useNavigate()
  const { login, verify2FA, isLoggingIn, isVerifying2FA } = useAuth()
  const [email, setEmail] = useState(() => localStorage.getItem('medibook_remembered_email') || '')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('medibook_remembered_email'))
  const [showPassword, setShowPassword] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    // Validate email format
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    try {
      const response = await login({ email: email.toLowerCase().trim(), password })
      if (response.requires2FA) { setNeeds2FA(true); return }
      if (response.user) {
        if (rememberMe) {
          localStorage.setItem('medibook_remembered_email', email)
        } else {
          localStorage.removeItem('medibook_remembered_email')
        }
        if (response.user.role === 'patient') navigate('/patient')
        else if (response.user.role === 'doctor') navigate('/doctor')
        else if (response.user.role === 'admin') navigate('/admin')
        else if (response.user.role === 'super_admin') navigate('/admin')
      }
    } catch (err) {
      const apiError = parseApiError(err)
      if (apiError.code === 'EMAIL_NOT_VERIFIED') {
        setShowVerifyPrompt(true)
        setError('Please verify your email. Check your inbox or request a new link.')
      } else {
        setError(apiError.message || 'The email or password you entered is incorrect.')
      }
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      await AuthService.resendVerification(email)
      setError('Verification email sent! Check your inbox.')
    } catch (err) {
      setError('Failed to resend email. Try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerify2FA = async () => {
    setError(null)
    try {
      const response = await verify2FA({ email, otp })
      if (response.user) {
        if (response.user.role === 'patient') navigate('/patient')
        else if (response.user.role === 'doctor') navigate('/doctor')
        else if (response.user.role === 'admin') navigate('/admin')
        else if (response.user.role === 'super_admin') navigate('/admin')
      }
    } catch (err) {
      setError(parseApiError(err).message || 'Invalid verification code.')
    }
  }

  return { email, setEmail, password, setPassword, otp, setOtp, rememberMe, setRememberMe, showPassword, setShowPassword, needs2FA, showVerifyPrompt, setShowVerifyPrompt, isResending, error, isLoggingIn, isVerifying2FA, handleLogin, handleVerify2FA, handleResendVerification }
}

// ── Shared form fields ────────────────────────────────────────────────────────
function LoginForm({
  email, setEmail, password, setPassword, otp, setOtp, rememberMe, setRememberMe, showPassword, setShowPassword,
  needs2FA, showVerifyPrompt, setShowVerifyPrompt, isResending, error, isLoggingIn, isVerifying2FA,
  handleLogin, handleVerify2FA, handleResendVerification,
}: ReturnType<typeof useLoginLogic>) {
  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {error && (
        <div role="alert" style={{
          padding: '10px 12px', background: MB.dangerBg, border: `1px solid #FCA29B`,
          borderRadius: 8, marginBottom: 16, fontSize: 13, color: MB.danger,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Icon name="alert" size={16} color={MB.danger} />
          <span>{error}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email" htmlFor="login-email">
          <Input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <Input id="login-password" value={password} onChange={(e) => setPassword(e.target.value)}
            icon="lock" type={showPassword ? 'text' : 'password'}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} color={MB.text3} />
              </button>
            }
            autoComplete="current-password" />
        </Field>
        {needs2FA && (
          <Field label="Verification code" htmlFor="login-otp">
            <Input id="login-otp" value={otp} onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="6 digit code" />
          </Field>
        )}
        {showVerifyPrompt && (
          <div role="status" style={{ padding: '14px', background: MB.warnBg, borderRadius: 8, border: `1px solid #D97706`, marginBottom: 12 }}>
            <p style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600, color: MB.ink }}>Email verification required</p>
            <p style={{ fontSize: 13, color: MB.text2, margin: '0 0 12px 0', lineHeight: 1.5 }}>
              We sent a verification link to {email}.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn variant="primary" size="sm" type="button" loading={isResending} onClick={handleResendVerification}>
                Resend verification email
              </Btn>
              <Btn variant="secondary" size="sm" type="button" onClick={() => setShowVerifyPrompt(false)}>
                Back to sign in
              </Btn>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: showVerifyPrompt ? 8 : -2 }}>
          <Checkbox checked={rememberMe} onChange={(checked) => setRememberMe(checked)} label="Remember me" />
          <Link to="/forgot-password" style={{ fontSize: 13, color: MB.primary, fontWeight: 500 }}>Forgot password?</Link>
        </div>
        <Btn variant="primary" size="lg" full
          loading={isLoggingIn || isVerifying2FA}
          type={needs2FA ? 'button' : 'submit'}
          onClick={needs2FA ? handleVerify2FA : undefined}
          disabled={!email || !password || (needs2FA && otp.length !== 6)}
        >
          {needs2FA ? 'Verify code' : 'Sign in'}
        </Btn>
      </div>
    </form>
  )
}

// ── Appointment feed (desktop panel illustration) ─────────────────────────────
const PANEL_APPTS = [
  { time: '09:15', doctor: 'Dr. A. Chen', spec: 'Cardiology', patient: 'Sarah M.', type: 'Follow-up', status: 'done' },
  { time: '09:30', doctor: 'Dr. O. Patel', spec: 'Neurology', patient: 'James K.', type: 'Initial consult', status: 'done' },
  { time: '09:45', doctor: 'Dr. L. Nguyen', spec: 'Dermatology', patient: 'Emma R.', type: 'Check-up', status: 'active' },
  { time: '10:00', doctor: 'Dr. A. Chen', spec: 'Cardiology', patient: 'David L.', type: 'Echo review', status: 'next' },
  { time: '10:20', doctor: 'Dr. M. Osei', spec: 'Pediatrics', patient: 'Lily T.', type: 'Vaccination', status: 'upcoming' },
  { time: '10:35', doctor: 'Dr. O. Patel', spec: 'Neurology', patient: 'Chris B.', type: 'MRI review', status: 'upcoming' },
  { time: '10:50', doctor: 'Dr. L. Nguyen', spec: 'Dermatology', patient: 'Aisha F.', type: 'Consultation', status: 'upcoming' },
  { time: '11:05', doctor: 'Dr. M. Osei', spec: 'Pediatrics', patient: 'Noah W.', type: 'Follow-up', status: 'upcoming' },
] as const

const FEED_CARD_H = 70 // card height (62px) + gap (8px) — must match marginBottom below
const FEED_STRIP_H = FEED_CARD_H * PANEL_APPTS.length // translateY for seamless loop

function PanelApptCard({ time, doctor, spec, patient, type, status }: typeof PANEL_APPTS[number]) {
  const isActive = status === 'active'
  const isDone = status === 'done'
  const isNext = status === 'next'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 10, marginBottom: 8,
      background: isActive
        ? 'rgba(255,255,255,0.16)'
        : isDone ? 'rgba(255,255,255,0.04)'
        : isNext ? 'rgba(255,255,255,0.11)'
        : 'rgba(255,255,255,0.07)',
      boxShadow: isActive
        ? 'inset 0 0 0 1px rgba(255,255,255,0.28)'
        : `inset 0 0 0 1px rgba(255,255,255,${isDone ? '0.07' : isNext ? '0.17' : '0.11'})`,
    }}>
      <div style={{ flexShrink: 0, width: 36, textAlign: 'right' }}>
        <span style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums',
          color: isDone ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)',
        }}>{time}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: isDone ? 'rgba(255,255,255,0.35)' : '#fff',
        }}>{doctor} · {spec}</div>
        <div style={{
          fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          color: isDone ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.52)',
        }}>{patient} · {type}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {isActive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="mb-panel-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, letterSpacing: '0.01em' }}>In progress</span>
          </span>
        )}
        {isNext && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: 600, background: 'rgba(255,255,255,0.14)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.01em' }}>
            Next
          </span>
        )}
        {isDone && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>Done</span>
        )}
      </div>
    </div>
  )
}

// ── Mobile layout ─────────────────────────────────────────────────────────────
function MobileLogin(props: ReturnType<typeof useLoginLogic>) {
  return (
    <MobScreen bg={MB.bg}>
      <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <Logo size={28} />
          <span style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>MediBook</span>
        </div>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
        <p className="mb-small" style={{ marginBottom: 28 }}>Sign in to your MediBook account.</p>
        <LoginForm {...props} />
        <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center', fontSize: 13, color: MB.text3 }}>
          New to MediBook?{' '}
          <Link to="/register" style={{ color: MB.primary, fontWeight: 600 }}>Create account</Link>
        </div>
      </div>
    </MobScreen>
  )
}

// ── Desktop split layout ──────────────────────────────────────────────────────
function DesktopLogin(props: ReturnType<typeof useLoginLogic>) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: MB.bg, overflow: 'hidden' }}>
      {/* Left: form panel */}
      <div style={{ flex: '0 0 480px', maxWidth: 480, display: 'flex', flexDirection: 'column', padding: '48px 56px', overflowY: 'auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
          <Logo size={32} />
          <span style={{ fontSize: 18, fontWeight: 700, color: MB.ink }}>MediBook</span>
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 360 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 15, color: MB.text2, margin: '0 0 32px', lineHeight: 1.6 }}>
            Sign in to your MediBook account.
          </p>
          <LoginForm {...props} />
        </div>

        <div style={{ paddingTop: 32, fontSize: 13, color: MB.text3, textAlign: 'center' }}>
          New to MediBook?{' '}
          <Link to="/register" style={{ color: MB.primary, fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>

      {/* Right: visual panel */}
      <div aria-hidden="true" style={{
        flex: 1, background: `linear-gradient(135deg, ${MB.primary} 0%, ${MB.primary700} 100%)`,
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 56,
      }}>
        {/* Keyframe animations */}
        <style>{`
          @keyframes mb-appt-scroll {
            0%   { transform: translateY(0) }
            100% { transform: translateY(-${FEED_STRIP_H}px) }
          }
          @keyframes mb-appt-pulse {
            0%, 100% { opacity: 1; transform: scale(1) }
            50%       { opacity: 0.35; transform: scale(0.6) }
          }
          .mb-panel-dot  { animation: mb-appt-pulse 1.8s ease-in-out infinite; }
          .mb-appt-feed  { animation: mb-appt-scroll ${Math.round(FEED_STRIP_H / 13)}s linear infinite; }
          @media (prefers-reduced-motion: reduce) {
            .mb-appt-feed { animation: none !important; }
            .mb-panel-dot { animation: none !important; }
          }
        `}</style>

        {/* Background texture */}
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none' }} viewBox="0 0 600 800">
          <defs>
            <pattern id="login-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>

        {/* Appointment feed */}
        <div style={{ position: 'absolute', top: 52, left: 56, right: 56, bottom: 224 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Today's schedule
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontVariantNumeric: 'tabular-nums' }}>{today}</span>
          </div>
          <div style={{
            height: 'calc(100% - 30px)', overflow: 'hidden',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 80%, transparent 100%)',
          }}>
            <div className="mb-appt-feed">
              {[...PANEL_APPTS, ...PANEL_APPTS].map((a, i) => <PanelApptCard key={i} {...a} />)}
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', maxWidth: 520 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            Book the right doctor<br />at the right time.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, margin: 0 }}>
            One platform for patients, doctors, and admins. Real-time availability, automated reminders, and zero double-bookings.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default memo(function MobLogin() {
  const logic = useLoginLogic()
  const { isWide } = useViewport()

  if (isWide) return <DesktopLogin {...logic} />
  return <MobileLogin {...logic} />
})
