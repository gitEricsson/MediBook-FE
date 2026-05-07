import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'

const MobCancelConfirm = memo(function MobCancelConfirm() {
  return (
    <MobScreen bg="rgba(0,0,0,0.45)">
      <div style={{ position: 'relative', flex: 1 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" style={{
              background: MB.bg, width: '100%', borderRadius: '20px 20px 0 0',
              padding: '20px 20px 28px', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
            }}>
              <div aria-hidden="true" style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: MB.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name="alert" size={22} color={MB.danger} />
              </div>
              <h3 id="cancel-title" className="mb-h3">Cancel this appointment?</h3>
              <p style={{ fontSize: 13, color: MB.text2, marginTop: 6, lineHeight: 1.5 }}>
                Your visit with <strong>Dr. Sarah Chen</strong> on <strong>Wed, May 7 at 9:30 AM</strong> will be cancelled.
                Since you're cancelling more than 24 hours in advance, no fee applies.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <Btn variant="secondary" size="lg" style={{ flex: 1 }}>Keep visit</Btn>
                <Btn variant="primary" danger size="lg" style={{ flex: 1 }}>Yes, cancel</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobScreen>
  )
})

export default MobCancelConfirm
