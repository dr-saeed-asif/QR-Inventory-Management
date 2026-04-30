import { Fragment } from 'react'
import { Button } from '@/components/ui/button'
import type { InventoryItem } from '@/types'

interface InventoryTableProps {
  items: InventoryItem[]
  page: number
  total: number
  onPrevPage: () => void
  onNextPage: () => void
  onShowQr: (item: InventoryItem) => void
  onShowBarcode: (item: InventoryItem) => void
  onDownloadQr: (item: InventoryItem) => void
  onDownloadBarcode: (item: InventoryItem) => void
  onView: (item: InventoryItem) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export const InventoryTable = ({
  items,
  page,
  total,
  onPrevPage,
  onNextPage,
  onShowQr,
  onShowBarcode,
  onDownloadQr,
  onDownloadBarcode,
  onView,
  onEdit,
  onDelete,
}: InventoryTableProps) => (
  <>
    <div className="max-h-[60vh] overflow-x-auto pb-2">
      <table className="min-w-[1450px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="sticky top-0 z-10 w-[160px] whitespace-nowrap bg-white px-3 py-2">Name</th>
            <th className="sticky top-0 z-10 w-[150px] whitespace-nowrap bg-white px-3 py-2">SKU</th>
            <th className="sticky top-0 z-10 w-[140px] whitespace-nowrap bg-white px-3 py-2">Category</th>
            <th className="sticky top-0 z-10 w-[90px] whitespace-nowrap bg-white px-3 py-2">On Hand</th>
            <th className="sticky top-0 z-10 w-[90px] whitespace-nowrap bg-white px-3 py-2">Reserved</th>
            <th className="sticky top-0 z-10 w-[100px] whitespace-nowrap bg-white px-3 py-2">Available</th>
            <th className="sticky top-0 z-10 w-[130px] whitespace-nowrap bg-white px-3 py-2">Expiry</th>
            <th className="sticky top-0 z-10 w-[160px] whitespace-nowrap bg-white px-3 py-2">Location</th>
            <th className="sticky top-0 z-10 w-[220px] whitespace-nowrap bg-white px-3 py-2">Codes</th>
            <th className="sticky top-0 z-10 w-[340px] whitespace-nowrap bg-white px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Fragment key={item.id}>
              <tr className="border-b">
                <td className="px-3 py-3">{item.name}</td>
                <td className="px-3 py-3">{item.sku}</td>
                <td className="px-3 py-3">{item.category}</td>
                <td className="px-3 py-3">{item.quantity}</td>
                <td className="px-3 py-3">{item.reservedQty}</td>
                <td className="px-3 py-3">{item.availableQty}</td>
                <td className="px-3 py-3">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                <td className="px-3 py-3">{item.location}</td>
                <td className="space-x-1 whitespace-nowrap px-3 py-3">
                  <Button type="button" variant="outline" onClick={() => onShowQr(item)}>Show QR</Button>
                  <Button type="button" variant="outline" onClick={() => onShowBarcode(item)}>Show Barcode</Button>
                </td>
                <td className="space-x-1 whitespace-nowrap px-3 py-3">
                  <Button type="button" variant="outline" onClick={() => onDownloadQr(item)}>Download QR</Button>
                  <Button type="button" variant="outline" onClick={() => onDownloadBarcode(item)}>Download Barcode</Button>
                  <Button type="button" variant="default" onClick={() => onView(item)}>View</Button>
                  <Button type="button" variant="contained" onClick={() => onEdit(item)}>Edit</Button>
                  <Button type="button" variant="destructive" onClick={() => onDelete(item)}>Delete</Button>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
    <div className="flex items-center justify-between">
      <p>Page {page} / {Math.max(1, Math.ceil(total / 8))}</p>
      <div className="space-x-2">
        <Button type="button" variant="outline" disabled={page === 1} onClick={onPrevPage}>Prev</Button>
        <Button type="button" variant="outline" onClick={onNextPage}>Next</Button>
      </div>
    </div>
  </>
)
