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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemInput, string>>>({})
  const [form, setForm] = useState<ItemInput>({ name: '', sku: '', categoryId: '', quantity: 0, price: 0, supplier: '', location: '', description: '' })

  useEffect(() => {
    categoryService.list().then(setCategories)
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
      <ItemForm form={form} categories={categories} errors={errors} isSubmitting={isSubmitting} onFormChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))} onSubmit={() => void onSubmit(form)} />
      <ItemTable qrImage={qrImage} barcodeImage={barcodeImage} onDownload={downloadGeneratedCode} />
    </Card>
  )
}

