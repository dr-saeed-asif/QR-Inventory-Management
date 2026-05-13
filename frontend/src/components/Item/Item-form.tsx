import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { groceryCatalogData } from '@/lib/grocery-catalog'
import type { Category } from '@/types'
import type { ItemInput } from '@/lib/validators'

interface ItemFormProps {
  form: ItemInput
  categories: Category[]
  itemOptions: string[]
  errors: Partial<Record<keyof ItemInput, string>>
  isSubmitting: boolean
  onFormChange: (field: keyof ItemInput, value: unknown) => void
  onSubmit: () => void
}

const generateNumericSku = () => `${Date.now()}${Math.floor(100 + Math.random() * 900)}`
const toDigitsOnly = (value: string) => value.replace(/\D/g, '')

export const ItemForm = ({ form, categories, itemOptions, errors, isSubmitting, onFormChange, onSubmit }: ItemFormProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const setAutoSku = () => onFormChange('sku', generateNumericSku())
  const urduNameLookup = useMemo(
    () =>
      new Map(
        groceryCatalogData.categories.flatMap((category) =>
          category.items.map((item) => [item.nameEn, item.nameUr] as const),
        ),
      ),
    [],
  )
  const filteredOptions = useMemo(() => {
    const query = form.name.trim().toLowerCase()
    if (!query) return itemOptions.slice(0, 80)
    return itemOptions
      .filter((name) => {
        const urduName = urduNameLookup.get(name)
        return name.toLowerCase().includes(query) || (urduName ? urduName.includes(form.name.trim()) : false)
      })
      .slice(0, 80)
  }, [form.name, itemOptions, urduNameLookup])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="grid gap-3 md:grid-cols-2"
    >
      <div>
        <div className="relative">
        <Input
          placeholder="Select item (English / اردو) or type manually"
          value={form.name}
          onChange={(event) => {
            const selectedName = event.target.value
            onFormChange('name', selectedName)
            if (!form.sku && selectedName.trim()) setAutoSku()
            setIsDropdownOpen(true)
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsDropdownOpen(false), 120)
          }}
        />
          {isDropdownOpen ? (
            <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
              {filteredOptions.length ? (
                filteredOptions.map((name) => {
                  const urduName = urduNameLookup.get(name)
                  return (
                    <button
                      key={name}
                      type="button"
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        onFormChange('name', name)
                        if (!form.sku) setAutoSku()
                        setIsDropdownOpen(false)
                      }}
                    >
                      <span className="text-slate-800">{name}</span>
                      {urduName ? (
                        <span className="text-xs text-slate-500" dir="rtl">
                          {urduName}
                        </span>
                      ) : null}
                    </button>
                  )
                })
              ) : (
                <p className="px-2 py-1.5 text-xs text-slate-500">No match. You can still type custom item name.</p>
              )}
            </div>
          ) : null}
        </div>
        <p className="text-xs text-red-600">{errors.name}</p>
      </div>
      <div>
        <Input
          placeholder="SKU"
          readOnly={true}
          value={form.sku}
          onChange={(event) => onFormChange('sku', toDigitsOnly(event.target.value))}
          onFocus={() => {
            if (!form.sku) setAutoSku()
          }}
        />
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
      <Input type="number" placeholder="Quantity (e.g. 50)" value={form.quantity === 0 ? '' : String(form.quantity)} onChange={(event) => onFormChange('quantity', Number(event.target.value || 0))} />
      <Input type="number" step="0.01" placeholder="Price (e.g. 199.99)" value={form.price === 0 ? '' : String(form.price)} onChange={(event) => onFormChange('price', Number(event.target.value || 0))} />
      <Input placeholder="Supplier" value={form.supplier} onChange={(event) => onFormChange('supplier', event.target.value)} />
      <Input placeholder="Location" value={form.location} onChange={(event) => onFormChange('location', event.target.value)} />
      <textarea className="min-h-24 rounded-md border border-slate-300 p-3 text-sm md:col-span-2" placeholder="Description" value={form.description ?? ''} onChange={(event) => onFormChange('description', event.target.value)} />
      <Button disabled={isSubmitting} className="md:col-span-2">{isSubmitting ? 'Saving...' : 'Create Item'}</Button>
    </form>
  )
}

