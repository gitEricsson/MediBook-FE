import { memo } from 'react'
import { Badge } from './Badge'
import type { AppointmentStatus } from '@/types/domain'
import type { BadgeTone } from '@/types/ui'

interface StatusPillProps {
  status: AppointmentStatus
}

const STATUS_MAP: Record<AppointmentStatus, { tone: BadgeTone; label: string }> = {
  SCHEDULED: { tone: 'primary',  label: 'Scheduled' },
  UPCOMING:  { tone: 'primary',  label: 'Upcoming'  },
  COMPLETED: { tone: 'success',  label: 'Completed' },
  CANCELLED: { tone: 'neutral',  label: 'Cancelled' },
  NO_SHOW:   { tone: 'danger',   label: 'No-show'   },
  PENDING:   { tone: 'warn',     label: 'Pending'   },
  ACTIVE:    { tone: 'success',  label: 'Active'    },
  INACTIVE:  { tone: 'neutral',  label: 'Inactive'  },
}

export const StatusPill = memo(function StatusPill({ status }: StatusPillProps) {
  const m = STATUS_MAP[status] ?? { tone: 'neutral' as BadgeTone, label: status }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
})
