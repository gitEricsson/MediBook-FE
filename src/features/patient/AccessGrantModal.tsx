import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { Icon } from '@/components/primitives/Icon'
import { Input } from '@/components/forms/Input'
import { Field } from '@/components/forms/Field'
import { Btn } from '@/components/primitives/Btn'
import { grantAccess } from '@/services/access-grant.service'
import { parseApiError } from '@/lib/api/contracts'

interface AccessGrantModalProps {
  patientId: number
  onClose: () => void
  onSuccess: () => void
}

export const AccessGrantModal = memo(function AccessGrantModal({ patientId, onClose, onSuccess }: AccessGrantModalProps) {
  const [doctorId, setDoctorId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId.trim()) {
      setError('Doctor ID is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await grantAccess(patientId, {
        doctorId: parseInt(doctorId),
        reason: reason || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message || 'Failed to grant access')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        width: '90%', maxWidth: 400,
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: MB.ink, margin: 0 }}>Grant Doctor Access</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name="x" size={20} color={MB.text3} />
          </button>
        </div>

        {error && (
          <div role="alert" style={{ padding: '10px 12px', background: MB.dangerBg, border: `1px solid ${MB.danger}`, borderRadius: 8, fontSize: 13, color: MB.danger, display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
            <Icon name="alert" size={16} color={MB.danger} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Doctor ID" required htmlFor="doctor-id">
            <Input id="doctor-id" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} type="number" placeholder="Enter doctor ID" />
          </Field>

          <Field label="Reason (optional)" htmlFor="reason">
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you granting access?"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${MB.line}`,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 400,
                color: MB.text,
                resize: 'vertical',
                minHeight: 80
              }}
            />
          </Field>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" size="md" full type="button" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="primary" size="md" full type="submit" loading={loading}>
              Grant Access
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
})
