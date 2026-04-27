import { Fragment, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { inventoryService } from '@/services/inventory.service'
import type { InventoryItem } from '@/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

export const InventoryListPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [qrPreview, setQrPreview] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<'view' | 'edit' | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<InventoryItem>>({})

  const loadItems = () =>
    inventoryService.list({ search, category, location, sortBy, sortOrder, page, pageSize: 8 }).then((res) => {
      setItems(res.data)
      setTotal(res.total)
    })

  useEffect(() => {
    void loadItems()
  }, [category, location, page, search, sortBy, sortOrder])

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return
    await inventoryService.delete(id)
    if (activeItemId === id) {
      setActiveItemId(null)
      setActiveMode(null)
    }
    await loadItems()
  }

  const showQr = async (value: string) => setQrPreview(await QRCode.toDataURL(value))
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

  const togglePanel = (item: InventoryItem, mode: 'view' | 'edit') => {
    if (activeItemId === item.id && activeMode === mode) {
      setActiveItemId(null)
      setActiveMode(null)
      return
    }
    setActiveItemId(item.id)
    setActiveMode(mode)
    setEditDraft({
      name: item.name,
      quantity: item.quantity,
      location: item.location,
      supplier: item.supplier,
      description: item.description,
    })
  }

  const onSaveEdit = async (id: string) => {
    await inventoryService.update(id, {
      name: editDraft.name ?? '',
      quantity: Number(editDraft.quantity ?? 0),
      location: editDraft.location ?? '',
      supplier: editDraft.supplier ?? '',
      description: editDraft.description ?? '',
    })
    setActiveItemId(null)
    setActiveMode(null)
    await loadItems()
  }

  if (items.length === 0) {
    return <EmptyState title="No inventory found" subtitle="Add your first item to get started." />
  }

  return (
    <Card className="space-y-4">
      <div className="grid gap-2 md:grid-cols-5">
        <Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Input placeholder="Filter category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Input placeholder="Filter location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="category">Sort by Category</option>
        </select>
        <select className="h-10 rounded-md border border-slate-300 px-3 text-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th>Name</th><th>SKU</th><th>Category</th><th>Qty</th><th>Location</th><th>QR</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr key={item.id} className="border-b">
                  <td>{item.name}</td><td>{item.sku}</td><td>{item.category}</td><td>{item.quantity}</td><td>{item.location}</td>
                  <td><Button type="button" variant="outline" onClick={() => showQr(item.qrValue)}>Show QR</Button></td>
                  <td className="space-x-1">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(activeItemId === item.id && activeMode === 'view' && 'bg-slate-900 text-white hover:bg-slate-800')}
                      onClick={() => togglePanel(item, 'view')}
                    >
                      {activeItemId === item.id && activeMode === 'view' ? 'Close' : 'View'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(activeItemId === item.id && activeMode === 'edit' && 'bg-slate-900 text-white hover:bg-slate-800')}
                      onClick={() => togglePanel(item, 'edit')}
                    >
                      {activeItemId === item.id && activeMode === 'edit' ? 'Close' : 'Edit'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => downloadQr(item.qrValue, item.sku)}>Download QR</Button>
                    <Button type="button" variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>
                  </td>
                </tr>
                {activeItemId === item.id ? (
                  <tr className="border-b bg-slate-50">
                    <td colSpan={7} className="p-3">
                      {activeMode === 'view' ? (
                        <div className="grid gap-1 text-sm">
                          <p><span className="font-semibold">Name:</span> {item.name}</p>
                          <p><span className="font-semibold">SKU:</span> {item.sku}</p>
                          <p><span className="font-semibold">Category:</span> {item.category}</p>
                          <p><span className="font-semibold">Supplier:</span> {item.supplier}</p>
                          <p><span className="font-semibold">Location:</span> {item.location}</p>
                          <p><span className="font-semibold">Price:</span> {item.price}</p>
                          <p><span className="font-semibold">Description:</span> {item.description || '-'}</p>
                        </div>
                      ) : (
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input
                            value={editDraft.name ?? ''}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Item Name"
                          />
                          <Input
                            type="number"
                            value={String(editDraft.quantity ?? 0)}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                            placeholder="Quantity"
                          />
                          <Input
                            value={editDraft.supplier ?? ''}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, supplier: e.target.value }))}
                            placeholder="Supplier"
                          />
                          <Input
                            value={editDraft.location ?? ''}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, location: e.target.value }))}
                            placeholder="Location"
                          />
                          <Input
                            className="md:col-span-2"
                            value={editDraft.description ?? ''}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Description"
                          />
                          <div className="md:col-span-2">
                            <Button type="button" onClick={() => onSaveEdit(item.id)}>Save Changes</Button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p>Page {page} / {Math.max(1, Math.ceil(total / 8))}</p>
        <div className="space-x-2">
          <Button type="button" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button type="button" variant="outline" onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
      {qrPreview ? <img src={qrPreview} alt="QR preview" className="h-44 w-44" /> : null}
    </Card>
  )
}
