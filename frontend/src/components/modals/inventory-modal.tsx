import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { InventoryItem } from '@/types'

interface InventoryModalProps {
  open: boolean
  onClose: () => void
  modalType: 'qr' | 'barcode' | 'view' | 'edit' | 'delete' | null
  modalItem: InventoryItem | null
  modalQrImage: string | null
  modalBarcodeImage: string | null
  editDraft: Partial<InventoryItem>
  onEditDraftChange: (field: keyof InventoryItem, value: any) => void
  onDownloadQr: () => void
  onDownloadBarcode: () => void
  onPrintImage: (imageUrl: string, title: string) => void
  onSaveEdit: () => void
  onConfirmDelete: () => void
}

export const InventoryModal = ({
  open,
  onClose,
  modalType,
  modalItem,
  modalQrImage,
  modalBarcodeImage,
  editDraft,
  onEditDraftChange,
  onDownloadQr,
  onDownloadBarcode,
  onPrintImage,
  onSaveEdit,
  onConfirmDelete,
}: InventoryModalProps) => {
  const getTitle = () => {
    if (!modalType) return ''
    if (modalType === 'qr') return 'QR Code'
    if (modalType === 'barcode') return 'Barcode'
    if (modalType === 'view') return 'Item Details'
    if (modalType === 'edit') return 'Edit Item'
    if (modalType === 'delete') return 'Confirm Delete'
    return ''
  }

  const getFooter = () => {
    if (modalType === 'qr') {
      return (
        <div className="flex justify-end gap-2">
          {modalQrImage && modalItem ? (
            <>
              <Button variant="outline" onClick={onDownloadQr}>
                Download QR
              </Button>
              <Button
                variant="outline"
                onClick={() => onPrintImage(modalQrImage, `QR-${modalItem.sku}`)}
              >
                Print QR
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )
    }

    if (modalType === 'barcode') {
      return (
        <div className="flex justify-end gap-2">
          {modalBarcodeImage && modalItem ? (
            <>
              <Button variant="outline" onClick={onDownloadBarcode}>
                Download Barcode
              </Button>
              <Button
                variant="outline"
                onClick={() => onPrintImage(modalBarcodeImage, `BARCODE-${modalItem.sku}`)}
              >
                Print Barcode
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )
    }

    if (modalType === 'view') {
      return (
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )
    }

    if (modalType === 'edit') {
      return (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSaveEdit}>Save</Button>
        </div>
      )
    }

    if (modalType === 'delete') {
      return (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Delete
          </Button>
        </div>
      )
    }

    return null
  }

  const getContent = () => {
    if (modalType === 'qr') {
      return modalQrImage ? (
        <div className="flex justify-center">
          <img src={modalQrImage} alt="QR" className="h-56 w-56" />
        </div>
      ) : (
        <p>Generating...</p>
      )
    }

    if (modalType === 'barcode') {
      return modalBarcodeImage ? (
        <div className="flex justify-center">
          <img src={modalBarcodeImage} alt="Barcode" className="h-28 w-full max-w-sm object-contain" />
        </div>
      ) : (
        <p>Generating...</p>
      )
    }

    if (modalType === 'view') {
      return modalItem ? (
        <div className="grid gap-2 text-sm">
          <p>
            <strong>Name:</strong> {modalItem.name}
          </p>
          <p>
            <strong>SKU:</strong> {modalItem.sku}
          </p>
          <p>
            <strong>Category:</strong> {modalItem.category}
          </p>
          <p>
            <strong>Supplier:</strong> {modalItem.supplier}
          </p>
          <p>
            <strong>Location:</strong> {modalItem.location}
          </p>
          <p>
            <strong>Price:</strong> {modalItem.price}
          </p>
          <p>
            <strong>Barcode:</strong> {modalItem.barcodeValue}
          </p>
          <p>
            <strong>Description:</strong> {modalItem.description || '-'}
          </p>
        </div>
      ) : null
    }

    if (modalType === 'edit') {
      return (
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            value={editDraft.name ?? ''}
            onChange={(e) => onEditDraftChange('name', e.target.value)}
            placeholder="Item Name"
          />
          <Input
            type="number"
            value={String(editDraft.quantity ?? 0)}
            onChange={(e) => onEditDraftChange('quantity', Number(e.target.value))}
            placeholder="Quantity"
          />
          <Input
            value={editDraft.supplier ?? ''}
            onChange={(e) => onEditDraftChange('supplier', e.target.value)}
            placeholder="Supplier"
          />
          <Input
            value={editDraft.location ?? ''}
            onChange={(e) => onEditDraftChange('location', e.target.value)}
            placeholder="Location"
          />
          <Input
            className="md:col-span-2"
            value={editDraft.description ?? ''}
            onChange={(e) => onEditDraftChange('description', e.target.value)}
            placeholder="Description"
          />
        </div>
      )
    }

    if (modalType === 'delete') {
      return (
        <div>
          <p>
            Are you sure you want to delete <strong>{modalItem?.name}</strong> (SKU: {modalItem?.sku})?
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <Modal open={open} title={getTitle()} onClose={onClose} footer={getFooter()}>
      {getContent()}
    </Modal>
  )
}
