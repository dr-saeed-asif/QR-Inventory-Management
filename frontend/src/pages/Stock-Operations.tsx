import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { stockService, type StockMovement } from '@/services/stock.service'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission } from '@/lib/permissions'

type OperationType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'

export const StockOperationsPage = () => {
  const user = useAuthStore((state) => state.user)
  const canWriteStock = hasPermission(user?.role, 'stock.write', user?.permissions)
  const [activeOperation, setActiveOperation] = useState<OperationType>('IN')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [history, setHistory] = useState<StockMovement[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    void stockService.history().then(setHistory)
  }, [])

  const execute = async () => {
    if (!itemId || quantity <= 0) {
      toast({ title: 'Item ID and quantity are required', variant: 'error' })
      return
    }
    setSubmitting(true)
    try {
      if (activeOperation === 'IN') await stockService.in({ itemId, quantity })
      if (activeOperation === 'OUT') await stockService.out({ itemId, quantity })
      if (activeOperation === 'TRANSFER') await stockService.transfer({ itemId, quantity, sourceWarehouse: 'WH-A', destinationWarehouse: 'WH-B' })
      if (activeOperation === 'ADJUSTMENT') await stockService.adjustment({ itemId, quantity, reason: 'MANUAL' })
      toast({ title: `${activeOperation} operation completed` })
      setHistory(await stockService.history())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Stock Operations</h2>
        <div className="flex flex-wrap gap-2">
          {canWriteStock
            ? (['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] as const).map((operation) => (
                <Button key={operation} type="button" variant={activeOperation === operation ? 'default' : 'outline'} onClick={() => setActiveOperation(operation)}>{operation}</Button>
              ))
            : null}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Item ID" value={itemId} onChange={(event) => setItemId(event.target.value)} disabled={!canWriteStock} />
          <Input type="number" placeholder="Quantity" value={String(quantity)} onChange={(event) => setQuantity(Number(event.target.value || 0))} disabled={!canWriteStock} />
        </div>
        {canWriteStock ? <Button type="button" disabled={submitting} onClick={() => void execute()}>{submitting ? 'Processing...' : `Run ${activeOperation}`}</Button> : null}
      </Card>
      <Card className="space-y-3">
        <h3 className="text-base font-semibold">Stock History</h3>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b"><th>Type</th><th>Item</th><th>Qty</th><th>When</th></tr></thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b"><td>{entry.type}</td><td>{entry.item?.name ?? entry.itemId}</td><td>{entry.quantity}</td><td>{new Date(entry.createdAt).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

