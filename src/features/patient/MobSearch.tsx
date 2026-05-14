import { memo, useState, useCallback } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { PatientShell } from '@/components/layout/PatientShell'
import { Input } from '@/components/forms/Input'
import { Checkbox } from '@/components/forms/Checkbox'
import { Card } from '@/components/primitives/Card'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDoctors } from '@/hooks/useDoctors'
import { useQuery, useMutation } from '@tanstack/react-query'
import { DepartmentsService } from '@/services/departments.service'
import { LookupsService } from '@/services/lookups.service'
import { IntelligenceService, TriageResult } from '@/services/intelligence.service'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useNavigate } from 'react-router-dom'
import { useViewport } from '@/hooks/useViewport'
import { useAuthStore } from '@/store/authStore'
import { parseApiError } from '@/lib/api/contracts'
import type { Doctor } from '@/types/domain'

// ── Symptom triage sheet ───────────────────────────────────────────────────────

const URGENCY_STYLE: Record<string, { bg: string; color: string }> = {
  LOW:       { bg: '#D1FAE5', color: '#065F46' },
  MEDIUM:    { bg: '#FEF3C7', color: '#92400E' },
  HIGH:      { bg: '#FEE2E2', color: '#991B1B' },
  EMERGENCY: { bg: '#DC2626', color: '#fff'    },
}

function SymptomTriageSheet({ onClose, onSpecialize }: { onClose: () => void; onSpecialize: (spec: string) => void }) {
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [result, setResult] = useState<TriageResult | null>(null)

  const addSymptom = () => {
    const trimmed = input.trim()
    if (trimmed && !symptoms.includes(trimmed)) setSymptoms((s) => [...s, trimmed])
    setInput('')
  }

  const mutation = useMutation({
    mutationFn: () => IntelligenceService.triageSymptoms(symptoms, Number(user?.id ?? 0)),
    onSuccess: (res) => setResult(res),
    onError: (err) => alert(parseApiError(err).message || 'Triage failed'),
  })

  const urgency = result?.urgencyIndicator ?? 'LOW'
  const urgencyStyle = URGENCY_STYLE[urgency] ?? URGENCY_STYLE.LOW

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: MB.bg, width: '100%', maxWidth: 560, margin: '0 auto', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: MB.line, borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: MB.ink }}>Symptom checker</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={18} color={MB.text3} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: MB.text3, margin: '0 0 16px', lineHeight: 1.5 }}>
          Not a diagnosis. AI-assisted suggestions — always consult a doctor.
        </p>

        {!result ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom() } }}
                placeholder="e.g. chest pain, fever, cough"
                style={{ flex: 1 } as React.CSSProperties}
              />
              <Btn variant="secondary" size="sm" onClick={addSymptom} disabled={!input.trim()}>Add</Btn>
            </div>
            {symptoms.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {symptoms.map((s) => (
                  <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: MB.primary50, fontSize: 12, color: MB.primary600, fontWeight: 500 }}>
                    {s}
                    <button onClick={() => setSymptoms((prev) => prev.filter((x) => x !== s))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: MB.primary600, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <Btn variant="primary" size="lg" full disabled={symptoms.length === 0} loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Analyse symptoms
            </Btn>
          </>
        ) : (
          <>
            {/* Urgency banner */}
            <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 16, background: urgencyStyle.bg }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: urgencyStyle.color }}>{urgency} urgency</div>
              <div style={{ fontSize: 13, color: urgencyStyle.color, marginTop: 4, opacity: 0.9 }}>{result.summary}</div>
            </div>

            {result.possibleConsiderations.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: MB.text3, textTransform: 'uppercase', letterSpacing: 0.04, marginBottom: 8 }}>Possible considerations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.possibleConsiderations.map((c) => (
                    <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: MB.bg2, borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: MB.text }}>{c}</span>
                      <Btn variant="secondary" size="sm" onClick={() => { onSpecialize(c); onClose() }}>Search</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ padding: '8px 10px', background: MB.bg2, borderRadius: 8, fontSize: 11, color: MB.text3, marginBottom: 16, lineHeight: 1.5 }}>
              {result.disclaimer}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="md" style={{ flex: 1 }} onClick={() => { setResult(null); setSymptoms([]) }}>Start over</Btn>
              <Btn variant="primary" size="md" style={{ flex: 1 }} onClick={onClose}>Find a doctor</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Mobile filter chip ────────────────────────────────────────────────────────
interface ChipProps {
  label: string; value: string | null; active: boolean
  onClear: () => void; onClick: () => void
}

function FilterChip({ label, value, active, onClear, onClick }: ChipProps) {
  return (
    <div role="button" tabIndex={0} aria-pressed={active} onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '6px 10px 6px 12px', borderRadius: 999,
        background: active ? MB.primary50 : MB.bg,
        border: `1px solid ${active ? MB.primary100 : MB.line}`,
        fontSize: 12, fontWeight: 500, color: active ? MB.primary600 : MB.text2,
        whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
      }}>
      {value ?? label}
      {active
        ? <span onClick={(e) => { e.stopPropagation(); onClear() }} style={{ marginLeft: 2, padding: '0 2px', lineHeight: 1, cursor: 'pointer' }}>×</span>
        : <Icon name="chevronDown" size={12} color={active ? MB.primary600 : MB.text3} />}
    </div>
  )
}

function FilterDropdown({ title, options, selected, onSelect, onClose }: {
  title: string; options: string[]; selected: string | null
  onSelect: (v: string | null) => void; onClose: () => void
}) {
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', marginTop: 4, maxHeight: 280, overflow: 'auto' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{title}</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="x" size={14} color={MB.text3} /></button>
      </div>
      {selected && (
        <button onClick={() => { onSelect(null); onClose() }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: MB.danger, cursor: 'pointer', fontFamily: 'inherit', borderBottom: `1px solid ${MB.line2}` }}>Clear filter</button>
      )}
      {options.map((opt) => (
        <button key={opt} onClick={() => { onSelect(opt); onClose() }} style={{
          width: '100%', padding: '10px 14px', background: selected === opt ? MB.primary50 : 'transparent',
          border: 'none', textAlign: 'left', fontSize: 13, fontWeight: selected === opt ? 600 : 400,
          color: selected === opt ? MB.primary600 : MB.text, cursor: 'pointer', fontFamily: 'inherit',
          borderBottom: `1px solid ${MB.line2}`,
        }}>{opt}</button>
      ))}
    </div>
  )
}

// ── Doctor card (shared) ──────────────────────────────────────────────────────
function DocCard({ doc, wide = false }: { doc: Doctor; wide?: boolean }) {
  const navigate = useNavigate()
  const fee = doc.consultationFee
  const rating = doc.averageRating
  const isSenior = doc.seniorConsultant
  const label = `DR · ${doc.name.split(' ')[1]?.slice(0, 3).toUpperCase() || 'DOC'}`

  return (
    <Card padding={wide ? 18 : 12} interactive onClick={() => navigate(`/patient/doctor/${doc.id}`)}>
      <div style={{ display: 'flex', gap: wide ? 16 : 12 }}>
        <PhotoBlock w={wide ? 68 : 56} h={wide ? 68 : 56} label={label} tone="primary" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: wide ? 15 : 14, fontWeight: 600, color: MB.text }}>Dr. {doc.name}</span>
            {isSenior && <span style={{ fontSize: 9, color: MB.primary, fontWeight: 700, background: MB.primary50, padding: '1px 5px', borderRadius: 3 }}>Senior</span>}
          </div>
          <div style={{ fontSize: 12, color: MB.text2, marginTop: 2 }}>{doc.spec || doc.specialization}</div>
          <div style={{ fontSize: 11, color: MB.text3, marginTop: 1 }}>{doc.dept || doc.department}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {doc.acceptingNew && <Badge tone="success" dot size="sm">Accepting new</Badge>}
            {doc.yearsOfExperience && <span style={{ fontSize: 11, color: MB.text3 }}>{doc.yearsOfExperience} yrs exp.</span>}
            {doc.telemedicineEnabled && <Badge tone="primary" size="sm">Telehealth</Badge>}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {rating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MB.text2 }}>
              <span style={{ color: '#F59E0B' }}>★</span>
              <span style={{ fontWeight: 600 }}>{rating.toFixed(1)}</span>
              {doc.reviewCount != null && <span style={{ color: MB.text3 }}>({doc.reviewCount})</span>}
            </div>
          )}
          {fee != null && <span style={{ fontSize: 12, fontWeight: 600, color: MB.text2 }}>₦{fee.toLocaleString()}</span>}
        </div>
        <Btn size="sm" onClick={() => navigate(`/patient/doctor/${doc.id}`)}>Book →</Btn>
      </div>
    </Card>
  )
}

function DocCardSkel() {
  return (
    <Card padding={12}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Skel w={56} h={56} r={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skel w="60%" h={14} /><Skel w="80%" h={12} /><Skel w="40%" h={10} />
        </div>
      </div>
    </Card>
  )
}

// ── Filter state hook (shared between mobile+desktop) ────────────────────────
function useSearchState(departments: { id: string | number; name: string }[]) {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState<string | null>(null)
  const [spec, setSpec] = useState<string | null>(null)
  const [acceptingNew, setAcceptingNew] = useState(false)
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  const { data: doctors, isLoading, isError, refetch } = useDoctors({
    query: debouncedQuery,
    departmentIds: dept
      ? departments.filter((d) => d.name === dept).map((d) => Number(d.id))
      : undefined,
    specialisations: spec ? [spec] : undefined,
    acceptingNew: acceptingNew || undefined,
  } as Parameters<typeof useDoctors>[0])

  const clearAll = useCallback(() => { setQuery(''); setDept(null); setSpec(null); setAcceptingNew(false) }, [])
  const hasFilters = !!dept || !!spec || acceptingNew

  return { query, setQuery, dept, setDept, spec, setSpec, acceptingNew, setAcceptingNew, doctors, isLoading, isError, refetch, clearAll, hasFilters }
}

// ── Desktop filter sidebar ────────────────────────────────────────────────────
function DesktopFilterSidebar({
  departments, specializations, dept, setDept, spec, setSpec, acceptingNew, setAcceptingNew, hasFilters, clearAll,
}: {
  departments: { id: string | number; name: string }[]
  specializations: string[]
  dept: string | null; setDept: (v: string | null) => void
  spec: string | null; setSpec: (v: string | null) => void
  acceptingNew: boolean; setAcceptingNew: (v: boolean) => void
  hasFilters: boolean; clearAll: () => void
}) {
  return (
    <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: MB.ink }}>Filters</span>
          {hasFilters && (
            <button onClick={clearAll} style={{ background: 'none', border: 'none', fontSize: 12, color: MB.danger, cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>
          )}
        </div>

        {/* Departments */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${MB.line2}` }}>
          <div className="mb-eyebrow" style={{ marginBottom: 10 }}>Department</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.slice(0, 8).map((d) => (
              <Checkbox
                key={String(d.id)}
                checked={dept === d.name}
                onChange={() => setDept(dept === d.name ? null : d.name)}
                label={d.name}
              />
            ))}
          </div>
        </div>

        {/* Specialisations */}
        {specializations.length > 0 && (
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${MB.line2}` }}>
            <div className="mb-eyebrow" style={{ marginBottom: 10 }}>Specialisation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {specializations.slice(0, 6).map((s) => (
                <Checkbox key={s} checked={spec === s} onChange={() => setSpec(spec === s ? null : s)} label={s} />
              ))}
            </div>
          </div>
        )}

        {/* Accepting new */}
        <div style={{ padding: '14px 16px' }}>
          <Checkbox checked={acceptingNew} onChange={() => setAcceptingNew(!acceptingNew)} label="Accepting new patients" />
        </div>
      </div>
    </aside>
  )
}

// ── Desktop layout ────────────────────────────────────────────────────────────
function DesktopSearch() {
  const { data: departments = [] } = useQuery({ queryKey: ['departments', 'public'], queryFn: DepartmentsService.getActiveDepartments, staleTime: 10 * 60 * 1000 })
  const { data: specializations = [] } = useQuery({ queryKey: ['specializations'], queryFn: LookupsService.getSpecialisations, staleTime: 60 * 60 * 1000 })

  const state = useSearchState(departments)
  const { query, setQuery, dept, setDept, spec, setSpec, acceptingNew, setAcceptingNew, doctors, isLoading, isError, refetch, clearAll, hasFilters } = state

  return (
    <PatientShell title="Find a doctor">
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', gap: 24, minHeight: 0, overflowY: 'auto' }}>
        {/* Filter sidebar */}
        <DesktopFilterSidebar
          departments={departments} specializations={specializations}
          dept={dept} setDept={setDept} spec={spec} setSpec={setSpec}
          acceptingNew={acceptingNew} setAcceptingNew={setAcceptingNew}
          hasFilters={hasFilters} clearAll={clearAll}
        />

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search bar + result count */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors or specialties…" icon="search" aria-label="Search doctors" />
            </div>
          </div>

          {/* Result meta */}
          {!isLoading && !isError && doctors && doctors.length > 0 && (
            <div style={{ fontSize: 13, color: MB.text3 }}>
              <strong style={{ color: MB.text }}>{doctors.length}</strong> doctor{doctors.length !== 1 ? 's' : ''} · sorted by availability
              {hasFilters && <button onClick={clearAll} style={{ marginLeft: 12, background: 'none', border: 'none', color: MB.danger, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Clear filters</button>}
            </div>
          )}

          {/* Cards */}
          {isLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => <DocCardSkel key={i} />)}
            </div>
          )}
          {isError && <ErrorState title="Couldn't load doctors" body="Check your connection and try again." onRetry={() => refetch()} />}
          {!isLoading && !isError && (!doctors || doctors.length === 0) && (
            <EmptyState icon="search" title="No doctors match" body="Try a broader search or remove a filter."
              action={hasFilters ? <Btn variant="secondary" size="sm" style={{ marginTop: 8 }} onClick={clearAll}>Clear filters</Btn> : undefined} />
          )}
          {!isLoading && !isError && doctors && doctors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {doctors.map((d) => <DocCard key={d.id} doc={d} wide />)}
            </div>
          )}
        </div>
      </div>
    </PatientShell>
  )
}

// ── Mobile layout ─────────────────────────────────────────────────────────────
function MobileSearch() {
  const { data: departments = [] } = useQuery({ queryKey: ['departments', 'public'], queryFn: DepartmentsService.getActiveDepartments, staleTime: 10 * 60 * 1000 })
  const { data: specializations = [] } = useQuery({ queryKey: ['specializations'], queryFn: LookupsService.getSpecialisations, staleTime: 60 * 60 * 1000 })

  const state = useSearchState(departments)
  const { query, setQuery, dept, setDept, spec, setSpec, acceptingNew, setAcceptingNew, doctors, isLoading, isError, refetch, clearAll, hasFilters } = state
  const [openFilter, setOpenFilter] = useState<'dept' | 'spec' | null>(null)
  const [showTriage, setShowTriage] = useState(false)
  const deptNames = departments.map((d) => d.name)

  return (
    <MobScreen>
      <MobTopBar title="Find a doctor" right={<button className="mb-icon-btn" aria-label="Notifications"><Icon name="bell" size={18} color={MB.text} /></button>} />

      <div style={{ padding: '12px 16px 8px', background: MB.bg, borderBottom: `1px solid ${MB.line2}`, position: 'relative', zIndex: 10 }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctors or specialties" icon="search" aria-label="Search doctors" />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4, position: 'relative' }}>
          <FilterChip label="Department" value={dept} active={!!dept} onClick={() => setOpenFilter(openFilter === 'dept' ? null : 'dept')} onClear={() => setDept(null)} />
          <FilterChip label="Specialisation" value={spec} active={!!spec} onClick={() => setOpenFilter(openFilter === 'spec' ? null : 'spec')} onClear={() => setSpec(null)} />
          <div role="button" tabIndex={0} aria-pressed={acceptingNew} onClick={() => setAcceptingNew(!acceptingNew)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAcceptingNew(!acceptingNew) } }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, flexShrink: 0, background: acceptingNew ? MB.primary50 : MB.bg, border: `1px solid ${acceptingNew ? MB.primary100 : MB.line}`, fontSize: 12, fontWeight: 500, color: acceptingNew ? MB.primary600 : MB.text2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {acceptingNew && <Icon name="check" size={11} color={MB.primary600} />} Accepting new
          </div>
          {hasFilters && <button onClick={clearAll} style={{ background: 'transparent', border: 'none', fontSize: 12, color: MB.danger, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', padding: '6px 4px' }}>Clear all</button>}
        </div>
        {openFilter === 'dept' && <FilterDropdown title="Department" options={deptNames} selected={dept} onSelect={setDept} onClose={() => setOpenFilter(null)} />}
        {openFilter === 'spec' && <FilterDropdown title="Specialisation" options={specializations} selected={spec} onSelect={setSpec} onClose={() => setOpenFilter(null)} />}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {/* Symptom checker banner */}
        <button
          onClick={() => setShowTriage(true)}
          style={{ width: '100%', marginBottom: 12, padding: '10px 14px', background: MB.primary50, border: `1px solid ${MB.primary100}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <Icon name="sparkle" size={16} color={MB.primary} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: MB.primary600 }}>Not sure which doctor to see?</div>
            <div style={{ fontSize: 12, color: MB.primary600, opacity: 0.8 }}>Describe your symptoms for AI-assisted guidance</div>
          </div>
          <Icon name="chevronRight" size={14} color={MB.primary} style={{ marginLeft: 'auto' } as React.CSSProperties} />
        </button>

        {isLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[0, 1, 2, 3].map((i) => <DocCardSkel key={i} />)}</div>}
        {isError && <ErrorState title="Couldn't load doctors" body="Check your connection and try again." onRetry={() => refetch()} />}
        {!isLoading && !isError && (!doctors || doctors.length === 0) && (
          <EmptyState icon="search" title="No doctors match" body="Try a broader search or remove a filter."
            action={hasFilters ? <Btn variant="secondary" size="sm" style={{ marginTop: 8 }} onClick={clearAll}>Clear filters</Btn> : undefined} />
        )}
        {!isLoading && !isError && doctors && doctors.length > 0 && (
          <>
            <div className="mb-caption" style={{ marginBottom: 8 }}>{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} · sorted by availability</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{doctors.map((d) => <DocCard key={d.id} doc={d} />)}</div>
          </>
        )}
      </div>
      <MobTabBar active="search" />
      {showTriage && (
        <SymptomTriageSheet
          onClose={() => setShowTriage(false)}
          onSpecialize={(term) => { setQuery(term); setShowTriage(false) }}
        />
      )}
    </MobScreen>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default memo(function MobSearch() {
  const { isWide } = useViewport()
  return isWide ? <DesktopSearch /> : <MobileSearch />
})
