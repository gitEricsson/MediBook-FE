import { memo, useState, useCallback } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Input } from '@/components/forms/Input'
import { Card } from '@/components/primitives/Card'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDoctors } from '@/hooks/useDoctors'
import { useQuery } from '@tanstack/react-query'
import { DepartmentsService } from '@/services/departments.service'
import { LookupsService } from '@/services/lookups.service'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useNavigate } from 'react-router-dom'
import type { Doctor } from '@/types/domain'

// ── Filter chips ─────────────────────────────────────────────────────────

interface ChipProps {
  label: string
  value: string | null
  active: boolean
  onClear: () => void
  onClick: () => void
}

function FilterChip({ label, value, active, onClear, onClick }: ChipProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '6px 10px 6px 12px', borderRadius: 999,
        background: active ? MB.primary50 : MB.bg,
        border: `1px solid ${active ? MB.primary100 : MB.line}`,
        fontSize: 12, fontWeight: 500, color: active ? MB.primary600 : MB.text2,
        whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
      }}
    >
      {value ?? label}
      {active
        ? <span onClick={(e) => { e.stopPropagation(); onClear() }} style={{ marginLeft: 2, padding: '0 2px', lineHeight: 1, cursor: 'pointer' }}>×</span>
        : <Icon name="chevronDown" size={12} color={active ? MB.primary600 : MB.text3} />
      }
    </div>
  )
}

// Simple inline filter panel
function FilterDropdown({ title, options, selected, onSelect, onClose }: {
  title: string
  options: string[]
  selected: string | null
  onSelect: (v: string | null) => void
  onClose: () => void
}) {
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: MB.bg, border: `1px solid ${MB.line}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', marginTop: 4, maxHeight: 280, overflow: 'auto' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: MB.text }}>{title}</span>
        <button onClick={onClose} aria-label={`Close ${title} filter`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="x" size={14} color={MB.text3} />
        </button>
      </div>
      {selected && (
        <button onClick={() => { onSelect(null); onClose() }} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: MB.danger, cursor: 'pointer', borderBottom: `1px solid ${MB.line2}`, fontFamily: 'inherit' }}>
          Clear filter
        </button>
      )}
      {options.map((opt) => (
        <button key={opt} onClick={() => { onSelect(opt); onClose() }} style={{
          width: '100%', padding: '10px 14px', background: selected === opt ? MB.primary50 : 'transparent',
          border: 'none', textAlign: 'left', fontSize: 13, fontWeight: selected === opt ? 600 : 400,
          color: selected === opt ? MB.primary600 : MB.text, cursor: 'pointer', fontFamily: 'inherit',
          borderBottom: `1px solid ${MB.line2}`,
        }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── Doctor card ───────────────────────────────────────────────────────────

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

function DocCard({ doc }: { doc: Doctor }) {
  const navigate = useNavigate()
  const fee = doc.effectiveConsultationFee ?? doc.consultationFee
  const rating = doc.averageRating

  return (
    <Card padding={12} interactive onClick={() => navigate(`/patient/doctor/${doc.id}`)}>
      <div style={{ display: 'flex', gap: 12 }}>
        <PhotoBlock
          w={56} h={56}
          label={`DR · ${doc.name.split(' ')[1]?.slice(0, 3).toUpperCase() || 'DOC'}`}
          tone="primary"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>Dr. {doc.name}</div>
          <div style={{ fontSize: 12, color: MB.text2, marginTop: 1 }}>{doc.spec || doc.specialization} · {doc.dept || doc.department}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {doc.acceptingNew && <Badge tone="success" dot size="sm">Accepting new</Badge>}
            {doc.yearsOfExperience && <span style={{ fontSize: 11, color: MB.text3 }}>{doc.yearsOfExperience} yrs exp.</span>}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {rating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MB.text2 }}>
              <span style={{ color: '#F59E0B' }}>★</span>
              <span style={{ fontWeight: 600 }}>{rating.toFixed(1)}</span>
              {doc.reviewCount != null && <span style={{ color: MB.text3 }}>({doc.reviewCount})</span>}
            </div>
          )}
          {fee != null && (
            <span style={{ fontSize: 12, fontWeight: 600, color: MB.text2 }}>
              ₦{fee.toLocaleString()}
            </span>
          )}
        </div>
        <Btn size="sm" onClick={() => navigate(`/patient/doctor/${doc.id}`)}>Book</Btn>
      </div>
    </Card>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────

type ActiveFilter = 'dept' | 'spec' | null

export default memo(function MobSearch() {
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState<string | null>(null)
  const [spec, setSpec] = useState<string | null>(null)
  const [acceptingNew, setAcceptingNew] = useState(false)
  const [openFilter, setOpenFilter] = useState<ActiveFilter>(null)
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'public'],
    queryFn: DepartmentsService.getActiveDepartments,
    staleTime: 10 * 60 * 1000,
  })
  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: LookupsService.getSpecialisations,
    staleTime: 60 * 60 * 1000,
  })

  const { data: doctors, isLoading, isError, refetch } = useDoctors({
    query: debouncedQuery,
    departmentIds: dept
      ? departments.filter((department) => department.name === dept).map((department) => department.id)
      : undefined,
    specialisations: spec ? [spec] : undefined,
    acceptingNew: acceptingNew || undefined,
  } as Parameters<typeof useDoctors>[0])

  const clearAll = useCallback(() => {
    setQuery(''); setDept(null); setSpec(null); setAcceptingNew(false)
  }, [])

  const hasFilters = !!dept || !!spec || acceptingNew
  const deptNames = departments.map((d) => d.name)

  return (
    <MobScreen>
      <MobTopBar title="Find a doctor" right={
        <button className="mb-icon-btn" aria-label="Notifications">
          <Icon name="bell" size={18} color={MB.text} />
        </button>
      } />

      <div style={{ padding: '12px 16px 8px', background: MB.bg, borderBottom: `1px solid ${MB.line2}`, position: 'relative', zIndex: 10 }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search doctors or specialties"
          icon="search"
          aria-label="Search doctors or specialties"
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4, position: 'relative' }}>
          <FilterChip
            label="Department"
            value={dept}
            active={!!dept}
            onClick={() => setOpenFilter(openFilter === 'dept' ? null : 'dept')}
            onClear={() => setDept(null)}
          />
          <FilterChip
            label="Specialisation"
            value={spec}
            active={!!spec}
            onClick={() => setOpenFilter(openFilter === 'spec' ? null : 'spec')}
            onClear={() => setSpec(null)}
          />
          <div
            role="button"
            tabIndex={0}
            aria-pressed={acceptingNew}
            onClick={() => setAcceptingNew((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setAcceptingNew((v) => !v)
              }
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '6px 12px', borderRadius: 999, flexShrink: 0,
              background: acceptingNew ? MB.primary50 : MB.bg,
              border: `1px solid ${acceptingNew ? MB.primary100 : MB.line}`,
              fontSize: 12, fontWeight: 500,
              color: acceptingNew ? MB.primary600 : MB.text2,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {acceptingNew && <Icon name="check" size={11} color={MB.primary600} />}
            Accepting new
          </div>
          {hasFilters && (
            <button onClick={clearAll} style={{ background: 'transparent', border: 'none', fontSize: 12, color: MB.danger, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', padding: '6px 4px' }}>
              Clear all
            </button>
          )}
        </div>

        {/* Filter dropdown panels */}
        {openFilter === 'dept' && (
          <FilterDropdown title="Department" options={deptNames} selected={dept} onSelect={setDept} onClose={() => setOpenFilter(null)} />
        )}
        {openFilter === 'spec' && (
          <FilterDropdown title="Specialisation" options={specializations} selected={spec} onSelect={setSpec} onClose={() => setOpenFilter(null)} />
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3].map((i) => <DocCardSkel key={i} />)}
          </div>
        )}
        {isError && (
          <ErrorState title="Couldn't load doctors" body="Check your connection and try again." onRetry={() => refetch()} />
        )}
        {!isLoading && !isError && (!doctors || doctors.length === 0) && (
          <EmptyState
            icon="search"
            title="No doctors match"
            body="Try a broader search or remove a filter."
            action={hasFilters ? <Btn variant="secondary" size="sm" style={{ marginTop: 8 }} onClick={clearAll}>Clear filters</Btn> : undefined}
          />
        )}
        {!isLoading && !isError && doctors && doctors.length > 0 && (
          <>
            <div className="mb-caption" style={{ marginBottom: 8 }}>
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} · sorted by availability
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {doctors.map((d) => <DocCard key={d.id} doc={d} />)}
            </div>
          </>
        )}
      </div>
      <MobTabBar active="search" />
    </MobScreen>
  )
})
