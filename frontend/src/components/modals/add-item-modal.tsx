import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { Category } from '@/types'
import type { ItemInput } from '@/lib/validators'

interface AddItemModalProps {
  open: boolean
  onClose: () => void
  onSubmit: () => Promise<void>
  categories: Category[]
  form: ItemInput
  errors: Partial<Record<keyof ItemInput, string>>
  isSubmitting: boolean
  onFormChange: (field: keyof ItemInput, value: any) => void
}

export const AddItemModal = ({
  open,
  onClose,
  onSubmit,
  categories,
  form,
  errors,
  isSubmitting,
  onFormChange,
}: AddItemModalProps) => {
  return (
    <Modal
      open={open}
      title="Add New Item"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={onSubmit}>
            {isSubmitting ? 'Adding...' : 'Add Item'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Input
            placeholder="Item Name"
            value={form.name}
            onChange={(e) => onFormChange('name', e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div>
          <Input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => onFormChange('sku', e.target.value)}
          />
          {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
        </div>
        <div>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={form.categoryId}
            onChange={(e) => onFormChange('categoryId', e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>}
        </div>
        <div>
          <Input
            type="number"
            placeholder="Quantity"
            value={form.quantity === 0 ? '' : String(form.quantity)}
            onChange={(e) => onFormChange('quantity', Number(e.target.value || 0))}
          />
          {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
        </div>
        <div>
          <Input
            type="number"
            step="0.01"
            placeholder="Price"
            value={form.price === 0 ? '' : String(form.price)}
            onChange={(e) => onFormChange('price', Number(e.target.value || 0))}
          />
          {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
        </div>
        <div>
          <Input
            placeholder="Supplier"
            value={form.supplier}
            onChange={(e) => onFormChange('supplier', e.target.value)}
          />
          {errors.supplier && <p className="text-xs text-red-600 mt-1">{errors.supplier}</p>}
        </div>
        <div>
          <Input
            placeholder="Location"
            value={form.location}
            onChange={(e) => onFormChange('location', e.target.value)}
          />
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>
        <div className="md:col-span-2">
          <textarea
            className="min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm"
            placeholder="Description (optional)"
            value={form.description ?? ''}
            onChange={(e) => onFormChange('description', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
