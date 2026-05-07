import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import type { UserRole } from '@/types/domain'
import type { IconName } from '@/types/ui'

interface Tab {
  id: string
  label: string
  icon: IconName
}

const TABS: Record<UserRole, Tab[]> = {
  patient: [
    { id: 'home',   label: 'Home',    icon: 'home'     },
    { id: 'search', label: 'Find',    icon: 'search'   },
    { id: 'appts',  label: 'Visits',  icon: 'calendar' },
    { id: 'profile',label: 'Profile', icon: 'user'     },
  ],
  doctor: [
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'patients', label: 'Patients', icon: 'users'    },
    { id: 'hours',    label: 'Hours',    icon: 'clock'    },
    { id: 'profile',  label: 'Profile',  icon: 'user'     },
  ],
  admin: [
    { id: 'home',      label: 'Overview', icon: 'grid'        },
    { id: 'depts',     label: 'Depts',    icon: 'building'    },
    { id: 'docs',      label: 'Doctors',  icon: 'stethoscope' },
    { id: 'analytics', label: 'Analytics',icon: 'chart'       },
  ],
}

interface MobTabBarProps {
  active?: string
  role?: UserRole
  onNavigate?: (id: string) => void
}

export const MobTabBar = memo(function MobTabBar({ active = 'home', role = 'patient', onNavigate }: MobTabBarProps) {
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
            onClick={() => onNavigate?.(t.id)}
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
