import { memo, useState, useRef } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { PatientShell } from '@/components/layout/PatientShell'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Field } from '@/components/forms/Field'
import { Input } from '@/components/forms/Input'
import { Skel } from '@/components/feedback/Skel'
import { useAuth } from '@/hooks/useAuth'
import { UserService } from '@/services/user.service'
import { DoctorService, DoctorApiResponse } from '@/services/doctor.service'
import { apiClient } from '@/lib/api/client'
import { unwrapApiResponse } from '@/lib/api/contracts'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { useViewport } from '@/hooks/useViewport'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="mb-eyebrow" style={{ marginBottom: 8, paddingLeft: 2 }}>{title}</div>
      {children}
    </div>
  )
}

function ProfileContent() {
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ['me'], queryFn: UserService.getMe })

  // Fetch doctor profile via userId
  const { data: doctor, isLoading: docLoading } = useQuery({
    queryKey: ['doctor', 'my-profile'],
    queryFn: async () => {
      if (!me?.id) return null
      const response = await apiClient.get(`/api/v1/doctors/search`, {
        params: { q: me.email, page: 0, size: 1 },
      })
      const page = unwrapApiResponse<{ content: DoctorApiResponse[] }>(response.data)
      return page.content[0] ?? null
    },
    enabled: !!me?.id,
  })

  const [editMode, setEditMode] = useState(false)
  const [bio, setBio] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [languages, setLanguages] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [telemedicine, setTelemedicine] = useState(false)

  const isLoading = meLoading || docLoading

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!doctor) return
      const response = await apiClient.put(`/api/v1/doctors/${doctor.id}`, {
        userId: me?.id ? Number(me.id) : undefined,
        departmentId: doctor.departmentId,
        specialization: specialization || doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        bio: bio || doctor.bio,
        languages: languages || doctor.languages,
        consultationFee: consultationFee ? parseFloat(consultationFee) : doctor.consultationFee,
        telemedicineEnabled: telemedicine,
      })
      return unwrapApiResponse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'my-profile'] })
      toast.success('Profile updated')
      setEditMode(false)
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to update profile'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => UserService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile picture updated')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to upload photo'),
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
    e.target.value = ''
  }

  const startEdit = () => {
    setBio(doctor?.bio ?? '')
    setSpecialization(doctor?.specialization ?? '')
    setLanguages(doctor?.languages ?? '')
    setConsultationFee(String(doctor?.consultationFee ?? ''))
    setTelemedicine(doctor?.telemedicineEnabled ?? false)
    setEditMode(true)
  }

  const initials = me ? `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase() : 'DR'
  const name = me ? `Dr. ${me.firstName} ${me.lastName}` : 'Doctor'

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      {/* Avatar + name */}
      <div style={{ background: MB.bg, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${MB.line2}`, margin: '-16px -16px 16px', borderRadius: '0 0 12px 12px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <PhotoBlock w={72} h={72} label={initials} tone="teal" src={me?.avatarUrl} onClick={() => avatarInputRef.current?.click()} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: MB.primary, border: `2px solid ${MB.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Icon name="camera" size={11} color="#fff" />
          </div>
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: MB.ink }}>
            {meLoading ? <Skel w={140} h={17} /> : name}
          </div>
          <div style={{ fontSize: 13, color: MB.text3, marginTop: 2 }}>
            {docLoading ? <Skel w={100} h={13} /> : (doctor?.specialization ?? 'Doctor')}
          </div>
        </div>
        {!editMode && <Btn variant="secondary" size="sm" icon="edit" onClick={startEdit}>Edit</Btn>}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[80, 60, 100, 60].map((w, i) => <Skel key={i} w={`${w}%`} h={14} />)}
        </div>
      ) : editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Specialization" htmlFor="doc-spec">
            <Input id="doc-spec" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Cardiology" />
          </Field>
          <Field label="Bio" htmlFor="doc-bio" hint="A short professional summary visible to patients">
            <textarea id="doc-bio" value={bio} onChange={(e) => setBio(e.target.value)}
              rows={5} placeholder="Board-certified cardiologist with 12 years of experience…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${MB.line}`, fontSize: 14, color: MB.text, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </Field>
          <Field label="Languages" htmlFor="doc-lang">
            <Input id="doc-lang" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, French" />
          </Field>
          <Field label="Consultation fee (NGN)" htmlFor="doc-fee">
            <Input id="doc-fee" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} type="number" placeholder="5000" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>Accept telemedicine</div>
              <div style={{ fontSize: 12, color: MB.text3 }}>Allow patients to book video consultations</div>
            </div>
            <button
              onClick={() => setTelemedicine(!telemedicine)}
              style={{
                width: 42, height: 24, borderRadius: 12, border: 'none',
                background: telemedicine ? MB.primary : MB.line,
                cursor: 'pointer', position: 'relative', transition: 'background .2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: telemedicine ? 20 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', display: 'block',
              }} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => setEditMode(false)}>Cancel</Btn>
            <Btn variant="primary" size="lg" style={{ flex: 1.5 }} loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save changes</Btn>
          </div>
        </div>
      ) : (
        <>
          <Section title="Professional details">
            <Card padding={0}>
              {[
                { label: 'Department', value: doctor?.departmentName ?? '—' },
                { label: 'Specialization', value: doctor?.specialization ?? '—' },
                { label: 'License number', value: doctor?.licenseNumber ?? '—' },
                { label: 'Languages', value: doctor?.languages ?? 'English' },
                { label: 'Consultation fee', value: doctor?.consultationFee ? `NGN ${doctor.consultationFee.toLocaleString()}` : '—' },
                { label: 'Telemedicine', value: doctor?.telemedicineEnabled ? 'Enabled' : 'Disabled' },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${MB.line2}` : 'none' }}>
                  <div style={{ fontSize: 12, color: MB.text3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: MB.text, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</div>
                </div>
              ))}
            </Card>
          </Section>

          {doctor?.bio && (
            <Section title="About">
              <Card padding={14}>
                <p style={{ margin: 0, fontSize: 14, color: MB.text2, lineHeight: 1.6 }}>{doctor.bio}</p>
              </Card>
            </Section>
          )}

          <Section title="Stats">
            <Card padding={0}>
              {[
                { label: 'Average rating', value: doctor?.averageRating ? `${doctor.averageRating.toFixed(1)} ★` : '—' },
                { label: 'Reviews', value: String(doctor?.reviewCount ?? 0) },
                { label: 'Experience', value: doctor?.yearsOfExperience ? `${doctor.yearsOfExperience} years` : '—' },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${MB.line2}` : 'none' }}>
                  <div style={{ fontSize: 12, color: MB.text3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: MB.text, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}
    </div>
  )
}

// ── Mobile layout ───────────────────────────────────────────────────────────────
function MobileDocProfile() {
  return (
    <MobScreen>
      <MobTopBar title="My profile" />
      <ProfileContent />
    </MobScreen>
  )
}

// ── Desktop layout ──────────────────────────────────────────────────────────────
function DesktopDocProfile() {
  return (
    <DeskShell active="profile">
      <DeskTopbar title="My profile" subtitle="Professional information visible to patients" />
      <div style={{ flex: 1, overflow: 'auto', maxWidth: 640, padding: 24 }}>
        <ProfileContent />
      </div>
    </DeskShell>
  )
}

export default memo(function MobDocProfile() {
  const { isWide } = useViewport()
  return isWide ? <DesktopDocProfile /> : <MobileDocProfile />
})
