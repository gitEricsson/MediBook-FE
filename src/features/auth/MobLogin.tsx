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
import { parseApiError } from '@/lib/api/contracts'

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
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const response = await login({ email, password })
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
      }
    } catch (err) {
      setError(parseApiError(err).message || 'The email or password you entered is incorrect.')
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
      }
    } catch (err) {
      setError(parseApiError(err).message || 'Invalid verification code.')
    }
  }

  return { email, setEmail, password, setPassword, otp, setOtp, rememberMe, setRememberMe, showPassword, setShowPassword, needs2FA, error, isLoggingIn, isVerifying2FA, handleLogin, handleVerify2FA }
}

// ── Shared form fields ────────────────────────────────────────────────────────
function LoginForm({
  email, setEmail, password, setPassword, otp, setOtp, rememberMe, setRememberMe, showPassword, setShowPassword,
  needs2FA, error, isLoggingIn, isVerifying2FA,
  handleLogin, handleVerify2FA,
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
              inputMode="numeric" maxLength={6} autoComplete="one-time-code" />
          </Field>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 }}>
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
        <p className="mb-small" style={{ marginBottom: 28 }}>Sign in to manage your appointments.</p>
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
            Sign in to manage your appointments.
          </p>
          <LoginForm {...props} />
        </div>

        <div style={{ paddingTop: 32, fontSize: 13, color: MB.text3, textAlign: 'center' }}>
          New to MediBook?{' '}
          <Link to="/register" style={{ color: MB.primary, fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>

      {/* Right: visual panel */}
      <div style={{
        flex: 1, background: `linear-gradient(135deg, ${MB.primary} 0%, ${MB.primary700} 100%)`,
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 56,
      }}>
        {/* Dot pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }} viewBox="0 0 600 800">
          <defs>
            <pattern id="login-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>
        {/* Decorative circle */}
        <svg viewBox="0 0 240 240" width={260} height={260}
          style={{ position: 'absolute', top: 60, right: 60, opacity: 0.15 }}>
          <circle cx="120" cy="120" r="100" stroke="#fff" strokeWidth="1.5" fill="none" />
          <circle cx="120" cy="120" r="70" stroke="#fff" strokeWidth="1.5" fill="none" />
          <path d="M120 40v160M40 120h160" stroke="#fff" strokeWidth="1.5" />
        </svg>

        {/* Small stats bar */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 28, position: 'relative' }}>
          {[
            { label: 'Appointments', value: '148 today' },
            { label: 'Active doctors', value: '24' },
            { label: 'No-show rate', value: '4.2%' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', maxWidth: 520 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', background: 'rgba(255,255,255,0.15)',
            borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#fff',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18,
          }}>
            <Icon name="sparkle" size={11} color="#fff" /> Healthcare, simplified
          </div>
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
