import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Skel } from '@/components/feedback/Skel'
import type { FeeEstimate } from '@/services/appointments.service'

interface FeeBreakdownProps {
  estimate: FeeEstimate | null | undefined
  isLoading?: boolean
  /** When true, render in the "compact" inline form used on Pay to confirm. */
  compact?: boolean
}

/**
 * Renders the per-component pricing breakdown returned by /appointments/fee-estimate.
 *
 * Visibility rules (matches the product spec):
 *   • Department base fee  → always shown
 *   • Consultation type    → always shown (the value can be a discount, a surcharge,
 *                            or ₦0 for FIRST_VISIT; even ₦0 is meaningful — it confirms
 *                            "no type surcharge applied")
 *   • Senior surcharge     → shown only when the doctor qualifies as a senior consultant
 *   • Medium surcharge     → shown only when the chosen medium incurs one
 */
export const FeeBreakdown = memo(function FeeBreakdown({ estimate, isLoading, compact }: FeeBreakdownProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14 }}>
        <Skel h={14} w="60%" />
        <Skel h={14} w="40%" />
        <Skel h={14} w="50%" />
      </div>
    )
  }
  if (!estimate) {
    return null
  }
  const currency = estimate.currency || 'NGN'
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : ''

  const fmt = (n: number) => {
    const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    return `${n < 0 ? '−' : ''}${symbol}${abs}`
  }

  // Build the line list in the order they're applied. Conditional lines are
  // gated by the *Applied flags from the backend so a non-applicable line is
  // not shown at all — but the always-on lines (base + type) appear even when
  // they contribute ₦0, because zero itself is informative.
  type Line = { key: string; label: string; value: number; muted?: boolean }
  const lines: Line[] = []

  lines.push({
    key: 'base',
    label: estimate.departmentName ? `${estimate.departmentName} base fee` : 'Department base fee',
    value: Number(estimate.baseFee || 0),
  })

  lines.push({
    key: 'type',
    label: estimate.consultationTypeLabel
      ? `${estimate.consultationTypeLabel} adjustment`
      : 'Consultation type adjustment',
    value: Number(estimate.consultationTypeAdjustment || 0),
    // A FIRST_VISIT contributes ₦0; render it in muted text so the eye lands
    // on the lines that actually move the total.
    muted: Math.abs(Number(estimate.consultationTypeAdjustment || 0)) < 0.005,
  })

  if (estimate.seniorSurchargeApplied) {
    lines.push({
      key: 'senior',
      label: 'Senior consultant surcharge',
      value: Number(estimate.seniorSurcharge || 0),
    })
  }

  if (estimate.mediumSurchargeApplied) {
    lines.push({
      key: 'medium',
      label: estimate.mediumLabel
        ? `${estimate.mediumLabel} surcharge`
        : 'Consultation medium surcharge',
      value: Number(estimate.mediumSurcharge || 0),
    })
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: compact ? '8px 14px' : '12px 14px',
    fontSize: 13,
    borderBottom: `1px solid ${MB.line2}`,
  }

  return (
    <div>
      {lines.map((l) => (
        <div key={l.key} style={rowStyle}>
          <span style={{ color: l.muted ? MB.text3 : MB.text2 }}>{l.label}</span>
          <span style={{
            color: l.value < 0 ? MB.success : l.muted ? MB.text3 : MB.text,
            fontWeight: 500,
          }}>
            {fmt(l.value)}
          </span>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: compact ? '10px 14px' : '14px',
          background: MB.primary50,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: MB.primary700 }}>Total due</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: MB.primary, fontFamily: 'var(--mb-font-mono),monospace' }}>
          {fmt(Number(estimate.fee || 0))}
        </span>
      </div>
    </div>
  )
})
