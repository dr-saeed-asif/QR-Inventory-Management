import { Fragment, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { barcodeToDataUrl } from '@/lib/barcode'
import { inventoryService } from '@/services/inventory.service'
import type { InventoryItem } from '@/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'

export const InventoryListPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'qr' | 'barcode' | 'view' | 'edit' | 'delete' | null>(null)
  const [modalItem, setModalItem] = useState<InventoryItem | null>(null)
  const [modalQrImage, setModalQrImage] = useState<string | null>(null)
  const [modalBarcodeImage, setModalBarcodeImage] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<InventoryItem>>({})

  const loadItems = () =>
    inventoryService.list({ search, category, location, sortBy, sortOrder, page, pageSize: 8 }).then((res) => {
      setItems(res.data)
      setTotal(res.total)
    })

  useEffect(() => {
    void loadItems()
  }, [category, location, page, search, sortBy, sortOrder])

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

  const printImage = (imageUrl: string, title: string) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: 95vw;
              max-height: 95vh;
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="${title}" />
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  

  const onSaveEdit = async (id: string) => {
    await inventoryService.update(id, {
      name: editDraft.name ?? '',
      quantity: Number(editDraft.quantity ?? 0),
      location: editDraft.location ?? '',
      supplier: editDraft.supplier ?? '',
      description: editDraft.description ?? '',
    })
    setModalOpen(false)
    await loadItems()
  }

  const openQrModal = async (item: InventoryItem) => {
    setModalItem(item)
    setModalType('qr')
    setModalQrImage(await QRCode.toDataURL(item.qrValue))
    setModalOpen(true)
  }

  const openBarcodeModal = (item: InventoryItem) => {
    setModalItem(item)
    setModalType('barcode')
    setModalBarcodeImage(barcodeToDataUrl(item.barcodeValue))
    setModalOpen(true)
  }

  const openViewModal = (item: InventoryItem) => {
    setModalItem(item)
    setModalType('view')
    setModalOpen(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setEditDraft({
      name: item.name,
      quantity: item.quantity,
      location: item.location,
      supplier: item.supplier,
      description: item.description,
    })
    setModalItem(item)
    setModalType('edit')
    setModalOpen(true)
  }

  const openDeleteModal = (item: InventoryItem) => {
    setModalItem(item)
    setModalType('delete')
    setModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!modalItem) return
    await inventoryService.delete(modalItem.id)
    setModalOpen(false)
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
              <th>Name</th><th>SKU</th><th>Category</th><th>Qty</th><th>Location</th><th>Codes</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr key={item.id} className="border-b">
                  <td>{item.name}</td><td>{item.sku}</td><td>{item.category}</td><td>{item.quantity}</td><td>{item.location}</td>
                  <td className="space-x-1">
                    <Button type="button" variant="outline" onClick={() => openQrModal(item)}>Show QR</Button>
                    <Button type="button" variant="outline" onClick={() => openBarcodeModal(item)}>Show Barcode</Button>
                  </td>
                  <td className="space-x-1">
                    <Button type="button" variant="outline" onClick={() => openViewModal(item)}>View</Button>
                    <Button type="button" variant="outline" onClick={() => openEditModal(item)}>Edit</Button>
                    <Button type="button" variant="outline" onClick={() => downloadQr(item.qrValue, item.sku)}>Download QR</Button>
                    <Button type="button" variant="outline" onClick={() => downloadBarcode(item.barcodeValue, item.sku)}>Download Barcode</Button>
                    <Button type="button" variant="destructive" onClick={() => openDeleteModal(item)}>Delete</Button>
                  </td>
                </tr>
                {/* modal used instead of inline panel */}
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
      <Modal
        open={modalOpen}
        title={modalType === 'qr' ? 'QR Code' : modalType === 'barcode' ? 'Barcode' : modalType === 'view' ? 'Item Details' : modalType === 'edit' ? 'Edit Item' : modalType === 'delete' ? 'Confirm Delete' : ''}
        onClose={() => setModalOpen(false)}
        footer={
              modalType === 'qr' ? (
                <div className="flex justify-end gap-2">
                  {modalQrImage && modalItem ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => downloadQr(modalItem.qrValue, modalItem.sku)}
                      >
                        Download QR
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => printImage(modalQrImage, `QR-${modalItem.sku}`)}
                      >
                        Print QR
                      </Button>
                    </>
                  ) : null}
                  <Button variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
                </div>
              ) : modalType === 'barcode' ? (
                <div className="flex justify-end gap-2">
                  {modalBarcodeImage && modalItem ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => downloadBarcode(modalItem.barcodeValue, modalItem.sku)}
                      >
                        Download Barcode
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => printImage(modalBarcodeImage, `BARCODE-${modalItem.sku}`)}
                      >
                        Print Barcode
                      </Button>
                    </>
                  ) : null}
                  <Button variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
                </div>
              ) : modalType === 'view' ? (
                <div className="flex justify-end gap-2">
                  {modalItem ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const html = `
                          <html>
                            <head>
                              <title>${modalItem.name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 24px; }
                                h1 { margin: 0 0 12px; }
                                p { margin: 6px 0; }
                              </style>
                            </head>
                            <body>
                              <h1>${modalItem.name}</h1>
                              <p><strong>SKU:</strong> ${modalItem.sku}</p>
                              <p><strong>Category:</strong> ${modalItem.category}</p>
                              <p><strong>Supplier:</strong> ${modalItem.supplier}</p>
                              <p><strong>Location:</strong> ${modalItem.location}</p>
                              <p><strong>Price:</strong> ${modalItem.price}</p>
                              <p><strong>Barcode:</strong> ${modalItem.barcodeValue}</p>
                              <p><strong>Description:</strong> ${modalItem.description || '-'}</p>
                            </body>
                          </html>
                        `
                        const printWindow = window.open('', '_blank', 'width=800,height=600')
                        if (!printWindow) return
                        printWindow.document.open()
                        printWindow.document.write(html)
                        printWindow.document.close()
                        printWindow.focus()
                        printWindow.print()
                      }}
                    >
                      Print Details
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
                </div>
              ) : modalType === 'edit' ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={() => modalItem && onSaveEdit(modalItem.id)}>Save</Button>
            </div>
          ) : modalType === 'delete' ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          ) : null
        }
      >
        {modalType === 'qr' ? (
          modalQrImage ? <div className="flex justify-center"><img src={modalQrImage} alt="QR" className="h-56 w-56" /></div> : <p>Generating...</p>
        ) : modalType === 'barcode' ? (
          modalBarcodeImage ? <div className="flex justify-center"><img src={modalBarcodeImage} alt="Barcode" className="h-28 w-full max-w-sm object-contain" /></div> : <p>Generating...</p>
        ) : modalType === 'view' ? (
          modalItem ? (
            <div className="grid gap-2 text-sm">
              <p><strong>Name:</strong> {modalItem.name}</p>
              <p><strong>SKU:</strong> {modalItem.sku}</p>
              <p><strong>Category:</strong> {modalItem.category}</p>
              <p><strong>Supplier:</strong> {modalItem.supplier}</p>
              <p><strong>Location:</strong> {modalItem.location}</p>
              <p><strong>Price:</strong> {modalItem.price}</p>
              <p><strong>Barcode:</strong> {modalItem.barcodeValue}</p>
              <p><strong>Description:</strong> {modalItem.description || '-'}</p>
            </div>
          ) : null
        ) : modalType === 'edit' ? (
          <div className="grid gap-2 md:grid-cols-2">
            <Input value={editDraft.name ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Item Name" />
            <Input type="number" value={String(editDraft.quantity ?? 0)} onChange={(e) => setEditDraft((p) => ({ ...p, quantity: Number(e.target.value) }))} placeholder="Quantity" />
            <Input value={editDraft.supplier ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, supplier: e.target.value }))} placeholder="Supplier" />
            <Input value={editDraft.location ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
            <Input className="md:col-span-2" value={editDraft.description ?? ''} onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
          </div>
        ) : modalType === 'delete' ? (
          <div>
            <p>Are you sure you want to delete <strong>{modalItem?.name}</strong> (SKU: {modalItem?.sku})?</p>
          </div>
        ) : null}
      </Modal>
    </Card>
  )
}
