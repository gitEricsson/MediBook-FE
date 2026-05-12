import { useNavigate } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { useAuthStore } from '@/store/authStore'

const ROLE_HOME: Record<string, string> = {
  admin: '/admin/patients',
  super_admin: '/admin/patients',
  doctor: '/doctor/schedule',
  patient: '/patient/search',
}

export function UnauthorizedState() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const home = user ? ROLE_HOME[user.role] : '/login'

  return (
    <main
      className="mb"
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: MB.bg2,
        padding: 24,
      }}
    >
      <section
        className="mb-card"
        aria-labelledby="unauthorized-title"
        style={{
          width: 'min(100%, 420px)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 14px',
            background: MB.dangerBg,
            color: MB.danger,
          }}
        >
          <Icon name="lock" size={21} />
        </div>
        <h1 id="unauthorized-title" className="mb-h2">Access restricted</h1>
        <p className="mb-body" style={{ marginTop: 8 }}>
          Your account does not have permission to open this workspace.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => navigate(-1)}>Go back</Btn>
          <Btn onClick={() => navigate(home, { replace: true })}>Open home</Btn>
        </div>
      </section>
    </main>
  )
}
