import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { Logo } from '@/components/layout/Logo'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Btn } from '@/components/primitives/Btn'

export const DeskLogin = memo(function DeskLogin() {
  return (
    <div style={{ width: '100%', height: '100%', background: MB.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400, background: MB.bg, borderRadius: 16, border: `1px solid ${MB.line}`, padding: 36, boxShadow: '0 4px 16px rgba(16,24,40,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <Logo size={32} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: MB.ink }}>MediBook</div>
            <div style={{ fontSize: 11, color: MB.text3, letterSpacing: 0.04, textTransform: 'uppercase' }}>Admin Console</div>
          </div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: MB.ink, margin: '0 0 6px' }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: MB.text3, margin: '0 0 24px' }}>Sign in to manage the MediBook platform.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email address" htmlFor="admin-email">
            <Input id="admin-email" value="alex@medibook.health" icon="mail" autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="admin-pw">
            <Input id="admin-pw" type="password" value="••••••••••" icon="lock" autoComplete="current-password" />
          </Field>
          <Btn variant="primary" size="lg" full type="submit" style={{ marginTop: 4 }}>Sign in</Btn>
        </div>
      </div>
    </div>
  )
})

export default DeskLogin
