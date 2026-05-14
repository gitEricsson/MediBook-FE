import { memo, useEffect, useState } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Btn } from '@/components/primitives/Btn'
import { AccessGrantService, AccessGrantResponse as AccessGrant } from '@/services/access-grant.service'
import { AccessGrantModal } from './AccessGrantModal'

interface AccessGrantListProps {
  patientId: number
}

export const AccessGrantList = memo(function AccessGrantList({ patientId }: AccessGrantListProps) {
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [revoking, setRevoking] = useState<number | null>(null)

  const loadGrants = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await AccessGrantService.getPatientGrants(patientId, 0, 50)
      setGrants(data.content)
    } catch (err) {
      setError('Failed to load access grants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGrants()
  }, [patientId])

  const handleRevoke = async (grantId: number) => {
    if (!window.confirm('Are you sure you want to revoke this access?')) return

    setRevoking(grantId)
    try {
      await AccessGrantService.revokeAccess(patientId, grantId)
      setGrants((prev) => prev.filter((g) => g.id !== grantId))
    } catch (err) {
      setError('Failed to revoke access')
    } finally {
      setRevoking(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
          <Icon name="sparkle" size={24} color={MB.primary} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: MB.ink, margin: 0 }}>Doctor Access</h3>
        <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}>
          Grant Access
        </Btn>
      </div>

      {error && (
        <div style={{ padding: '10px 12px', background: MB.dangerBg, border: `1px solid ${MB.danger}`, borderRadius: 8, fontSize: 13, color: MB.danger }}>
          {error}
        </div>
      )}

      {grants.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: MB.bg, borderRadius: 8 }}>
          <Icon name="users" size={32} color={MB.text3} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: MB.text2, margin: 0 }}>No doctors have access to your records yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {grants.map((grant) => (
            <div key={grant.id} style={{
              padding: 12,
              background: MB.bg,
              border: `1px solid ${MB.line}`,
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: MB.ink }}>
                  Dr. {grant.doctorName}
                </div>
                {grant.doctorDepartment && (
                  <div style={{ fontSize: 12, color: MB.text2 }}>{grant.doctorDepartment}</div>
                )}
                {grant.reason && (
                  <div style={{ fontSize: 12, color: MB.text3, marginTop: 4 }}>{grant.reason}</div>
                )}
              </div>
              <Btn
                variant="secondary"
                size="sm"
                loading={revoking === grant.id}
                onClick={() => handleRevoke(grant.id)}
              >
                Revoke
              </Btn>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AccessGrantModal
          patientId={patientId}
          onClose={() => setShowModal(false)}
          onSuccess={loadGrants}
        />
      )}
    </div>
  )
})
