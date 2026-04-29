import { useRef, useState } from 'react'
import type { ComponentType } from 'react'
import * as QRScannerLib from '@yudiel/react-qr-scanner'
import { Card } from '@/components/ui/card'
import { inventoryService } from '@/services/inventory.service'
import type { InventoryItem } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import axios from 'axios'

const Scanner = (QRScannerLib as unknown as { Scanner: ComponentType<any> }).Scanner

export const ScannerPage = () => {
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const lastScannedRef = useRef<string>('')
  const isResolvingRef = useRef(false)

  const resolveCode = async (rawCode: string) => {
    const code = rawCode.trim()
    if (!code) return
    if (isResolvingRef.current) return
    if (code === lastScannedRef.current) return

    isResolvingRef.current = true
    setLoading(true)
    try {
      const found = await inventoryService.detailsFromCode(code)
      setItem(found)
      setError('')
      lastScannedRef.current = code
    } catch (scanError) {
      if (axios.isAxiosError(scanError) && scanError.response?.status === 404) {
        setError('Item not found for this code')
      } else if (axios.isAxiosError(scanError) && scanError.response?.status === 401) {
        setError('Session expired. Please login again.')
      } else {
        setError('Scanner request failed. Please try again.')
      }
      setItem(null)
    } finally {
      setLoading(false)
      isResolvingRef.current = false
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">QR / Barcode Scanner</h2>
      <div className="h-[300px] w-[400px] max-w-full overflow-hidden rounded-md border border-slate-200">
        <Scanner
          formats={['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e']}
          onScan={(codes: Array<{ rawValue?: string; raw?: string }> | { rawValue?: string; raw?: string } | null) => {
            const firstCode = Array.isArray(codes) ? codes[0] : codes
            const value = firstCode?.rawValue ?? firstCode?.raw
            if (!value) return
            void resolveCode(value)
          }}
          onError={() => setError('Unable to access webcam')}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Or enter barcode/QR value manually"
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
          className="max-w-md"
        />
        <Button type="button" variant="outline" disabled={loading} onClick={() => void resolveCode(manualCode)}>
          {loading ? 'Checking...' : 'Find Item'}
        </Button>
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
