import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import type { IconName } from '@/types/ui'

type ConfirmStatus = 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface StatusConfig {
  title: string; body: string; cta: string
  danger: boolean; icon: IconName; iconColor: string; iconBg: string
}

const CONFIG: Record<ConfirmStatus, StatusConfig> = {
  COMPLETED: { title: 'Mark as completed?',  body: 'This appointment will be moved to your completed list, and you can add a consultation note.', cta: 'Yes, mark completed', danger: false, icon: 'check',  iconColor: MB.success, iconBg: MB.successBg },
  CANCELLED:  { title: 'Cancel this appointment?', body: 'The patient will be notified by email and SMS. The slot will be returned to your availability.', cta: 'Yes, cancel', danger: true, icon: 'x',     iconColor: MB.danger,  iconBg: MB.dangerBg  },
  NO_SHOW:    { title: 'Mark as no-show?',   body: "This indicates the patient did not attend. They'll be notified and may be subject to your no-show policy.", cta: 'Yes, mark no-show', danger: true, icon: 'alert', iconColor: MB.danger,  iconBg: MB.dangerBg  },
}

interface MobDocStatusConfirmProps { status?: ConfirmStatus }

export default memo(function MobDocStatusConfirm({ status = 'NO_SHOW' }: MobDocStatusConfirmProps) {
  const cfg = CONFIG[status]
  return (
    <MobScreen bg="rgba(0,0,0,0.45)">
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div role="dialog" aria-modal="true" aria-labelledby="status-confirm-title" style={{
          background: MB.bg, width: '100%', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 28px', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
        }}>
          <div aria-hidden="true" style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 16px' }} />
          <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name={cfg.icon} size={22} color={cfg.iconColor} />
          </div>
          <h3 id="status-confirm-title" className="mb-h3">{cfg.title}</h3>
          <p style={{ fontSize: 13, color: MB.text2, marginTop: 6, lineHeight: 1.5 }}>{cfg.body}</p>
          <Card padding={12} style={{ marginTop: 14, background: MB.bg2 }}>
            <div style={{ fontSize: 12, color: MB.text3 }}>Tue, May 6 · 10:00 AM</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Marcus Lee · Chest pain consult</div>
          </Card>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Btn variant="secondary" size="lg" style={{ flex: 1 }}>Keep as-is</Btn>
            <Btn variant="primary" danger={cfg.danger} size="lg" style={{ flex: 1.4 }}>{cfg.cta}</Btn>
          </div>
        </div>
      </div>
    </MobScreen>
  )
})
