import { memo, useState } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Input } from '@/components/forms/Input'
import { Card } from '@/components/primitives/Card'
import { PhotoBlock } from '@/components/primitives/PhotoBlock'
import { Btn } from '@/components/primitives/Btn'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDoctors } from '@/hooks/useDoctors'
import { useNavigate } from 'react-router-dom'
import type { Doctor } from '@/types/domain'

type SearchState = 'results' | 'loading' | 'empty' | 'error'

interface FilterChipProps { label: string; value?: string; active?: boolean }
function FilterChip({ label, value, active }: FilterChipProps) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '6px 10px 6px 12px', borderRadius: 999,
      background: active ? MB.primary50 : MB.bg,
      border: `1px solid ${active ? MB.primary100 : MB.line}`,
      fontSize: 12, fontWeight: 500, color: active ? MB.primary600 : MB.text2,
      whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
    }}>
      {value ?? label}
      <Icon name="chevronDown" size={12} color={active ? MB.primary600 : MB.text3} />
    </div>
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

function DocCard({ doc }: { doc: Doctor }) {
  const navigate = useNavigate()
  return (
    <Card padding={12} interactive onClick={() => navigate(`/patient/doctor/${doc.id}`)}>
      <div style={{ display: 'flex', gap: 12 }}>
        <PhotoBlock w={56} h={56} label={`DR · ${doc.name.split(' ')[1]?.slice(0,3).toUpperCase() || 'DOC'}`}
          tone={doc.tone === 'amber' || doc.tone === 'rose' ? 'slate' : (doc.tone || 'slate')} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: MB.text }}>Dr. {doc.name}</div>
          <div style={{ fontSize: 12, color: MB.text2, marginTop: 1 }}>{doc.spec || doc.specialization} · {doc.dept || doc.department}</div>
          <div style={{ fontSize: 11, color: MB.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" size={11} color={MB.text3} /> {doc.city || 'Available'}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${MB.line2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="mb-caption" style={{ marginBottom: 1 }}>Next available</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: MB.success }}>{doc.next || 'Today'}</div>
        </div>
        <Btn size="sm" onClick={() => navigate(`/patient/doctor/${doc.id}`)}>Book</Btn>
      </div>
    </Card>
  )
}

interface MobSearchProps { state?: SearchState }

export default memo(function MobSearch({ state = 'results' }: MobSearchProps) {
  const [params, setParams] = useState({ query: '' });
  const { data: doctors, isLoading, isError, refetch } = useDoctors(params);
  
  const resolvedState: SearchState = isLoading ? 'loading' : isError ? 'error' : (doctors?.length === 0 ? 'empty' : state);

  return (
    <MobScreen>
      <MobTopBar title="Find a doctor" right={
        <button className="mb-icon-btn" aria-label="Notifications">
          <Icon name="bell" size={18} color={MB.text} />
        </button>
      } />
      <div style={{ padding: '12px 16px 8px', background: MB.bg, borderBottom: `1px solid ${MB.line2}` }}>
        <Input 
          value={params.query} 
          onChange={(e) => setParams({ ...params, query: e.target.value })}
          placeholder="Search doctors or specialties" 
          icon="search" 
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
          <FilterChip label="Department" value="Cardiology" active />
          <FilterChip label="Specialisation" />
          <FilterChip label="Availability" value="This week" active />
          <FilterChip label="Distance" />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: resolvedState === 'loading' ? 12 : '12px 16px' }}>
        {resolvedState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0,1,2,3].map(i => <DocCardSkel key={i} />)}
          </div>
        )}
        {resolvedState === 'error' && <ErrorState title="Couldn't load doctors" body="Check your connection and try again." onRetry={() => refetch()} />}
        {resolvedState === 'empty' && (
          <EmptyState icon="search" title="No doctors match your search" body="Try a broader term or remove a filter."
            action={<Btn variant="secondary" size="sm" style={{ marginTop: 8 }} onClick={() => setParams({ query: '' })}>Clear filters</Btn>} />
        )}
        {resolvedState === 'results' && (
          <>
            <div className="mb-caption" style={{ marginBottom: 8 }}>
              {(doctors ?? []).length} doctors · sorted by next available
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(doctors ?? []).map(d => <DocCard key={d.id} doc={d} />)}
            </div>
          </>
        )}
      </div>
      <MobTabBar active="search" />
    </MobScreen>
  )
})
