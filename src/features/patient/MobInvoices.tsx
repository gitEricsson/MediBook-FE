import { memo } from 'react'
import { MB } from '@/constants/tokens'
import { MobScreen } from '@/components/layout/MobScreen'
import { MobTopBar } from '@/components/layout/MobTopBar'
import { MobTabBar } from '@/components/layout/MobTabBar'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Icon } from '@/components/primitives/Icon'
import { Skel } from '@/components/feedback/Skel'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { unwrapApiResponse, PageResponse, toPageableParams } from '@/lib/api/contracts'
import type { BadgeTone } from '@/types/ui'

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface Invoice {
  id: number
  invoiceNumber: string
  patientName: string
  doctorName: string
  subtotal: number
  discount: number
  total: number
  currency: string
  status: 'PAID' | 'UNPAID' | 'CANCELLED' | 'REFUNDED'
  issuedAt: string
  paidAt?: string
  lineItems?: InvoiceLineItem[]
}

const STATUS_TONE: Record<Invoice['status'], BadgeTone> = {
  PAID: 'success',
  UNPAID: 'warn',
  CANCELLED: 'neutral',
  REFUNDED: 'primary',
}

async function fetchMyInvoices(): Promise<Invoice[]> {
  const response = await apiClient.get('/api/v1/invoices/my', {
    params: toPageableParams({ page: 0, size: 20 }),
  })
  const page = unwrapApiResponse<PageResponse<Invoice>>(response.data)
  return page.content
}

function InvoiceSkel() {
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <Skel h={12} w="50%" r={4} />
        <Skel h={20} w={60} r={999} />
      </div>
      <Skel h={18} w="40%" r={4} />
      <Skel h={12} w="60%" r={4} style={{ marginTop: 6 }} />
    </Card>
  )
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const issued = new Date(invoice.issuedAt)
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: MB.text3, fontWeight: 600, letterSpacing: 0.04, textTransform: 'uppercase' }}>
            {issued.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: MB.text3, marginTop: 2 }}>
            {invoice.invoiceNumber}
          </div>
        </div>
        <Badge tone={STATUS_TONE[invoice.status]} size="sm" dot>
          {invoice.status}
        </Badge>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: MB.ink, letterSpacing: 0 }}>
          {invoice.currency} {invoice.total.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: MB.text3, marginTop: 2 }}>{invoice.doctorName}</div>
      </div>
      {invoice.status === 'PAID' && invoice.paidAt && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${MB.line2}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={13} color={MB.success} />
          <span style={{ fontSize: 12, color: MB.success, fontWeight: 500 }}>
            Paid {new Date(invoice.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}
    </Card>
  )
}

export default memo(function MobInvoices() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices', 'my'],
    queryFn: fetchMyInvoices,
  })

  return (
    <MobScreen>
      <MobTopBar title="Invoices" back />
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map((i) => <InvoiceSkel key={i} />)}
          </div>
        )}
        {isError && (
          <ErrorState title="Couldn't load invoices" onRetry={() => refetch()} />
        )}
        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState icon="inbox" title="No invoices yet" body="Invoices for your appointments will appear here." />
        )}
        {!isLoading && !isError && data && data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.map((inv) => <InvoiceCard key={inv.id} invoice={inv} />)}
          </div>
        )}
      </div>
      <MobTabBar active="appts" />
    </MobScreen>
  )
})
