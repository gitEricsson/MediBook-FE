import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Logo } from '@/components/layout/Logo'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Checkbox } from '@/components/forms/Checkbox'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import { parseApiError } from '@/lib/api/contracts'
import { validatePassword, validateEmail, validateRequired } from '@/lib/validation'
import { sanitizeInput } from '@/lib/sanitize'

function useRegisterLogic() {
  const navigate = useNavigate()
  const { register, isRegistering } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [registered, setRegistered] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms and Privacy Policy.')
      return
    }

    // Validate email format
    const emailError = validateEmail(email)
    if (emailError) {
      setFieldErrors({ email: emailError })
      return
    }

    // Validate password strength
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setFieldErrors({ password: passwordErrors[0] })
      return
    }

    try {
      // Sanitize inputs before sending to API
      const sanitizedData = {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        email: email.toLowerCase().trim(),
        phone: phone.replace(/\s+/g, ''),
        password: password, // Don't sanitize password
      }

      await register(sanitizedData)
      localStorage.removeItem('mb_tour_seen')
      setRegistered(true)
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message || 'Unable to create account right now. Please try again.')
      setFieldErrors(parsed.fieldErrors)
    }
  }

  return { firstName, setFirstName, lastName, setLastName, email, setEmail, phone, setPhone, password, setPassword, agreeTerms, setAgreeTerms, showPassword, setShowPassword, error, fieldErrors, registered, isRegistering, handleRegister, navigate }
}

function RegisterForm(props: ReturnType<typeof useRegisterLogic>) {
  const { firstName, setFirstName, lastName, setLastName, email, setEmail, phone, setPhone, password, setPassword, agreeTerms, setAgreeTerms, showPassword, setShowPassword, error, fieldErrors, isRegistering, handleRegister } = props
  return (
    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div role="alert" style={{ padding: '10px 12px', background: MB.dangerBg, border: '1px solid #FCA29B', borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="alert" size={16} color={MB.danger} /><span>{error}</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="First name" required htmlFor="reg-first"><Input id="reg-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" /></Field>
        <Field label="Last name" required htmlFor="reg-last"><Input id="reg-last" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" /></Field>
      </div>
      <Field label="Email" required htmlFor="reg-email" error={fieldErrors.email}>
        <Input id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" error={!!fieldErrors.email} autoComplete="email" />
      </Field>
      <Field label="Phone" htmlFor="reg-phone" error={fieldErrors.phone}>
        <Input id="reg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon="phone" autoComplete="tel" />
      </Field>
      <Field label="Password" required htmlFor="reg-pw" hint="At least 8 characters with upper/lowercase, number, and symbol" error={fieldErrors.password}>
        <div style={{ position: 'relative' }}>
          <Input id="reg-pw" value={password} onChange={(e) => setPassword(e.target.value)} icon="lock" type={showPassword ? 'text' : 'password'} autoComplete="new-password" />
          <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} color={MB.text3} />
          </button>
        </div>
      </Field>
      <Checkbox checked={agreeTerms} onChange={() => setAgreeTerms((v) => !v)} label={
        <span>I agree to the <Link to="/terms" style={{ color: MB.primary }}>Terms</Link> and <Link to="/privacy" style={{ color: MB.primary }}>Privacy Policy</Link></span>
      } />
      <Btn variant="primary" size="lg" full type="submit" loading={isRegistering}
        disabled={!firstName || !lastName || !email || !password || !agreeTerms}>
        Create account
      </Btn>
    </form>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────
function MobileRegister(props: ReturnType<typeof useRegisterLogic>) {
  const { registered, email, navigate } = props
  if (registered) {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" back transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon name="mail" size={28} color={MB.success} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 24 }}>Verify your email</h1>
          <p className="mb-small" style={{ margin: '8px 0 24px' }}>We created your account and sent a verification link to {email}.</p>
          <Btn variant="primary" size="lg" full onClick={() => navigate('/login')}>Back to sign in</Btn>
        </div>
      </MobScreen>
    )
  }
  return (
    <MobScreen bg={MB.bg}>
      <MobTopBar title="" back transparent />
      <div style={{ flex: 1, padding: '8px 24px 24px', overflow: 'auto' }}>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Create your account</h1>
        <p className="mb-small" style={{ marginBottom: 24 }}>Book and manage healthcare appointments in one place.</p>
        <RegisterForm {...props} />
      </div>
    </MobScreen>
  )
}

// ── Desktop split ─────────────────────────────────────────────────────────────
function DesktopRegister(props: ReturnType<typeof useRegisterLogic>) {
  const { registered, email, navigate } = props
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: MB.bg, overflow: 'hidden' }}>
      {/* Left: visual */}
      <div style={{
        flex: '0 0 400px', maxWidth: 400,
        background: `linear-gradient(160deg, ${MB.primary50} 0%, #EFF6FF 100%)`,
        display: 'flex', flexDirection: 'column', padding: '52px 40px',
        borderRight: `1px solid ${MB.line}`,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 48 }}>
          <Logo size={30} />
          <span style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>MediBook</span>
        </Link>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
            Your health,<br />your schedule.
          </h2>
          <p style={{ fontSize: 14, color: MB.text2, lineHeight: 1.7, margin: '0 0 32px' }}>
            Join thousands of patients who book, manage, and track their healthcare appointments in one place.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: 'search', text: 'Find doctors by specialty in seconds' },
              { icon: 'calendar', text: 'Real-time appointment availability' },
              { icon: 'bell', text: 'Automatic reminders before each visit' },
              { icon: 'clock', text: 'View full appointment history anytime' },
            ].map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={f.icon as never} size={14} color={MB.primary} />
                </div>
                <span style={{ fontSize: 13, color: MB.text2 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: MB.text3 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: MB.primary, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {registered ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Icon name="mail" size={32} color={MB.success} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: MB.ink, margin: '0 0 12px' }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: MB.text2, maxWidth: 400, margin: '0 0 28px', lineHeight: 1.6 }}>
              We created your account and sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
            <Btn variant="primary" size="lg" onClick={() => navigate('/login')}>Go to sign in</Btn>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '48px 56px', maxWidth: 560, width: '100%', margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: MB.ink, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Create your account</h1>
            <p style={{ fontSize: 14, color: MB.text2, margin: '0 0 28px', lineHeight: 1.6 }}>Book and manage healthcare appointments in one place.</p>
            <RegisterForm {...props} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default memo(function MobRegister() {
  const logic = useRegisterLogic()
  const { isWide } = useViewport()
  if (isWide) return <DesktopRegister {...logic} />
  return <MobileRegister {...logic} />
})
