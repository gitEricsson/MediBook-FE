import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { UserRole } from '@/types/domain'
import type { IconName } from '@/types/ui'
import { useNavigate } from 'react-router-dom'

interface Tab {
  id: string
  label: string
  icon: IconName
  path: string
}

const TABS: Record<UserRole, Tab[]> = {
  patient: [
    { id: 'search', label: 'Find',    icon: 'search',   path: '/patient/search' },
    { id: 'appts',  label: 'Visits',  icon: 'calendar', path: '/patient/appts'  },
    { id: 'profile',label: 'Profile', icon: 'user',     path: '/patient/profile'},
  ],
  doctor: [
    { id: 'schedule', label: 'Schedule', icon: 'calendar', path: '/doctor/schedule' },
    { id: 'hours',    label: 'Hours',    icon: 'clock',    path: '/doctor/hours'    },
    { id: 'profile',  label: 'Profile',  icon: 'user',     path: '/doctor/profile'  },
  ],
  admin: [
    { id: 'patients',  label: 'Patients', icon: 'users',      path: '/admin/patients' },
    { id: 'depts',     label: 'Depts',    icon: 'building',   path: '/admin/depts'    },
    { id: 'docs',      label: 'Doctors',  icon: 'stethoscope',path: '/admin/docs'     },
    { id: 'analytics', label: 'Analytics',icon: 'chart',      path: '/admin/analytics'},
  ],
}

interface MobTabBarProps {
  active?: string
  role?: UserRole
}

export const MobTabBar = memo(function MobTabBar({ active, role = 'patient' }: MobTabBarProps) {
  const navigate = useNavigate();
  const tabs = TABS[role]
  
  return (
    <nav aria-label="Main navigation" style={{ height: 64, background: MB.bg, borderTop: `1px solid ${MB.line2}`, display: 'flex', flexShrink: 0, paddingBottom: 4 }}>
      {tabs.map((t) => {
        const isActive = active === t.id
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
              fontFamily: 'inherit',
            }}
          >
            <Icon name={t.icon} size={22} color={isActive ? MB.primary : MB.text3} strokeWidth={isActive ? 2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: 0.02 }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
})
