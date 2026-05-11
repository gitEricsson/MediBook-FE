import { memo } from 'react'
import { Badge } from './Badge'
import type { AppointmentStatus } from '@/types/domain'
import type { BadgeTone } from '@/types/ui'

interface StatusPillProps {
  status: AppointmentStatus | string
}

const STATUS_MAP: Record<AppointmentStatus, { tone: BadgeTone; label: string }> = {
  PENDING:   { tone: 'warn',    label: 'Pending'   },
  CONFIRMED: { tone: 'primary', label: 'Confirmed' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  CANCELLED: { tone: 'neutral', label: 'Cancelled' },
  NO_SHOW:   { tone: 'danger',  label: 'No-show'   },
}

export const StatusPill = memo(function StatusPill({ status }: StatusPillProps) {
  const extra: Record<string, { tone: BadgeTone; label: string }> = {
    ACTIVE: { tone: 'success', label: 'Active' },
    INACTIVE: { tone: 'neutral', label: 'Inactive' },
    OPEN: { tone: 'success', label: 'Open' },
    HELD: { tone: 'warn', label: 'Held' },
    TAKEN: { tone: 'neutral', label: 'Taken' },
  }
  const m = STATUS_MAP[status as AppointmentStatus] ?? extra[status] ?? { tone: 'neutral' as BadgeTone, label: status }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
})
