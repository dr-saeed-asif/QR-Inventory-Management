import { useState } from 'react'
import QRCode from 'qrcode'
import { inventoryService } from '@/services/inventory.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const ReportsPage = () => {
  const [loading, setLoading] = useState(false)

  const exportCsv = async () => {
    setLoading(true)
    const response = await inventoryService.list({ page: 1, pageSize: 1000 })
    const rows = [
      ['Name', 'SKU', 'Category', 'Quantity', 'Location'],
      ...response.data.map((i) => [i.name, i.sku, i.category, String(i.quantity), i.location]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'inventory-report.csv'
    anchor.click()
    setLoading(false)
  }

  const exportQrs = async () => {
    const response = await inventoryService.list({ page: 1, pageSize: 50 })
    for (const item of response.data) {
      const dataUrl = await QRCode.toDataURL(item.qrValue)
      const anchor = document.createElement('a')
      anchor.href = dataUrl
      anchor.download = `${item.sku}.png`
      anchor.click()
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">Reports</h2>
      <Button onClick={exportCsv} disabled={loading}>{loading ? 'Exporting...' : 'Export Inventory CSV'}</Button>
      <Button variant="outline" onClick={exportQrs}>Export QR Codes</Button>
    </Card>
  )
}
