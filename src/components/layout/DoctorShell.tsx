import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Logo } from './Logo'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import type { IconName } from '@/types/ui'

interface NavItem { id: string; label: string; icon: IconName; path: string }

const NAV_ITEMS: NavItem[] = [
  { id: 'schedule', label: 'My schedule',    icon: 'calendar', path: '/doctor/schedule' },
  { id: 'hours',    label: 'Working hours',  icon: 'clock',    path: '/doctor/hours'    },
  { id: 'profile',  label: 'Profile',        icon: 'user',     path: '/doctor/profile'  },
]

function useActiveId(): string {
  const { pathname } = useLocation()
  // appointment detail pages are part of "schedule"
  if (pathname.startsWith('/doctor/appt')) return 'schedule'
  const found = NAV_ITEMS.find((n) => pathname.startsWith(n.path))
  return found?.id ?? 'schedule'
}

interface DoctorShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export const DoctorShell = memo(function DoctorShell({ children, title, subtitle, actions }: DoctorShellProps) {
  const { isWide } = useViewport()

  if (!isWide) {
    return <>{children}</>
  }

  return <DesktopDoctorLayout title={title} subtitle={subtitle} actions={actions}>{children}</DesktopDoctorLayout>
})

function DesktopDoctorLayout({
  children, title, subtitle, actions,
}: { children: React.ReactNode; title?: string; subtitle?: string; actions?: React.ReactNode }) {
  const navigate = useNavigate()
  const activeId = useActiveId()
  const authUser = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const displayName = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Doctor'

  return (
    <div
      className="mb"
      style={{ width: '100%', height: '100%', display: 'flex', background: MB.bg2, overflow: 'hidden' }}
    >
      {/* Sidebar */}
      <nav
        aria-label="Doctor navigation"
        style={{
          width: 220, background: MB.bg, borderRight: `1px solid ${MB.line2}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}
      >
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${MB.line2}` }}>
          <Logo size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink }}>MediBook</div>
            <div style={{ fontSize: 10, color: MB.text3, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Doctor portal</div>
          </div>
        </div>

        <div style={{ padding: 8, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                  display: 'flex', alignItems: 'center', gap: 10, border: 'none',
                  background: isActive ? MB.primary50 : 'transparent',
                  color: isActive ? MB.primary600 : MB.text2,
                  fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  transition: 'background .1s ease',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = MB.bg3 }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <Icon name={item.icon} size={16} color={isActive ? MB.primary600 : MB.text3} />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Doctor profile footer */}
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={displayName} size={30} tone="teal" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: MB.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. {displayName}</div>
            <div style={{ fontSize: 10, color: MB.text3 }}>{authUser?.email ?? ''}</div>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => { await logout() }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
          >
            <Icon name="logout" size={15} color={MB.text3} />
          </button>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {(title || actions) && (
          <header style={{
            height: 60, padding: '0 28px', background: MB.bg,
            borderBottom: `1px solid ${MB.line2}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              {title && <h1 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>}
              {subtitle && <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{subtitle}</div>}
            </div>
            {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>}
          </header>
        )}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
