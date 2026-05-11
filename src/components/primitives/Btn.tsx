import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from './Icon'
import { cn } from '@/lib/cn'
import type { BtnVariant, IconName, Size } from '@/types/ui'

interface BtnProps {
  children?: React.ReactNode
  variant?: BtnVariant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  full?: boolean
  loading?: boolean
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
  className?: string
  'aria-label'?: string
}

const SIZE_MAP: Record<Size, { h: number; px: number; fs: number; gap: number }> = {
  sm: { h: 32, px: 12, fs: 13, gap: 6 },
  md: { h: 40, px: 14, fs: 14, gap: 7 },
  lg: { h: 48, px: 18, fs: 15, gap: 8 },
}

const VARIANT_MAP: Record<BtnVariant, { bg: string; color: string; border: string }> = {
  primary:      { bg: MB.primary,  color: '#fff',      border: 'transparent' },
  secondary:    { bg: MB.bg,       color: MB.text,     border: MB.line },
  ghost:        { bg: 'transparent', color: MB.text,   border: 'transparent' },
  danger:       { bg: MB.danger,   color: '#fff',      border: 'transparent' },
  dangerOutline:{ bg: MB.bg,       color: MB.danger,   border: '#FCA29B' },
  link:         { bg: 'transparent', color: MB.primary, border: 'transparent' },
}

export const Btn = memo(function Btn({
  children, variant = 'primary', size = 'md', icon, iconRight,
  full, loading, disabled, danger, onClick, type = 'button', style, className,
  'aria-label': ariaLabel,
}: BtnProps) {
  const sz = SIZE_MAP[size]
  const v = { ...VARIANT_MAP[variant] }
  if (danger && variant === 'primary') v.bg = MB.danger

  const isPrimary = variant === 'primary' || variant === 'danger' || danger
  const spinnerStyle: React.CSSProperties = {
    borderColor: isPrimary ? 'rgba(255,255,255,0.3)' : 'rgba(14,138,95,0.18)',
    borderTopColor: isPrimary ? '#fff' : MB.primary,
  }

  return (
    <button
      type={type} onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={cn('mb-btn', className)}
      style={{
        '--mb-btn-height': `${sz.h}px`,
        '--mb-btn-px': `${sz.px}px`,
        '--mb-btn-font-size': `${sz.fs}px`,
        '--mb-btn-gap': `${sz.gap}px`,
        '--mb-btn-width': full ? '100%' : undefined,
        '--mb-btn-bg': v.bg,
        '--mb-btn-color': v.color,
        '--mb-btn-border': v.border,
        '--mb-btn-hover-bg': isPrimary ? (danger ? '#912018' : MB.primary600) : variant === 'ghost' || variant === 'link' ? MB.bg3 : MB.bg3,
        '--mb-btn-hover-border': variant === 'secondary' || variant === 'dangerOutline' ? '#D6DAE1' : v.border,
        '--mb-btn-shadow': isPrimary ? '0 1px 2px rgba(16,24,40,0.05)' : 'none',
        ...style,
      } as React.CSSProperties}
    >
      {loading
        ? <span className="mb-spinner" style={spinnerStyle} />
        : icon && <Icon name={icon} size={sz.fs + 2} />
      }
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={sz.fs + 2} />}
    </button>
  )
})
