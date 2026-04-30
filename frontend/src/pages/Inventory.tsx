import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { barcodeToDataUrl } from '@/lib/barcode'
import { inventoryService } from '@/services/inventory.service'
import type { InventoryItem } from '@/types'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { InventoryForm } from '@/components/inventory/Inventory-form'
import { InventoryTable } from '@/components/inventory/Inventory-table'
import useDebounce from '@/hooks/use-debounce'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const InventoryListPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [expiredOnly, setExpiredOnly] = useState(false)
  const [sortBy] = useState('name')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const loadItems = (overrides?: Partial<{ search: string; category: string; location: string; sortBy: string; sortOrder: 'asc' | 'desc'; page: number; lowStockOnly: boolean; expiredOnly: boolean }>) => {
    const qSearch = overrides?.search ?? search
    const qCategory = overrides?.category ?? category
    const qLocation = overrides?.location ?? location
    const qSortBy = overrides?.sortBy ?? sortBy
    const qSortOrder = overrides?.sortOrder ?? sortOrder
    const qPage = overrides?.page ?? page
    const qLowStock = overrides?.lowStockOnly ?? lowStockOnly
    const qExpired = overrides?.expiredOnly ?? expiredOnly

    return inventoryService
      .list({
        search: qSearch,
        category: qCategory,
        location: qLocation,
        lowStock: qLowStock,
        expired: qExpired,
        sortBy: qSortBy,
        sortOrder: qSortOrder,
        page: qPage,
        pageSize: 8,
      })
      .then((res) => {
        setItems(res.data)
        setTotal(res.total)
      })
  }

  const debouncedSearch = useDebounce(search, 300)
  const debouncedCategory = useDebounce(category, 300)
  const debouncedLocation = useDebounce(location, 300)

  useEffect(() => {
    void loadItems({
      search: debouncedSearch,
      category: debouncedCategory,
      location: debouncedLocation,
      lowStockOnly,
      expiredOnly,
    })
  }, [debouncedSearch, debouncedCategory, debouncedLocation, lowStockOnly, expiredOnly, page, sortBy, sortOrder])

  const downloadQr = async (value: string, sku: string) => {
    const dataUrl = await QRCode.toDataURL(value)
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${sku}.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }

  const downloadBarcode = async (value: string, sku: string) => {
    const dataUrl = barcodeToDataUrl(value)
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${sku}-barcode.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return
    try {
      await inventoryService.delete(item.id)
      toast({ title: 'Item deleted successfully' })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast({ title: 'Item not found', description: 'This item may already be deleted. List has been refreshed.', variant: 'error' })
      } else {
        toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
      }
    } finally {
      await loadItems()
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({ title: 'Please choose a CSV/XLSX file', variant: 'error' })
      return
    }
    setImporting(true)
    try {
      const result = await inventoryService.importFile(importFile)
      toast({ title: 'Import completed', description: `Created: ${result.created}, Updated: ${result.updated}` })
      setImportFile(null)
      await loadItems()
    } catch (error) {
      toast({ title: 'Import failed', description: error instanceof Error ? error.message : 'Please check your file format', variant: 'error' })
    } finally {
      setImporting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card className="space-y-4">
        <InventoryForm
          importFile={importFile}
          importing={importing}
          search={search}
          category={category}
          location={location}
          lowStockOnly={lowStockOnly}
          expiredOnly={expiredOnly}
          onImportFileChange={setImportFile}
          onImport={() => void handleImport()}
          onAddItem={() => navigate('/admin/add-item')}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onLocationChange={setLocation}
          onLowStockOnlyChange={setLowStockOnly}
          onExpiredOnlyChange={setExpiredOnly}
        />
        <EmptyState title="No inventory found" subtitle="Add your first item or import CSV/Excel to get started." />
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <InventoryForm
        importFile={importFile}
        importing={importing}
        search={search}
        category={category}
        location={location}
        lowStockOnly={lowStockOnly}
        expiredOnly={expiredOnly}
        onImportFileChange={setImportFile}
        onImport={() => void handleImport()}
        onAddItem={() => navigate('/admin/add-item')}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onLocationChange={setLocation}
        onLowStockOnlyChange={setLowStockOnly}
        onExpiredOnlyChange={setExpiredOnly}
      />
      <InventoryTable
        items={items}
        page={page}
        total={total}
        onPrevPage={() => setPage((p) => p - 1)}
        onNextPage={() => setPage((p) => p + 1)}
        onShowQr={(item) => void downloadQr(item.qrValue, item.sku)}
        onShowBarcode={(item) => void downloadBarcode(item.barcodeValue, item.sku)}
        onDownloadQr={(item) => downloadQr(item.qrValue, item.sku)}
        onDownloadBarcode={(item) => downloadBarcode(item.barcodeValue, item.sku)}
        onView={() => toast({ title: 'No modal mode', description: 'Only form flow is enabled.' })}
        onEdit={() => toast({ title: 'No modal mode', description: 'Only form flow is enabled.' })}
        onDelete={(item) => void handleDelete(item)}
      />
    </Card>
  )
}
