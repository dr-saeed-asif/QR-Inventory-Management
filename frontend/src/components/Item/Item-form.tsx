import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Category } from '@/types'
import type { ItemInput } from '@/lib/validators'

interface ItemFormProps {
  form: ItemInput
  categories: Category[]
  errors: Partial<Record<keyof ItemInput, string>>
  isSubmitting: boolean
  onFormChange: (field: keyof ItemInput, value: unknown) => void
  onSubmit: () => void
}

export const ItemForm = ({ form, categories, errors, isSubmitting, onFormChange, onSubmit }: ItemFormProps) => (
  <form
    onSubmit={(event) => {
      event.preventDefault()
      onSubmit()
    }}
    className="grid gap-3 md:grid-cols-2"
  >
    <div>
      <Input placeholder="Item Name" value={form.name} onChange={(event) => onFormChange('name', event.target.value)} />
      <p className="text-xs text-red-600">{errors.name}</p>
    </div>
    <div>
      <Input placeholder="SKU" value={form.sku} onChange={(event) => onFormChange('sku', event.target.value)} />
      <p className="text-xs text-red-600">{errors.sku}</p>
    </div>
    <div>
      <select className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" value={form.categoryId} onChange={(event) => onFormChange('categoryId', event.target.value)}>
        <option value="">Select category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <p className="text-xs text-red-600">{errors.categoryId}</p>
    </div>
    <Input type="number" placeholder="Quantity" value={String(form.quantity)} onChange={(event) => onFormChange('quantity', Number(event.target.value || 0))} />
    <Input type="number" step="0.01" placeholder="Price" value={String(form.price)} onChange={(event) => onFormChange('price', Number(event.target.value || 0))} />
    <Input placeholder="Supplier" value={form.supplier} onChange={(event) => onFormChange('supplier', event.target.value)} />
    <Input placeholder="Location" value={form.location} onChange={(event) => onFormChange('location', event.target.value)} />
    <textarea className="min-h-24 rounded-md border border-slate-300 p-3 text-sm md:col-span-2" placeholder="Description" value={form.description ?? ''} onChange={(event) => onFormChange('description', event.target.value)} />
    <Button disabled={isSubmitting} className="md:col-span-2">{isSubmitting ? 'Saving...' : 'Create Item'}</Button>
  </form>
)

