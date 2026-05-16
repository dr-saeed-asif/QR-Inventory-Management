import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { itemSchema, type ItemInput } from '@/lib/validators'
import { barcodeToDataUrl } from '@/lib/barcode'
import { inventoryService } from '@/services/inventory.service'
import { categoryService } from '@/services/category.service'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import type { Category } from '@/types'
import { ItemForm } from '@/components/Item/Item-form'
import { ItemTable } from '@/components/Item/Item-table'

export const AddItemPage = () => {
  const { toast } = useToast()
  const [qrImage, setQrImage] = useState<string>('')
  const [barcodeImage, setBarcodeImage] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [itemOptions, setItemOptions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemInput, string>>>({})
  const [form, setForm] = useState<ItemInput>({ name: '', sku: '', categoryId: '', quantity: 0, price: 0, supplier: '', location: '', description: '' })

  useEffect(() => {
    categoryService.list({ page: 1, pageSize: 500 }).then((res) => setCategories(res.data))
  }, [])

  useEffect(() => {
    const loadItemOptions = async () => {
      try {
        // Seed static catalog in DB (if permission allows), then read suggestions from backend.
        try {
          await inventoryService.syncCatalog()
        } catch {
          // Ignore if user cannot import or if already seeded.
        }
        const names = await inventoryService.catalogNames()
        setItemOptions(names)
      } catch {
        setItemOptions([])
      }
    }

    void loadItemOptions()
  }, [])

  const onSubmit = async (values: ItemInput) => {
    const parsed = itemSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(parsed.error.issues.reduce<Partial<Record<keyof ItemInput, string>>>((acc, issue) => {
        const path = issue.path[0] as keyof ItemInput
        acc[path] = issue.message
        return acc
      }, {}))
      return
    }
    setErrors({})
    setIsSubmitting(true)
    try {
      const item = await inventoryService.create(parsed.data)
      setQrImage(await QRCode.toDataURL(item.qrValue))
      setBarcodeImage(barcodeToDataUrl(item.barcodeValue))
      toast({ title: 'Item created successfully' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadGeneratedCode = async (imageUrl: string, filename: string) => {
    if (!imageUrl) return
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Add Item</h2>
      <ItemForm form={form} categories={categories} itemOptions={itemOptions} errors={errors} isSubmitting={isSubmitting} onFormChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))} onSubmit={() => void onSubmit(form)} />
      <ItemTable qrImage={qrImage} barcodeImage={barcodeImage} onDownload={downloadGeneratedCode} />
    </Card>
  )
}

