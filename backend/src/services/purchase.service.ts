import { Prisma, TransactionStatus } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ApiError } from '../utils/api-error'
import { parsePagination } from '../utils/pagination'
import { calcLineTotal, calcTotals, nextInvoiceNo, type CommerceLineInput } from '../utils/commerce'
import { activityService } from './activity.service'
import { alertService } from './alert.service'

export interface PurchaseInput {
  partyId?: string
  purchaseDate?: string
  discount?: number
  notes?: string
  lines: CommerceLineInput[]
}

const purchaseInclude = {
  party: true,
  lines: { include: { item: { select: { id: true, name: true, sku: true } } } },
} as const

const mapPurchase = (purchase: Prisma.PurchaseGetPayload<{ include: typeof purchaseInclude }>) => ({
  id: purchase.id,
  invoiceNo: purchase.invoiceNo,
  partyId: purchase.partyId,
  party: purchase.party
    ? { id: purchase.party.id, name: purchase.party.name, phone: purchase.party.phone, type: purchase.party.type }
    : null,
  status: purchase.status,
  purchaseDate: purchase.purchaseDate.toISOString(),
  subtotal: Number(purchase.subtotal),
  discount: Number(purchase.discount),
  total: Number(purchase.total),
  notes: purchase.notes,
  lines: purchase.lines.map((line) => ({
    id: line.id,
    itemId: line.itemId,
    itemName: line.item.name,
    itemSku: line.item.sku,
    quantity: line.quantity,
    unitPrice: Number(line.unitPrice),
    lineTotal: Number(line.lineTotal),
  })),
  createdAt: purchase.createdAt.toISOString(),
})

export const purchaseService = {
  list: async (query?: { page?: string; limit?: string }) => {
    const { page, limit, skip } = parsePagination(query)

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        orderBy: { createdAt: 'desc' },
        include: purchaseInclude,
        skip,
        take: limit,
      }),
      prisma.purchase.count(),
    ])

    return { data: purchases.map(mapPurchase), total, page, limit }
  },

  getById: async (id: string) => {
    const purchase = await prisma.purchase.findUnique({ where: { id }, include: purchaseInclude })
    if (!purchase) throw new ApiError(404, 'Purchase not found')
    return mapPurchase(purchase)
  },

  create: async (input: PurchaseInput, userId?: string) => {
    if (!input.lines.length) throw new ApiError(400, 'At least one line item is required')

    if (input.partyId) {
      const party = await prisma.party.findUnique({ where: { id: input.partyId } })
      if (!party) throw new ApiError(400, 'Party not found')
    }

    const itemIds = [...new Set(input.lines.map((l) => l.itemId))]
    const items = await prisma.item.findMany({ where: { id: { in: itemIds } } })
    if (items.length !== itemIds.length) throw new ApiError(400, 'One or more items are invalid')

    const { subtotal, discount, total } = calcTotals(input.lines, input.discount ?? 0)
    const invoiceNo = await nextInvoiceNo('PUR', () => prisma.purchase.count())
    const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : new Date()

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          invoiceNo,
          partyId: input.partyId || null,
          status: TransactionStatus.CONFIRMED,
          purchaseDate,
          subtotal,
          discount,
          total,
          notes: input.notes?.trim() || null,
          createdById: userId || null,
          lines: {
            create: input.lines.map((line) => ({
              itemId: line.itemId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: calcLineTotal(line.quantity, line.unitPrice),
            })),
          },
        },
        include: purchaseInclude,
      })

      for (const line of input.lines) {
        const item = await tx.item.findUnique({ where: { id: line.itemId } })
        if (!item) continue
        const beforeQty = item.quantity
        const afterQty = beforeQty + line.quantity
        await tx.item.update({ where: { id: line.itemId }, data: { quantity: afterQty } })
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: 'IN',
            quantity: line.quantity,
            beforeQty,
            afterQty,
            note: `Purchase ${invoiceNo}`,
            reference: invoiceNo,
            userId,
          },
        })
      }

      return created
    })

    for (const line of input.lines) {
      await alertService.syncItemAlerts(line.itemId)
    }

    await activityService.create({
      action: 'CREATE',
      entityType: 'PURCHASE',
      entityId: purchase.id,
      description: `Purchase ${invoiceNo} created (Rs ${Number(total)})`,
      userId,
    })

    return mapPurchase(purchase)
  },

  delete: async (id: string, userId?: string) => {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!purchase) throw new ApiError(404, 'Purchase not found')

    await prisma.$transaction(async (tx) => {
      for (const line of purchase.lines) {
        const item = await tx.item.findUnique({ where: { id: line.itemId } })
        if (!item) continue
        if (line.quantity > item.quantity) {
          throw new ApiError(
            400,
            `Cannot delete purchase: insufficient stock to reverse "${item.name}"`,
          )
        }
        const beforeQty = item.quantity
        const afterQty = beforeQty - line.quantity
        await tx.item.update({ where: { id: line.itemId }, data: { quantity: afterQty } })
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: 'OUT',
            quantity: line.quantity,
            beforeQty,
            afterQty,
            note: `Reversal: Purchase ${purchase.invoiceNo} deleted`,
            reference: purchase.invoiceNo,
            userId,
          },
        })
      }
      await tx.purchase.delete({ where: { id } })
    })

    for (const line of purchase.lines) {
      await alertService.syncItemAlerts(line.itemId)
    }

    await activityService.create({
      action: 'DELETE',
      entityType: 'PURCHASE',
      entityId: id,
      description: `Purchase ${purchase.invoiceNo} deleted`,
      userId,
    })
  },
}
