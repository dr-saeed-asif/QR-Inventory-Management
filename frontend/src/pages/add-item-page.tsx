import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { itemSchema, type ItemInput } from '@/lib/validators'
import { inventoryService } from '@/services/inventory.service'
import { categoryService } from '@/services/category.service'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { Category } from '@/types'

export const AddItemPage = () => {
  const { toast } = useToast()
  const [qrImage, setQrImage] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemInput, string>>>({})
  const [form, setForm] = useState<ItemInput>({
    name: '',
    sku: '',
    categoryId: '',
    quantity: 0,
    price: 0,
    supplier: '',
    location: '',
    description: '',
  })

  useEffect(() => {
    categoryService.list().then(setCategories)
  }, [])

  const onSubmit = async (values: ItemInput) => {
    const parsed = itemSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(
        parsed.error.issues.reduce<Partial<Record<keyof ItemInput, string>>>((acc, issue) => {
          const path = issue.path[0] as keyof ItemInput
          acc[path] = issue.message
          return acc
        }, {}),
      )
      return
    }
    setErrors({})
    setIsSubmitting(true)
    try {
      const item = await inventoryService.create(parsed.data)
      setQrImage(await QRCode.toDataURL(item.qrValue))
      toast({ title: 'Item created successfully' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadGeneratedQr = async () => {
    if (!qrImage) return
    const response = await fetch(qrImage)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `qr-code-${Date.now()}.png`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Add Item</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit(form)
        }}
        className="grid gap-3 md:grid-cols-2"
      >
        <div>
          <Input
            placeholder="Item Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <p className="text-xs text-red-600">{errors.name}</p>
        </div>
        <div>
          <Input
            placeholder="SKU"
            value={form.sku}
            onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
          />
          <p className="text-xs text-red-600">{errors.sku}</p>
        </div>
        <div>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-red-600">{errors.categoryId}</p>
        </div>
        <Input
          type="number"
          placeholder="Quantity"
          value={String(form.quantity)}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, quantity: Number(event.target.value || 0) }))
          }
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Price"
          value={String(form.price)}
          onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value || 0) }))}
        />
        <Input
          placeholder="Supplier"
          value={form.supplier}
          onChange={(event) => setForm((prev) => ({ ...prev, supplier: event.target.value }))}
        />
        <Input
          placeholder="Location"
          value={form.location}
          onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
        />
        <textarea
          className="min-h-24 rounded-md border border-slate-300 p-3 text-sm md:col-span-2"
          placeholder="Description"
          value={form.description ?? ''}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
        <Button disabled={isSubmitting} className="md:col-span-2">{isSubmitting ? 'Saving...' : 'Create Item'}</Button>
      </form>
      {qrImage ? (
        <Card className="space-y-2">
          <p className="font-medium">Generated QR</p>
          <img src={qrImage} alt="Generated QR code" className="h-40 w-40" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={downloadGeneratedQr}>Download QR</Button>
            <Button type="button" variant="outline" onClick={() => window.print()}>Print QR</Button>
          </div>
        </Card>
      ) : null}
    </Card>
  )
}
