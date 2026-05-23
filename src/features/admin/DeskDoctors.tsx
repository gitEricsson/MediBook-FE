import { memo, useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MB } from '@/constants/tokens'
import { DeskShell } from '@/components/layout/DeskShell'
import { DeskTopbar } from '@/components/layout/DeskTopbar'
import { Avatar } from '@/components/primitives/Avatar'
import { StatusPill } from '@/components/primitives/StatusPill'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Input } from '@/components/forms/Input'
import { Field } from '@/components/forms/Field'
import { Th } from '@/components/table/Th'
import { Td } from '@/components/table/Td'
import { RowMenu } from '@/components/table/RowMenu'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAdminDoctors, useAdminDepartments } from '@/hooks/useAdmin'
import { AdminService } from '@/services/admin.service'
import { ReviewsService, ReviewResponse } from '@/services/reviews.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '@/lib/api/contracts'
import { Badge } from '@/components/primitives/Badge'
import type { DoctorResponse } from '@/types/api'

// ── Add Doctor Drawer ─────────────────────────────────────────────────────────

interface AddDoctorForm {
  firstName: string; lastName: string; email: string
  departmentId: string; specialization: string; licenseNumber: string
  startTime: string; endTime: string
}

function AddDoctorDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: departments = [] } = useAdminDepartments()
  const [form, setForm] = useState<AddDoctorForm>({
    firstName: '', lastName: '', email: '',
    departmentId: '', specialization: '', licenseNumber: '',
    startTime: '9:00 AM', endTime: '5:00 PM',
  })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => AdminService.createDoctor({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      departmentId: form.departmentId,
      specialization: form.specialization || undefined,
      licenseNumber: form.licenseNumber || undefined,
      defaultStartTime: form.startTime,
      defaultEndTime: form.endTime,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
      toast.success(`Dr. ${form.firstName} ${form.lastName} invited — setup link emailed to ${form.email}`)
      onSaved()
    },
    onError: () => toast.error('Failed to create doctor account'),
  })

  const set = (k: keyof AddDoctorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const canSubmit = form.firstName && form.lastName && form.email && form.departmentId

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(15,23,42,0.35)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 100,
        width: 440, background: MB.bg, boxShadow: '-12px 0 32px rgba(15,23,42,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: MB.ink }}>Add a new doctor</h2>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Provisions an account and sends invitation.</div>
          </div>
          <button onClick={onClose} aria-label="Close drawer" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={MB.text2} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First name" required htmlFor="dr-fn">
              <Input id="dr-fn" value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last name" required htmlFor="dr-ln">
              <Input id="dr-ln" value={form.lastName} onChange={set('lastName')} />
            </Field>
          </div>
          <Field label="Work email" required htmlFor="dr-email" hint="An invitation will be sent here.">
            <Input id="dr-email" value={form.email} onChange={set('email')} icon="mail" type="email" autoComplete="off" />
          </Field>
          <Field label="Department" required htmlFor="dr-dept">
            <select
              id="dr-dept"
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: `1px solid ${MB.line}`,
                background: MB.bg, padding: '0 12px', fontSize: 14, color: form.departmentId ? MB.text : MB.text4,
                fontFamily: 'inherit', outline: 'none', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' strokeWidth='1.75' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              }}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Specialisation" htmlFor="dr-spec">
            <Input id="dr-spec" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Interventional Cardiology" />
          </Field>
          <Field label="License number" htmlFor="dr-lic">
            <Input id="dr-lic" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="e.g. MD-CA-44219" />
          </Field>
          <Field label="Default working hours" hint="Doctor can adjust later." htmlFor="dr-start">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
              <Input id="dr-start" value={form.startTime} onChange={set('startTime')} placeholder="9:00 AM" />
              <span style={{ color: MB.text3, fontSize: 13 }}>to</span>
              <Input value={form.endTime} onChange={set('endTime')} placeholder="5:00 PM" />
            </div>
          </Field>
        </div>

        <div style={{ padding: 20, borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="plus" loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
            Create &amp; invite
          </Btn>
        </div>
      </div>
    </>
  )
}

// ── Edit Doctor Drawer ────────────────────────────────────────────────────────

interface EditDoctorForm {
  departmentId: string
  specialization: string
  licenseNumber: string
  bio: string
  languages: string
  yearsOfExperience: string
  slotDurationMins: string
  gender: '' | 'MALE' | 'FEMALE' | 'OTHER'
}

function EditDoctorDrawer({ doctor, onClose, onSaved }: {
  doctor: DoctorResponse
  onClose: () => void
  onSaved: () => void
}) {
  const { data: departments = [] } = useAdminDepartments()
  const [form, setForm] = useState<EditDoctorForm>({
    departmentId: String(doctor.departmentId ?? ''),
    specialization: doctor.specialization ?? '',
    licenseNumber: doctor.licenseNumber ?? '',
    bio: doctor.bio ?? '',
    languages: doctor.languages ?? '',
    yearsOfExperience: String(doctor.yearsOfExperience ?? ''),
    slotDurationMins: String(doctor.slotDurationMins ?? ''),
    gender: (doctor.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined) ?? '',
  })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => AdminService.updateDoctor(String(doctor.id), {
      userId: doctor.userId,
      departmentId: Number(form.departmentId),
      specialization: form.specialization || undefined,
      licenseNumber: form.licenseNumber,
      bio: form.bio || undefined,
      languages: form.languages || undefined,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      slotDurationMins: form.slotDurationMins ? Number(form.slotDurationMins) : undefined,
      gender: form.gender || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
      toast.success(`Dr. ${doctor.fullName} updated`)
      onSaved()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Failed to update doctor'),
  })

  const set = <K extends keyof EditDoctorForm>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value as EditDoctorForm[K] }))

  const canSubmit = form.departmentId && form.licenseNumber

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(15,23,42,0.35)' }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 100,
        width: 460, background: MB.bg, boxShadow: '-12px 0 32px rgba(15,23,42,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: MB.ink }}>Edit doctor</h2>
            <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>Dr. {doctor.fullName} · {doctor.email}</div>
          </div>
          <button onClick={onClose} aria-label="Close drawer" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={MB.text2} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Department" required htmlFor="edit-dept">
            <select
              id="edit-dept"
              value={form.departmentId}
              onChange={set('departmentId')}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: `1px solid ${MB.line}`,
                background: MB.bg, padding: '0 12px', fontSize: 14, color: MB.text,
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Specialisation" htmlFor="edit-spec">
            <Input id="edit-spec" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Interventional Cardiology" />
          </Field>
          <Field label="License number" required htmlFor="edit-lic">
            <Input id="edit-lic" value={form.licenseNumber} onChange={set('licenseNumber')} />
          </Field>
          <Field label="Bio" htmlFor="edit-bio" hint="Public summary shown on the patient profile">
            <textarea
              id="edit-bio"
              value={form.bio}
              onChange={set('bio')}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${MB.line}`, fontSize: 14, color: MB.text,
                fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </Field>
          <Field label="Languages" htmlFor="edit-lang">
            <Input id="edit-lang" value={form.languages} onChange={set('languages')} placeholder="English, Hausa" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Years of experience" htmlFor="edit-yoe">
              <Input id="edit-yoe" type="number" min={0} max={60} value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
            </Field>
            <Field label="Slot duration (mins)" htmlFor="edit-slot" hint="10–120">
              <Input id="edit-slot" type="number" min={10} max={120} value={form.slotDurationMins} onChange={set('slotDurationMins')} />
            </Field>
          </div>
          <Field label="Gender" htmlFor="edit-gender">
            <select
              id="edit-gender"
              value={form.gender}
              onChange={set('gender')}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: `1px solid ${MB.line}`,
                background: MB.bg, padding: '0 12px', fontSize: 14, color: MB.text,
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
        </div>

        <div style={{ padding: 20, borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" loading={mutation.isPending} disabled={!canSubmit} onClick={() => mutation.mutate()}>
            Save changes
          </Btn>
        </div>
      </div>
    </>
  )
}

// ── Deactivate / Reactivate confirmation ─────────────────────────────────────

function ConfirmStatusToggle({ doctor, mode, onClose }: {
  doctor: DoctorResponse
  mode: 'deactivate' | 'reactivate'
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => mode === 'deactivate'
      ? AdminService.deactivateDoctor(String(doctor.id))
      : AdminService.reactivateDoctor(String(doctor.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
      toast.success(mode === 'deactivate'
        ? `Dr. ${doctor.fullName} deactivated`
        : `Dr. ${doctor.fullName} reactivated`)
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Operation failed'),
  })

  const title = mode === 'deactivate' ? 'Deactivate doctor?' : 'Reactivate doctor?'
  const body = mode === 'deactivate'
    ? `Dr. ${doctor.fullName} will stop accepting new appointments. Existing appointments are unaffected. You can reactivate at any time.`
    : `Dr. ${doctor.fullName} will resume accepting new appointments.`
  const cta = mode === 'deactivate' ? 'Yes, deactivate' : 'Yes, reactivate'

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: MB.bg, borderRadius: 14, padding: 24, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: mode === 'deactivate' ? MB.dangerBg : MB.primary50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={mode === 'deactivate' ? 'alert' : 'check'} size={18} color={mode === 'deactivate' ? MB.danger : MB.primary} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: MB.ink }}>{title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: MB.text2, lineHeight: 1.5 }}>{body}</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          {mode === 'deactivate' ? (
            <Btn variant="primary" danger loading={mutation.isPending} onClick={() => mutation.mutate()}>{cta}</Btn>
          ) : (
            <Btn variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>{cta}</Btn>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Review moderation tab ────────────────────────────────────────────────────
//
// Two modes:
//   • No `doctorId` filter (default deep-link)      → global pending-review queue.
//   • With `doctorId` filter (Moderate-from-perf)   → that doctor's full review
//                                                     history (any status); the
//                                                     queue endpoint only returns
//                                                     PENDING globally, so a
//                                                     filtered view would 99% of
//                                                     the time look empty, which
//                                                     is the bug the user reported.
//
// In the per-doctor view we render a row for every review and offer Approve /
// Reject only on PENDING ones — APPROVED / REJECTED stay visible for audit.

function ReviewsModerationTab({
  doctorFilter,
  onClearFilter,
}: {
  doctorFilter: { id: number; name?: string } | null
  onClearFilter: () => void
}) {
  const queryClient = useQueryClient()

  const queueQuery = useQuery({
    queryKey: ['admin', 'reviews', 'pending'],
    queryFn: () => ReviewsService.getPendingReviews(0, 50).then((p) => p.content),
    enabled: !doctorFilter,
  })

  const perDoctorQuery = useQuery({
    queryKey: ['admin', 'reviews', 'doctor', doctorFilter?.id],
    queryFn: () =>
      ReviewsService.getDoctorReviews(String(doctorFilter!.id), 0, 50).then((p) => p.content),
    enabled: !!doctorFilter,
  })

  const isLoading = doctorFilter ? perDoctorQuery.isLoading : queueQuery.isLoading
  const reviews   = doctorFilter ? perDoctorQuery.data ?? [] : queueQuery.data ?? []

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      ReviewsService.moderate(id, action),
    onSuccess: (_, vars) => {
      // Invalidate both flavours so the queue + the per-doctor list stay in sync.
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews', 'pending'] })
      if (doctorFilter) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reviews', 'doctor', doctorFilter.id] })
      }
      toast.success(vars.action === 'approve' ? 'Review approved' : 'Review rejected')
    },
    onError: (err) => toast.error(parseApiError(err).message || 'Operation failed'),
  })

  const header = doctorFilter ? (
    <div style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: MB.ink }}>
          Reviews for Dr. {doctorFilter.name ?? `#${doctorFilter.id}`}
        </div>
        <div style={{ fontSize: 11, color: MB.text3, marginTop: 2 }}>
          Showing all statuses · only pending reviews are actionable
        </div>
      </div>
      <Btn variant="secondary" size="sm" onClick={onClearFilter}>Clear filter</Btn>
    </div>
  ) : (
    <div style={{ padding: '14px 24px', borderBottom: `1px solid ${MB.line2}`, fontSize: 13, fontWeight: 700, color: MB.ink }}>
      Pending moderation queue
    </div>
  )

  let body: React.ReactNode
  if (isLoading) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 24 }}>
        {[0, 1].map((i) => <div key={i} style={{ height: 80, background: MB.bg2, borderRadius: 10 }} />)}
      </div>
    )
  } else if (reviews.length === 0) {
    body = (
      <div style={{ padding: 40, textAlign: 'center', color: MB.text3, fontSize: 14 }}>
        {doctorFilter
          ? 'No reviews have been submitted for this doctor yet.'
          : 'No reviews pending moderation.'}
      </div>
    )
  } else {
    body = (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map((r: ReviewResponse) => {
          const isPending = r.status === 'PENDING'
          const tone = r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warn'
          return (
            <div key={r.id} style={{ background: MB.bg2, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{r.patientName}</div>
                  {!doctorFilter && <div style={{ fontSize: 12, color: MB.text3 }}>→ Dr. {r.doctorName}</div>}
                  <div style={{ fontSize: 13, color: '#F59E0B', marginTop: 2 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                <Badge tone={tone} size="sm">{r.status.toLowerCase()}</Badge>
              </div>
              {r.comment && <p style={{ margin: '0 0 12px', fontSize: 13, color: MB.text2, lineHeight: 1.5 }}>{r.comment}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: MB.text3 }}>
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {isPending && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="primary" size="sm" loading={moderateMutation.isPending} onClick={() => moderateMutation.mutate({ id: String(r.id), action: 'approve' })}>Approve</Btn>
                    <Btn variant="dangerOutline" size="sm" loading={moderateMutation.isPending} onClick={() => moderateMutation.mutate({ id: String(r.id), action: 'reject' })}>Reject</Btn>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return <>{header}{body}</>
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default memo(function DeskDoctors() {
  const { data: doctors, isLoading } = useAdminDoctors()
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  // Read `?tab=...&doctorId=...` from the URL so deep-links (e.g. "Moderate"
  // from the perf dashboard) land on the right view with the right filter.
  const [activeTab, setActiveTab] = useState<'doctors' | 'reviews'>(
    () => (searchParams.get('tab') === 'reviews' ? 'reviews' : 'doctors'),
  )
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [editing, setEditing] = useState<DoctorResponse | null>(null)
  const [statusToggle, setStatusToggle] = useState<{ doctor: DoctorResponse; mode: 'deactivate' | 'reactivate' } | null>(null)
  const [revoking, setRevoking] = useState<number | null>(null)

  // Keep the URL in sync with the active tab so refreshes / back-button preserve state.
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (activeTab === 'reviews') {
      next.set('tab', 'reviews')
    } else {
      next.delete('tab')
      next.delete('doctorId')
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [activeTab, searchParams, setSearchParams])

  const doctorFilterId = activeTab === 'reviews' ? searchParams.get('doctorId') : null
  const doctorFilter = useMemo(() => {
    if (!doctorFilterId) return null
    const id = Number(doctorFilterId)
    const doc = (doctors ?? []).find((d) => d.id === id)
    return { id, name: doc?.fullName }
  }, [doctorFilterId, doctors])

  const clearDoctorFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('doctorId')
    setSearchParams(next, { replace: true })
  }

  const displayDocs = useMemo(() => doctors ?? [], [doctors])
  const filteredDocs = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return displayDocs
    return displayDocs.filter((d) =>
      d.fullName.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term),
    )
  }, [displayDocs, search])

  const handleExport = () => {
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = [
      ['Name', 'Email', 'Department', 'Specialisation', 'Languages', 'Accepting new'],
      ...filteredDocs.map((d) => [
        d.fullName,
        d.email,
        d.departmentName,
        d.specialization || 'Specialist',
        d.languages || '',
        d.acceptingNew ? 'Yes' : 'No',
      ]),
    ]
    const csv = rows.map((row) => row.map(quote).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'medibook-doctors.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleRevokeSessions = async (doctorId: number, userId: number, name: string) => {
    setRevoking(doctorId)
    try {
      await AdminService.revokeUserSessions(String(userId))
      toast.success(`Sessions revoked for ${name}`)
    } catch {
      toast.error('Failed to revoke sessions')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <>
    <DeskShell active="docs">
      <DeskTopbar
        title="Doctors"
        subtitle={`${filteredDocs.length} of ${displayDocs.length}`}
        actions={
          <>
            <div style={{ display: 'flex', gap: 4, background: MB.bg2, borderRadius: 8, padding: 4 }}>
              {(['doctors', 'reviews'] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: activeTab === t ? MB.bg : 'transparent', color: activeTab === t ? MB.text : MB.text3 }}>
                  {t === 'doctors' ? 'Doctors' : 'Reviews'}
                </button>
              ))}
            </div>
            {activeTab === 'doctors' && <>
              <div style={{ width: 240 }}>
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors..." icon="search" aria-label="Search doctors" />
              </div>
              <Btn variant="secondary" icon="download" onClick={handleExport} disabled={isLoading || filteredDocs.length === 0}>Export</Btn>
              <Btn variant="primary" icon="plus" onClick={() => setShowAddDrawer(true)}>Add doctor</Btn>
            </>}
          </>
        }
      />
      <div style={{ flex: 1, overflow: 'auto', padding: activeTab === 'reviews' ? 0 : 24 }}>
        {activeTab === 'reviews' && (
          <ReviewsModerationTab doctorFilter={doctorFilter} onClearFilter={clearDoctorFilter} />
        )}
        {activeTab === 'doctors' && <div style={{ background: MB.bg, borderRadius: 12, border: `1px solid ${MB.line}`, overflow: 'hidden' }}>
          <div className="mb-table-frame">
          <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Doctors list">
            <thead style={{ background: MB.bg2, borderBottom: `1px solid ${MB.line}` }}>
              <tr>
                <Th>Doctor</Th>
                <Th>Department</Th>
                <Th>Specialisation</Th>
                <Th>Languages</Th>
                <Th>Status</Th>
                <Th width={40} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      {[200, 120, 140, 100, 70, 28].map((w, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}><Skel w={w} h={12} /></td>
                      ))}
                    </tr>
                  ))
                : filteredDocs.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="stethoscope" title="No doctors found" body="Assign the ROLE_DOCTOR role to a user to create a doctor profile." /></td></tr>
                : filteredDocs.map((d) => {
                    // `isActive` (backend column) wins when present; fall back to `acceptingNew`
                    // for older list payloads that didn't expose it.
                    const isActive = d.isActive ?? d.active ?? d.acceptingNew
                    return (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${MB.line2}` }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={d.fullName} size={28} tone="primary" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{d.fullName}</div>
                            <div style={{ fontSize: 11, color: MB.text3 }}>{d.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{d.departmentName}</Td>
                      <Td>{d.specialization || 'Specialist'}</Td>
                      <Td>{d.languages || '—'}</Td>
                      <Td><StatusPill status={isActive ? 'ACTIVE' : 'INACTIVE'} /></Td>
                      <Td>
                        <RowMenu
                          aria-label={`Actions for ${d.fullName}`}
                          items={[
                            {
                              label: 'Edit profile',
                              icon: 'edit',
                              onClick: () => setEditing(d),
                            },
                            {
                              label: 'Resend invite',
                              icon: 'mail',
                              onClick: async () => {
                                try {
                                  await AdminService.resendDoctorInvite(String(d.id))
                                  toast.success(`Invite resent to ${d.email}`)
                                } catch (err) {
                                  toast.error(parseApiError(err).message || 'Could not resend invite')
                                }
                              },
                            },
                            isActive ? {
                              label: 'Deactivate',
                              icon: 'alert',
                              danger: true,
                              onClick: () => setStatusToggle({ doctor: d, mode: 'deactivate' }),
                            } : {
                              label: 'Reactivate',
                              icon: 'check',
                              onClick: () => setStatusToggle({ doctor: d, mode: 'reactivate' }),
                            },
                            {
                              label: revoking === d.id ? 'Revoking…' : 'Revoke sessions',
                              icon: 'logout',
                              danger: true,
                              disabled: revoking === d.id,
                              onClick: () => handleRevokeSessions(d.id, d.userId, d.fullName),
                            },
                          ]}
                        />
                      </Td>
                    </tr>
                  )})
              }
            </tbody>
          </table>
          </div>
        </div>}
      </div>
    </DeskShell>
    {showAddDrawer && (
      <AddDoctorDrawer onClose={() => setShowAddDrawer(false)} onSaved={() => setShowAddDrawer(false)} />
    )}
    {editing && (
      <EditDoctorDrawer
        doctor={editing}
        onClose={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />
    )}
    {statusToggle && (
      <ConfirmStatusToggle
        doctor={statusToggle.doctor}
        mode={statusToggle.mode}
        onClose={() => setStatusToggle(null)}
      />
    )}
    </>
  )
})
