import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { AuthService } from '@/services/auth.service'
import { parseApiError } from '@/lib/api/contracts'

export default memo(function MobForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await AuthService.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      setError(parseApiError(err).message || 'Unable to send reset email. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" back transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon name="mail" size={28} color={MB.primary} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 24 }}>Check your email</h1>
          <p className="mb-small" style={{ margin: '8px 0 28px' }}>
            We sent a password reset link to <strong>{email}</strong>. It expires in 15 minutes.
          </p>
          <Btn variant="primary" size="lg" full onClick={() => setSent(false)}>
            Try a different email
          </Btn>
          <Link to="/login" style={{ display: 'block', marginTop: 16, fontSize: 13, color: MB.primary, fontWeight: 500, textAlign: 'center' }}>
            Back to sign in
          </Link>
        </div>
      </MobScreen>
    )
  }

  return (
    <MobScreen bg={MB.bg}>
      <MobTopBar title="" back transparent />
      <form onSubmit={handleSubmit} style={{ flex: 1, padding: '8px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="lock" size={22} color={MB.primary} />
        </div>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Reset your password</h1>
        <p className="mb-small" style={{ marginBottom: 28 }}>
          Enter your email and we'll send you a reset link.
        </p>

        {error && (
          <div role="alert" style={{ padding: '10px 12px', background: MB.dangerBg, border: `1px solid #FCA29B`, borderRadius: 8, marginBottom: 16, fontSize: 13, color: MB.danger, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="alert" size={16} color={MB.danger} />
            <span>{error}</span>
          </div>
        )}

        <Field label="Email" htmlFor="fp-email">
          <Input
            id="fp-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="mail"
            autoComplete="email"
            type="email"
          />
        </Field>

        <Btn
          variant="primary"
          size="lg"
          full
          type="submit"
          loading={loading}
          disabled={!email}
          style={{ marginTop: 20 }}
        >
          Send reset link
        </Btn>

        <Link to="/login" style={{ display: 'block', marginTop: 20, fontSize: 13, color: MB.primary, fontWeight: 500, textAlign: 'center' }}>
          Back to sign in
        </Link>
      </form>
    </MobScreen>
  )
})
