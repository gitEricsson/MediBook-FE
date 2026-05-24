import { useEffect, useMemo, useState } from 'react'
import { parseBackendDateTime } from '@/lib/date'

/**
 * Time-window policy for an appointment's collaboration affordances:
 *
 *   chat + telemedicine become live  10 minutes BEFORE  scheduled start
 *   they stay live until            10 minutes AFTER   scheduled end
 *   after that the consultation is closed:
 *     • chat is read-only (historical messages remain accessible)
 *     • telemedicine join is disabled
 *
 * Completion is treated as "consultation closed" regardless of clock — once
 * a doctor marks an appointment COMPLETED, the chat composer disables even
 * if the wall clock is still inside the 10-min trailing window.
 */
const WINDOW_MS_BEFORE = 10 * 60_000
const WINDOW_MS_AFTER  = 10 * 60_000

export type ConsultationStatus = string | undefined | null

export interface ConsultationGating {
  /** Effective start of the live window (scheduled start − 10 min). */
  windowOpensAt: Date
  /** Effective end of the live window (scheduled end + 10 min). */
  windowClosesAt: Date
  /** Now is between {@link windowOpensAt} and {@link windowClosesAt} (inclusive). */
  windowOpen: boolean
  /** Chat composer is enabled (window open AND not completed). */
  chatWritable: boolean
  /** Chat conversation can be opened in read-only mode (always true post-confirmation). */
  chatReadable: boolean
  /** Telemedicine join is available right now. */
  telemedicineAvailable: boolean
  /** The doctor has marked the appointment COMPLETED. */
  isCompleted: boolean
  /** Appointment status is CONFIRMED or COMPLETED — i.e. paid + acknowledged. */
  isActionable: boolean
  /** Human label: "Opens in 6 min" / "Active now" / "Closed 12 min ago". */
  label: string
}

interface GatingInput {
  scheduledAt: string | Date | undefined | null
  durationMins?: number | null
  endTime?: string | Date | undefined | null
  status?: ConsultationStatus
  consultationType?: 'FIRST_VISIT' | 'FOLLOW_UP' | 'EMERGENCY' | string | null | undefined
  consultationMedium?: 'PHYSICAL' | 'AUDIO' | 'VIDEO' | string | null | undefined
  /** Appointment type — TELEMEDICINE/TELEHEALTH still trigger video even on PHYSICAL medium DTOs. */
  type?: string | null | undefined
}

function formatRelative(diffMs: number): string {
  const abs = Math.abs(diffMs)
  const mins = Math.round(abs / 60_000)
  if (mins < 1) return diffMs >= 0 ? 'in <1 min' : '<1 min ago'
  if (mins < 60) return diffMs >= 0 ? `in ${mins} min` : `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return diffMs >= 0 ? `in ${hours}h` : `${hours}h ago`
  const days = Math.round(hours / 24)
  return diffMs >= 0 ? `in ${days}d` : `${days}d ago`
}

/**
 * Lives on `Date.now()` and re-renders once per minute while a consultation is
 * imminent or in-flight so the gating UI updates without manual refresh.
 */
export function useConsultationGating(input: GatingInput): ConsultationGating {
  // The hook owns `now` as state so reads are pure during render and the
  // gating recomputes itself when the timer ticks. Initialised lazily from
  // Date.now() — the only place we touch the impure global clock.
  const [now, setNow] = useState<number>(() => Date.now())

  // Stable derived timestamps — keyed on the raw inputs so the effect deps
  // below are primitives, not freshly-allocated Date objects each render.
  const opensAtMs = useMemo(() => {
    const start = input.scheduledAt ? parseBackendDateTime(input.scheduledAt).getTime() : 0
    return start - WINDOW_MS_BEFORE
  }, [input.scheduledAt])

  const closesAtMs = useMemo(() => {
    const start = input.scheduledAt ? parseBackendDateTime(input.scheduledAt).getTime() : 0
    const endRaw = input.endTime
      ? parseBackendDateTime(input.endTime).getTime()
      : start + (input.durationMins ?? 30) * 60_000
    return endRaw + WINDOW_MS_AFTER
  }, [input.scheduledAt, input.endTime, input.durationMins])

  const opensAt = useMemo(() => new Date(opensAtMs), [opensAtMs])
  const closesAt = useMemo(() => new Date(closesAtMs), [closesAtMs])

  // Re-tick once per 30s while the window is anywhere near "now" (within 24h
  // on either side). Distant or long-past appointments skip the interval so
  // we don't burn timers for nothing.
  useEffect(() => {
    const t0 = Date.now()
    if (closesAtMs < t0 - 24 * 3_600_000) return
    if (opensAtMs  > t0 + 24 * 3_600_000) return
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [closesAtMs, opensAtMs])
  const isCompleted = input.status === 'COMPLETED'
  const isCancelled = input.status === 'CANCELLED' || input.status === 'NO_SHOW'
  const isEmergency = input.consultationType === 'EMERGENCY' || input.status === 'EMERGENCY_PENDING_SETTLEMENT'
  const isActionable = input.status === 'CONFIRMED'
    || input.status === 'COMPLETED'
    || input.status === 'IN_CONSULTATION'
    || isEmergency

  const windowOpen = !isCancelled && (isEmergency || (now >= opensAt.getTime() && now <= closesAt.getTime()))
  const chatWritable = windowOpen && !isCompleted && isActionable
  const chatReadable = isActionable
  const isTelemedium = input.consultationMedium === 'AUDIO' || input.consultationMedium === 'VIDEO'
    || input.type === 'TELEMEDICINE' || input.type === 'TELEHEALTH'
  const telemedicineAvailable = windowOpen && !isCompleted && isActionable && isTelemedium

  let label: string
  if (isCancelled) {
    label = 'Cancelled'
  } else if (isCompleted) {
    label = 'Consultation completed · chat is read-only'
  } else if (isEmergency) {
    label = 'Active now'
  } else if (now < opensAt.getTime()) {
    label = `Opens ${formatRelative(opensAt.getTime() - now)}`
  } else if (now <= closesAt.getTime()) {
    label = 'Active now'
  } else {
    label = `Closed ${formatRelative(now - closesAt.getTime() < 0 ? 0 : -(now - closesAt.getTime()))}`
  }

  return {
    windowOpensAt: opensAt,
    windowClosesAt: closesAt,
    windowOpen,
    chatWritable,
    chatReadable,
    telemedicineAvailable,
    isCompleted,
    isActionable,
    label,
  }
}
