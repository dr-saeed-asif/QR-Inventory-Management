import { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { purchasesService } from '@/services/purchases.service'
import { partyService } from '@/services/party.service'
import { inventoryService } from '@/services/inventory.service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageListHeader } from '@/components/layout/page-list-header'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import type { InventoryItem, Party, PurchaseRecord } from '@/types'
import { TransactionForm, type DraftLine } from '@/components/commerce/Transaction-form'
import { TransactionList } from '@/components/commerce/Transaction-list'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission } from '@/lib/permissions'
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 10
const emptyLines = (): DraftLine[] => [{ itemId: '', quantity: 1, unitPrice: 0 }]

export const PurchasesPage = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const canCreate = hasPermission(user?.role, 'purchases.create', user?.permissions)
  const canDelete = hasPermission(user?.role, 'purchases.delete', user?.permissions)
  const isCreateRoute = location.pathname.endsWith('/create')

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [partyId, setPartyId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>(emptyLines())

  const loadList = async (pageNum = page) => {
    setLoading(true)
    try {
      const res = await purchasesService.list({ page: pageNum, pageSize: PAGE_SIZE })
      setPurchases(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  const loadFormData = async () => {
    const [partyRows, inventory] = await Promise.all([
      partyService.list({ type: 'SUPPLIER', page: 1, pageSize: 500 }),
      inventoryService.list({ page: 1, pageSize: 500 }),
    ])
    setParties(partyRows.data)
    setItems(inventory.data)
  }

  useEffect(() => {
    if (isCreateRoute) {
      void loadFormData()
      return
    }
    void loadList(page)
  }, [isCreateRoute, page])

  const resetForm = () => {
    setPartyId('')
    setDiscount(0)
    setNotes('')
    setLines(emptyLines())
  }

  const closeForm = () => navigate('/admin/purchases')

  const submitPurchase = async () => {
    const validLines = lines.filter((l) => l.itemId && l.quantity > 0)
    if (!validLines.length) {
      toast({ title: 'Add at least one item', variant: 'error' })
      return
    }
    try {
      await purchasesService.create({
        partyId: partyId || undefined,
        discount,
        notes: notes || undefined,
        lines: validLines,
      })
      resetForm()
      toast({ title: 'Purchase saved' })
      setPage(1)
      closeForm()
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
      toast({ title: 'Purchase failed', description: message, variant: 'error' })
    }
  }

  if (isCreateRoute) {
    if (!canCreate) {
      return <EmptyState title="Access denied" subtitle="You do not have permission to create purchases." />
    }
    return (
      <div className="space-y-4">
        <PageListHeader title="New purchase" subtitle="Record a purchase and increase stock." showAdd={false} />
        <Button variant="outline" onClick={closeForm}>
          Back to Purchases
        </Button>
        <Card>
          <TransactionForm
            mode="purchase"
            parties={parties}
            items={items}
            partyId={partyId}
            discount={discount}
            notes={notes}
            lines={lines}
            canCreate
            onPartyIdChange={setPartyId}
            onDiscountChange={setDiscount}
            onNotesChange={setNotes}
            onLinesChange={setLines}
            onCancel={closeForm}
            onSubmit={submitPurchase}
          />
        </Card>
      </div>
    )
  }

  return (
    <ListPageLayout
      loading={loading}
      isEmpty={!loading && total === 0}
      emptySubtitle="No purchases found. Click Add to create a purchase."
      header={
        <PageListHeader
          title="Purchases"
          subtitle="Record purchases and increase stock automatically."
          addLabel="Add"
          showAdd={canCreate}
          onAdd={() => navigate('/admin/purchases/create')}
        />
      }
      pagination={<ListPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    >
      <TransactionList
        mode="purchase"
        records={purchases}
        canDelete={canDelete}
        onDelete={async (record) => {
          if (!window.confirm(`Delete purchase ${record.invoiceNo}? Stock will be adjusted.`)) return
          try {
            await purchasesService.delete(record.id)
            if (purchases.length === 1 && page > 1) setPage(page - 1)
            else await loadList(page)
            toast({ title: 'Purchase deleted' })
          } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined
            toast({ title: 'Delete failed', description: message, variant: 'error' })
          }
        }}
      />
    </ListPageLayout>
  )
}
