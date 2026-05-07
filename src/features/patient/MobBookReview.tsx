import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Textarea } from '@/components/forms/Textarea'

type BookState = 'default' | 'loading' | 'success' | 'error'

function ReviewRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: last ? 'none' : `1px solid ${MB.line2}`, fontSize: 13 }}>
      <span style={{ color: MB.text3 }}>{label}</span>
      <span style={{ color: MB.text, fontWeight: 500, fontFamily: mono ? 'var(--mb-font-mono),monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

interface MobBookReviewProps { state?: BookState }

export default memo(function MobBookReview({ state = 'default' }: MobBookReviewProps) {
  const success = state === 'success'
  const error   = state === 'error'
  return (
    <MobScreen>
      <MobTopBar title={success ? 'Confirmed' : 'Review & confirm'} back={!success} />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {success ? (
          <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: MB.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={32} color={MB.success} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="mb-h2" style={{ fontSize: 20 }}>You're booked!</h2>
              <div className="mb-small" style={{ marginTop: 4 }}>Confirmation sent to sarah.patient@email.com</div>
            </div>
            <Card padding={14} style={{ width: '100%', textAlign: 'left', background: MB.bg2 }}>
              <ReviewRow label="Doctor"       value="Dr. Sarah Chen" />
              <ReviewRow label="Date"         value="Wed, May 7, 2026" />
              <ReviewRow label="Time"         value="9:30 AM PT" />
              <ReviewRow label="Location"     value="Bay General · Floor 4, Room 412" />
              <ReviewRow label="Confirmation" value="MB-7K2QP9" mono last />
            </Card>
            <Btn variant="primary" size="lg" full style={{ marginTop: 8 }}>View in My visits</Btn>
            <Btn variant="ghost"   size="md" full>Add to calendar</Btn>
          </div>
        ) : (
          <>
            <Card padding={14} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PhotoBlock w={48} h={48} label="DR · CHEN" tone="primary" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Sarah Chen</div>
                  <div style={{ fontSize: 12, color: MB.text3 }}>Cardiology · Bay General</div>
                </div>
              </div>
            </Card>
            <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Appointment</div>
            <Card padding={0} style={{ marginBottom: 14 }}>
              <ReviewRow label="Date"     value="Wed, May 7, 2026" />
              <ReviewRow label="Time"     value="9:30 AM – 10:00 AM PT" />
              <ReviewRow label="Type"     value="In-person consultation" last />
            </Card>
            <div className="mb-eyebrow" style={{ marginBottom: 8 }}>Reason for visit</div>
            <Field>
              <Textarea value="Annual check-up. Family history of hypertension." rows={3} readOnly />
            </Field>
            <div style={{ marginTop: 14, padding: 12, background: MB.warnBg, borderRadius: 8, fontSize: 12, color: MB.warn, display: 'flex', gap: 8 }}>
              <Icon name="info" size={14} color={MB.warn} />
              <span>Cancellations are free up to 24 hours before your visit.</span>
            </div>
            {error && (
              <div role="alert" style={{ marginTop: 14, padding: 12, background: MB.dangerBg, borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8 }}>
                <Icon name="alert" size={16} color={MB.danger} />
                <div><strong>This slot was just taken.</strong> Please pick another time.</div>
              </div>
            )}
          </>
        )}
      </div>
      {!success && (
        <div style={{ padding: 16, background: MB.bg, borderTop: `1px solid ${MB.line2}`, flexShrink: 0, display: 'flex', gap: 10 }}>
          <Btn variant="secondary" size="lg" style={{ flex: 1 }}>Back</Btn>
          <Btn variant="primary"   size="lg" style={{ flex: 1.6 }} loading={state === 'loading'}>Confirm booking</Btn>
        </div>
      )}
    </MobScreen>
  )
})
