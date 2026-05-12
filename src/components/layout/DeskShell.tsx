import { memo, useState, useRef, useEffect } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Logo } from './Logo'
import type { UserRole } from '@/types/domain'
import type { IconName } from '@/types/ui'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'

interface NavItem { id: string; label: string; icon: IconName }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: [
    { id: 'home',      label: 'Overview',      icon: 'grid'        },
    { id: 'depts',     label: 'Departments',   icon: 'building'    },
    { id: 'docs',      label: 'Doctors',       icon: 'stethoscope' },
    { id: 'analytics', label: 'Analytics',     icon: 'chart'       },
    { id: 'capacity',  label: 'Capacity',      icon: 'calendar'    },
    { id: 'settings',  label: 'Settings',      icon: 'settings'    },
  ],
  doctor: [
    { id: 'schedule', label: 'Schedule',       icon: 'calendar' },
    { id: 'hours',    label: 'Working hours',  icon: 'clock'    },
    { id: 'profile',  label: 'Profile',        icon: 'user'     },
  ],
  patient: [
    { id: 'home',   label: 'Home',             icon: 'home'     },
    { id: 'search', label: 'Find a doctor',    icon: 'search'   },
    { id: 'appts',  label: 'My visits',        icon: 'calendar' },
    { id: 'profile',label: 'Profile',          icon: 'user'     },
  ],
}

const ROLE_LABEL: Record<UserRole, string> = { admin: 'Admin', doctor: 'Doctor', patient: 'Patient' }

const NAV_PATHS: Record<UserRole, Record<string, string>> = {
  admin: {
    home: '/admin/patients',
    depts: '/admin/depts',
    docs: '/admin/docs',
    analytics: '/admin/analytics',
    capacity: '/admin/capacity',
    settings: '/admin/settings',
  },
  doctor: {
    schedule: '/doctor/schedule',
    hours: '/doctor/hours',
    profile: '/doctor/profile',
  },
  patient: {
    home: '/patient/search',
    search: '/patient/search',
    appts: '/patient/appts',
    profile: '/patient/profile',
  },
}

// Derive active nav item from the current URL path
function useActiveNavId(role: UserRole): string {
  const { pathname } = useLocation()
  const paths = NAV_PATHS[role]
  // find the most specific match first
  const entry = Object.entries(paths).find(([, path]) => pathname.startsWith(path))
  return entry ? entry[0] : 'home'
}

// ── User menu ─────────────────────────────────────────────────────────────────
function UserMenu({ name, sub }: { name: string; sub: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ padding: 12, borderTop: `1px solid ${MB.line2}`, position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px',
          borderRadius: 8, transition: 'background .1s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = MB.bg3 }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <Avatar name={name} size={32} tone="primary" />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: MB.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 11, color: MB.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
        </div>
        <Icon name="moreV" size={16} color={MB.text3} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', bottom: '100%', left: 8, right: 8,
            background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 10,
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)', zIndex: 200,
            overflow: 'hidden', marginBottom: 4,
          }}
        >
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${MB.line2}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{name}</div>
            <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>{sub}</div>
          </div>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/') }}
            style={menuItemStyle}
          >
            <Icon name="home" size={14} color={MB.text3} /> Home
          </button>
          <div style={{ height: 1, background: MB.line2, margin: '4px 0' }} />
          <button
            role="menuitem"
            onClick={async () => { setOpen(false); await logout() }}
            style={{ ...menuItemStyle, color: MB.danger }}
          >
            <Icon name="logout" size={14} color={MB.danger} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
  fontSize: 13, fontWeight: 500, color: MB.text, textAlign: 'left',
  fontFamily: 'inherit', transition: 'background .1s ease',
}

// ═════════════════════════════════════════════════════════════════════════════

interface DeskShellProps {
  children: React.ReactNode
  active?: string
  role?: UserRole
}

export const DeskShell = memo(function DeskShell({ children, active: activeProp, role = 'admin' }: DeskShellProps) {
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)
  const derivedActive = useActiveNavId(role)
  const active = activeProp ?? derivedActive

  const items = NAV_BY_ROLE[role]
  const displayName = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Account'
  const displaySub = authUser?.email ?? ''

  return (
    <div className="mb" style={{ width: '100%', height: '100%', display: 'flex', background: MB.bg2, overflow: 'hidden' }}>
      {/* Sidebar */}
      <nav
        className="mb-desk-sidebar"
        aria-label="Sidebar navigation"
        style={{ width: 240, background: MB.bg, borderRight: `1px solid ${MB.line2}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s ease' }}
      >
        {/* Logo / branding */}
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${MB.line2}` }}>
          <Logo size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink, letterSpacing: 0 }}>MediBook</div>
            <div style={{ fontSize: 10, color: MB.text3, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{ROLE_LABEL[role]} console</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: 8, flex: 1, overflowY: 'auto' }}>
          {items.map((it) => {
            const isActive = active === it.id
            return (
              <button
                key={it.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(NAV_PATHS[role][it.id] || '/')}
                style={{
                  padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive ? MB.primary50 : 'transparent',
                  color: isActive ? MB.primary600 : MB.text2,
                  fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
                  width: '100%', border: 'none', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'background .1s ease, color .1s ease',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = MB.bg3 }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <Icon name={it.icon} size={16} color={isActive ? MB.primary600 : MB.text3} />
                <span className="mb-desk-nav-label">{it.label}</span>
              </button>
            )
          })}
        </div>

        {/* User menu */}
        <UserMenu name={displayName} sub={displaySub} />
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
})
