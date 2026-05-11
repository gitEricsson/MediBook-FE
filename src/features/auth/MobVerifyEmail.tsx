import { memo, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { LoadingDots } from '@/components/feedback/LoadingDots'
import { AuthService } from '@/services/auth.service'
import { parseApiError } from '@/lib/api/contracts'

export default memo(function MobVerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying')
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setStatus('resend'); return }
    AuthService.verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setError(parseApiError(err).message || 'Verification failed. The link may have expired.')
        setStatus('error')
      })
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResending(true)
    try {
      await AuthService.resendVerification(resendEmail)
      setResendSent(true)
    } catch (err) {
      setError(parseApiError(err).message || 'Could not resend. Try again.')
    } finally {
      setResending(false)
    }
  }

  if (status === 'verifying') {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="Verifying email" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingDots />
        </div>
      </MobScreen>
    )
  }

  if (status === 'success') {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon name="check" size={32} color={MB.success} strokeWidth={2.5} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 24 }}>Email verified</h1>
          <p className="mb-small" style={{ margin: '8px 0 28px' }}>Your account is now active. You can sign in.</p>
          <Btn variant="primary" size="lg" full onClick={() => navigate('/login')}>Sign in</Btn>
        </div>
      </MobScreen>
    )
  }

  if (status === 'error') {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" back transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: MB.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="alert" size={26} color={MB.danger} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 22 }}>Link expired</h1>
          <p className="mb-small" style={{ margin: '8px 0 8px' }}>{error}</p>
          <Btn variant="primary" size="lg" full style={{ marginTop: 20 }} onClick={() => setStatus('resend')}>
            Resend verification email
          </Btn>
          <Link to="/login" style={{ display: 'block', marginTop: 16, fontSize: 13, color: MB.primary, fontWeight: 500 }}>
            Back to sign in
          </Link>
        </div>
      </MobScreen>
    )
  }

  // Resend flow
  return (
    <MobScreen bg={MB.bg}>
      <MobTopBar title="" back transparent />
      <form onSubmit={handleResend} style={{ flex: 1, padding: '8px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="mail" size={22} color={MB.primary} />
        </div>
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Verify your email</h1>
        <p className="mb-small" style={{ marginBottom: 28 }}>
          {resendSent
            ? `We sent a new link to ${resendEmail}. Check your inbox.`
            : "Enter your email to receive a new verification link."}
        </p>

        {!resendSent && (
          <>
            <Field label="Email" htmlFor="ve-email">
              <Input id="ve-email" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} icon="mail" type="email" autoComplete="email" />
            </Field>
            <Btn variant="primary" size="lg" full type="submit" loading={resending} disabled={!resendEmail} style={{ marginTop: 20 }}>
              Send verification link
            </Btn>
          </>
        )}

        <Link to="/login" style={{ display: 'block', marginTop: 20, fontSize: 13, color: MB.primary, fontWeight: 500, textAlign: 'center' }}>
          Back to sign in
        </Link>
      </form>
    </MobScreen>
  )
})
