import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Checkbox } from '@/components/forms/Checkbox'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { useAuth } from '@/hooks/useAuth'
import { parseApiError } from '@/lib/api/contracts'

export default memo(function MobRegister() {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError('You must agree to the Terms and Privacy Policy.')
      return
    }
    setError(null)
    setFieldErrors({})
    try {
      await register({ firstName, lastName, email, phone, password })
      localStorage.removeItem('mb_tour_seen')
      setRegistered(true)
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message || 'Unable to create account right now. Please try again.')
      setFieldErrors(parsed.fieldErrors)
    }
  }

  if (registered) {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" back transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon name="mail" size={28} color={MB.success} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 24 }}>Verify your email</h1>
          <p className="mb-small" style={{ margin: '8px 0 24px' }}>We created your account and sent a verification link to {email}. Sign in after verification.</p>
          <Btn variant="primary" size="lg" full onClick={() => navigate('/login')}>Back to sign in</Btn>
        </div>
      </MobScreen>
    )
  }

  return (
    <MobScreen bg={MB.bg}>
      <MobTopBar title="" back transparent />
      <form onSubmit={handleRegister} style={{ flex: 1, padding: '8px 24px 24px', overflow: 'auto' }}>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Create your account</h1>
        <p className="mb-small" style={{ marginBottom: 24 }}>Book and manage healthcare appointments in one place.</p>
        {error && (
          <div role="alert" style={{
            padding: '10px 12px', background: MB.dangerBg, border: '1px solid #FCA29B',
            borderRadius: 8, marginBottom: 16, fontSize: 13, color: MB.danger,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <Icon name="alert" size={16} color={MB.danger} />
            <span>{error}</span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First name" required htmlFor="reg-first"><Input id="reg-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" /></Field>
            <Field label="Last name"  required htmlFor="reg-last"><Input id="reg-last" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" /></Field>
          </div>
          <Field label="Email" required htmlFor="reg-email" error={fieldErrors.email}>
            <Input id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" error={!!fieldErrors.email} autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="reg-phone" error={fieldErrors.phone}>
            <Input id="reg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon="phone" autoComplete="tel" />
          </Field>
          <Field label="Password" required htmlFor="reg-pw" hint="At least 8 characters with upper/lowercase, number, and symbol" error={fieldErrors.password}>
            <Input id="reg-pw" value={password} onChange={(e) => setPassword(e.target.value)} icon="lock" type="password"
              suffix={<Icon name="eye" size={16} color={MB.text3} />} autoComplete="new-password" />
          </Field>
          <Checkbox checked={agreeTerms} onChange={() => setAgreeTerms((v) => !v)} label={
            <span>I agree to the{' '}
              <Link to="/terms" style={{ color: MB.primary }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: MB.primary }}>Privacy Policy</Link>
            </span>
          } />
          <Btn variant="primary" size="lg" full type="submit" loading={isRegistering} disabled={!firstName || !lastName || !email || !password || !agreeTerms}>Create account</Btn>
        </div>
      </form>
    </MobScreen>
  )
})
