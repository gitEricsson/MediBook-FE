import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Avatar } from '@/components/primitives/Avatar'
import { Logo } from './Logo'
import type { UserRole } from '@/types/domain'
import type { IconName } from '@/types/ui'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface NavItem { id: string; label: string; icon: IconName }

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  admin: [
    { id: 'home',      label: 'Overview',     icon: 'grid'        },
    { id: 'depts',     label: 'Departments',  icon: 'building'    },
    { id: 'docs',      label: 'Doctors',      icon: 'stethoscope' },
    { id: 'analytics', label: 'Analytics',    icon: 'chart'       },
    { id: 'capacity',  label: 'Capacity',     icon: 'calendar'    },
    { id: 'settings',  label: 'Settings',     icon: 'settings'    },
  ],
  doctor: [
    { id: 'schedule', label: 'Schedule',      icon: 'calendar' },
    { id: 'patients', label: 'Patients',      icon: 'users'    },
    { id: 'hours',    label: 'Working hours', icon: 'clock'    },
    { id: 'notes',    label: 'Notes',         icon: 'edit'     },
  ],
  patient: [
    { id: 'home',   label: 'Home',          icon: 'home'   },
    { id: 'search', label: 'Find a doctor', icon: 'search' },
    { id: 'appts',  label: 'My visits',     icon: 'calendar' },
    { id: 'profile',label: 'Profile',       icon: 'user'   },
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
    patients: '/doctor/schedule',
    hours: '/doctor/hours',
    notes: '/doctor/schedule',
  },
  patient: {
    home: '/patient/search',
    search: '/patient/search',
    appts: '/patient/appts',
    profile: '/patient/profile',
  },
}

interface DeskShellProps {
  children: React.ReactNode
  active?: string
  role?: UserRole
}

export const DeskShell = memo(function DeskShell({ children, active = 'home', role = 'admin' }: DeskShellProps) {
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)
  const items = NAV_BY_ROLE[role]
  const displayName = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'Account'
  const displaySub = authUser?.email ?? ''
  return (
    <div className="mb" style={{ width: '100%', height: '100%', display: 'flex', background: MB.bg2, overflow: 'hidden' }}>
      {/* Sidebar */}
      <nav className="mb-desk-sidebar" aria-label="Sidebar navigation" style={{ width: 240, background: MB.bg, borderRight: `1px solid ${MB.line2}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s ease' }}>
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${MB.line2}` }}>
          <Logo size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: MB.ink, letterSpacing: 0 }}>MediBook</div>
            <div style={{ fontSize: 10, color: MB.text3, fontWeight: 500, letterSpacing: 0.04, textTransform: 'uppercase' }}>{ROLE_LABEL[role]} console</div>
          </div>
        </div>
        <div style={{ padding: 8, flex: 1 }}>
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
                width: '100%', border: 'none', textAlign: 'left',
              }}>
                <Icon name={it.icon} size={16} color={isActive ? MB.primary600 : MB.text3} />
                <span className="mb-desk-nav-label">{it.label}</span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={displayName} size={32} tone="primary" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: MB.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displaySub}</div>
          </div>
          <Icon name="moreV" size={16} color={MB.text3} />
        </div>
      </nav>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
})
