import { Button } from '@/components/ui/button'
import type { PurchaseRecord, SaleRecord } from '@/types'

type Record = SaleRecord | PurchaseRecord

interface TransactionListProps {
  mode: 'sale' | 'purchase'
  records: Record[]
  canDelete: boolean
  onDelete: (record: Record) => void
}

const formatDate = (value: string) => new Date(value).toLocaleDateString()

export const TransactionList = ({ mode, records, canDelete, onDelete }: TransactionListProps) => (
  <div className="space-y-2">
    {records.map((record) => {
      const date = mode === 'sale' ? (record as SaleRecord).saleDate : (record as PurchaseRecord).purchaseDate
      return (
        <div key={record.id} className="rounded-md border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{record.invoiceNo}</p>
              <p className="text-xs text-slate-500">
                {formatDate(date)}
                {record.party?.name ? ` · ${record.party.name}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Rs {record.total.toFixed(2)}</p>
              <p className="text-xs text-slate-500">{record.lines.length} item(s)</p>
            </div>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {record.lines.map((line) => (
              <li key={line.id ?? `${line.itemId}-${line.quantity}`}>
                {line.itemName ?? 'Item'} × {line.quantity} @ Rs {line.unitPrice} = Rs{' '}
                {(line.lineTotal ?? line.quantity * line.unitPrice).toFixed(2)}
              </li>
            ))}
          </ul>
          {canDelete ? (
            <Button variant="destructive" className="mt-2" onClick={() => onDelete(record)}>
              Delete
            </Button>
          ) : null}
        </div>
      )
    })}
  </div>
)
