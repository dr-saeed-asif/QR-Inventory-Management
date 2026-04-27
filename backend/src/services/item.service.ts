import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { generateBarcodeValue, generateQrValue } from '../utils/qr'
import { activityService } from './activity.service'
import { auditService } from './audit.service'

interface ItemInput {
  name: string
  sku: string
  categoryId: string
  quantity: number
  price: number
  supplier: string
  location: string
  description?: string
  lowStockAt?: number
}

export const itemService = {
  create: async (input: ItemInput, userId?: string) => {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } })
    if (!category) throw new ApiError(404, 'Category not found')

    const item = await prisma.item.create({
      data: {
        ...input,
        price: new Prisma.Decimal(input.price),
        qrValue: generateQrValue(),
        barcodeValue: generateBarcodeValue(input.sku),
      },
      include: { category: true },
    })

    await activityService.create({
      action: 'CREATE',
      entityType: 'ITEM',
      entityId: item.id,
      description: `Item "${item.name}" created`,
      userId,
      itemId: item.id,
    })
    return item
  },

  list: async (query: Record<string, string | undefined>) => {
    const page = Number(query.page ?? '1')
    const limit = Number(query.limit ?? '10')
    const skip = (page - 1) * limit

    const where: Prisma.ItemWhereInput = {
      name: query.search ? { contains: query.search } : undefined,
      categoryId: query.categoryId || undefined,
      location: query.location ? { contains: query.location } : undefined,
    }

    const [data, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count({ where }),
    ])

    return { data, total, page, limit }
  },

  getById: async (id: string) => {
    const item = await prisma.item.findUnique({ where: { id }, include: { category: true } })
    if (!item) throw new ApiError(404, 'Item not found')
    return item
  },

  getByCode: async (code: string) => {
    const item = await prisma.item.findFirst({
      where: {
        OR: [{ qrValue: code }, { barcodeValue: code }],
      },
      include: { category: true },
    })
    if (!item) throw new ApiError(404, 'Item not found for provided code')
    return item
  },

  update: async (id: string, input: Partial<ItemInput>, userId?: string) => {
    const existing = await prisma.item.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, 'Item not found')

    const updated = await prisma.item.update({
      where: { id },
      data: {
        ...input,
        price: typeof input.price === 'number' ? new Prisma.Decimal(input.price) : undefined,
      },
      include: { category: true },
    })

    await auditService.create({
      entityType: 'ITEM',
      entityId: id,
      oldData: existing,
      newData: updated,
      userId,
      itemId: id,
    })
    return updated
  },

  delete: async (id: string, userId?: string) => {
    const existing = await prisma.item.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, 'Item not found')
    await prisma.item.delete({ where: { id } })
    await activityService.create({
      action: 'DELETE',
      entityType: 'ITEM',
      entityId: id,
      description: `Item "${existing.name}" deleted`,
      userId,
      itemId: id,
    })
  },
}
