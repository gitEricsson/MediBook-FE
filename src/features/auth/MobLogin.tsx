import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { Logo } from '@/components/layout/Logo'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Checkbox } from '@/components/forms/Checkbox'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { MobScreen } from '@/components/layout/MobScreen'

type LoginState = 'default' | 'error' | 'loading'

interface MobLoginProps { state?: LoginState }

export default memo(function MobLogin({ state = 'default' }: MobLoginProps) {
  const isError   = state === 'error'
  const isLoading = state === 'loading'
  return (
    <MobScreen bg={MB.bg}>
      <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <Logo size={28} />
          <span style={{ fontSize: 17, fontWeight: 700, color: MB.ink, letterSpacing: -0.01 }}>MediBook</span>
        </div>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
        <p className="mb-small" style={{ marginBottom: 28 }}>Sign in to manage your appointments.</p>

        {isError && (
          <div role="alert" style={{
            padding: '10px 12px', background: MB.dangerBg, border: `1px solid #FCA29B`,
            borderRadius: 8, marginBottom: 16, fontSize: 13, color: MB.danger,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <Icon name="alert" size={16} color={MB.danger} />
            <span>The email or password you entered is incorrect.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" htmlFor="login-email">
            <Input id="login-email" value="sarah.patient@email.com" icon="mail" autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="login-password" error={isError ? 'Check your password and try again' : null}>
            <Input id="login-password" value="••••••••••" icon="lock" type="password" error={isError}
              suffix={<Icon name="eye" size={16} color={MB.text3} />} autoComplete="current-password" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 }}>
            <Checkbox checked label="Remember me" />
            <Link to="/forgot-password" style={{ fontSize: 13, color: MB.primary, fontWeight: 500 }}>Forgot password?</Link>
          </div>
          <Btn variant="primary" size="lg" full loading={isLoading} type="submit">Sign in</Btn>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center', fontSize: 13, color: MB.text3 }}>
          New to MediBook?{' '}
          <Link to="/register" style={{ color: MB.primary, fontWeight: 600 }}>Create account</Link>
        </div>
      </div>
    </MobScreen>
  )
})
