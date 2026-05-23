import { memo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { PrescriptionsService, type PrescriptionStatus } from '@/services/prescriptions.service'
import { useAuthStore } from '@/store/authStore'

/**
 * Patient view of their prescription history. Read-only — only the doctor on the
 * appointment can issue or cancel.
 *
 * URL: /patient/prescriptions
 */
export default memo(function MobPrescriptions() {
  const userId = useAuthStore((s) => s.user?.id)
  const [filter, setFilter] = useState<PrescriptionStatus | 'ALL'>('ACTIVE')

  const list = useQuery({
    queryKey: ['prescriptions', 'patient', userId, filter],
    queryFn:  () => PrescriptionsService.forPatient(Number(userId), filter === 'ALL' ? undefined : filter, 0, 50),
    enabled:  !!userId,
  })

  const items = list.data?.content ?? []

  return (
    <MobScreen>
      <MobTopBar title="My prescriptions" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['ACTIVE', 'COMPLETED', 'CANCELLED', 'ALL'] as const).map((f) => (
            <Btn key={f} size="sm" variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </Btn>
          ))}
        </div>

        {list.isLoading && <div style={{ color: MB.text3 }}>Loading…</div>}
        {list.isError   && <div style={{ color: MB.danger }}>Could not load prescriptions.</div>}
        {!list.isLoading && items.length === 0 && (
          <Card padding={20} style={{ textAlign: 'center', color: MB.text3, fontSize: 13 }}>
            No prescriptions to show.
          </Card>
        )}

        {items.map((rx) => {
          const isActive = rx.status === 'ACTIVE'
          return (
            <Card key={rx.id} padding={12} style={{ marginBottom: 10, background: isActive ? MB.primary50 : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{rx.drugName} <span style={{ color: MB.text3, fontWeight: 500 }}>· {rx.dosage}</span></div>
                  <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>
                    {rx.frequency}{rx.route ? ` · ${rx.route}` : ''}{rx.durationDays ? ` · ${rx.durationDays} days` : ''}
                  </div>
                  {rx.doctorName && (
                    <div style={{ fontSize: 11, color: MB.text3, marginTop: 4 }}>Prescribed by Dr. {rx.doctorName}</div>
                  )}
                  {rx.issuedAt && (
                    <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>
                      Issued {new Date(rx.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  {rx.instructions && (
                    <div style={{ fontSize: 12, color: MB.text2, marginTop: 8, padding: 8, background: MB.bg2, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
                      {rx.instructions}
                    </div>
                  )}
                  {rx.status === 'CANCELLED' && rx.cancelledReason && (
                    <div style={{ fontSize: 11, color: MB.danger, marginTop: 6 }}>Cancelled: {rx.cancelledReason}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: isActive ? MB.primary50 : MB.bg3, color: isActive ? MB.primary700 : MB.text4 }}>
                  {rx.status}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </MobScreen>
  )
})
