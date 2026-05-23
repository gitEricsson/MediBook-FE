import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Logo } from './Logo'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useViewport } from '@/hooks/useViewport'
import { useNotificationStore } from '@/store/notificationStore'
import type { IconName } from '@/types/ui'

interface NavItem { id: string; label: string; icon: IconName; path: string; badge?: boolean }

const NAV_ITEMS: NavItem[] = [
  { id: 'search',        label: 'Find a doctor',    icon: 'search',   path: '/patient/search'        },
  { id: 'appts',         label: 'My visits',         icon: 'calendar', path: '/patient/appts'         },
  { id: 'emergency',     label: 'Emergency',         icon: 'alert',    path: '/patient/emergency'     },
  { id: 'history',       label: 'History',           icon: 'clock',    path: '/patient/history'       },
  { id: 'notifications', label: 'Notifications',     icon: 'bell',     path: '/patient/notifications', badge: true },
  { id: 'profile',       label: 'Profile',           icon: 'user',     path: '/patient/profile'       },
]

function useActiveId(): string {
  const { pathname } = useLocation()
  // The consultation detail route uses /patient/appt/:id (singular). Map it
  // to the "appts" nav so the sidebar highlight stays on "My visits" while the
  // user is reading a specific appointment.
  if (pathname.startsWith('/patient/appt/')) return 'appts'
  // Same for the in-app payment hand-off — the user is mid-visit-management.
  if (pathname.startsWith('/patient/pay/')) return 'appts'
  const found = NAV_ITEMS.find((n) => pathname.startsWith(n.path))
  return found?.id ?? 'search'
}

interface PatientShellProps {
  children: React.ReactNode
  /** Page title for the desktop top bar */
  title?: string
  /** Right-side actions for the desktop top bar */
  actions?: React.ReactNode
}

export const PatientShell = memo(function PatientShell({ children, title, actions }: PatientShellProps) {
  const { isWide } = useViewport()

  if (!isWide) {
    // Mobile: render children directly — MobScreen/MobTabBar handle layout
    return <>{children}</>
  }

  return <DesktopPatientLayout title={title} actions={actions}>{children}</DesktopPatientLayout>
})

// ── Desktop layout ─────────────────────────────────────────────────────────────
function DesktopPatientLayout({
  children, title, actions,
}: { children: React.ReactNode; title?: string; actions?: React.ReactNode }) {
  const navigate = useNavigate()
  const activeId = useActiveId()
  const authUser = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const displayName = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Account'

  return (
    <div
      className="mb"
      style={{ width: '100%', height: '100%', display: 'flex', background: MB.bg2, overflow: 'hidden' }}
    >
      {/* Sidebar */}
      <nav
        aria-label="Patient navigation"
        style={{
          width: 220, background: MB.bg, borderRight: `1px solid ${MB.line2}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${MB.line2}` }}>
          <Logo size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink }}>MediBook</div>
            <div style={{ fontSize: 10, color: MB.text3, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Patient portal</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: 8, flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            const hasBadge = item.badge && unreadCount > 0
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
                <div style={{ position: 'relative' }}>
                  <Icon name={item.icon} size={16} color={isActive ? MB.primary600 : MB.text3} />
                  {hasBadge && (
                    <span style={{
                      position: 'absolute', top: -4, right: -5,
                      minWidth: 14, height: 14, borderRadius: 7,
                      background: MB.danger, color: '#fff',
                      fontSize: 8, fontWeight: 700, lineHeight: '14px',
                      textAlign: 'center', padding: '0 2px',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {item.label}
              </button>
            )
          })}
        </div>

        {/* User footer */}
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={displayName} size={30} tone="primary" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: MB.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: 10, color: MB.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser?.email ?? ''}</div>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => { await logout() }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
          >
            <Icon name="logout" size={15} color={MB.text3} />
          </button>
        </div>
      </nav>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        {(title || actions) && (
          <header style={{
            height: 60, padding: '0 28px', background: MB.bg,
            borderBottom: `1px solid ${MB.line2}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {title && (
              <h1 style={{ fontSize: 17, fontWeight: 700, color: MB.ink, margin: 0, letterSpacing: '-0.01em' }}>
                {title}
              </h1>
            )}
            {actions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {actions}
              </div>
            )}
          </header>
        )}
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
