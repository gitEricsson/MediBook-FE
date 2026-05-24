import { useMemo } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'

const PW_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
] as const

export function PasswordChecklist({ password }: { password: string }) {
  const results = useMemo(() => PW_RULES.map(r => ({ ...r, met: r.test(password) })), [password])
  if (!password) return null
  return (
    <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {results.map(r => (
        <li key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: r.met ? MB.success : MB.text3 }}>
          <Icon name={r.met ? 'check' : 'circle'} size={12} color={r.met ? MB.success : MB.text3} />
          {r.label}
        </li>
      ))}
    </ul>
  )
}
