import { useState } from 'react'
import type { ComponentType } from 'react'
import * as QRScannerLib from '@yudiel/react-qr-scanner'
import { Card } from '@/components/ui/card'
import { inventoryService } from '@/services/inventory.service'
import type { InventoryItem } from '@/types'

const Scanner = (QRScannerLib as unknown as { Scanner: ComponentType<any> }).Scanner

export const ScannerPage = () => {
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [error, setError] = useState('')

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">QR / Barcode Scanner</h2>
      <div className="h-[300px] w-[400px] max-w-full overflow-hidden rounded-md border border-slate-200">
        <Scanner
          formats={['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e']}
          onScan={async (codes: Array<{ rawValue?: string }>) => {
            const value = codes[0]?.rawValue
            if (!value) return
            try {
              setItem(await inventoryService.detailsFromCode(value))
              setError('')
            } catch {
              setError('Item not found for this code')
              setItem(null)
            }
          }}
          onError={() => setError('Unable to access webcam')}
        />
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      {item ? (
        <div className="rounded-md border border-slate-200 p-4">
          <p className="font-semibold">{item.name}</p>
          <p>SKU: {item.sku}</p>
          <p>Category: {item.category}</p>
          <p>Quantity: {item.quantity}</p>
          <p>Location: {item.location}</p>
          <p>Barcode: {item.barcodeValue}</p>
        </div>
      ) : null}
    </Card>
  )
}
