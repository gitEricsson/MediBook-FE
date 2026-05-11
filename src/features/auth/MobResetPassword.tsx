import { memo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { AuthService } from '@/services/auth.service'
import { parseApiError } from '@/lib/api/contracts'

export default memo(function MobResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mismatch = confirm.length > 0 && password !== confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mismatch) return
    setError(null)
    setLoading(true)
    try {
      await AuthService.resetPassword({ token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(parseApiError(err).message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" back transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: MB.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="alert" size={26} color={MB.danger} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 22 }}>Invalid link</h1>
          <p className="mb-small" style={{ margin: '8px 0 24px' }}>This reset link is missing or invalid. Request a new one.</p>
          <Btn variant="primary" size="lg" full onClick={() => navigate('/forgot-password')}>Request new link</Btn>
        </div>
      </MobScreen>
    )
  }

  if (done) {
    return (
      <MobScreen bg={MB.bg}>
        <MobTopBar title="" transparent />
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon name="check" size={32} color={MB.success} strokeWidth={2.5} />
          </div>
          <h1 className="mb-h1" style={{ fontSize: 24 }}>Password updated</h1>
          <p className="mb-small" style={{ margin: '8px 0 28px' }}>You can now sign in with your new password.</p>
          <Btn variant="primary" size="lg" full onClick={() => navigate('/login')}>Sign in</Btn>
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
        <h1 className="mb-h1" style={{ fontSize: 26, marginBottom: 6 }}>Set new password</h1>
        <p className="mb-small" style={{ marginBottom: 28 }}>Choose a strong password with at least 8 characters.</p>

        {error && (
          <div role="alert" style={{ padding: '10px 12px', background: MB.dangerBg, border: `1px solid #FCA29B`, borderRadius: 8, marginBottom: 16, fontSize: 13, color: MB.danger, display: 'flex', gap: 8 }}>
            <Icon name="alert" size={16} color={MB.danger} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="New password" htmlFor="rp-pw" hint="Min 8 chars, upper/lowercase, number and symbol">
            <Input id="rp-pw" value={password} onChange={(e) => setPassword(e.target.value)} type="password" icon="lock" autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" htmlFor="rp-pw2" error={mismatch ? 'Passwords do not match' : undefined}>
            <Input id="rp-pw2" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" icon="lock" error={mismatch} autoComplete="new-password" />
          </Field>
        </div>

        <Btn
          variant="primary"
          size="lg"
          full
          type="submit"
          loading={loading}
          disabled={!password || !confirm || mismatch}
          style={{ marginTop: 24 }}
        >
          Update password
        </Btn>

        <Link to="/login" style={{ display: 'block', marginTop: 16, fontSize: 13, color: MB.primary, fontWeight: 500, textAlign: 'center' }}>
          Back to sign in
        </Link>
      </form>
    </MobScreen>
  )
})
