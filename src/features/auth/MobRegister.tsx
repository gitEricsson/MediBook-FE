import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Checkbox } from '@/components/forms/Checkbox'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'

type RegisterState = 'default' | 'error'

interface MobRegisterProps { state?: RegisterState }

export default memo(function MobRegister({ state = 'default' }: MobRegisterProps) {
  const fieldErr = state === 'error'
  return (
    <MobScreen bg={MB.bg}>
      <MobTopBar title="" back transparent />
      <div style={{ flex: 1, padding: '8px 24px 24px', overflow: 'auto' }}>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Create your account</h1>
        <p className="mb-small" style={{ marginBottom: 24 }}>Book and manage healthcare appointments in one place.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First name" required htmlFor="reg-first"><Input id="reg-first" value="Sarah" autoComplete="given-name" /></Field>
            <Field label="Last name"  required htmlFor="reg-last"><Input id="reg-last"  value="Patient" autoComplete="family-name" /></Field>
          </div>
          <Field label="Email" required htmlFor="reg-email" error={fieldErr ? 'This email is already registered' : null}>
            <Input id="reg-email" value="sarah.patient@email.com" icon="mail" error={fieldErr} autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="reg-phone">
            <Input id="reg-phone" value="(415) 555-0142" icon="phone" autoComplete="tel" />
          </Field>
          <Field label="Password" required htmlFor="reg-pw" hint="Min 10 chars, 1 number, 1 symbol">
            <Input id="reg-pw" value="••••••••••" icon="lock" type="password"
              suffix={<Icon name="eye" size={16} color={MB.text3} />} autoComplete="new-password" />
          </Field>
          <Checkbox checked label={
            <span>I agree to the{' '}
              <Link to="/terms" style={{ color: MB.primary }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: MB.primary }}>Privacy Policy</Link>
            </span>
          } />
          <Btn variant="primary" size="lg" full type="submit">Create account</Btn>
        </div>
      </div>
    </MobScreen>
  )
})
