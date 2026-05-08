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

export default memo(function MobLogin() {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('sarah.patient@email.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login({ email, password });
      if (response.user) {
        if (response.user.role === 'patient') navigate('/patient');
        else if (response.user.role === 'doctor') navigate('/doctor');
        else if (response.user.role === 'admin') navigate('/admin');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'The email or password you entered is incorrect.');
    }
  };

  return (
    <MobScreen bg={MB.bg}>
      <form onSubmit={handleLogin} style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <Logo size={28} />
          <span style={{ fontSize: 17, fontWeight: 700, color: MB.ink, letterSpacing: -0.01 }}>MediBook</span>
        </div>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
        <p className="mb-small" style={{ marginBottom: 28 }}>Sign in to manage your appointments.</p>

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
            <Input 
              id="login-email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              icon="mail" 
              autoComplete="email" 
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input 
              id="login-password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              icon="lock" 
              type="password" 
              suffix={<Icon name="eye" size={16} color={MB.text3} />} 
              autoComplete="current-password" 
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -2 }}>
            <Checkbox checked label="Remember me" />
            <Link to="/forgot-password" style={{ fontSize: 13, color: MB.primary, fontWeight: 500 }}>Forgot password?</Link>
          </div>
          <Btn variant="primary" size="lg" full loading={isLoggingIn} type="submit">Sign in</Btn>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center', fontSize: 13, color: MB.text3 }}>
          New to MediBook?{' '}
          <Link to="/register" style={{ color: MB.primary, fontWeight: 600 }}>Create account</Link>
        </div>
      </form>
    </MobScreen>
  )
})
