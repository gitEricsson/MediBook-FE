import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { UserRole } from '@/types/domain'
import type { IconName } from '@/types/ui'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'

interface Tab {
  id: string
  label: string
  icon: IconName
  path: string
  badge?: boolean
}

const TABS: Record<UserRole, Tab[]> = {
  patient: [
    { id: 'search',        label: 'Find',         icon: 'search',    path: '/patient/search'        },
    { id: 'appts',         label: 'Visits',        icon: 'calendar',  path: '/patient/appts'         },
    { id: 'notifications', label: 'Alerts',        icon: 'bell',      path: '/patient/notifications', badge: true },
    { id: 'profile',       label: 'Profile',       icon: 'user',      path: '/patient/profile'       },
  ],
  doctor: [
    { id: 'schedule', label: 'Schedule', icon: 'calendar', path: '/doctor/schedule' },
    { id: 'hours',    label: 'Hours',    icon: 'clock',    path: '/doctor/hours'    },
    { id: 'profile',  label: 'Profile',  icon: 'user',     path: '/doctor/profile'  },
  ],
  admin: [
    { id: 'patients',  label: 'Patients', icon: 'users',       path: '/admin/patients'  },
    { id: 'depts',     label: 'Depts',    icon: 'building',    path: '/admin/depts'     },
    { id: 'docs',      label: 'Doctors',  icon: 'stethoscope', path: '/admin/docs'      },
    { id: 'analytics', label: 'Analytics',icon: 'chart',       path: '/admin/analytics' },
  ],
  super_admin: [
    { id: 'patients',  label: 'Patients', icon: 'users',       path: '/admin/patients'  },
    { id: 'depts',     label: 'Depts',    icon: 'building',    path: '/admin/depts'     },
    { id: 'docs',      label: 'Doctors',  icon: 'stethoscope', path: '/admin/docs'      },
    { id: 'admins',    label: 'Admins',   icon: 'shield',      path: '/admin/admins'    },
  ],
}

interface MobTabBarProps {
  active?: string
  role?: UserRole
}

export const MobTabBar = memo(function MobTabBar({ active: activeProp, role = 'patient' }: MobTabBarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const tabs = TABS[role]

  // Derive active from URL when not provided explicitly
  const active = activeProp ?? tabs.find((t) => pathname.startsWith(t.path))?.id ?? tabs[0].id

  return (
    <nav
      aria-label="Main navigation"
      style={{ height: 64, background: MB.bg, borderTop: `1px solid ${MB.line2}`, display: 'flex', flexShrink: 0, paddingBottom: 4 }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id
        const hasBadge = t.badge && unreadCount > 0

        return (
          <button
            key={t.id}
            aria-label={t.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(t.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              color: isActive ? MB.primary : MB.text3,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', position: 'relative',
              transition: 'color .12s ease',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon name={t.icon} size={22} color={isActive ? MB.primary : MB.text3} strokeWidth={isActive ? 2 : 1.6} />
              {hasBadge && (
                <span
                  aria-label={`${unreadCount} unread notifications`}
                  style={{
                    position: 'absolute', top: -3, right: -5,
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: MB.danger, color: '#fff',
                    fontSize: 9, fontWeight: 700, lineHeight: '16px',
                    textAlign: 'center', padding: '0 3px',
                    border: `1.5px solid ${MB.bg}`,
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: '0.02em' }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
})
