import { memo } from 'react'

export type PaymentProvider = 'PAYSTACK' | 'MONNIFY' | 'STRIPE' | 'FLUTTERWAVE'

interface PaymentLogoProps {
  provider: PaymentProvider
  height?: number
}

/**
 * Inline wordmark chips for the supported payment gateways. We use textual marks
 * on each brand's background colour instead of hosted image assets so the logos
 * are always present (no CDN/build dependencies) and stay crisp at any size.
 */
export const PaymentLogo = memo(function PaymentLogo({ provider, height = 22 }: PaymentLogoProps) {
  const cfg = LOGO_CONFIG[provider]
  if (!cfg) return null

  return (
    <span
      aria-label={cfg.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        padding: `0 ${Math.round(height * 0.45)}px`,
        borderRadius: Math.round(height * 0.28),
        background: cfg.bg,
        color: cfg.fg,
        fontFamily: cfg.font,
        fontWeight: cfg.weight,
        fontSize: Math.round(height * 0.55),
        letterSpacing: cfg.tracking,
        textTransform: cfg.transform,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.text}
    </span>
  )
})

const LOGO_CONFIG: Record<PaymentProvider, {
  label: string
  text: string
  bg: string
  fg: string
  font: string
  weight: number
  tracking: string
  transform: 'none' | 'lowercase' | 'uppercase'
}> = {
  PAYSTACK: {
    label: 'Paystack',
    text: 'paystack',
    bg: '#011B33',
    fg: '#0BA4DB',
    font: 'Inter, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.02em',
    transform: 'lowercase',
  },
  MONNIFY: {
    label: 'Monnify',
    text: 'monnify',
    bg: '#0F1D40',
    fg: '#F9C846',
    font: 'Inter, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.01em',
    transform: 'lowercase',
  },
  STRIPE: {
    label: 'Stripe',
    text: 'stripe',
    bg: '#635BFF',
    fg: '#ffffff',
    font: 'Inter, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.02em',
    transform: 'lowercase',
  },
  FLUTTERWAVE: {
    label: 'Flutterwave',
    text: 'flutterwave',
    bg: '#F5A623',
    fg: '#000000',
    font: 'Inter, system-ui, sans-serif',
    weight: 700,
    tracking: '-0.01em',
    transform: 'lowercase',
  },
}
