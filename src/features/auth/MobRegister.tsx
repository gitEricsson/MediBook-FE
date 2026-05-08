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

export default memo(function MobRegister() {
  const navigate = useNavigate()
  const { register, isRegistering } = useAuth()
  const [firstName, setFirstName] = useState('Sarah')
  const [lastName, setLastName] = useState('Patient')
  const [email, setEmail] = useState('sarah.patient@email.com')
  const [phone, setPhone] = useState('+14155550142')
  const [password, setPassword] = useState('Password123!')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setError('You must agree to the Terms and Privacy Policy.')
      return
    }
    setError(null)
    try {
      await register({ firstName, lastName, email, phone, password })
      navigate('/patient')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create account right now. Please try again.')
    }
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
          <Field label="Email" required htmlFor="reg-email" error={error ? 'This email may already be registered' : null}>
            <Input id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" error={!!error} autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="reg-phone">
            <Input id="reg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon="phone" autoComplete="tel" />
          </Field>
          <Field label="Password" required htmlFor="reg-pw" hint="Min 10 chars, 1 number, 1 symbol">
            <Input id="reg-pw" value={password} onChange={(e) => setPassword(e.target.value)} icon="lock" type="password"
              suffix={<Icon name="eye" size={16} color={MB.text3} />} autoComplete="new-password" />
          </Field>
          <Checkbox checked={agreeTerms} onChange={() => setAgreeTerms((v) => !v)} label={
            <span>I agree to the{' '}
              <Link to="/terms" style={{ color: MB.primary }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: MB.primary }}>Privacy Policy</Link>
            </span>
          } />
          <Btn variant="primary" size="lg" full type="submit" loading={isRegistering}>Create account</Btn>
        </div>
      </form>
    </MobScreen>
  )
})
